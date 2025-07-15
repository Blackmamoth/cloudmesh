# cloudmesh

## Local Development Setup

### Backend

1. Copy `.env.example` to `.env` and fill in the required environment variables.
2. Install [Goose](https://github.com/pressly/goose) for database migrations (if not already installed):

   ```sh
   go install github.com/pressly/goose/v3/cmd/goose@latest
   ```

3. Start the backend services using Docker Compose:

   ```sh
   cd backend
   docker compose -f docker-compose.dev.yml up -d
   ```

4. Apply database migrations:

   ```sh
   make migration-up
   ```

### Frontend

1. Copy `.env.example` to `.env` and fill in the required environment variables.
2. Install dependencies and run migrations:

   ```sh
   cd frontend
   pnpm install
   pnpm db:migrate
   pnpm dev
   ```
