-include .env

DB_URL = "postgres://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@$(POSTGRES_HOST):$(POSTGRES_PORT)/$(POSTGRES_DBNAME)?sslmode=$(POSTGRES_SSLMODE)"

MIGRATION_DIR = "./backend/sqlc/migrations"

migration:
	@goose -dir $(MIGRATION_DIR) create $(filter-out $@,$(MAKECMDGOALS)) sql

migration-status:
	@goose postgres -dir $(MIGRATION_DIR) $(DB_URL) status

migration-up:
	@goose postgres -dir $(MIGRATION_DIR) $(DB_URL) up

migration-down:
	@goose postgres -dir $(MIGRATION_DIR) $(DB_URL) down

migration-reset:
	@goose postgres -dir $(MIGRATION_DIR) $(DB_URL) reset

compose-up:
	@docker compose --env-file .env -f ./docker/dev/docker-compose.dev.yml up -d

compose-down:
	@docker compose --env-file .env -f ./docker/dev/docker-compose.dev.yml down

buildx:
	@docker buildx build -f ./docker/prod/Dockerfile --platform linux/amd64 -t cloudmesh-backend .