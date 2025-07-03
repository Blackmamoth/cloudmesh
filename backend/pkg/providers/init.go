package providers

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/google/uuid"
	"github.com/gorilla/sessions"
	"golang.org/x/oauth2"
)

type Provider interface {
	GetConsentPageURL(w http.ResponseWriter, r *http.Request, store *sessions.CookieStore, userID string) (string, error)
	GetToken(w http.ResponseWriter, r *http.Request, store *sessions.CookieStore) (*oauth2.Token, string, error)
}

type OAuthState struct {
	UserID    string `json:"user_id"`
	CsrfToken string `json:"csrf_token"`
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
