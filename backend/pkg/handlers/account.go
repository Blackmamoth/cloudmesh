package handlers

import (
	"fmt"
	"net/http"

	"github.com/blackmamoth/cloudmesh/pkg/config"
	"github.com/blackmamoth/cloudmesh/pkg/middlewares"
	"github.com/blackmamoth/cloudmesh/pkg/utils"
	"github.com/blackmamoth/cloudmesh/repository"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

type AccountHandler struct {
	connPool       *pgxpool.Pool
	authMiddleware *middlewares.AuthMiddleware
}

func NewAccountHandler(connPool *pgxpool.Pool, authMiddleware *middlewares.AuthMiddleware) *AccountHandler {
	return &AccountHandler{
		connPool:       connPool,
		authMiddleware: authMiddleware,
	}
}

func (h *AccountHandler) RegisterRoutes() *chi.Mux {
	r := chi.NewRouter()

	r.Use(h.authMiddleware.VerifyAccessToken)

	r.Get("/get-accounts", h.getAccounts)

	return r
}

func (h *AccountHandler) getAccounts(w http.ResponseWriter, r *http.Request) {

	userID := r.Context().Value(middlewares.UserKey).(string)

	conn, err := h.connPool.Acquire(r.Context())
	if err != nil {
		config.LOGGER.Error("failed to acquire new connection from connection pool", zap.Error(err))
		utils.SendAPIErrorResponse(w, http.StatusInternalServerError, fmt.Errorf("failed to process your request, please try again later"))
		return
	}
	defer conn.Release()

	queries := repository.New(conn)

	accountDetails, err := queries.GetLinkedAccountsByUserID(r.Context(), userID)

	if err != nil {
		config.LOGGER.Error("failed to fetch account details", zap.String("user_id", userID), zap.Error(err))
		utils.SendAPIErrorResponse(w, http.StatusInternalServerError, fmt.Errorf("failed to process your request, please try again later"))
		return
	}

	lastSyncedTime, err := queries.GetLatestSyncTimeByUserID(r.Context(), userID)

	if err != nil {
		config.LOGGER.Error("failed to fetch latest sync time", zap.String("user_id", userID), zap.Error(err))
		utils.SendAPIErrorResponse(w, http.StatusInternalServerError, fmt.Errorf("failed to process your request, please try again later"))
		return
	}

	utils.SendAPIResponse(w, http.StatusOK, map[string]any{
		"accounts":       h.groupAccountsByProvider(accountDetails),
		"last_synced":    lastSyncedTime,
		"total_accounts": len(accountDetails),
	})
}

func (h *AccountHandler) groupAccountsByProvider(accounts []repository.GetLinkedAccountsByUserIDRow) map[string][]repository.GetLinkedAccountsByUserIDRow {
	grouped := make(map[string][]repository.GetLinkedAccountsByUserIDRow)

	for _, acc := range accounts {
		grouped[string(acc.Provider)] = append(grouped[string(acc.Provider)], acc)
	}

	return grouped
}
