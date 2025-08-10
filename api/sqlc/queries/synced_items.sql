-- name: AddSyncedItems :copyfrom
INSERT INTO synced_items (
    account_id, provider_file_id, name, extension, size, path, mime_type, parent_folder, is_folder, is_trashed, content_hash, created_time, modified_time, thumbnail_link, preview_link, web_view_link, web_content_link, link_expires_at
) VALUES (
    @account_id, @provider_file_id, @name, @extension , @size, @path, @mime_type, @parent_folder, @is_folder, @is_trashed, @content_hash, @created_time, @modified_time, @thumbnail_link, @preview_link, @web_view_link, @web_content_link, @link_expires_at
);

-- name: GetSyncedItems :many
SELECT synced_items.id,
       synced_items.name,
       synced_items.size,
       synced_items.is_folder,
       synced_items.is_trashed,
       synced_items.thumbnail_link,
       synced_items.preview_link,
       synced_items.web_view_link,
       synced_items.web_content_link,
       synced_items.modified_time,
       linked_account.name AS account_name,
       linked_account.avatar_url,
       linked_account.provider
FROM   synced_items
       JOIN linked_account
         ON linked_account.id = synced_items.account_id
WHERE  linked_account.user_id = @user_id
       AND (NULLIF(@parent_folder, '') IS NULL OR synced_items.parent_folder = @parent_folder)
       AND (NULLIF(@provider, '') IS NULL OR linked_account.provider = @provider::provider_enum)
       AND (
         CASE
           WHEN @provider_file_ids::TEXT[] IS NULL OR COALESCE(array_length(@provider_file_ids::TEXT[], 1), 0) = 0
           THEN (NULLIF(@search, '') IS NULL OR synced_items.name ILIKE '%' || @search::TEXT || '%')
           ELSE synced_items.provider_file_id = ANY(@provider_file_ids::TEXT[])
         END
       )
ORDER BY
       CASE
           WHEN @sort_on = 'file_name' AND @sort_by = 'asc' THEN synced_items.name
           ELSE NULL -- Explicitly return NULL when not sorting by this
       END ASC,
       CASE
           WHEN @sort_on = 'file_name' AND @sort_by = 'desc' THEN synced_items.name
           ELSE NULL
       END DESC,
       CASE
           WHEN @sort_on = 'size' AND @sort_by = 'asc' THEN synced_items.size
           ELSE NULL
       END ASC,
       CASE
           WHEN @sort_on = 'size' AND @sort_by = 'desc' THEN synced_items.size
           ELSE NULL
       END DESC,
       CASE
           WHEN @sort_on = 'modified_time' AND @sort_by = 'asc' THEN synced_items.modified_time::TIMESTAMPTZ
           ELSE NULL
       END ASC,
       CASE
           WHEN @sort_on = 'modified_time' AND @sort_by = 'desc' THEN synced_items.modified_time::TIMESTAMPTZ
           ELSE NULL
       END DESC,
       synced_items.modified_time DESC
LIMIT @limit_by OFFSET @offset_by;

-- name: CountFilesWithFilters :one
SELECT COUNT(*)
FROM   synced_items
       JOIN linked_account
       ON linked_account.id = synced_items.account_id
WHERE  linked_account.user_id = @user_id
       AND (NULLIF(@parent_folder, '') IS NULL OR synced_items.parent_folder = @parent_folder)
       AND (NULLIF(@provider, '') IS NULL OR linked_account.provider = @provider::provider_enum)
       AND (NULLIF(@search, '') IS NULL OR synced_items.name ILIKE '%' || @search::TEXT || '%')
       AND (
         CASE
           WHEN @provider_file_ids::TEXT[] IS NULL OR COALESCE(array_length(@provider_file_ids::TEXT[], 1), 0) = 0
           THEN (NULLIF(@search, '') IS NULL OR synced_items.name ILIKE '%' || @search::TEXT || '%')
           ELSE synced_items.provider_file_id = ANY(@provider_file_ids::TEXT[])
         END
);

-- name: DeleteConflictingItems :exec
DELETE FROM synced_items WHERE provider_file_id = ANY(@provider_file_ids::TEXT[]) AND account_id = @account_id;

-- name: GetProviderFileIds :many
SELECT synced_items.id AS file_id, synced_items.provider_file_id, synced_items.path, linked_account.provider, linked_account.id AS account_id
FROM synced_items JOIN linked_account ON linked_account.id = synced_items.account_id
WHERE linked_account.user_id = @user_id AND synced_items.id = ANY(@ids::UUID[]) AND synced_items.is_trashed = @is_trashed;

-- name: SetFileTrashed :exec
UPDATE synced_items SET is_trashed = true WHERE id = ANY(@file_ids::UUID[]) AND account_id = @account_id;

-- name: DeleteSyncedItems :exec
DELETE FROM synced_items WHERE id = ANY(@file_ids::UUID[]) AND account_id = @account_id;

-- name: GetSyncedItemByID :one
SELECT name, provider_file_id, is_folder, path FROM synced_items WHERE account_id = @account_id AND id = @id;
