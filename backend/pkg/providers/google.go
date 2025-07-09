package providers

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/blackmamoth/cloudmesh/pkg/config"
	"github.com/blackmamoth/cloudmesh/pkg/db"
	"github.com/blackmamoth/cloudmesh/pkg/utils"
	"github.com/blackmamoth/cloudmesh/repository"
	"github.com/gorilla/sessions"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/endpoints"
	"google.golang.org/api/drive/v3"
	oauth2Google "google.golang.org/api/oauth2/v2"
	"google.golang.org/api/option"
)

type GoogleProvider struct {
	Config oauth2.Config
}

const (
	GOOGLE_SESSION_NAME  = "cloudmesh-google-oauth-session"
	GOOGLE_PROVIDER_NAME = string(repository.ProviderEnumGoogle)
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

func (p *GoogleProvider) GetConsentPageURL(w http.ResponseWriter, r *http.Request, store *sessions.CookieStore, userID string) (string, error) {

	verifier := oauth2.GenerateVerifier()

	encodedState, oauthState, err := GenerateOauthState(userID)
	if err != nil {
		config.LOGGER.Error("failed to generated encoded oauthstate", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Error(err))
		return "", err
	}

	session, err := store.Get(r, GOOGLE_SESSION_NAME)
	if err != nil {
		config.LOGGER.Error("could not get or create session from cookie store", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Error(err))
		return "", err
	}

	session.Values["pkce_verifier_google"] = verifier
	session.Values["oauth_csrf_token_google"] = oauthState.CsrfToken

	err = session.Save(r, w)
	if err != nil {
		config.LOGGER.Error("failed to save session in cookie store", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Error(err))
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
		config.LOGGER.Error("failed to decode received state", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Error(err))
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
		config.LOGGER.Error("failed to cleanup session details", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Error(err))
	}

	tok, err := p.Config.Exchange(context.Background(), code, oauth2.VerifierOption(storedVerifier))
	if err != nil {
		config.LOGGER.Error("token exchange failed", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Error(err))
		return nil, "", nil, err
	}

	accountInfo, err := p.GetAccountInfo(r.Context(), tok)
	if err != nil {
		return nil, "", nil, err
	}

	return tok, receivedOauthState.UserID, accountInfo, nil
}

func (p *GoogleProvider) GetAccountInfo(ctx context.Context, token *oauth2.Token) (*UserAccountInfo, error) {
	httpClient := p.getHTTPClient(token.AccessToken, token.RefreshToken)
	svc, err := oauth2Google.NewService(ctx, option.WithHTTPClient(httpClient))
	if err != nil {
		config.LOGGER.Error("failed to create oauth2 service", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Error(err))
		return nil, fmt.Errorf("failed to create oauth2 service")
	}

	userInfo, err := svc.Userinfo.Get().Do()
	if err != nil {
		config.LOGGER.Error("failed to fetch user info", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Error(err))
		return nil, fmt.Errorf("failed to fetch user info")
	}

	userAccountInfo := UserAccountInfo{
		Provider:       DROPBOX_PROVIDER_NAME,
		ProviderUserID: userInfo.Id,
		Email:          userInfo.Email,
		Name:           userInfo.Name,
		AvatarURL:      userInfo.Picture,
	}

	return &userAccountInfo, nil
}

func (p *GoogleProvider) SyncFiles(ctx context.Context, conn *pgxpool.Conn, accountID pgtype.UUID, authToken repository.GetAuthTokensRow) error {

	httpClient := p.getHTTPClient(authToken.AccessToken, authToken.RefreshToken)

	driveService, err := drive.NewService(ctx, option.WithHTTPClient(httpClient))
	if err != nil {
		config.LOGGER.Error("an error occured while initializing google drive service", zap.String("provider", GOOGLE_PROVIDER_NAME), zap.Error(err))
		return err
	}

	pageToken := ""

	query := ""

	queries := repository.New(conn)

	lastSyncedAt, err := queries.GetLatestSyncTime(ctx, accountID)

	if err != nil {
		if !errors.Is(err, sql.ErrNoRows) {
			config.LOGGER.Error("could not fetch timestamp for latest sync", zap.String("provider", GOOGLE_PROVIDER_NAME), zap.String("account_id", accountID.String()))
			return err
		}
	}

	if lastSyncedAt.Valid {
		query = fmt.Sprintf("modifiedTime > '%s'", lastSyncedAt.Time.Format(time.RFC3339))
	}

	var files []repository.AddSyncedItemsParams
	totalItemCount := 0

	for {
		fileList, err := driveService.Files.
			List().
			Q(query).
			Fields("files(id, name, size, mimeType, createdTime, modifiedTime, thumbnailLink, fullFileExtension, parents, webViewLink, webContentLink, iconLink, sha256Checksum)").
			PageToken(pageToken).
			PageSize(1000).
			Do()

		if err != nil {
			config.LOGGER.Error("an error occured while synching google drive files", zap.String("provider", GOOGLE_PROVIDER_NAME), zap.Error(err))
			return err
		}

		for _, file := range fileList.Files {

			parsedCreatedTime, err := time.Parse(time.RFC3339, file.CreatedTime)
			if err != nil {
				parsedCreatedTime = time.Time{}
			}

			parsedModifiedTime, err := time.Parse(time.RFC3339, file.ModifiedTime)
			if err != nil {
				parsedModifiedTime = time.Time{}
			}

			previewLink := fmt.Sprintf("https://drive.google.com/file/d/%s/preview", file.Id)

			parentFolder := ""

			if len(file.Parents) > 0 {
				parentFolder = file.Parents[0]
			}

			isFolder := file.MimeType == "application/vnd.google-apps.folder"

			files = append(files, repository.AddSyncedItemsParams{
				AccountID:      accountID,
				ProviderFileID: file.Id,
				Name:           file.Name,
				Extension:      file.FullFileExtension,
				Size:           file.Size,
				MimeType:       db.PGTextField(file.MimeType),
				CreatedTime:    db.PGTimestamptzField(parsedCreatedTime),
				ModifiedTime:   db.PGTimestamptzField(parsedModifiedTime),
				ParentFolder:   db.PGTextField(parentFolder),
				IsFolder:       isFolder,
				ContentHash:    db.PGTextField(file.Sha256Checksum),
				ThumbnailLink:  db.PGTextField(file.ThumbnailLink),
				PreviewLink:    db.PGTextField(previewLink),
				WebViewLink:    db.PGTextField(file.WebViewLink),
				WebContentLink: db.PGTextField(file.WebContentLink),
				LinkExpiresAt:  db.PGTimestamptzField(time.Time{}),
			})
		}

		var insertedRows int64

		err = utils.WithTransaction(ctx, conn, func(tx pgx.Tx) error {
			qx := queries.WithTx(tx)

			insertedRows, err = qx.AddSyncedItems(ctx, files)

			if err != nil {
				return err
			}

			return qx.UpdateLastSyncedTimestamp(ctx, repository.UpdateLastSyncedTimestampParams{
				SyncPageToken: db.PGTextField(""),
				AccountID:     accountID,
			})
		})

		if err != nil {
			config.LOGGER.Error("failed to insert synced files", zap.String("provider", GOOGLE_PROVIDER_NAME), zap.Error(err))
			return err
		}

		config.LOGGER.Info("batch inserted", zap.String("provider", GOOGLE_PROVIDER_NAME), zap.String("account_id", accountID.String()), zap.Int64("item_count", insertedRows))

		totalItemCount += int(insertedRows)

		pageToken = fileList.NextPageToken

		if pageToken == "" {
			break
		}

		files = []repository.AddSyncedItemsParams{}
	}

	config.LOGGER.Info("Google drive sync successful", zap.Int("item_count", totalItemCount))

	return nil
}

func (p *GoogleProvider) RenewOAuthTokens(ctx context.Context, conn *pgxpool.Conn, accountID pgtype.UUID, refreshToken string) (string, error) {
	return "", nil
}

func (p *GoogleProvider) getHTTPClient(accessToken, refreshToken string) *http.Client {
	token := &oauth2.Token{AccessToken: accessToken, RefreshToken: refreshToken}

	tokenSource := p.Config.TokenSource(context.Background(), token)

	reusableTokenSource := oauth2.ReuseTokenSource(token, tokenSource)

	return oauth2.NewClient(context.Background(), reusableTokenSource)
}
