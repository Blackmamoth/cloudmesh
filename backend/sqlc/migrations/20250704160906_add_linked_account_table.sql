-- +goose Up
-- +goose StatementBegin
CREATE TYPE provider_enum AS ENUM ('google', 'dropbox');

CREATE TABLE IF NOT EXISTS linked_account (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    
    provider provider_enum NOT NULL,
    provider_user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT DEFAULT NULL,

    access_token TEXT NOT NULL,
    refresh_token TEXT DEFAULT NULL,
    token_type TEXT DEFAULT NULL,
    expiry TIMESTAMPTZ DEFAULT NULL,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS linked_account;

DROP TYPE IF EXISTS provider_enum;
-- +goose StatementEnd
