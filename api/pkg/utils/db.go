package utils

import (
	"context"

	"github.com/blackmamoth/cloudmesh/pkg/config"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

func WithTransaction(
	ctx context.Context,
	conn *pgxpool.Conn,
	fn func(context.Context, pgx.Tx) error,
) error {
	tx, err := conn.Begin(ctx)
	if err != nil {
		config.LOGGER.Error("failed to begin transactoin", zap.Error(err))

		return err
	}

	defer func(ctx context.Context) {
		if r := recover(); r != nil {
			if rollbackErr := tx.Rollback(ctx); rollbackErr != nil {
				config.LOGGER.Error("failed to rollback transaction after panic",
					zap.Error(rollbackErr),
					zap.Any("panic", r))
			}

			panic(r)
		} else if err != nil {
			if rollbackErr := tx.Rollback(ctx); rollbackErr != nil {
				config.LOGGER.Error("failed to rollback transaction",
					zap.Error(rollbackErr),
					zap.NamedError("original_error", err))
			}
		}
	}(ctx)

	err = fn(ctx, tx)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}
