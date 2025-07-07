-- name: AddSyncedItems :copyfrom
INSERT INTO synced_items (
    account_id, provider_file_id, name, extension, size, mime_type, created_time, modified_time, thumbnail_link, preview_link, web_view_link, web_content_link, link_expires_at
) VALUES (
    @account_id, @provider_file_id, @name, @extension ,@size, @mime_type, @created_time, @modified_time, @thumbnail_link, @preview_link, @web_view_link, @web_content_link, @link_expires_at
);
