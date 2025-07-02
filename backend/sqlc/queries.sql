-- name: GetJWKSPublicKey :one
SELECT public_key FROM jwks LIMIT 1;

-- name: GetUserByID :one
SELECT * FROM "user" WHERE id = @user_id;