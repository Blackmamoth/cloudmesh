-- +goose Up
-- +goose StatementBegin
CREATE TYPE job_status_enum AS ENUM ('queued', 'processing', 'succeeded', 'failed', 'retrying');

CREATE TABLE IF NOT EXISTS job_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    
    job_id TEXT NOT NULL,
    account_id UUID NOT NULL,
    type TEXT NOT NULL,
    status job_status_enum NOT NULL,
    queue TEXT NOT NULL,
    
    params JSONB DEFAULT NULL,
    error TEXT DEFAULT NULL,
    retries INT DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NULL,
    finished_at TIMESTAMPTZ DEFAULT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (id),
    FOREIGN KEY (account_id) REFERENCES linked_account(id) ON DELETE CASCADE
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS job_logs;

DROP TYPE IF EXISTS job_status_enum;
-- +goose StatementEnd
