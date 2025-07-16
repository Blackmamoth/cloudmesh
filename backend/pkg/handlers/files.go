package handlers

import (
	"errors"
	"fmt"
	"io"
	"net/http"

	"github.com/blackmamoth/cloudmesh/pkg/config"
	"github.com/blackmamoth/cloudmesh/pkg/db"
	"github.com/blackmamoth/cloudmesh/pkg/middlewares"
	"github.com/blackmamoth/cloudmesh/pkg/providers"
	"github.com/blackmamoth/cloudmesh/pkg/utils"
	"github.com/blackmamoth/cloudmesh/repository"
	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

const (
	DEFAULT_LIMIT         = 25
	DEFAULT_OFFSET        = 0
	DEFAULT_PARENT_FOLDER = "/"
	DEFAULT_SORT_ON       = "modified_time"
	DEFAULT_SORT_BY       = "DESC"
)

type FilesHandler struct {
	connPool       *pgxpool.Pool
	authMiddleware *middlewares.AuthMiddleware
	fileMiddleware *middlewares.FileMiddleware
}

type GetFilesValidation struct {
	Provider     string `validate:"omitempty,oneof=google dropbox" json:"provider"`
	ParentFolder string `validate:"omitempty" json:"parent_folder"`
	Search       string `validate:"omitempty" json:"search"`
	SortOn       string `validate:"omitempty" json:"sort_on"`
	SortBy       string `validate:"omitempty" json:"sort_by"`
	Limit        int32  `validate:"omitempty" json:"limit"`
	Offset       int32  `validate:"omitempty" json:"offset"`
}

type UploadFilesValidation struct {
	AccountID string `validate:"required" json:"account_id"`
}

func (v *GetFilesValidation) setDefaults() {
	if v.Limit == 0 {
		v.Limit = DEFAULT_LIMIT
	}

	if v.Offset < 0 {
		v.Offset = DEFAULT_OFFSET
	}

	if v.ParentFolder == "" && v.Search == "" {
		v.ParentFolder = DEFAULT_PARENT_FOLDER
	}

	if v.SortOn == "" {
		v.SortOn = DEFAULT_SORT_ON
	}

	if v.SortBy == "" {
		v.SortBy = DEFAULT_SORT_BY
	}
}

func NewFilesHandler(connPool *pgxpool.Pool, authMiddleware *middlewares.AuthMiddleware, fileMiddleware *middlewares.FileMiddleware) *FilesHandler {
	return &FilesHandler{
		connPool:       connPool,
		authMiddleware: authMiddleware,
		fileMiddleware: fileMiddleware,
	}
}

func (h *FilesHandler) RegisterRoutes() *chi.Mux {
	r := chi.NewRouter()

	r.Use(h.authMiddleware.VerifyAccessToken)

	r.Group(func(r chi.Router) {
		r.Use(h.fileMiddleware.CheckFilePayload)
		r.Post("/upload", h.uploadFilesToProvider)
	})

	r.Post("/", h.getFiles)

	return r
}

func (h *FilesHandler) getFiles(w http.ResponseWriter, r *http.Request) {
	var payload GetFilesValidation

	defer r.Body.Close()

	if err := utils.ParseJSON(r, &payload); err != nil && !errors.Is(err, io.EOF) {
		config.LOGGER.Error("could not parse json payload", zap.Error(err))
		utils.SendAPIErrorResponse(w, http.StatusUnprocessableEntity, fmt.Errorf("your request could not be processed"))
		return
	}

	if err := utils.Validate.Struct(payload); err != nil {
		errs := utils.GenerateValidationErrorObject(err.(validator.ValidationErrors), payload)
		utils.SendAPIErrorResponse(w, http.StatusUnprocessableEntity, errs)
		return
	}

	payload.setDefaults()

	conn, err := h.connPool.Acquire(r.Context())
	if err != nil {
		config.LOGGER.Error("failed to acquire new connection from connection pool", zap.Error(err))
		utils.SendAPIErrorResponse(w, http.StatusUnprocessableEntity, fmt.Errorf("your request could not be processed, please try again later"))
		return
	}
	defer conn.Release()

	userID := r.Context().Value(middlewares.UserKey).(string)

	queries := repository.New(conn)

	files, err := queries.GetSyncedItems(r.Context(), repository.GetSyncedItemsParams{
		UserID:       userID,
		ParentFolder: db.PGTextField(payload.ParentFolder),
		Provider:     repository.ProviderEnum(payload.Provider),
		SortOn:       payload.SortOn,
		SortBy:       payload.SortBy,
		Search:       payload.Search,
		LimitBy:      payload.Limit,
		OffsetBy:     payload.Offset,
	})

	if err != nil {
		config.LOGGER.Error("failed to fetch files", zap.String("user_id", userID), zap.Error(err))
		utils.SendAPIErrorResponse(w, http.StatusUnprocessableEntity, fmt.Errorf("we could not fetch your files details, please try again later"))
		return
	}

	totalFileCount, err := queries.CountFilesWithFilters(r.Context(), repository.CountFilesWithFiltersParams{
		UserID:       userID,
		ParentFolder: db.PGTextField(payload.ParentFolder),
		Provider:     repository.ProviderEnum(payload.Provider),
		Search:       payload.Search,
	})

	if err != nil {
		config.LOGGER.Error("failed to fetch file counts", zap.String("user_id", userID), zap.Error(err))
		utils.SendAPIErrorResponse(w, http.StatusUnprocessableEntity, fmt.Errorf("we could not fetch your files details, please try again later"))
		return
	}

	utils.SendAPIResponse(w, http.StatusOK, map[string]any{
		"files":       files,
		"total_files": totalFileCount,
	})

}

func (h *FilesHandler) uploadFilesToProvider(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	if r.Form == nil {
		utils.SendAPIErrorResponse(w, http.StatusUnprocessableEntity, fmt.Errorf("`account_id` is required"))
		return
	}

	payload := UploadFilesValidation{
		AccountID: r.Form.Get("account_id"),
	}

	if err := utils.Validate.Struct(payload); err != nil {
		errs := utils.GenerateValidationErrorObject(err.(validator.ValidationErrors), payload)
		utils.SendAPIErrorResponse(w, http.StatusUnprocessableEntity, errs)
		return
	}

	uploadedFiles, ok := h.fileMiddleware.GetUploadedFiles(r.Context())
	if !ok || len(uploadedFiles) == 0 {
		config.LOGGER.Warn("no files were found or the request body was malformed")
		utils.SendAPIErrorResponse(w, http.StatusBadRequest, fmt.Errorf("no files were found in request context"))
		return
	}

	defer func() {
		for _, f := range uploadedFiles {
			f.File.Close()
		}
	}()

	userID := r.Context().Value(middlewares.UserKey).(string)

	accountID, err := db.PGUUID(payload.AccountID)
	if err != nil {
		config.LOGGER.Error("failed to parse UUID", zap.Error(err))
		utils.SendAPIErrorResponse(w, http.StatusBadRequest, fmt.Errorf("invalid account id or UUID"))
		return
	}

	conn, err := db.ConnPool.Acquire(r.Context())
	if err != nil {
		config.LOGGER.Error("failed to acquire new connection from connection pool", zap.Error(err))
		utils.SendAPIErrorResponse(w, http.StatusUnprocessableEntity, fmt.Errorf("your request could not be processed, please try again later"))
		return
	}

	queries := repository.New(conn)

	authTokens, err := queries.GetAuthTokens(r.Context(), repository.GetAuthTokensParams{
		UserID:    userID,
		AccountID: *accountID,
	})

	if err != nil {
		config.LOGGER.Error("failed to fetch auth tokens from db", zap.Error(err), zap.String("user_id", userID), zap.String("account_id", accountID.String()))
		utils.SendAPIErrorResponse(w, http.StatusUnprocessableEntity, fmt.Errorf("your request could not be processed, please try again later"))
		return
	}

	provider, ok := providers.OAuthProviders[string(authTokens.Provider)]
	if !ok {
		utils.SendAPIErrorResponse(w, http.StatusUnprocessableEntity, providers.ErrUnsupportedProvider)
		return
	}

	err = provider.UploadFiles(r.Context(), authTokens, uploadedFiles)

	if err != nil {
		config.LOGGER.Error("failed to upload files", zap.Error(err), zap.String("user_id", userID), zap.String("account_id", accountID.String()))
		utils.SendAPIErrorResponse(w, http.StatusInternalServerError, fmt.Errorf("your files could not be uploaded, please try again later"))
		return
	}

	utils.SendAPIResponse(w, http.StatusOK, "files uploaded successfully")
}
