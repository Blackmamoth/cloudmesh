package utils

import (
	"crypto/ed25519"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type JWTClaims struct {
	jwt.RegisteredClaims
	UserID        string    `json:"id"`
	Name          string    `json:"name"`
	Email         string    `json:"email"`
	EmailVerified bool      `json:"emailVerified"`
	Image         string    `json:"image"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
	IssuedAt      int32     `json:"iat"`
	Issuer        string    `json:"iss"`
	Audience      string    `json:"aud"`
	Expiration    int32     `json:"exp"`
	Sub           string    `json:"sub"`
}

type JWK struct {
	CRV string `json:"crv"`
	X   string `json:"x"`
	KTY string `json:"kty"`
}

func ParseJWT(tokenString, publicKeyJWK string) (*JWTClaims, error) {

	var jwk JWK

	if err := json.Unmarshal([]byte(publicKeyJWK), &jwk); err != nil {
		return nil, err
	}

	publicKeyBytes, err := base64.RawURLEncoding.DecodeString(jwk.X)
	if err != nil {
		return nil, err
	}

	publicKey := ed25519.PublicKey(publicKeyBytes)

	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(t *jwt.Token) (any, error) {
		if t.Method.Alg() != jwt.SigningMethodEdDSA.Alg() {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return publicKey, nil
	})
	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}
	return nil, fmt.Errorf("invalid token")
}
