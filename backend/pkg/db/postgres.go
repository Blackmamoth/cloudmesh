package db

import (
	"context"
	"fmt"
	"time"

	"github.com/blackmamoth/cloudmesh/pkg/config"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

var (
	PoolConfig *pgxpool.Config
	ConnPool   *pgxpool.Pool
)

func init() {
	poolConfig, err := connectPostgres()
	if err != nil {
		config.LOGGER.Fatal("Application disconnected from PostgreSQL Server", zap.Error(err))
	}

	pool, err := pgxpool.NewWithConfig(context.Background(), poolConfig)
	if err != nil {
		config.LOGGER.Fatal("Application disconnected from PostgreSQL Server", zap.Error(err))
	}

	if err := pingPostgresConnection(pool); err != nil {
		config.LOGGER.Fatal("Application disconnected from PostgreSQL Server", zap.Error(err))
	}

	config.LOGGER.Info("Application connected to PostgreSQL Server")

	PoolConfig = poolConfig

	ConnPool = pool
}

func pingPostgresConnection(connPool *pgxpool.Pool) error {
	conn, err := connPool.Acquire(context.Background())
	if err != nil {
		return err
	}

	defer conn.Release()
	return conn.Ping(context.Background())
}

func connectPostgres() (*pgxpool.Config, error) {
	dsn := fmt.Sprintf("postgresql://%s:%s@%s:%s/%s?sslmode=%s",
		config.PostgresConfig.USER,
		config.PostgresConfig.PASSWORD,
		config.PostgresConfig.HOST,
		config.PostgresConfig.PORT,
		config.PostgresConfig.DBNAME,
		config.PostgresConfig.SSLMODE)

	poolConfig, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, err
	}

	poolConfig.MaxConns = config.PostgresConfig.MAX_CONNECTIONS
	poolConfig.MinConns = config.PostgresConfig.MIN_CONNECTIONS
	poolConfig.MaxConnLifetime = time.Hour * time.Duration(
		config.PostgresConfig.MAX_CONNECTION_IDLE_TIME,
	)
	poolConfig.MaxConnIdleTime = time.Minute * time.Duration(
		config.PostgresConfig.MAX_CONNECTION_IDLE_TIME,
	)
	poolConfig.HealthCheckPeriod = time.Minute * time.Duration(
		config.PostgresConfig.HEALTH_CHECK_PERIOD,
	)
	poolConfig.ConnConfig.ConnectTimeout = time.Second * time.Duration(
		config.PostgresConfig.CONNECTION_TIMEOUT,
	)

	return poolConfig, nil
}

func PGTextField(val string) pgtype.Text {
	return pgtype.Text{String: val, Valid: val != ""}
}

func PGTimestamptzField(val time.Time) pgtype.Timestamptz {
	return pgtype.Timestamptz{Time: val, Valid: !val.IsZero()}
}

func PGUUID(val string) (*pgtype.UUID, error) {
	var pgUUID pgtype.UUID

	parsedUUID, err := uuid.Parse(val)
	if err != nil {
		return nil, err
	}

	pgUUID = pgtype.UUID{
		Bytes: parsedUUID,
		Valid: true,
	}

	return &pgUUID, nil
}
