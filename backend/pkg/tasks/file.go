package tasks

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

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
		return fmt.Errorf("file to unmarshal task payload: %v", err)
	}

	conn, err := db.ConnPool.Acquire(ctx)
	if err != nil {
		config.LOGGER.Error("failed to acquire new connection from connection pool", zap.Error(err))
		return fmt.Errorf("failed to acquire new connection from connection pool: %v", err)
	}
	defer conn.Release()

	queries := repository.New(conn)

	jobID := t.ResultWriter().TaskID()

	retryCount, ok := asynq.GetRetryCount(ctx)

	if !ok || retryCount == 0 {
		err = queries.UpdateJobLogStart(ctx, repository.UpdateJobLogStartParams{
			StartedAt: db.PGTimestamptzField(time.Now()),
			JobID:     jobID,
		})

		if err != nil {
			config.LOGGER.Error("failed to insert start log for job", zap.String("job_id", jobID), zap.Error(err))
		}
	} else {
		err = queries.UpdateJobLogRetryCount(ctx, repository.UpdateJobLogRetryCountParams{
			Retries: db.PGInt4Field(int32(retryCount)),
			JobID:   jobID,
		})

		if err != nil {
			config.LOGGER.Error("failed to insert retry count log for job", zap.String("job_id", jobID), zap.Int("retry_count", retryCount), zap.Error(err))
		}
	}

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
		return fmt.Errorf("failed to fetch auth tokens from db: %v", err)
	}

	provider, ok := providers.OAuthProviders[string(authToken.Provider)]

	if !ok {
		return providers.ErrUnsupportedProvider
	}

	err = provider.SyncFiles(ctx, conn, *accountID, authToken)

	if err != nil {

		dbErr := queries.UpdateJobLogFailed(ctx, repository.UpdateJobLogFailedParams{
			Error: db.PGTextField(err.Error()),
			JobID: jobID,
		})

		if dbErr != nil {
			config.LOGGER.Error("failed to insert failed log for job", zap.String("job_id", jobID), zap.Error(err))
		}

		return err
	}

	err = queries.UpdateJobLogFinish(ctx, repository.UpdateJobLogFinishParams{
		FinishedAt: db.PGTimestamptzField(time.Now()),
		JobID:      jobID,
	})

	if err != nil {
		config.LOGGER.Error("failed to insert finish log for job", zap.String("job_id", jobID), zap.Error(err))
	}

	newTask, err := NewFileSyncTask(p.UserID, p.AccountID)

	if err == nil {
		asynqclient := db.GetAsynqClient()

		asynqclient.Enqueue(newTask, asynq.ProcessAt(time.Now().Add(30*time.Minute)), asynq.Unique(6*time.Minute))
	}

	config.LOGGER.Info("worker completed synching files to the db", zap.String("user_id", p.UserID), zap.String("account_id", p.AccountID))
	return nil
}
