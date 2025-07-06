package providers

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/blackmamoth/cloudmesh/repository"
	"github.com/google/uuid"
	"github.com/gorilla/sessions"
	"golang.org/x/oauth2"
)

type UserAccountInfo struct {
	Provider       string `json:"provider"`
	ProviderUserID string `json:"provider_user_id"`
	Email          string `json:"email"`
	Name           string `json:"name"`
	AvatarURL      string `json:"avatar_url"`
}

type Provider interface {
	GetConsentPageURL(w http.ResponseWriter, r *http.Request, store *sessions.CookieStore, userID string) (string, error)
	GetToken(w http.ResponseWriter, r *http.Request, store *sessions.CookieStore) (*oauth2.Token, string, *UserAccountInfo, error)
	GetAccountInfo(ctx context.Context, token *oauth2.Token) (*UserAccountInfo, error)
}

type OAuthState struct {
	UserID    string `json:"user_id"`
	CsrfToken string `json:"csrf_token"`
}

var (
	ErrUnsupportedProvider = errors.New("invalid or unsupported provider")
	ErrNoCode              = errors.New("authorization code not found in redirect url")
	ErrNoState             = errors.New("state parameter not found")
	ErrNoSession           = errors.New("session does not exist or can't be retrieved")
	ErrNoVerifier          = errors.New("PKCE verifier missing or invalid")
	ErrInvalidState        = errors.New("invalid state parameter")
	ErrFailSessionCleanUp  = errors.New("failed to clean up session values")
)

var OAuthProviders map[string]Provider

func init() {
	OAuthProviders = make(map[string]Provider)
	OAuthProviders[string(repository.ProviderEnumGoogle)] = NewGoogleProvider()
	OAuthProviders[string(repository.ProviderEnumDropbox)] = NewDropboxProvider()
}

func GenerateOauthState(userID string) (string, *OAuthState, error) {
	csrfToken := uuid.New().String()
	state := &OAuthState{
		UserID:    userID,
		CsrfToken: csrfToken,
	}

	jsonData, err := json.Marshal(state)
	if err != nil {
		return "", nil, fmt.Errorf("failed to marshal OAuth state: %v", err)
	}

	encodedState := base64.URLEncoding.EncodeToString(jsonData)
	return encodedState, state, nil
}

func DecodeOauthState(encodedState string) (*OAuthState, error) {
	decodedData, err := base64.URLEncoding.DecodeString(encodedState)
	if err != nil {
		return nil, fmt.Errorf("failed to base64 decode OAuth state: %v", err)
	}

	var state OAuthState
	if err := json.Unmarshal(decodedData, &state); err != nil {
		return nil, fmt.Errorf("failed to unmarshal OAuth state JSON: %v", err)
	}
	return &state, nil
}
