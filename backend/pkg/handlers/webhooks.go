package handlers

import (
	"errors"
	"fmt"
	"io"
	"net/http"

	"github.com/blackmamoth/cloudmesh/pkg/config"
	"github.com/blackmamoth/cloudmesh/pkg/utils"
	"github.com/blackmamoth/cloudmesh/repository"
	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

type WebhookHandler struct {
	connPool *pgxpool.Pool
}

type UserDataValidation struct {
	UserId       string `validate:"required" json:"id"`
	Username     string `validate:"required" json:"username"`
	FirstName    string `validate:"omitempty" json:"first_name"`
	LastName     string `validate:"omitempty" json:"last_name"`
	EmailAddress string `validate:"required,email" json:"email_address"`
	Provider     string `validate:"required,oneof=oauth_google oauth_github oauth_dropbox email" json:"provider"`
	ImageURL     string `validate:"required" json:"image_url"`
}

func NewWebhookHandler(connPool *pgxpool.Pool) *WebhookHandler {
	return &WebhookHandler{
		connPool: connPool,
	}
}

func (h *WebhookHandler) RegisterRoutes() *chi.Mux {
	r := chi.NewRouter()

	r.Post("/sync/user", h.syncUser)

	return r
}

func (h *WebhookHandler) syncUser(w http.ResponseWriter, r *http.Request) {
	var payload UserDataValidation

	defer r.Body.Close()

	if err := utils.ParseJSON(r, &payload); err != nil {
		if errors.Is(err, io.EOF) {
			utils.SendAPIErrorResponse(w, http.StatusUnprocessableEntity, "request body cannot be empty")
		} else {
			config.LOGGER.Info("could not parse json payload", zap.Error(err))
			utils.SendAPIErrorResponse(w, http.StatusUnprocessableEntity, "invalid json format")
		}
		return
	}

	if err := utils.Validate.Struct(payload); err != nil {
		errs := utils.GenerateValidationErrorObject(err.(validator.ValidationErrors), payload)
		utils.SendAPIErrorResponse(w, http.StatusUnprocessableEntity, errs)
		return
	}

	conn, err := h.connPool.Acquire(r.Context())
	if err != nil {
		config.LOGGER.Error("could not acquire new connection from pool", zap.Error(err))
		utils.SendAPIErrorResponse(w, http.StatusInternalServerError, fmt.Errorf("could not process request"))
		return
	}
	defer conn.Release()

	userParams := repository.InsertUserParams{
		ID:       payload.UserId,
		Username: payload.Username,
		FirstName: pgtype.Text{
			String: payload.FirstName,
			Valid:  payload.FirstName != "",
		},
		LastName: pgtype.Text{
			String: payload.LastName,
			Valid:  payload.LastName != "",
		},
		EmailAddress: payload.EmailAddress,
		Provider:     payload.Provider,
		ImageUrl:     payload.ImageURL,
	}

	err = utils.WithTransaction(r.Context(), conn, func(tx pgx.Tx) error {
		queries := repository.New(tx)

		err := queries.InsertUser(r.Context(), userParams)
		if err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		config.LOGGER.Error("failed to sync user in DB", zap.Error(err))
		utils.SendAPIErrorResponse(w, http.StatusInternalServerError, fmt.Errorf("user could not be inserted in the DB"))
		return
	}

	utils.SendAPIResponse(w, http.StatusCreated, "user data successfully saved inside db")

}
