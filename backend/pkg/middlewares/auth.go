package middlewares

import (
	"context"
	"fmt"
	"net/http"

	"github.com/blackmamoth/cloudmesh/pkg/utils"
	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/clerk/clerk-sdk-go/v2/user"
)

type AuthMiddleware struct{}

func NewAuthMiddleware() *AuthMiddleware {
	return &AuthMiddleware{}
}

func (m *AuthMiddleware) VerifyAccessToken(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := clerk.SessionClaimsFromContext(r.Context())

		if !ok {
			utils.SendAPIErrorResponse(w, http.StatusUnauthorized, fmt.Errorf("unauthorized"))
			return
		}

		usr, err := user.Get(r.Context(), claims.Subject)
		if err != nil {
			utils.SendAPIErrorResponse(w, http.StatusUnauthorized, err)
			return
		}

		ctx := r.Context()

		ctx = context.WithValue(ctx, "userId", usr.ID)

		r = r.WithContext(ctx)

		next.ServeHTTP(w, r)
	})
}
