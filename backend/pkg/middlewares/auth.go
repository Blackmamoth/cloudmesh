package middlewares

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/blackmamoth/cloudmesh/pkg/config"
	"github.com/blackmamoth/cloudmesh/pkg/db"
	"github.com/blackmamoth/cloudmesh/pkg/utils"
	"github.com/blackmamoth/cloudmesh/repository"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type AuthMiddleware struct {
	connPool *pgxpool.Pool
}

type userKey struct{}

var UserKey userKey = userKey{}

var (
	ErrNoToken      = errors.New("unauthorized, no token")
	ErrUnauthorized = errors.New("unauthorized")
	ErrUnexpected   = errors.New("an unexpected error occured, please try again later")
)

func NewAuthMiddleware(connPool *pgxpool.Pool) *AuthMiddleware {
	return &AuthMiddleware{
		connPool: connPool,
	}
}

func (m *AuthMiddleware) VerifyAccessToken(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenString := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
		if tokenString == "" {
			utils.SendAPIErrorResponse(w, http.StatusUnauthorized, ErrNoToken)
			return
		}

		var publicKeyJWK string

		conn, err := m.connPool.Acquire(r.Context())
		if err != nil {
			config.LOGGER.Error("failed to acquire new connection from connection pool", zap.Error(err))
			utils.SendAPIErrorResponse(w, http.StatusInternalServerError, ErrUnexpected)
			return
		}
		defer conn.Release()

		publicKeyJWKCache := db.RedisClient.Get(r.Context(), "public_key_jwk")
		if publicKeyJWKCache.Err() != nil {
			if publicKeyJWKCache.Err() != redis.Nil {
				config.LOGGER.Warn("could not fetch public key from redis cache", zap.Error(err))
			}

			publicKeyJWK, err := m.getJWKSPublicKey(r.Context(), conn)
			if err != nil {
				config.LOGGER.Error("could not fetch public key from database", zap.Error(err))
				utils.SendAPIErrorResponse(w, http.StatusInternalServerError, ErrUnexpected)
				return
			}

			db.RedisClient.Set(r.Context(), "public_key_jwk", publicKeyJWK, time.Hour)
		} else {
			publicKeyJWK = publicKeyJWKCache.Val()
		}

		jwtClaims, err := utils.ParseJWT(tokenString, publicKeyJWK)
		if err != nil {
			config.LOGGER.Error("could not parse jwt token", zap.Error(err))
			utils.SendAPIErrorResponse(w, http.StatusUnauthorized, ErrUnauthorized)
			return
		}

		userID := jwtClaims.UserID

		if err := m.checkUserExists(r.Context(), conn, userID); err != nil {
			utils.SendAPIErrorResponse(w, http.StatusUnauthorized, ErrUnauthorized)
			return
		}

		ctx := r.Context()

		ctx = context.WithValue(ctx, UserKey, userID)

		r = r.WithContext(ctx)

		next.ServeHTTP(w, r)

	})
}

func (m *AuthMiddleware) checkUserExists(ctx context.Context, conn *pgxpool.Conn, userId string) error {
	queries := repository.New(conn)

	_, err := queries.GetUserByID(ctx, userId)
	return err
}

func (m *AuthMiddleware) getJWKSPublicKey(ctx context.Context, conn *pgxpool.Conn) (string, error) {
	queries := repository.New(conn)

	publicKeyJWK, err := queries.GetJWKSPublicKey(ctx)
	if err != nil {
		return "", err
	}

	return publicKeyJWK, nil
}
