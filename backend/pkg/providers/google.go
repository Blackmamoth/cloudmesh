package providers

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/blackmamoth/cloudmesh/pkg/config"
	"github.com/gorilla/sessions"
	"go.uber.org/zap"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/endpoints"
	oauth2Google "google.golang.org/api/oauth2/v2"
	"google.golang.org/api/option"
)

type GoogleProvider struct {
	Config oauth2.Config
}

const GOOGLE_SESSION_NAME = "cloudmesh-google-oauth-session"

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

	session, err := store.Get(r, GOOGLE_SESSION_NAME)
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

func (p *GoogleProvider) GetToken(w http.ResponseWriter, r *http.Request, store *sessions.CookieStore) (*oauth2.Token, string, *UserAccountInfo, error) {

	code := r.URL.Query().Get("code")
	if code == "" {
		return nil, "", nil, ErrNoCode
	}

	receivedEncodedState := r.URL.Query().Get("state")
	if receivedEncodedState == "" {
		return nil, "", nil, ErrNoState
	}

	receivedOauthState, err := DecodeOauthState(receivedEncodedState)
	if err != nil {
		config.LOGGER.Error("failed to decode received state", zap.String("provider", "google"), zap.Error(err))
		return nil, "", nil, fmt.Errorf("failed to decode received state")
	}

	session, err := store.Get(r, GOOGLE_SESSION_NAME)
	if err != nil {
		return nil, "", nil, ErrNoSession
	}

	storedVerifier, ok := session.Values["pkce_verifier_google"].(string)
	if !ok || storedVerifier == "" {
		return nil, "", nil, ErrNoVerifier
	}

	storedCsrfToken, ok := session.Values["oauth_csrf_token_google"].(string)
	if !ok || storedCsrfToken == "" {
		return nil, "", nil, ErrNoState
	}

	if receivedOauthState.CsrfToken != storedCsrfToken {
		return nil, "", nil, ErrInvalidState
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
		return nil, "", nil, err
	}

	accountInfo, err := p.GetAccountInfo(r.Context(), tok)
	if err != nil {
		return nil, "", nil, err
	}

	return tok, receivedOauthState.UserID, accountInfo, nil
}

func (p *GoogleProvider) GetAccountInfo(ctx context.Context, token *oauth2.Token) (*UserAccountInfo, error) {
	httpClient := p.Config.Client(ctx, token)
	svc, err := oauth2Google.NewService(ctx, option.WithHTTPClient(httpClient))
	if err != nil {
		config.LOGGER.Error("failed to create oauth2 service", zap.String("provider", "google"), zap.Error(err))
		return nil, fmt.Errorf("failed to create oauth2 service")
	}

	userInfo, err := svc.Userinfo.Get().Do()
	if err != nil {
		config.LOGGER.Error("failed to fetch user info", zap.String("provider", "google"), zap.Error(err))
		return nil, fmt.Errorf("failed to fetch user info")
	}

	userAccountInfo := UserAccountInfo{
		Provider:       "google",
		ProviderUserID: userInfo.Id,
		Email:          userInfo.Email,
		Name:           userInfo.Name,
		AvatarURL:      userInfo.Picture,
	}

	return &userAccountInfo, nil
}
