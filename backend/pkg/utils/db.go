package utils

import (
	"context"

	"github.com/blackmamoth/cloudmesh/pkg/config"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

func WithTransaction(ctx context.Context, conn *pgxpool.Conn, fn func(pgx.Tx) error) error {
	tx, err := conn.Begin(ctx)
	if err != nil {
		config.LOGGER.Error("failed to begin transactoin", zap.Error(err))
		return err
	}

	defer func() {
		if r := recover(); err != nil {
			tx.Rollback(context.Background())
			panic(r)
		} else if err != nil {
			tx.Rollback(context.Background())
		}
	}()

	err = fn(tx)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}
