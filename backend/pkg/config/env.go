package config

import (
	"log"

	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
)

type APIConfiguration struct {
	ENVIRONMENT   string `envconfig:"ENVIRONMENT"   required:"true"`
	HOST          string `envconfig:"HOST"                          default:"127.0.0.1"`
	PORT          string `envconfig:"PORT"                          default:"8080"`
	FRONTEND_HOST string `envconfig:"FRONTEND_HOST" required:"true"`
}

type PostgresConfiguration struct {
	USER                     string `envconfig:"POSTGRES_USER"                     required:"true"`
	PASSWORD                 string `envconfig:"POSTGRES_PASSWORD"                 required:"true"`
	HOST                     string `envconfig:"POSTGRES_HOST"                     required:"true"`
	PORT                     string `envconfig:"POSTGRES_PORT"`
	DBNAME                   string `envconfig:"POSTGRES_DBNAME"                                   default:"cloudmesh"`
	SSLMODE                  string `envconfig:"POSTGRES_SSLMODE"                                  default:"disable"`
	MAX_CONNECTIONS          int32  `envconfig:"POSTGRES_MAX_CONNECTIONS"          required:"true"`
	MIN_CONNECTIONS          int32  `envconfig:"POSTGRES_MIN_CONNECTIONS"          required:"true"`
	MAX_CONNECTION_LIFETIME  int64  `envconfig:"POSTGRES_MAX_CONNECTION_LIFETIME"  required:"true"`
	MAX_CONNECTION_IDLE_TIME int64  `envconfig:"POSTGRES_MAX_CONNECTION_IDLE_TIME" required:"true"`
	HEALTH_CHECK_PERIOD      int64  `envconfig:"POSTGRES_HEALTH_CHECK_PERIOD"      required:"true"`
	CONNECTION_TIMEOUT       int64  `envconfig:"POSTGRES_CONNECTION_TIMEOUT"       required:"true"`
}

type RedisConfiguration struct {
	PASS string `envconfig:"REDIS_PASS" required:"true"`
	HOST string `envconfig:"REDIS_HOST" required:"true"`
	PORT string `envconfig:"REDIS_PORT" required:"true"`
	DB   int    `envconfig:"REDIS_DB"                   default:"0"`
}

type OAuthConfiguration struct {
	GOOGLE struct {
		CLIENT_ID     string `envconfig:"GOOGLE_ID" required:"true"`
		CLIENT_SECRET string `envconfig:"GOOGLE_SECRET" required:"true"`
		OAUTH_SCOPES  string `envconfig:"GOOGLE_OAUTH_SCOPES" required:"true"`
		REDIRECT_URI  string `envconfig:"GOOGLE_REDIRECT_URI" required:"true"`
	} `envconfig:"GOOGLE_"`
	DROPBOX struct {
		CLIENT_ID     string `envconfig:"DROPBOX_ID" required:"true"`
		CLIENT_SECRET string `envconfig:"DROPBOX_SECRET" required:"true"`
		OAUTH_SCOPES  string `envconfig:"DROPBOX_OAUTH_SCOPES" required:"true"`
		REDIRECT_URI  string `envconfig:"DROPBOX_REDIRECT_URI" required:"true"`
	} `envconfig:"DROPBOX_"`
}

type CookieStoreConfiguration struct {
	AUTH_KEY       string `envconfig:"COOKIE_STORE_AUTH_KEY" required:"true"`
	ENCRYPTION_KEY string `envconfig:"COOKIE_STORE_ENCRYPTION_KEY" required:"true"`
}

var (
	APIConfig         APIConfiguration
	PostgresConfig    PostgresConfiguration
	RedisConfig       RedisConfiguration
	OAuthConfig       OAuthConfiguration
	CookieStoreConfig CookieStoreConfiguration
)

func init() {
	loadEnv()
}

func loadEnv() {
	godotenv.Load()

	if err := envconfig.Process("", &APIConfig); err != nil {
		log.Fatalf("An error occured while loading environment variables: %v", err)
	}

	if err := envconfig.Process("POSTGRES_", &PostgresConfig); err != nil {
		log.Fatalf("An error occured while loading environment variables: %v", err)
	}

	if err := envconfig.Process("REDIS_", &RedisConfig); err != nil {
		log.Fatalf("An error occured while loading environment variables: %v", err)
	}

	if err := envconfig.Process("", &OAuthConfig); err != nil {
		log.Fatalf("An error occured while loading environment variables: %v", err)
	}

	if err := envconfig.Process("COOKIE_", &CookieStoreConfig); err != nil {
		log.Fatalf("An error occured while loading environment variables: %v", err)
	}

}
