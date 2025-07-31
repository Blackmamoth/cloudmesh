# cloudmesh

## Local Development Setup

1. Copy `.env.example` to `.env` in the root and fill in the required environment variables.
2. Install [Goose](https://github.com/pressly/goose) for database migrations (if not already installed):
   ```sh
   go install github.com/pressly/goose/v3/cmd/goose@latest
   ```
3. Make sure you have `make` installed on your system (required for the following steps).
4. Run `make compose-up` in the root of the project to start the backend services using Docker Compose.
5. Run the following commands in the `frontend` directory to install dependencies and run migrations:
   ```sh
   pnpm install
   pnpm db:migrate
   ```
6. Run `make migration-up` in the root of your project to apply migrations for the backend.
7. Finally, run `pnpm dev` in the `frontend` directory to start the frontend at port `3000`.
