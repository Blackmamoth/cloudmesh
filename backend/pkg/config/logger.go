package config

import (
	"os"
	"time"

	"github.com/joho/godotenv"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var LOGGER *zap.Logger

func init() {
	initializeLogger()
}

func initializeLogger() {
	godotenv.Load()

	encoderCfg := zap.NewProductionEncoderConfig()
	logLevel := zap.NewAtomicLevelAt(zap.ErrorLevel)

	ENVIRONMENT := os.Getenv("ENVIRONMENT")
	if ENVIRONMENT == "development" {
		encoderCfg = zap.NewDevelopmentEncoderConfig()
		logLevel = zap.NewAtomicLevelAt(zap.DebugLevel)
	}

	encoderCfg.TimeKey = "timestamp"
	encoderCfg.EncodeTime = zapcore.ISO8601TimeEncoder

	isDevelopment := ENVIRONMENT == "development"

	config := zap.Config{
		Level:             logLevel,
		Development:       isDevelopment,
		DisableStacktrace: !isDevelopment,
		DisableCaller:     !isDevelopment,
		Encoding:          "json",
		EncoderConfig:     encoderCfg,
		OutputPaths:       []string{"stderr"},
		ErrorOutputPaths:  []string{"stderr"},
		InitialFields: map[string]any{
			"pid":         os.Getpid(),
			"environment": ENVIRONMENT,
		},
	}

	baseLogger := zap.Must(config.Build())

	core := zapcore.NewSamplerWithOptions(baseLogger.Core(), time.Second, 100, 10)

	LOGGER = zap.New(core)
}
