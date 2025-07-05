-- name: GetJWKSPublicKey :one
SELECT public_key FROM jwks LIMIT 1;