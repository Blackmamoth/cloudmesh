package tasks

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/blackmamoth/cloudmesh/pkg/config"
	"github.com/blackmamoth/cloudmesh/pkg/db"
	"github.com/blackmamoth/cloudmesh/pkg/providers"
	"github.com/blackmamoth/cloudmesh/pkg/utils"
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
		return fmt.Errorf("file to unmarshal task payload: %w", err)
	}

	_, connPool := db.GetPGClient()

	conn, err := connPool.Acquire(ctx)
	if err != nil {
		config.LOGGER.Error("failed to acquire new connection from connection pool", zap.Error(err))

		return fmt.Errorf("failed to acquire new connection from connection pool: %w", err)
	}
	defer conn.Release()

	queries := repository.New(conn)

	taskID := t.ResultWriter().TaskID()

	retryCount, ok := asynq.GetRetryCount(ctx)

	if !ok || retryCount == 0 {
		err = queries.UpdateTaskLogStart(ctx, repository.UpdateTaskLogStartParams{
			StartedAt: db.PGTimestamptzField(time.Now()),
			TaskID:    taskID,
		})
		if err != nil {
			config.LOGGER.Error(
				"failed to insert start log for task",
				zap.String("task_id", taskID),
				zap.Error(err),
			)
		}
	} else {
		err = queries.UpdateTaskLogRetryCount(ctx, repository.UpdateTaskLogRetryCountParams{
			// #nosec G115 -- retryCount is bounded and will never exceed int32
			Retries: db.PGInt4Field(int32(retryCount)),
			TaskID:  taskID,
		})
		if err != nil {
			config.LOGGER.Error("failed to insert retry count log for task", zap.String("task_id", taskID), zap.Int("retry_count", retryCount), zap.Error(err))
		}
	}

	accountID, err := db.PGUUID(p.AccountID)
	if err != nil {
		config.LOGGER.Error("failed to parse UUID string", zap.Error(err))

		return errors.New("failed to parse UUID string")
	}

	authToken, err := queries.GetAuthTokens(ctx, repository.GetAuthTokensParams{
		UserID:    p.UserID,
		AccountID: *accountID,
	})
	if err != nil {
		config.LOGGER.Error(
			"failed to fetch auth tokens from db",
			zap.Error(err),
			zap.String("user_id", p.UserID),
			zap.String("account_id", p.AccountID),
		)

		return fmt.Errorf("failed to fetch auth tokens from db: %w", err)
	}

	provider, ok := providers.OAuthProviders[string(authToken.Provider)]

	if !ok {
		return providers.ErrUnsupportedProvider
	}

	err = provider.SyncFiles(ctx, conn, *accountID, authToken)
	if err != nil {
		dbErr := queries.UpdateTaskLogFailed(ctx, repository.UpdateTaskLogFailedParams{
			Error:  db.PGTextField(err.Error()),
			TaskID: taskID,
		})
		if dbErr != nil {
			config.LOGGER.Error(
				"failed to insert failed log for task",
				zap.String("task_id", taskID),
				zap.Error(err),
			)
		}

		return err
	}

	err = queries.UpdateTaskLogFinish(ctx, repository.UpdateTaskLogFinishParams{
		FinishedAt: db.PGTimestamptzField(time.Now()),
		TaskID:     taskID,
	})
	if err != nil {
		config.LOGGER.Error(
			"failed to insert finish log for task",
			zap.String("task_id", taskID),
			zap.Error(err),
		)
	}

	newTask, err := NewFileSyncTask(p.UserID, p.AccountID)
	if err == nil {
		asynqclient := db.GetAsynqClient()

		processAt := time.Now().
			Add(time.Duration(config.AsynqConfig.FILE_SYNC_INTERVAL) * time.Minute)

		if _, err := asynqclient.Enqueue(newTask, asynq.ProcessAt(processAt), asynq.Unique(6*time.Minute)); err != nil {
			config.LOGGER.Error("failed to enqueue new file sync task", zap.Error(err))
		}
	}

	if err := utils.DeleteKeysByPattern(ctx, fmt.Sprintf("search_cache:%s:%s*", authToken.Provider, p.AccountID)); err != nil {
		config.LOGGER.Error(
			"failed to delete cache for content search results",
			zap.String("provider", string(authToken.Provider)),
			zap.String("account_id", p.AccountID),
			zap.Error(err),
		)
	}

	config.LOGGER.Info(
		"worker completed synching files to the db",
		zap.String("user_id", p.UserID),
		zap.String("account_id", p.AccountID),
	)

	return nil
}
