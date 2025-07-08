-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS synced_items (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    
    account_id UUID NOT NULL,
    provider_file_id TEXT NOT NULL,

    name TEXT NOT NULL,
    extension TEXT NOT NULL,
    size BIGINT NOT NULL,

    mime_type TEXT DEFAULT NULL,
    created_time TIMESTAMPTZ DEFAULT NULL,
    modified_time TIMESTAMPTZ DEFAULT NULL,

    thumbnail_link TEXT DEFAULT NULL,
    preview_link TEXT DEFAULT NULL,
    web_view_link TEXT DEFAULT NULL,
    web_content_link TEXT DEFAULT NULL,
    link_expires_at TIMESTAMPTZ DEFAULT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(), 

    PRIMARY KEY (id),
    FOREIGN KEY (account_id) REFERENCES linked_account(id) ON DELETE CASCADE
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS synced_items;
-- +goose StatementEnd
