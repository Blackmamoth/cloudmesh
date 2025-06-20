package db

import (
	"context"
	"fmt"

	"github.com/blackmamoth/cloudmesh/pkg/config"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

var RedisClient *redis.Client

func init() {
	redisClient := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", config.RedisConfig.HOST, config.RedisConfig.PORT),
		Password: config.RedisConfig.PASS,
		DB:       config.RedisConfig.DB,
		OnConnect: func(ctx context.Context, cn *redis.Conn) error {
			config.LOGGER.Info("Application connected to Redis Server")
			return nil
		},
	})

	if status := redisClient.Ping(context.Background()); status.Err() != nil {
		config.LOGGER.Fatal("Application disconnected from Redis Server", zap.Error(status.Err()))
	}

	RedisClient = redisClient
}
