package db

import (
	"context"
	"fmt"

	"sync"

	"github.com/blackmamoth/cloudmesh/pkg/config"
	"github.com/hibiken/asynq"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

var (
	RedisClient  *redis.Client
	asyncqclient *asynq.Client
	once         sync.Once
)

func init() {
	RedisClient = redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", config.RedisConfig.HOST, config.RedisConfig.PORT),
		Password: config.RedisConfig.PASS,
		DB:       config.RedisConfig.DB,
		OnConnect: func(ctx context.Context, cn *redis.Conn) error {
			config.LOGGER.Info("Application connected to Redis Server", zap.Int("db", config.RedisConfig.DB))
			return nil
		},
	})

	if status := RedisClient.Ping(context.Background()); status.Err() != nil {
		config.LOGGER.Fatal("Application disconnected from Redis Server", zap.Error(status.Err()))
	}
}

func GetAsynqClient() *asynq.Client {
	once.Do(func() {
		asyncqclient = asynq.NewClient(asynq.RedisClientOpt{
			Addr:     fmt.Sprintf("%s:%s", config.RedisConfig.HOST, config.RedisConfig.PORT),
			Password: config.RedisConfig.PASS,
			DB:       config.RedisConfig.DB,
		})
	})
	return asyncqclient
}
