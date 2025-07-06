package main

import (
	"fmt"

	"github.com/blackmamoth/cloudmesh/pkg/config"
	"github.com/blackmamoth/cloudmesh/pkg/tasks"
	"github.com/hibiken/asynq"
	"go.uber.org/zap"
)

func main() {
	defer config.LOGGER.Sync()
	redisAddr := fmt.Sprintf("%s:%s", config.RedisConfig.HOST, config.RedisConfig.PORT)

	srv := asynq.NewServer(asynq.RedisClientOpt{Addr: redisAddr, Password: config.RedisConfig.PASS}, asynq.Config{
		Concurrency: 10,
		Queues: map[string]int{
			"critical": 6,
			"default":  3,
			"low":      1,
		},
	})

	mux := asynq.NewServeMux()
	mux.HandleFunc(tasks.TypeFileSync, tasks.HandleFileSyncTask)

	config.LOGGER.Info("Asynq server started")

	if err := srv.Run(mux); err != nil {
		config.LOGGER.Fatal("Asynq server terminated", zap.Error(err))
	}
}
