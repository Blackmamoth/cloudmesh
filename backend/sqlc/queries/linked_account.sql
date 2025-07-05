-- name: AddAccountDetails :exec
INSERT INTO linked_account (
    user_id, provider, provider_user_id, access_token, refresh_token, token_type, expiry, email, name, avatar_url
) VALUES (
    @user_id, @provider, @provider_user_id, @access_token, @refresh_token, @token_type, @expiry, @email, @name, @avatar_url
);
