package providers

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/blackmamoth/cloudmesh/pkg/config"
	"github.com/google/uuid"
	"github.com/gorilla/sessions"
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

func (p *GoogleProvider) GetConsentPageURL(w http.ResponseWriter, r *http.Request, store *sessions.CookieStore, sessionName string) (string, error) {
	verifier := oauth2.GenerateVerifier()
	state := uuid.New().String()

	session, err := store.Get(r, sessionName)
	if err != nil {
		return "", err
	}

	session.Values["pkce_verifier"] = verifier
	session.Values["oauth_state"] = state

	err = sessions.Save(r, w)
	if err != nil {
		return "", err
	}

	url := p.Config.AuthCodeURL(state, oauth2.AccessTypeOffline, oauth2.S256ChallengeOption(verifier), oauth2.SetAuthURLParam("prompt", "consent"))
	return url, nil
}

func (p *GoogleProvider) GetToken(w http.ResponseWriter, r *http.Request, store *sessions.CookieStore, sessionName string) (*oauth2.Token, error) {

	code := r.URL.Query().Get("code")
	if code == "" {
		return nil, ErrNoCode
	}

	receivedState := r.URL.Query().Get("state")
	if receivedState == "" {
		return nil, ErrNoState
	}

	session, err := store.Get(r, sessionName)
	if err != nil {
		return nil, ErrNoSession
	}

	storedVerifier, ok := session.Values["pkce_verifier"].(string)
	if !ok || storedVerifier == "" {
		return nil, ErrNoVerifier
	}

	storedState, ok := session.Values["oauth_state"].(string)
	if !ok || storedState == "" {
		return nil, ErrNoState
	}

	if receivedState != storedState {
		return nil, ErrInvalidState
	}

	delete(session.Values, "pkce_verifier")
	delete(session.Values, "oauth_state")
	err = session.Save(r, w)

	if err != nil {
		return nil, ErrFailSessionCleanUp
	}

	tok, err := p.Config.Exchange(context.Background(), code, oauth2.VerifierOption(storedVerifier))
	if err != nil {
		return nil, err
	}

	return tok, nil
}
