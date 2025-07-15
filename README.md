# cloudmesh

## Local Development Setup

### Backend

1. Copy `.env.example` to `.env` and fill in the required environment variables.
2. Start the backend services using Docker Compose:
   
   ```sh
   cd backend
   docker compose -f docker-compose.dev.yml up -d
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