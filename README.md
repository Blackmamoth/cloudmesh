# cloudmesh

## Local Development Setup

1. Copy `.env.example` to `.env` in the root and fill in the required environment variables.
2. Install [Goose](https://github.com/pressly/goose) for database migrations (if not already installed):
   ```sh
   go install github.com/pressly/goose/v3/cmd/goose@latest
   ```
3. Make sure you have `make` installed on your system (required for the following steps).
4. Run the following command to setup dev environment.

```sh
make dev
```
