-include .env

DB_URL = "postgres://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@$(POSTGRES_HOST):$(POSTGRES_PORT)/$(POSTGRES_DBNAME)?sslmode=$(POSTGRES_SSLMODE)"

MIGRATION_DIR = "./sqlc/migrations"

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