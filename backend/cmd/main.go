package main

import (
	"github.com/blackmamoth/cloudmesh/cmd/api"
	"github.com/blackmamoth/cloudmesh/pkg/config"
	"github.com/blackmamoth/cloudmesh/pkg/db"
	"go.uber.org/zap"
)

func main() {
	defer config.LOGGER.Sync()

	_, connPool := db.GetPGClient()

	redisClient := db.GetRedisClient()

	apiServer := api.NewAPIServer(config.APIConfig.HOST, config.APIConfig.PORT, connPool, redisClient)

	if err := apiServer.Run(); err != nil {
		config.LOGGER.Fatal("Application terminated", zap.Error(err))
	}
}
