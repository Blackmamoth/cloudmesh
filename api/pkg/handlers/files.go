package handlers

import (
	"context"
	"errors"
	"net/http"

	"github.com/blackmamoth/cloudmesh/pkg/config"
	"github.com/blackmamoth/cloudmesh/pkg/db"
	"github.com/blackmamoth/cloudmesh/pkg/middlewares"
	"github.com/blackmamoth/cloudmesh/pkg/providers"
	"github.com/blackmamoth/cloudmesh/pkg/utils"
	"github.com/blackmamoth/cloudmesh/repository"
	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
	"github.com/jackc/pgx/v5/pgtype"
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
	Provider      string `validate:"omitempty,oneof=google dropbox" json:"provider"`
	ParentFolder  string `validate:"omitempty"                      json:"parent_folder"`
	Search        string `validate:"omitempty"                      json:"search"`
	SortOn        string `validate:"omitempty"                      json:"sort_on"`
	SortBy        string `validate:"omitempty"                      json:"sort_by"`
	Limit         int32  `validate:"omitempty"                      json:"limit"`
	Offset        int32  `validate:"omitempty"                      json:"offset"`
	ContentSearch bool   `validate:"omitempty"                      json:"content_search"`
}

type UploadFilesValidation struct {
	AccountID string `validate:"required,uuid" json:"account_id"`
}

type MoveToTrashValidation struct {
	FileIDs []string `validate:"required,min=1,dive,uuid4" json:"file_ids"`
}

type PermanentDeleteValidation struct {
	FileIDs []string `validate:"required,min=1,dive,uuid4" json:"file_ids"`
}

type CreateFolderValidation struct {
	Name           string `validate:"required"      json:"name"`
	AccountID      string `validate:"required,uuid" json:"account_id"`
	ParentFolderID string `validate:"omitempty"     json:"parent_folder_id"`
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

func NewFilesHandler(
	connPool *pgxpool.Pool,
	authMiddleware *middlewares.AuthMiddleware,
	fileMiddleware *middlewares.FileMiddleware,
) *FilesHandler {
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

	r.Post("/create-folder", h.createFolder)

	r.Put("/move-to-trash", h.moveFilesToTrash)

	r.Delete("/permanent-delete-files", h.permanentlyDelete)

	return r
}

func (h *FilesHandler) getFiles(w http.ResponseWriter, r *http.Request) {
	payload, ok := utils.ParseAndValidate[GetFilesValidation](w, r, true)
	if !ok {
		return
	}

	payload.setDefaults()

	conn, err := h.connPool.Acquire(r.Context())
	if err != nil {
		config.LOGGER.Error("failed to acquire new connection from connection pool", zap.Error(err))
		utils.SendAPIErrorResponse(
			w,
			http.StatusUnprocessableEntity,
			errors.New("your request could not be processed, please try again later"),
		)

		return
	}
	defer conn.Release()

	userID, ok := r.Context().Value(middlewares.UserKey).(string)
	if !ok {
		config.LOGGER.Error("invalid userid", zap.Any("user_id_received", userID))
		utils.SendAPIErrorResponse(
			w,
			http.StatusBadRequest,
			errors.New("could not validate user credentials"),
		)

		return
	}

	providerFileIDs := []string{}

	queries := repository.New(conn)

	if payload.ContentSearch && payload.Search != "" {
		accounts, err := queries.GetUserAccounts(r.Context(), userID)
		if err != nil {
			config.LOGGER.Error(
				"failed to fetch user accounts from db",
				zap.Error(err),
				zap.String("user_id", userID),
			)
			utils.SendAPIErrorResponse(
				w,
				http.StatusUnprocessableEntity,
				errors.New("your request could not be processed, please try again later"),
			)

			return
		}

		for _, account := range accounts {
			provider := providers.OAuthProviders[string(account.Provider)]

			fileIDs, err := provider.SearchByContent(
				r.Context(),
				payload.Search,
				account,
				conn,
				queries,
			)
			if err != nil {
				config.LOGGER.Error(
					"failed to search for files by content",
					zap.String("provider", string(account.Provider)),
					zap.String("user_id", userID),
					zap.String("account_id", account.ID.String()),
					zap.Error(err),
				)
				utils.SendAPIErrorResponse(
					w,
					http.StatusUnprocessableEntity,
					errors.New("your request could not be processed, please try again later"),
				)

				return
			}

			providerFileIDs = append(providerFileIDs, fileIDs...)
		}
	}

	files, err := queries.GetSyncedItems(r.Context(), repository.GetSyncedItemsParams{
		UserID:          userID,
		ParentFolder:    db.PGTextField(payload.ParentFolder),
		Provider:        repository.ProviderEnum(payload.Provider),
		SortOn:          payload.SortOn,
		SortBy:          payload.SortBy,
		Search:          payload.Search,
		LimitBy:         payload.Limit,
		OffsetBy:        payload.Offset,
		ProviderFileIds: providerFileIDs,
	})
	if err != nil {
		config.LOGGER.Error("failed to fetch files", zap.String("user_id", userID), zap.Error(err))
		utils.SendAPIErrorResponse(
			w,
			http.StatusUnprocessableEntity,
			errors.New("we could not fetch your files details, please try again later"),
		)

		return
	}

	totalFileCount, err := queries.CountFilesWithFilters(
		r.Context(),
		repository.CountFilesWithFiltersParams{
			UserID:       userID,
			ParentFolder: db.PGTextField(payload.ParentFolder),
			Provider:     repository.ProviderEnum(payload.Provider),
			Search:       payload.Search,
		},
	)
	if err != nil {
		config.LOGGER.Error(
			"failed to fetch file counts",
			zap.String("user_id", userID),
			zap.Error(err),
		)
		utils.SendAPIErrorResponse(
			w,
			http.StatusUnprocessableEntity,
			errors.New("we could not fetch your files details, please try again later"),
		)

		return
	}

	utils.SendAPIResponse(w, http.StatusOK, map[string]any{
		"files":       files,
		"file_count":  len(files),
		"total_files": totalFileCount,
	})
}

func (h *FilesHandler) validateUploadPayload(
	r *http.Request,
) (UploadFilesValidation, map[string]string, error) {
	defer r.Body.Close()

	if r.Form == nil {
		return UploadFilesValidation{}, nil, errors.New("`account_id` is required")
	}

	payload := UploadFilesValidation{
		AccountID: r.Form.Get("account_id"),
	}

	if err := utils.Validate.Struct(payload); err != nil {
		errs := utils.GenerateValidationErrorObject(func() validator.ValidationErrors {
			var target validator.ValidationErrors

			_ = errors.As(err, &target)

			return target
		}(), payload)

		return UploadFilesValidation{}, errs, nil
	}

	return payload, nil, nil
}

func (h *FilesHandler) getUploadedFiles(ctx context.Context) ([]middlewares.UploadedFile, error) {
	files, ok := h.fileMiddleware.GetUploadedFiles(ctx)
	if !ok || len(files) == 0 {
		return nil, errors.New("no files were found in request context")
	}

	return files, nil
}

func (h *FilesHandler) uploadFilesToProvider(w http.ResponseWriter, r *http.Request) {
	payload, validationErrs, err := h.validateUploadPayload(r)
	if validationErrs != nil {
		utils.SendAPIErrorResponse(w, http.StatusUnprocessableEntity, validationErrs)

		return
	}

	if err != nil {
		utils.SendAPIErrorResponse(w, http.StatusUnprocessableEntity, err)

		return
	}

	uploadedFiles, err := h.getUploadedFiles(r.Context())
	if err != nil {
		config.LOGGER.Warn(err.Error())
		utils.SendAPIErrorResponse(w, http.StatusBadRequest, err)

		return
	}

	defer func() {
		for _, f := range uploadedFiles {
			if err := f.File.Close(); err != nil {
				config.LOGGER.Error("failed to close file", zap.Error(err))
			}
		}
	}()

	userID, ok := r.Context().Value(middlewares.UserKey).(string)
	if !ok {
		config.LOGGER.Error("invalid userid", zap.Any("user_id_received", userID))
		utils.SendAPIErrorResponse(
			w,
			http.StatusBadRequest,
			errors.New("could not validate user credentials"),
		)

		return
	}

	accountID, err := db.PGUUID(payload.AccountID)
	if err != nil {
		config.LOGGER.Error("failed to parse UUID", zap.Error(err))
		utils.SendAPIErrorResponse(
			w,
			http.StatusBadRequest,
			errors.New("invalid account id or UUID"),
		)

		return
	}

	conn, err := h.connPool.Acquire(r.Context())
	if err != nil {
		config.LOGGER.Error("failed to acquire new connection from connection pool", zap.Error(err))
		utils.SendAPIErrorResponse(
			w,
			http.StatusUnprocessableEntity,
			errors.New("your request could not be processed, please try again later"),
		)

		return
	}
	defer conn.Release()

	queries := repository.New(conn)

	authTokens, err := queries.GetAuthTokens(r.Context(), repository.GetAuthTokensParams{
		UserID:    userID,
		AccountID: *accountID,
	})
	if err != nil {
		config.LOGGER.Error(
			"failed to fetch auth tokens from db",
			zap.Error(err),
			zap.String("user_id", userID),
			zap.String("account_id", accountID.String()),
		)
		utils.SendAPIErrorResponse(
			w,
			http.StatusUnprocessableEntity,
			errors.New("your request could not be processed, please try again later"),
		)

		return
	}

	provider, ok := providers.OAuthProviders[string(authTokens.Provider)]
	if !ok {
		utils.SendAPIErrorResponse(
			w,
			http.StatusUnprocessableEntity,
			providers.ErrUnsupportedProvider,
		)

		return
	}

	err = provider.UploadFiles(r.Context(), accountID, conn, queries, authTokens, uploadedFiles)
	if err != nil {
		config.LOGGER.Error(
			"failed to upload files",
			zap.Error(err),
			zap.String("user_id", userID),
			zap.String("account_id", accountID.String()),
		)
		utils.SendAPIErrorResponse(
			w,
			http.StatusInternalServerError,
			errors.New("your files could not be uploaded, please try again later"),
		)

		return
	}

	utils.SendAPIResponse(w, http.StatusOK, "files uploaded successfully")
}

func (h *FilesHandler) createFolder(w http.ResponseWriter, r *http.Request) {
	payload, ok := utils.ParseAndValidate[CreateFolderValidation](w, r, false)
	if !ok {
		return
	}

	userID, ok := r.Context().Value(middlewares.UserKey).(string)
	if !ok {
		config.LOGGER.Error("invalid userid", zap.Any("user_id_received", userID))
		utils.SendAPIErrorResponse(
			w,
			http.StatusBadRequest,
			errors.New("could not validate user credentials"),
		)

		return
	}

	conn, err := h.connPool.Acquire(r.Context())
	if err != nil {
		config.LOGGER.Error("failed to acquire new connection from connection pool", zap.Error(err))
		utils.SendAPIErrorResponse(
			w,
			http.StatusUnprocessableEntity,
			errors.New("your request could not be processed"),
		)

		return
	}
	defer conn.Release()

	parentFolderID := &pgtype.UUID{Valid: false}

	accountID, err := db.PGUUID(payload.AccountID)
	if err != nil {
		config.LOGGER.Error("failed to parse account uuid", zap.Error(err))
		utils.SendAPIErrorResponse(
			w,
			http.StatusUnprocessableEntity,
			errors.New("your request could not be processed"),
		)

		return
	}

	if payload.ParentFolderID != "" {
		parentFolderID, err = db.PGUUID(payload.ParentFolderID)
		if err != nil {
			config.LOGGER.Error("failed to parse account uuid", zap.Error(err))
			utils.SendAPIErrorResponse(
				w,
				http.StatusUnprocessableEntity,
				errors.New("your request could not be processed"),
			)

			return
		}
	}

	queries := repository.New(conn)

	account, err := queries.GetLinkedAccount(r.Context(), repository.GetLinkedAccountParams{
		UserID:    userID,
		AccountID: *accountID,
	})
	if err != nil {
		config.LOGGER.Error(
			"failed to retrieve user account",
			zap.String("account_id", payload.AccountID),
			zap.String("user_id", userID),
			zap.Error(err),
		)
		utils.SendAPIErrorResponse(
			w,
			http.StatusInternalServerError,
			errors.New("your request could not be processed"),
		)

		return
	}

	parentFolder := providers.ParentFolder{}

	if parentFolderID.Valid {
		syncedItem, err := queries.GetSyncedItemByID(
			r.Context(),
			repository.GetSyncedItemByIDParams{
				AccountID: *accountID,
				ID:        *parentFolderID,
			},
		)
		if err != nil {
			config.LOGGER.Error(
				"failed to retrieve parent folder details",
				zap.String("account_id", payload.AccountID),
				zap.String("user_id", userID),
				zap.Error(err),
			)
			utils.SendAPIErrorResponse(
				w,
				http.StatusInternalServerError,
				errors.New("your request could not be processed"),
			)

			return
		}

		parentFolder.ID = syncedItem.ProviderFileID
		parentFolder.Path = syncedItem.Path.String
	}

	provider := providers.OAuthProviders[string(account.Provider)]

	err = provider.CreateFolder(r.Context(), payload.Name, parentFolder, account, conn, *queries)
	if err != nil {
		config.LOGGER.Error("failed to create new folder", zap.Error(err))
		utils.SendAPIErrorResponse(
			w,
			http.StatusInternalServerError,
			errors.New("could not create new folder, please try again later"),
		)

		return
	}

	utils.SendAPIResponse(
		w,
		http.StatusOK,
		map[string]string{"message": "Your folder was successfully created"},
	)
}

//nolint:dupl
func (h *FilesHandler) moveFilesToTrash(w http.ResponseWriter, r *http.Request) {
	payload, ok := utils.ParseAndValidate[MoveToTrashValidation](w, r, false)
	if !ok {
		return
	}

	userID, ok := r.Context().Value(middlewares.UserKey).(string)
	if !ok {
		config.LOGGER.Error("invalid userid", zap.Any("user_id_received", userID))
		utils.SendAPIErrorResponse(
			w,
			http.StatusBadRequest,
			errors.New("could not validate user credentials"),
		)

		return
	}

	fileIds := []pgtype.UUID{}

	for _, fileID := range payload.FileIDs {
		fileUUID, err := db.PGUUID(fileID)
		if err != nil {
			config.LOGGER.Error("failed to parse string into UUID", zap.Error(err))
			utils.SendAPIErrorResponse(
				w,
				http.StatusUnprocessableEntity,
				errors.New("we could not process your request, please try again"),
			)

			return
		}

		fileIds = append(fileIds, *fileUUID)
	}

	conn, err := h.connPool.Acquire(r.Context())
	if err != nil {
		config.LOGGER.Error("failed to acquire new connection from connection pool", zap.Error(err))
		utils.SendAPIErrorResponse(
			w,
			http.StatusUnprocessableEntity,
			errors.New("your request could not be processed, please try again later"),
		)

		return
	}
	defer conn.Release()

	queries := repository.New(conn)

	fileDetails, err := queries.GetProviderFileIds(r.Context(), repository.GetProviderFileIdsParams{
		UserID:    userID,
		Ids:       fileIds,
		IsTrashed: db.PGBool(false),
	})
	if err != nil {
		config.LOGGER.Error("failed to fetch file ids for move to trash action", zap.Error(err))
		utils.SendAPIErrorResponse(
			w,
			http.StatusUnprocessableEntity,
			errors.New("your request could not be processed, please try again later"),
		)

		return
	}

	grouped := h.groupFilesByAccountID(fileDetails)

	for accountID, items := range grouped {
		authTokens, err := queries.GetAuthTokens(r.Context(), repository.GetAuthTokensParams{
			UserID:    userID,
			AccountID: accountID,
		})
		if err != nil {
			config.LOGGER.Error("failed to fetch auth tokens from db", zap.Error(err))
			utils.SendAPIErrorResponse(
				w,
				http.StatusUnprocessableEntity,
				errors.New("your request could not be processed, please try again later"),
			)

			return
		}

		providerName := items[0].Provider

		provider := providers.OAuthProviders[string(providerName)]

		err = provider.MoveToTrash(r.Context(), &accountID, conn, queries, authTokens, items)
		if err != nil {
			config.LOGGER.Error(
				"failed to move file ids for move to trash action",
				zap.Error(err),
				zap.String("provider", string(providerName)),
			)
			utils.SendAPIErrorResponse(
				w,
				http.StatusUnprocessableEntity,
				errors.New("your request could not be processed, please try again later"),
			)

			return
		}
	}

	utils.SendAPIResponse(w, http.StatusOK, map[string]any{
		"message": "Files successfully moved to trash",
	})
}

//nolint:dupl
func (h *FilesHandler) permanentlyDelete(w http.ResponseWriter, r *http.Request) {
	payload, ok := utils.ParseAndValidate[PermanentDeleteValidation](w, r, false)
	if !ok {
		return
	}

	userID, ok := r.Context().Value(middlewares.UserKey).(string)
	if !ok {
		config.LOGGER.Error("invalid userid", zap.Any("user_id_received", userID))
		utils.SendAPIErrorResponse(
			w,
			http.StatusBadRequest,
			errors.New("could not validate user credentials"),
		)

		return
	}

	fileIds := []pgtype.UUID{}

	for _, fileID := range payload.FileIDs {
		fileUUID, err := db.PGUUID(fileID)
		if err != nil {
			config.LOGGER.Error("failed to parse string into UUID", zap.Error(err))
			utils.SendAPIErrorResponse(
				w,
				http.StatusUnprocessableEntity,
				errors.New("we could not process your request, please try again"),
			)

			return
		}

		fileIds = append(fileIds, *fileUUID)
	}

	conn, err := h.connPool.Acquire(r.Context())
	if err != nil {
		config.LOGGER.Error("failed to acquire new connection from connection pool", zap.Error(err))
		utils.SendAPIErrorResponse(
			w,
			http.StatusUnprocessableEntity,
			errors.New("your request could not be processed, please try again later"),
		)

		return
	}
	defer conn.Release()

	queries := repository.New(conn)

	fileDetails, err := queries.GetProviderFileIds(r.Context(), repository.GetProviderFileIdsParams{
		UserID:    userID,
		Ids:       fileIds,
		IsTrashed: db.PGBool(true),
	})
	if err != nil {
		config.LOGGER.Error("failed to fetch file ids for move to trash action", zap.Error(err))
		utils.SendAPIErrorResponse(
			w,
			http.StatusUnprocessableEntity,
			errors.New("your request could not be processed, please try again later"),
		)

		return
	}

	grouped := h.groupFilesByAccountID(fileDetails)

	for accountID, items := range grouped {
		authTokens, err := queries.GetAuthTokens(r.Context(), repository.GetAuthTokensParams{
			UserID:    userID,
			AccountID: accountID,
		})
		if err != nil {
			config.LOGGER.Error("failed to fetch auth tokens from db", zap.Error(err))
			utils.SendAPIErrorResponse(
				w,
				http.StatusUnprocessableEntity,
				errors.New("your request could not be processed, please try again later"),
			)

			return
		}

		providerName := items[0].Provider

		provider := providers.OAuthProviders[string(providerName)]

		err = provider.PermanentlyDeleteFiles(
			r.Context(),
			&accountID,
			conn,
			queries,
			authTokens,
			items,
		)
		if err != nil {
			config.LOGGER.Error(
				"failed to move file ids for move to trash action",
				zap.Error(err),
				zap.String("provider", string(providerName)),
			)
			utils.SendAPIErrorResponse(
				w,
				http.StatusUnprocessableEntity,
				errors.New("your request could not be processed, please try again later"),
			)

			return
		}
	}

	utils.SendAPIResponse(w, http.StatusOK, map[string]any{
		"message": "Files successfully deleted",
	})
}

func (h *FilesHandler) groupFilesByAccountID(
	files []repository.GetProviderFileIdsRow,
) map[pgtype.UUID][]repository.GetProviderFileIdsRow {
	grouped := make(map[pgtype.UUID][]repository.GetProviderFileIdsRow)

	for _, file := range files {
		grouped[file.AccountID] = append(grouped[file.AccountID], file)
	}

	return grouped
}
