package handlers

import (
	"context"
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
	"github.com/hibiken/asynq"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
	"golang.org/x/oauth2"
)

type LinkHandler struct {
	connPool    *pgxpool.Pool
	redisClient *redis.Client
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

func NewLinkHandler(connPool *pgxpool.Pool, redisClient *redis.Client) *LinkHandler {
	return &LinkHandler{
		connPool:    connPool,
		redisClient: redisClient,
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

	if err = h.validateNonce(r.Context(), oauthState.Nonce); err != nil {
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

func (h *LinkHandler) getProviderFromRequest(
	w http.ResponseWriter,
	r *http.Request,
) (string, providers.Provider, bool) {
	providerName := strings.ToLower(chi.URLParam(r, "provider"))

	provider, ok := providers.OAuthProviders[providerName]
	if !ok {
		h.errorRedirect(w, r)

		return "", nil, false
	}

	return providerName, provider, true
}

func (h *LinkHandler) encryptTokens(
	w http.ResponseWriter,
	r *http.Request,
	token *oauth2.Token,
) (string, string, error) {
	encAccess, err := utils.Encrypt(token.AccessToken)
	if err != nil {
		h.errorRedirect(w, r)

		return "", "", err
	}

	encRefresh, err := utils.Encrypt(token.RefreshToken)
	if err != nil {
		h.errorRedirect(w, r)

		return "", "", err
	}

	return encAccess, encRefresh, nil
}

func (h *LinkHandler) linkAccountCallback(w http.ResponseWriter, r *http.Request) {
	providerName, provider, ok := h.getProviderFromRequest(w, r)
	if !ok {
		return
	}

	token, userId, accountInfo, err := provider.GetToken(w, r, store)
	if err != nil {
		h.logAndRedirectError(w, r, "GetToken failed", providerName, err)

		return
	}

	encryptedAccessToken, encryptedRefreshToken, err := h.encryptTokens(w, r, token)
	if err != nil {
		return
	}

	conn, err := h.connPool.Acquire(r.Context())
	if err != nil {
		h.logAndRedirectError(w, r, "failed to acquire connection", providerName, err)

		return
	}
	defer conn.Release()

	queries := repository.New(conn)

	accountID, successQuery, err := h.upsertAccount(
		r.Context(), queries, conn, userId, providerName, accountInfo,
		encryptedAccessToken, encryptedRefreshToken, token,
	)
	if err != nil {
		h.logAndRedirectError(w, r, "account upsert failed", providerName, err)

		return
	}

	if err = h.scheduleBackgroundJobs(r.Context(), userId, providerName, accountID, token, queries); err != nil {
		h.logAndRedirectError(w, r, "scheduling jobs failed", providerName, err)

		return
	}

	http.Redirect(w, r, fmt.Sprintf("%s/linked-accounts?successQuery=%s",
		config.APIConfig.FRONTEND_HOST, successQuery), http.StatusFound)
}

func (h *LinkHandler) errorRedirect(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, config.APIConfig.FRONTEND_HOST+"/error", http.StatusFound)
}

func (h *LinkHandler) logAndRedirectError(
	w http.ResponseWriter,
	r *http.Request,
	msg, provider string,
	err error,
) {
	if provider != "" {
		config.LOGGER.Error(msg, zap.String("provider", provider), zap.Error(err))
	} else {
		config.LOGGER.Error(msg, zap.Error(err))
	}

	h.errorRedirect(w, r)
}

func (h *LinkHandler) scheduleBackgroundJobs(
	ctx context.Context,
	userID, providerName, accountID string,
	token *oauth2.Token,
	queries *repository.Queries,
) error {
	asynqClient := db.GetAsynqClient()

	err := h.enqueueFileSyncTaskAndLog(ctx, userID, accountID, providerName, asynqClient, queries)
	if err != nil {
		config.LOGGER.Error("enqueueFileSyncTaskAndLog failed", zap.Error(err))

		return err
	}

	err = h.enqueueAuthTokenRenewalTaskAndLog(
		ctx,
		userID,
		accountID,
		providerName,
		time.Duration(token.ExpiresIn),
		asynqClient,
		queries,
	)
	if err != nil {
		config.LOGGER.Error("enqueueAuthTokenRenewalTaskAndLog failed", zap.Error(err))

		return err
	}

	return nil
}

func (h *LinkHandler) upsertAccount(
	ctx context.Context,
	queries *repository.Queries,
	conn *pgxpool.Conn,
	userID, providerName string,
	accountInfo *providers.UserAccountInfo,
	encAccessToken, encRefreshToken string,
	token *oauth2.Token,
) (string, string, error) {
	var accountID string

	successQuery := "newAccount"

	addCountParams := repository.AddAccountDetailsParams{
		UserID:         userID,
		Provider:       repository.ProviderEnum(providerName),
		ProviderUserID: accountInfo.ProviderUserID,
		AccessToken:    encAccessToken,
		RefreshToken:   encRefreshToken,
		TokenType:      db.PGTextField(token.TokenType),
		Expiry:         db.PGTimestamptzField(token.Expiry),
		Email:          accountInfo.Email,
		Name:           accountInfo.Name,
		AvatarUrl:      db.PGTextField(accountInfo.AvatarURL),
	}

	existingAccountID, err := queries.GetAccountByProviderID(
		ctx,
		repository.GetAccountByProviderIDParams{
			UserID:         userID,
			Provider:       repository.ProviderEnum(providerName),
			ProviderUserID: accountInfo.ProviderUserID,
		},
	)

	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		config.LOGGER.Error("failed to fetch existing account details", zap.Error(err))

		return "", "", err
	}

	if errors.Is(err, sql.ErrNoRows) {
		err = utils.WithTransaction(ctx, conn, func(ctx context.Context, tx pgx.Tx) error {
			qx := queries.WithTx(tx)

			id, err := qx.AddAccountDetails(ctx, addCountParams)
			if err != nil {
				return err
			}

			accountID = id.String()

			return nil
		})
		if err != nil {
			config.LOGGER.Error("error inserting account details",
				zap.String("provider", providerName),
				zap.Error(err))

			return "", "", err
		}
	} else {
		accountID = existingAccountID.String()

		err = utils.WithTransaction(ctx, conn, func(ctx context.Context, tx pgx.Tx) error {
			return queries.WithTx(tx).UpdateAuthTokens(ctx, repository.UpdateAuthTokensParams{
				AccessToken:  encAccessToken,
				RefreshToken: encRefreshToken,
				TokenType:    db.PGTextField(token.TokenType),
				Expiry:       db.PGTimestamptzField(token.Expiry),
				AccountID:    existingAccountID,
			})
		})
		if err != nil {
			config.LOGGER.Error("error updating auth tokens",
				zap.String("provider", providerName),
				zap.Error(err))

			return "", "", err
		}

		successQuery = "existingAccount"
	}

	return accountID, successQuery, nil
}

func (h *LinkHandler) validateNonce(ctx context.Context, nonce string) error {
	key := "link-nonce:" + nonce

	val, err := h.redisClient.Get(ctx, key).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return errors.New("nonce not found or expired")
		}

		config.LOGGER.Error("error querying redis for nonce", zap.Error(err))

		return err
	}

	if val != nonce {
		return errors.New("nonce mismatch")
	}

	if delErr := h.redisClient.Del(ctx, key).Err(); delErr != nil {
		config.LOGGER.Warn("failed to delete used nonce", zap.Error(delErr))
	}

	return nil
}

func (h *LinkHandler) enqueueFileSyncTaskAndLog(
	ctx context.Context,
	userId, accountID, providerName string,
	asynqClient *asynq.Client,
	queries *repository.Queries,
) error {
	task, err := tasks.NewFileSyncTask(userId, accountID)
	if err != nil {
		config.LOGGER.Error(
			"failed to create file sync task",
			zap.String("provider", providerName),
			zap.String("task_type", tasks.TypeFileSync),
			zap.Error(err),
		)

		return err
	}

	info, err := asynqClient.Enqueue(task, asynq.MaxRetry(3))
	if err != nil {
		config.LOGGER.Error(
			"failed to enqueue file sync task",
			zap.String("provider", providerName),
			zap.String("task_type", tasks.TypeFileSync),
			zap.Error(err),
		)

		return err
	}

	config.LOGGER.Info(
		"file sync task successfully enqueued",
		zap.String("provider", providerName),
		zap.String("task_type", tasks.TypeFileSync),
		zap.String("task_id", info.ID),
		zap.String("queue", info.Queue),
	)

	params, err := json.Marshal(tasks.FileSyncPayload{UserID: userId, AccountID: accountID})
	if err != nil {
		config.LOGGER.Error(
			"failed to marshal file sync task params",
			zap.String("provider", providerName),
			zap.Error(err),
		)

		return nil
	}

	accountUUID, err := db.PGUUID(accountID)
	if err != nil {
		config.LOGGER.Error(
			"invalid accountID UUID format",
			zap.String("provider", providerName),
			zap.String("accountID", accountID),
			zap.Error(err),
		)

		return nil
	}

	err = queries.AddNewJobLog(ctx, repository.AddNewJobLogParams{
		JobID:     info.ID,
		AccountID: *accountUUID,
		Type:      info.Type,
		Status:    repository.JobStatusEnumQueued,
		Queue:     info.Queue,
		Params:    params,
	})
	if err != nil {
		config.LOGGER.Error(
			"failed to insert job log",
			zap.String("provider", providerName),
			zap.String("task_type", tasks.TypeFileSync),
			zap.String("task_id", info.ID),
			zap.String("queue", info.Queue),
			zap.Error(err),
		)

		return err
	}

	return nil
}

func (h *LinkHandler) enqueueAuthTokenRenewalTaskAndLog(
	ctx context.Context,
	userId, accountID, providerName string,
	expiresIn time.Duration,
	asynqClient *asynq.Client,
	queries *repository.Queries,
) error {
	task, err := tasks.NewAuthTokenRenewalTask(userId, accountID)
	if err != nil {
		config.LOGGER.Error(
			"failed to create auth token renewal task",
			zap.String("provider", providerName),
			zap.String("task_type", tasks.TypeAuthTokenRenewal),
			zap.Error(err),
		)

		return err
	}

	info, err := asynqClient.Enqueue(task, asynq.MaxRetry(3), asynq.ProcessIn(expiresIn))
	if err != nil {
		config.LOGGER.Error(
			"failed to enqueue auth token renewal task",
			zap.String("provider", providerName),
			zap.String("task_type", tasks.TypeAuthTokenRenewal),
			zap.Error(err),
		)

		return err
	}

	config.LOGGER.Info(
		"auth token renewal task successfully enqueued",
		zap.String("provider", providerName),
		zap.String("task_type", tasks.TypeAuthTokenRenewal),
		zap.String("task_id", info.ID),
		zap.String("queue", info.Queue),
	)

	params, err := json.Marshal(tasks.AuthTokenRenewalPayload{UserID: userId, AccountID: accountID})
	if err != nil {
		config.LOGGER.Error(
			"failed to marshal auth token renewal task params",
			zap.String("provider", providerName),
			zap.Error(err),
		)

		return nil
	}

	accountUUID, err := db.PGUUID(accountID)
	if err != nil {
		config.LOGGER.Error(
			"invalid accountID UUID format",
			zap.String("provider", providerName),
			zap.String("accountID", accountID),
			zap.Error(err),
		)

		return nil
	}

	err = queries.AddNewJobLog(ctx, repository.AddNewJobLogParams{
		JobID:     info.ID,
		AccountID: *accountUUID,
		Type:      info.Type,
		Status:    repository.JobStatusEnumQueued,
		Queue:     info.Queue,
		Params:    params,
	})
	if err != nil {
		config.LOGGER.Error(
			"failed to insert job log",
			zap.String("provider", providerName),
			zap.String("task_type", tasks.TypeAuthTokenRenewal),
			zap.String("task_id", info.ID),
			zap.String("queue", info.Queue),
			zap.Error(err),
		)

		return err
	}

	return nil
}
