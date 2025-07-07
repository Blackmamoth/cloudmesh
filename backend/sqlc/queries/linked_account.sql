-- name: AddAccountDetails :one
INSERT INTO linked_account (
    user_id, provider, provider_user_id, access_token, refresh_token, token_type, expiry, email, name, avatar_url
) VALUES (
    @user_id, @provider, @provider_user_id, @access_token, @refresh_token, @token_type, @expiry, @email, @name, @avatar_url
) RETURNING id;

-- name: GetAuthTokens :one
SELECT provider, access_token, refresh_token FROM public.linked_account WHERE
user_id = @user_id AND id = @account_id;