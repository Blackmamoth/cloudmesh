package providers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/blackmamoth/cloudmesh/pkg/config"
	"github.com/blackmamoth/cloudmesh/repository"
	"github.com/gorilla/sessions"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/endpoints"
)

type DropboxProvider struct {
	Config oauth2.Config
}

type DropboxAccountInfo struct {
	AccountID   string `json:"account_id"`
	AccountType struct {
		Tag string `json:".tag"`
	}
	Disabled      bool   `json:"disabled"`
	Email         string `json:"email"`
	EmailVerified bool   `json:"email_verified"`
	IsTeammate    bool   `json:"is_teammate"`
	Name          struct {
		AbbreviatedName string `json:"abbreviated_name"`
		DisplayName     string `json:"display_name"`
		FamiliarName    string `json:"familiar_name"`
		GivenName       string `json:"given_name"`
		Surname         string `json:"surname"`
	}
	ProfilePhotoURL string `json:"profile_photo_url"`
	TeamMemberID    string `json:"team_member_id"`
}

const (
	DROPBOX_SESSION_NAME = "cloudmesh-dropbox-oauth-session"
	DROPBOX_ACCOUNT_URL  = "https://api.dropboxapi.com/2/users/get_current_account"
)

func NewDropboxProvider() *DropboxProvider {
	return &DropboxProvider{
		Config: oauth2.Config{
			ClientID:     config.OAuthConfig.DROPBOX.CLIENT_ID,
			ClientSecret: config.OAuthConfig.DROPBOX.CLIENT_SECRET,
			Scopes:       strings.Split(config.OAuthConfig.DROPBOX.OAUTH_SCOPES, ","),
			Endpoint:     endpoints.Dropbox,
			RedirectURL:  config.OAuthConfig.DROPBOX.REDIRECT_URI,
		},
	}
}

func (p *DropboxProvider) GetConsentPageURL(w http.ResponseWriter, r *http.Request, store *sessions.CookieStore, userID string) (string, error) {

	verifier := oauth2.GenerateVerifier()

	encodedState, oauthState, err := GenerateOauthState(userID)
	if err != nil {
		config.LOGGER.Error("failed to generated encoded oauthstate", zap.String("provider", "dropbox"), zap.Error(err))
		return "", err
	}

	session, err := store.Get(r, DROPBOX_SESSION_NAME)
	if err != nil {
		config.LOGGER.Error("could not get or create session from cookie store", zap.String("provider", "dropbox"), zap.Error(err))
		return "", err
	}

	session.Values["pkce_verifier_dropbox"] = verifier
	session.Values["oauth_csrf_token_dropbox"] = oauthState.CsrfToken

	err = session.Save(r, w)
	if err != nil {
		config.LOGGER.Error("failed to save session in cookie store", zap.String("provider", "dropbox"), zap.Error(err))
		return "", err
	}

	url := p.Config.AuthCodeURL(encodedState, oauth2.AccessTypeOffline, oauth2.S256ChallengeOption(verifier), oauth2.SetAuthURLParam("prompt", "consent"), oauth2.SetAuthURLParam("token_access_type", "offline"))

	return url, nil
}

func (p *DropboxProvider) GetToken(w http.ResponseWriter, r *http.Request, store *sessions.CookieStore) (*oauth2.Token, string, *UserAccountInfo, error) {

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
		config.LOGGER.Error("failed to decode received state", zap.String("provider", "dropbox"), zap.Error(err))
		return nil, "", nil, fmt.Errorf("failed to decode received state")
	}

	session, err := store.Get(r, DROPBOX_SESSION_NAME)
	if err != nil {
		return nil, "", nil, ErrNoSession
	}

	storedVerifier, ok := session.Values["pkce_verifier_dropbox"].(string)
	if !ok || storedVerifier == "" {
		return nil, "", nil, ErrNoVerifier
	}

	storedCsrfToken, ok := session.Values["oauth_csrf_token_dropbox"].(string)
	if !ok || storedCsrfToken == "" {
		return nil, "", nil, ErrNoState
	}

	if receivedOauthState.CsrfToken != storedCsrfToken {
		return nil, "", nil, ErrInvalidState
	}

	delete(session.Values, "pkce_verifier_dropbox")
	delete(session.Values, "oauth_csrf_token_dropbox")
	err = session.Save(r, w)
	if err != nil {
		config.LOGGER.Error("failed to cleanup session details", zap.String("provider", "dropbox"), zap.Error(err))
	}

	tok, err := p.Config.Exchange(context.Background(), code, oauth2.VerifierOption(storedVerifier))
	if err != nil {
		config.LOGGER.Error("token exchange failed", zap.String("provider", "dropbox"), zap.Error(err))
		return nil, "", nil, err
	}

	accountInfo, err := p.GetAccountInfo(r.Context(), tok)
	if err != nil {
		return nil, "", nil, err
	}

	return tok, receivedOauthState.UserID, accountInfo, nil
}

func (p *DropboxProvider) GetAccountInfo(ctx context.Context, token *oauth2.Token) (*UserAccountInfo, error) {

	httpClient := http.Client{}

	req, err := http.NewRequest(http.MethodPost, DROPBOX_ACCOUNT_URL, nil)
	if err != nil {
		config.LOGGER.Error("failed to initiate new HTTP POST request", zap.Error(err))
		return nil, err
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token.AccessToken))

	res, err := httpClient.Do(req)
	if err != nil {
		config.LOGGER.Error("dropbox /get_current_account request failed", zap.String("provider", "dropbox"), zap.Error(err))
		return nil, err
	}

	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		config.LOGGER.Error("failed to read response body for /get_current_account", zap.String("provider", "dropbox"), zap.Error(err))
		return nil, err
	}

	var response DropboxAccountInfo

	err = json.Unmarshal(body, &response)

	if err != nil {
		config.LOGGER.Error("failed to unmarshal response body for /get_current_account", zap.String("provider", "dropbox"), zap.Error(err))
		return nil, err
	}

	userInfo := UserAccountInfo{
		Provider:       "dropbox",
		ProviderUserID: response.AccountID,
		Email:          response.Email,
		Name:           response.Name.DisplayName,
		AvatarURL:      response.ProfilePhotoURL,
	}

	return &userInfo, nil
}

func (p *DropboxProvider) SyncFiles(ctx context.Context, conn *pgxpool.Conn, accountID pgtype.UUID, authToken repository.GetAuthTokensRow) error {
	return nil
}
