package tasks

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/blackmamoth/cloudmesh/pkg/config"
	"github.com/blackmamoth/cloudmesh/pkg/db"
	"github.com/blackmamoth/cloudmesh/pkg/providers"
	"github.com/blackmamoth/cloudmesh/repository"
	"github.com/hibiken/asynq"
	"go.uber.org/zap"
)

const (
	TypeFileSync = "file:sync"
)

type FileSyncPayload struct {
	UserID    string
	AccountID string
}

func NewFileSyncTask(userID, accountID string) (*asynq.Task, error) {
	payload, err := json.Marshal(FileSyncPayload{UserID: userID, AccountID: accountID})
	if err != nil {
		return nil, err
	}
	return asynq.NewTask(TypeFileSync, payload), nil
}

func HandleFileSyncTask(ctx context.Context, t *asynq.Task) error {
	var p FileSyncPayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		return fmt.Errorf("file to unmarshal task payload: %v: %w", err, asynq.SkipRetry)
	}

	conn, err := db.ConnPool.Acquire(ctx)
	if err != nil {
		config.LOGGER.Error("failed to acquire new connection from connection pool", zap.Error(err))
		return err
	}
	defer conn.Release()

	queries := repository.New(conn)

	accountID, err := db.PGUUID(p.AccountID)

	if err != nil {
		config.LOGGER.Error("failed to parse UUID string", zap.Error(err))
		return fmt.Errorf("failed to parse UUID string")
	}

	authToken, err := queries.GetAuthTokens(ctx, repository.GetAuthTokensParams{
		UserID:    p.UserID,
		AccountID: *accountID,
	})

	if err != nil {
		config.LOGGER.Error("failed to fetch auth tokens from db", zap.Error(err), zap.String("user_id", p.UserID), zap.String("account_id", p.AccountID))
		return fmt.Errorf("failed to fetch auth tokens from db")
	}

	provider, ok := providers.OAuthProviders[string(authToken.Provider)]

	if !ok {
		return providers.ErrUnsupportedProvider
	}

	err = provider.SyncFiles(ctx, conn, *accountID, authToken)

	if err != nil {
		return err
	}

	config.LOGGER.Info("worker completed synching files to the db", zap.String("user_id", p.UserID), zap.String("account_id", p.AccountID))
	return nil
}
