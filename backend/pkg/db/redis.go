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
	redisClient  *redis.Client
	asyncqclient *asynq.Client
	asynqOnce    sync.Once
	redisOnce    sync.Once
)

func GetRedisClient() *redis.Client {
	redisOnce.Do(func() {
		redisClient = redis.NewClient(&redis.Options{
			Addr:     fmt.Sprintf("%s:%s", config.RedisConfig.HOST, config.RedisConfig.PORT),
			Password: config.RedisConfig.PASS,
			DB:       config.RedisConfig.DB,
			OnConnect: func(ctx context.Context, cn *redis.Conn) error {
				config.LOGGER.Info("Application connected to Redis Server", zap.Int("db", config.RedisConfig.DB))
				return nil
			},
		})

		if status := redisClient.Ping(context.Background()); status.Err() != nil {
			config.LOGGER.Fatal("Application disconnected from Redis Server", zap.Error(status.Err()))
		}
	})
	return redisClient
}

func GetAsynqClient() *asynq.Client {
	asynqOnce.Do(func() {
		asyncqclient = asynq.NewClient(asynq.RedisClientOpt{
			Addr:     fmt.Sprintf("%s:%s", config.RedisConfig.HOST, config.RedisConfig.PORT),
			Password: config.RedisConfig.PASS,
			DB:       config.RedisConfig.DB,
		})
	})
	return asyncqclient
}
