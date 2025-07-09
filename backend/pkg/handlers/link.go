package handlers

import (
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/blackmamoth/cloudmesh/pkg/config"
	"github.com/blackmamoth/cloudmesh/pkg/db"
	"github.com/blackmamoth/cloudmesh/pkg/providers"
	"github.com/blackmamoth/cloudmesh/pkg/tasks"
	"github.com/blackmamoth/cloudmesh/pkg/utils"
	"github.com/blackmamoth/cloudmesh/repository"
	"github.com/go-chi/chi/v5"
	"github.com/gorilla/sessions"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

type LinkHandler struct {
	connPool *pgxpool.Pool
}

type OAuthState struct {
	UserID string `json:"user_id"`
	Nonce  string `json:"nonce"`
}

var store *sessions.CookieStore

func init() {
	authKey, err := hex.DecodeString(config.CookieStoreConfig.AUTH_KEY)
	if err != nil {
		config.LOGGER.Fatal("Could not set auth key for cookie store", zap.Error(err))
	}

	encKey, err := hex.DecodeString(config.CookieStoreConfig.ENCRYPTION_KEY)
	if err != nil {
		config.LOGGER.Fatal("Could not set encryption key for cookie store", zap.Error(err))
	}

	store = sessions.NewCookieStore(authKey, encKey)

	store.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   int(7 * 24 * time.Hour / time.Second),
		HttpOnly: true,
		Secure:   config.APIConfig.ENVIRONMENT != "development",
		SameSite: http.SameSiteLaxMode,
	}
}

func NewLinkHandler(connPool *pgxpool.Pool) *LinkHandler {
	return &LinkHandler{
		connPool: connPool,
	}
}

func (h *LinkHandler) RegisterRoutes() *chi.Mux {
	r := chi.NewRouter()

	r.Get("/{provider}", h.linkAccount)
	r.Get("/{provider}/callback", h.linkAccountCallback)
	return r
}

func (h *LinkHandler) linkAccount(w http.ResponseWriter, r *http.Request) {
	providerName := chi.URLParam(r, "provider")

	providerName = strings.ToLower(providerName)

	provider, ok := providers.OAuthProviders[providerName]
	if !ok {
		h.errorRedirect(w, r)
		return
	}

	state := r.URL.Query().Get("state")

	if state == "" {
		h.errorRedirect(w, r)
		return
	}

	decoded, err := base64.URLEncoding.DecodeString(state)
	if err != nil {
		config.LOGGER.Error("could not deocde base64 encoded state", zap.Error(err))
		utils.SendAPIErrorResponse(w, http.StatusBadRequest, err)
		return
	}

	var oauthState OAuthState
	err = json.Unmarshal(decoded, &oauthState)
	if err != nil {
		config.LOGGER.Error("failed to unmarshal into OAuthState", zap.Error(err))
		h.errorRedirect(w, r)
		return
	}

	if oauthState.UserID == "" {
		h.errorRedirect(w, r)
		return
	}

	consentPageURL, err := provider.GetConsentPageURL(w, r, store, oauthState.UserID)
	if err != nil {
		h.errorRedirect(w, r)
		return
	}

	http.Redirect(w, r, consentPageURL, http.StatusFound)
}

func (h *LinkHandler) linkAccountCallback(w http.ResponseWriter, r *http.Request) {
	providerName := chi.URLParam(r, "provider")

	providerName = strings.ToLower(providerName)

	provider, ok := providers.OAuthProviders[providerName]
	if !ok {
		h.errorRedirect(w, r)
		return
	}

	token, userId, accountInfo, err := provider.GetToken(w, r, store)
	if err != nil {
		h.errorRedirect(w, r)
		return
	}

	addCountParams := repository.AddAccountDetailsParams{
		UserID:         userId,
		Provider:       repository.ProviderEnum(providerName),
		ProviderUserID: accountInfo.ProviderUserID,
		AccessToken:    token.AccessToken,
		RefreshToken:   token.RefreshToken,
		TokenType:      db.PGTextField(token.TokenType),
		Expiry:         db.PGTimestamptzField(token.Expiry),
		Email:          accountInfo.Email,
		Name:           accountInfo.Name,
		AvatarUrl:      db.PGTextField(accountInfo.AvatarURL),
	}

	conn, err := h.connPool.Acquire(r.Context())
	if err != nil {
		config.LOGGER.Error("could not get a connection from db pool", zap.String("provider", providerName), zap.Error(err))
		h.errorRedirect(w, r)
		return
	}
	defer conn.Release()

	queries := repository.New(conn)

	existingAccountID, err := queries.GetAccountByProviderID(r.Context(), repository.GetAccountByProviderIDParams{
		UserID:         userId,
		Provider:       repository.ProviderEnum(providerName),
		ProviderUserID: accountInfo.ProviderUserID,
	})

	var accountID string
	successQuery := "newAccount"

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			err = utils.WithTransaction(r.Context(), conn, func(tx pgx.Tx) error {
				qx := queries.WithTx(tx)

				id, err := qx.AddAccountDetails(r.Context(), addCountParams)

				if err != nil {
					return err
				}

				accountID = id.String()

				return nil
			})

			if err != nil {
				config.LOGGER.Error("an error occured while inserting account details", zap.String("provider", providerName), zap.Error(err))
				h.errorRedirect(w, r)
				return
			}
		} else {
			config.LOGGER.Error("failed to fetch existing account details", zap.Error(err))
			h.errorRedirect(w, r)
			return
		}
	} else {
		accountID = existingAccountID.String()

		err = utils.WithTransaction(r.Context(), conn, func(tx pgx.Tx) error {
			qx := queries.WithTx(tx)

			err := qx.UpdateAuthTokens(r.Context(), repository.UpdateAuthTokensParams{
				AccessToken:  token.AccessToken,
				RefreshToken: token.RefreshToken,
				TokenType:    db.PGTextField(token.TokenType),
				Expiry:       db.PGTimestamptzField(token.Expiry),
				AccountID:    existingAccountID,
			})

			return err
		})

		if err != nil {
			config.LOGGER.Error("an error occured while updating auth tokens", zap.String("provider", providerName), zap.Error(err))
			h.errorRedirect(w, r)
			return
		}

		successQuery = "existingAccount"
	}

	asynqclient := db.GetAsynqClient()

	task, err := tasks.NewFileSyncTask(userId, accountID)

	if err != nil {
		config.LOGGER.Error("failed to create new file sync task", zap.String("provider", providerName), zap.String("task_type", tasks.TypeFileSync), zap.Error(err))
		h.errorRedirect(w, r)
		return
	}

	info, err := asynqclient.Enqueue(task)
	if err != nil {
		config.LOGGER.Error("failed to enqueue file sync task", zap.String("provider", providerName), zap.String("task_type", tasks.TypeFileSync), zap.Error(err))
		h.errorRedirect(w, r)
		return
	}

	config.LOGGER.Info("file sync task successfully enqueued", zap.String("provider", providerName), zap.String("task_type", tasks.TypeFileSync), zap.String("task_id", info.ID), zap.String("queue", info.Queue))

	http.Redirect(w, r, fmt.Sprintf("%s/dashboard/linked-accounts?successQuery=%s", config.APIConfig.FRONTEND_HOST, successQuery), http.StatusFound)
}

func (h *LinkHandler) errorRedirect(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, fmt.Sprintf("%s/error", config.APIConfig.FRONTEND_HOST), http.StatusFound)
}
