package providers

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/blackmamoth/cloudmesh/pkg/config"
	"github.com/gorilla/sessions"
	"go.uber.org/zap"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/endpoints"
)

type GoogleProvider struct {
	Config oauth2.Config
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

const googleSessionName = "cloudmesh-google-oauth-session"

func NewGoogleProvider() *GoogleProvider {
	return &GoogleProvider{
		Config: oauth2.Config{
			ClientID:     config.OAuthConfig.GOOGLE.CLIENT_ID,
			ClientSecret: config.OAuthConfig.GOOGLE.CLIENT_SECRET,
			Scopes:       strings.Split(config.OAuthConfig.GOOGLE.OAUTH_SCOPES, ","),
			Endpoint:     endpoints.Google,
			RedirectURL:  config.OAuthConfig.GOOGLE.REDIRECT_URI,
		},
	}
}

func (p *GoogleProvider) GetConsentPageURL(w http.ResponseWriter, r *http.Request, store *sessions.CookieStore, userID string) (string, error) {

	verifier := oauth2.GenerateVerifier()

	encodedState, oauthState, err := GenerateOauthState(userID)
	if err != nil {
		config.LOGGER.Error("failed to generated encoded oauthstate", zap.String("provider", "google"), zap.Error(err))
		return "", err
	}

	session, err := store.Get(r, googleSessionName)
	if err != nil {
		config.LOGGER.Error("could not get or create session from cookie store", zap.String("provider", "google"), zap.Error(err))
		return "", err
	}

	session.Values["pkce_verifier_google"] = verifier
	session.Values["oauth_csrf_token_google"] = oauthState.CsrfToken

	err = session.Save(r, w)
	if err != nil {
		config.LOGGER.Error("failed to save session in cookie store", zap.String("provider", "google"), zap.Error(err))
		return "", err
	}

	url := p.Config.AuthCodeURL(encodedState, oauth2.AccessTypeOffline, oauth2.S256ChallengeOption(verifier), oauth2.SetAuthURLParam("prompt", "consent"))

	return url, nil
}

func (p *GoogleProvider) GetToken(w http.ResponseWriter, r *http.Request, store *sessions.CookieStore) (*oauth2.Token, string, error) {

	code := r.URL.Query().Get("code")
	if code == "" {
		return nil, "", ErrNoCode
	}

	receivedEncodedState := r.URL.Query().Get("state")
	if receivedEncodedState == "" {
		return nil, "", ErrNoState
	}

	receivedOauthState, err := DecodeOauthState(receivedEncodedState)
	if err != nil {
		config.LOGGER.Error("failed to decode received state", zap.String("provider", "google"), zap.Error(err))
		return nil, "", fmt.Errorf("failed to decode received state")
	}

	session, err := store.Get(r, googleSessionName)
	if err != nil {
		return nil, "", ErrNoSession
	}

	storedVerifier, ok := session.Values["pkce_verifier_google"].(string)
	if !ok || storedVerifier == "" {
		return nil, "", ErrNoVerifier
	}

	storedCsrfToken, ok := session.Values["oauth_csrf_token_google"].(string)
	if !ok || storedCsrfToken == "" {
		return nil, "", ErrNoState
	}

	if receivedOauthState.CsrfToken != storedCsrfToken {
		return nil, "", ErrInvalidState
	}

	delete(session.Values, "pkce_verifier_google")
	delete(session.Values, "oauth_csrf_token_google")
	err = session.Save(r, w)
	if err != nil {
		config.LOGGER.Error("failed to cleanup session details", zap.String("provider", "google"), zap.Error(err))
	}

	tok, err := p.Config.Exchange(context.Background(), code, oauth2.VerifierOption(storedVerifier))
	if err != nil {
		config.LOGGER.Error("token exchange failed", zap.String("provider", "google"), zap.Error(err))
		return nil, "", err
	}

	return tok, receivedOauthState.UserID, nil
}
