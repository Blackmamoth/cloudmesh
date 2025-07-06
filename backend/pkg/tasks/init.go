package tasks

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/blackmamoth/cloudmesh/pkg/config"
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
	config.LOGGER.Info("worker begin synching file", zap.String("user_id", p.UserID), zap.String("account_id", p.AccountID))
	return nil
}
