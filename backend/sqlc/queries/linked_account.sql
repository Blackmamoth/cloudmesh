-- name: AddAccountDetails :one
INSERT INTO linked_account (
    user_id, provider, provider_user_id, access_token, refresh_token, token_type, expiry, email, name, avatar_url
) VALUES (
    @user_id, @provider, @provider_user_id, @access_token, @refresh_token, @token_type, @expiry, @email, @name, @avatar_url
) RETURNING id;

-- name: UpdateAuthTokens :exec
UPDATE linked_account SET access_token = @access_token, refresh_token = @refresh_token, token_type = @token_type, expiry = @expiry WHERE id = @account_id;

-- name: GetLatestSyncTime :one
SELECT last_synced_at FROM linked_account WHERE id = @account_id;

-- name: GetAccountByProviderID :one
SELECT id FROM linked_account WHERE user_id = @user_id AND provider = @provider AND provider_user_id = @provider_user_id LIMIT 1;

-- name: GetAuthTokens :one
SELECT provider, access_token, refresh_token FROM linked_account WHERE
user_id = @user_id AND id = @account_id;

-- name: UpdateLastSyncedTimestamp :exec
UPDATE linked_account SET last_synced_at = NOW(), sync_page_token = @sync_page_token WHERE id = @account_id;

-- name: GetLinkedAccountsByUserID :many
SELECT provider, name, email, avatar_url, last_synced_at FROM linked_account WHERE user_id = @user_id;

-- name: GetLatestSyncTimeByUserID :one
SELECT last_synced_at FROM linked_account WHERE user_id = @user_id ORDER BY last_synced_at DESC;