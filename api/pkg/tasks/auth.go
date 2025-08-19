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

// #nosec G101 -- this is a static task type name, not a credential
const (
	TypeAuthTokenRenewal = "file:auth-token-renewal"
)

type AuthTokenRenewalPayload struct {
	UserID    string
	AccountID string
}

func NewAuthTokenRenewalTask(userID, accountID string) (*asynq.Task, error) {
	payload, err := json.Marshal(AuthTokenRenewalPayload{UserID: userID, AccountID: accountID})
	if err != nil {
		return nil, err
	}

	return asynq.NewTask(TypeAuthTokenRenewal, payload), nil
}

func HandleAuthTokenRenewalTask(ctx context.Context, t *asynq.Task) error {
	var p AuthTokenRenewalPayload
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

	refreshToken, err := utils.Decrypt(authToken.RefreshToken)
	if err != nil {
		config.LOGGER.Error(
			"could not decrypt refresh token",
			zap.String("provider", string(authToken.Provider)),
			zap.String("account_id", accountID.String()),
		)

		return err
	}

	_, expiresIn, err := provider.RenewOAuthTokens(ctx, conn, *accountID, refreshToken)
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

	newTask, err := NewAuthTokenRenewalTask(p.UserID, p.AccountID)
	if err == nil {
		asynqclient := db.GetAsynqClient()

		if _, err := asynqclient.Enqueue(
			newTask,
			asynq.ProcessIn(time.Duration(expiresIn)),
			asynq.Unique(6*time.Minute),
		); err != nil {
			config.LOGGER.Error("failed to enqueue new auth token renewal task", zap.Error(err))
		}
	}

	config.LOGGER.Info(
		"worker completed token renewal task and saved new token to db",
		zap.String("user_id", p.UserID),
		zap.String("account_id", p.AccountID),
	)

	return nil
}
