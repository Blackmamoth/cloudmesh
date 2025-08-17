package providers

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/blackmamoth/cloudmesh/pkg/config"
	"github.com/blackmamoth/cloudmesh/pkg/middlewares"
	"github.com/blackmamoth/cloudmesh/repository"
	"github.com/google/uuid"
	"github.com/gorilla/sessions"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
	"golang.org/x/oauth2"
)

type UserAccountInfo struct {
	Provider       string `json:"provider"`
	ProviderUserID string `json:"provider_user_id"`
	Email          string `json:"email"`
	Name           string `json:"name"`
	AvatarURL      string `json:"avatar_url"`
}

type OAuthState struct {
	UserID    string `json:"user_id"`
	CsrfToken string `json:"csrf_token"`
}

type StorageQuota struct {
	TotalStorage int64 `json:"total_storage"`
	UsedStorage  int64 `json:"used_storage"`
}

type ParentFolder struct {
	ID   string
	Path string
}

type Provider interface {
	GetConsentPageURL(
		w http.ResponseWriter,
		r *http.Request,
		store *sessions.CookieStore,
		userID string,
	) (string, error)
	GetToken(
		w http.ResponseWriter,
		r *http.Request,
		store *sessions.CookieStore,
	) (*oauth2.Token, string, *UserAccountInfo, error)
	GetAccountInfo(ctx context.Context, token *oauth2.Token) (*UserAccountInfo, error)
	SyncFiles(
		ctx context.Context,
		conn *pgxpool.Conn,
		accountID pgtype.UUID,
		authToken repository.GetAuthTokensRow,
	) error
	RenewOAuthTokens(
		ctx context.Context,
		conn *pgxpool.Conn,
		accountID pgtype.UUID,
		refreshToken string,
	) (string, int64, error)
	UploadFiles(
		ctx context.Context,
		accountID *pgtype.UUID,
		conn *pgxpool.Conn,
		queries *repository.Queries,
		authTokens repository.GetAuthTokensRow,
		uploadedFiles []middlewares.UploadedFile,
	) error
	MoveToTrash(
		ctx context.Context,
		accountID *pgtype.UUID,
		conn *pgxpool.Conn,
		queries *repository.Queries,
		authTokens repository.GetAuthTokensRow,
		syncedItemIds []repository.GetProviderFileIdsRow,
	) error
	PermanentlyDeleteFiles(
		ctx context.Context,
		accountID *pgtype.UUID,
		conn *pgxpool.Conn,
		queries *repository.Queries,
		authTokens repository.GetAuthTokensRow,
		syncedItemIds []repository.GetProviderFileIdsRow,
	) error
	RestoreFiles(
		ctx context.Context,
		account *repository.GetAccountByIdRow,
		files []repository.GetTrashItemsByIdsRow,
		conn *pgxpool.Conn,
		queries *repository.Queries,
	) error
	SearchByContent(
		ctx context.Context,
		searchText string,
		account repository.GetUserAccountsRow,
		conn *pgxpool.Conn,
		queries *repository.Queries,
	) ([]string, error)
	GetStorageQuota(
		ctx context.Context,
		userID string,
		accountID *pgtype.UUID,
		encryptedAccessToken, encryptedRefreshToken string,
	) (*StorageQuota, error)
	CreateFolder(
		ctx context.Context,
		name string,
		parentFolder ParentFolder,
		account repository.GetLinkedAccountRow,
		conn *pgxpool.Conn,
		queries repository.Queries,
	) error
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
	OAuthProviders[string(repository.ProviderEnumMicrosoft)] = NewMicrosoftProvider()
}

func GenerateOauthState(userID string) (string, *OAuthState, error) {
	csrfToken := uuid.New().String()
	state := &OAuthState{
		UserID:    userID,
		CsrfToken: csrfToken,
	}

	jsonData, err := json.Marshal(state)
	if err != nil {
		return "", nil, fmt.Errorf("failed to marshal OAuth state: %w", err)
	}

	encodedState := base64.URLEncoding.EncodeToString(jsonData)

	return encodedState, state, nil
}

func DecodeOauthState(encodedState string) (*OAuthState, error) {
	decodedData, err := base64.URLEncoding.DecodeString(encodedState)
	if err != nil {
		return nil, fmt.Errorf("failed to base64 decode OAuth state: %w", err)
	}

	var state OAuthState
	if err := json.Unmarshal(decodedData, &state); err != nil {
		return nil, fmt.Errorf("failed to unmarshal OAuth state JSON: %w", err)
	}

	return &state, nil
}

func getConsentPageURL(
	userID, providerName, sessionName, verifierKey, csrfTokenKey string,
	w http.ResponseWriter,
	r *http.Request,
	oauthConfig *oauth2.Config,
	store *sessions.CookieStore,
) (string, error) {
	verifier := oauth2.GenerateVerifier()

	encodedState, oauthState, err := GenerateOauthState(userID)
	if err != nil {
		config.LOGGER.Error(
			"failed to generated encoded oauthstate",
			zap.String("provider", providerName),
			zap.Error(err),
		)

		return "", err
	}

	session, err := store.Get(r, sessionName)
	if err != nil {
		config.LOGGER.Error(
			"could not get or create session from cookie store",
			zap.String("provider", providerName),
			zap.Error(err),
		)

		return "", err
	}

	session.Values[verifierKey] = verifier
	session.Values[csrfTokenKey] = oauthState.CsrfToken

	err = session.Save(r, w)
	if err != nil {
		config.LOGGER.Error(
			"failed to save session in cookie store",
			zap.String("provider", providerName),
			zap.Error(err),
		)

		return "", err
	}

	url := oauthConfig.AuthCodeURL(
		encodedState,
		oauth2.AccessTypeOffline,
		oauth2.S256ChallengeOption(verifier),
		oauth2.SetAuthURLParam("prompt", "consent"),
	)

	return url, nil
}

func exchangeToken(
	ctx context.Context,
	r *http.Request,
	w http.ResponseWriter,
	store *sessions.CookieStore,
	sessionName string,
	verifierKey string,
	csrfTokenKey string,
	oauthConfig *oauth2.Config,
	providerName string,
	getAccountInfo func(ctx context.Context, tok *oauth2.Token) (*UserAccountInfo, error),
) (*oauth2.Token, string, *UserAccountInfo, error) {
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
		config.LOGGER.Error(
			"failed to decode received state",
			zap.String("provider", providerName),
			zap.Error(err),
		)

		return nil, "", nil, errors.New("failed to decode received state")
	}

	session, err := store.Get(r, sessionName)
	if err != nil {
		return nil, "", nil, ErrNoSession
	}

	storedVerifier, ok := session.Values[verifierKey].(string)
	if !ok || storedVerifier == "" {
		return nil, "", nil, ErrNoVerifier
	}

	storedCsrfToken, ok := session.Values[csrfTokenKey].(string)
	if !ok || storedCsrfToken == "" {
		return nil, "", nil, ErrNoState
	}

	if receivedOauthState.CsrfToken != storedCsrfToken {
		return nil, "", nil, ErrInvalidState
	}

	delete(session.Values, verifierKey)
	delete(session.Values, csrfTokenKey)

	err = session.Save(r, w)
	if err != nil {
		config.LOGGER.Error(
			"failed to cleanup session details",
			zap.String("provider", providerName),
			zap.Error(err),
		)
	}

	tok, err := oauthConfig.Exchange(ctx, code, oauth2.VerifierOption(storedVerifier))
	if err != nil {
		config.LOGGER.Error(
			"token exchange failed",
			zap.String("provider", providerName),
			zap.Error(err),
		)

		return nil, "", nil, err
	}

	accountInfo, err := getAccountInfo(ctx, tok)
	if err != nil {
		return nil, "", nil, err
	}

	return tok, receivedOauthState.UserID, accountInfo, nil
}
