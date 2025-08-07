package providers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/blackmamoth/cloudmesh/pkg/config"
	"github.com/blackmamoth/cloudmesh/pkg/middlewares"
	"github.com/blackmamoth/cloudmesh/repository"
	"github.com/gorilla/sessions"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/endpoints"
)

type MicrosoftProvider struct {
	Config oauth2.Config
}

type MicrosoftUser struct {
	ID                string   `json:"id"`
	DisplayName       string   `json:"displayName"`
	GivenName         string   `json:"givenName"`
	Surname           string   `json:"surname"`
	UserPrincipalName string   `json:"userPrincipalName"`
	Mail              string   `json:"mail"`
	JobTitle          string   `json:"jobTitle,omitempty"`
	OfficeLocation    string   `json:"officeLocation,omitempty"`
	PreferredLanguage string   `json:"preferredLanguage,omitempty"`
	MobilePhone       string   `json:"mobilePhone,omitempty"`
	BusinessPhones    []string `json:"businessPhones,omitempty"`
}

const (
	MICROSOFT_SESSION_NAME  = "cloudmesh-microsoft-oauth-session"
	MICROSOFT_PROVIDER_NAME = string(repository.ProviderEnumMicrosoft)
	MICROSOFT_BASE_URL      = "https://graph.microsoft.com/v1.0"
)

func NewMicrosoftProvider() *MicrosoftProvider {
	return &MicrosoftProvider{
		Config: oauth2.Config{
			ClientID:     config.OAuthConfig.MICROSOFT.CLIENT_ID,
			ClientSecret: config.OAuthConfig.MICROSOFT.CLIENT_SECRET,
			Endpoint:     endpoints.Microsoft,
			Scopes:       strings.Split(config.OAuthConfig.MICROSOFT.OAUTH_SCOPES, ","),
			RedirectURL:  config.OAuthConfig.MICROSOFT.REDIRECT_URI,
		},
	}
}

func (p *MicrosoftProvider) GetConsentPageURL(w http.ResponseWriter, r *http.Request, store *sessions.CookieStore, userID string) (string, error) {
	verifier := oauth2.GenerateVerifier()

	encodedState, oauthState, err := GenerateOauthState(userID)
	if err != nil {
		config.LOGGER.Error("failed to generated encoded oauthstate", zap.String("provider", MICROSOFT_PROVIDER_NAME), zap.Error(err))
		return "", err
	}

	session, err := store.Get(r, MICROSOFT_SESSION_NAME)
	if err != nil {
		config.LOGGER.Error("could not get or create session from cookie store", zap.String("provider", MICROSOFT_PROVIDER_NAME), zap.Error(err))
		return "", err
	}

	session.Values["pkce_verifier_microsoft"] = verifier
	session.Values["oauth_csrf_token_microsoft"] = oauthState.CsrfToken

	err = session.Save(r, w)
	if err != nil {
		config.LOGGER.Error("failed to save session in cookie store", zap.String("provider", MICROSOFT_PROVIDER_NAME), zap.Error(err))
		return "", err
	}

	url := p.Config.AuthCodeURL(encodedState, oauth2.AccessTypeOffline, oauth2.S256ChallengeOption(verifier), oauth2.SetAuthURLParam("prompt", "consent"))

	return url, nil
}

func (p *MicrosoftProvider) GetToken(w http.ResponseWriter, r *http.Request, store *sessions.CookieStore) (*oauth2.Token, string, *UserAccountInfo, error) {
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
		config.LOGGER.Error("failed to decode received state", zap.String("provider", MICROSOFT_PROVIDER_NAME), zap.Error(err))
		return nil, "", nil, fmt.Errorf("failed to decode received state")
	}

	session, err := store.Get(r, MICROSOFT_SESSION_NAME)
	if err != nil {
		return nil, "", nil, ErrNoSession
	}

	storedVerifier, ok := session.Values["pkce_verifier_microsoft"].(string)
	if !ok || storedVerifier == "" {
		return nil, "", nil, ErrNoVerifier
	}

	storedCsrfToken, ok := session.Values["oauth_csrf_token_microsoft"].(string)
	if !ok || storedCsrfToken == "" {
		return nil, "", nil, ErrNoState
	}

	if receivedOauthState.CsrfToken != storedCsrfToken {
		return nil, "", nil, ErrInvalidState
	}

	delete(session.Values, "pkce_verifier_microsoft")
	delete(session.Values, "oauth_csrf_token_microsoft")
	err = session.Save(r, w)
	if err != nil {
		config.LOGGER.Error("failed to cleanup session details", zap.String("provider", MICROSOFT_PROVIDER_NAME), zap.Error(err))
	}

	tok, err := p.Config.Exchange(context.Background(), code, oauth2.VerifierOption(storedVerifier))
	if err != nil {
		config.LOGGER.Error("token exchange failed", zap.String("provider", MICROSOFT_PROVIDER_NAME), zap.Error(err))
		return nil, "", nil, err
	}

	accountInfo, err := p.GetAccountInfo(r.Context(), tok)
	if err != nil {
		return nil, "", nil, err
	}

	return tok, receivedOauthState.UserID, accountInfo, nil
}

func (p *MicrosoftProvider) GetAccountInfo(ctx context.Context, token *oauth2.Token) (*UserAccountInfo, error) {
	url := fmt.Sprintf("%s/me", MICROSOFT_BASE_URL)

	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		config.LOGGER.Error("failed to create request body for microsoft account info request", zap.String("provider", MICROSOFT_PROVIDER_NAME), zap.Error(err))
		return nil, err
	}

	httpClient := http.Client{}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token.AccessToken))

	resp, err := httpClient.Do(req)
	if err != nil {
		config.LOGGER.Error("http request for getting microsoft account details failed", zap.String("provider", MICROSOFT_PROVIDER_NAME), zap.Error(err))
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		config.LOGGER.Error("failed to read http response body for getting microsoft account details", zap.String("provider", MICROSOFT_PROVIDER_NAME), zap.Error(err))
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		err = fmt.Errorf("%s", string(body))
		config.LOGGER.Error("http response for getting microsoft account details returned a non 200 response", zap.Int("status_code", resp.StatusCode), zap.String("provider", MICROSOFT_PROVIDER_NAME), zap.Error(err))
		return nil, err
	}

	var user MicrosoftUser

	err = json.Unmarshal(body, &user)
	if err != nil {
		config.LOGGER.Error("failed to unmarshal microsoft user details", zap.String("provider", MICROSOFT_PROVIDER_NAME), zap.Error(err))
		return nil, err
	}

	userAccountInfo := UserAccountInfo{
		Provider:       MICROSOFT_PROVIDER_NAME,
		ProviderUserID: user.ID,
		Email:          user.Mail,
		Name:           user.DisplayName,
		AvatarURL:      "",
	}

	return &userAccountInfo, nil
}

func (p *MicrosoftProvider) SyncFiles(ctx context.Context, conn *pgxpool.Conn, accountID pgtype.UUID, authToken repository.GetAuthTokensRow) error {
	return nil
}

func (p *MicrosoftProvider) RenewOAuthTokens(ctx context.Context, conn *pgxpool.Conn, accountID pgtype.UUID, refreshToken string) (string, int64, error) {
	return "", 0, nil
}

func (p *MicrosoftProvider) UploadFiles(ctx context.Context, accountID *pgtype.UUID, conn *pgxpool.Conn, queries *repository.Queries, authTokens repository.GetAuthTokensRow, uploadedFiles []middlewares.UploadedFile) error {
	return nil
}

func (p *MicrosoftProvider) MoveToTrash(ctx context.Context, accountID *pgtype.UUID, conn *pgxpool.Conn, queries *repository.Queries, authTokens repository.GetAuthTokensRow, syncedItemIds []repository.GetProviderFileIdsRow) error {
	return nil
}

func (p *MicrosoftProvider) PermanentlyDeleteFiles(ctx context.Context, accountID *pgtype.UUID, conn *pgxpool.Conn, queries *repository.Queries, authTokens repository.GetAuthTokensRow, syncedItemIds []repository.GetProviderFileIdsRow) error {
	return nil
}

func (p *MicrosoftProvider) SearchByContent(ctx context.Context, searchText string, account repository.GetUserAccountsRow, conn *pgxpool.Conn, queries *repository.Queries) ([]string, error) {
	return nil, nil
}

func (p *MicrosoftProvider) GetStorageQuota(ctx context.Context, userID string, accountID *pgtype.UUID, encryptedAccessToken, encryptedRefreshToken string) (*StorageQuota, error) {
	return nil, nil
}
