package providers

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/blackmamoth/cloudmesh/pkg/config"
	"github.com/blackmamoth/cloudmesh/pkg/db"
	"github.com/blackmamoth/cloudmesh/pkg/middlewares"
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
	"google.golang.org/api/googleapi"
	oauth2Google "google.golang.org/api/oauth2/v2"
	"google.golang.org/api/option"
)

type GoogleProvider struct {
	Config oauth2.Config
}

const (
	GOOGLE_SESSION_NAME  = "cloudmesh-google-oauth-session"
	GOOGLE_PROVIDER_NAME = string(repository.ProviderEnumGoogle)
	GOOGLE_AUTH_URL      = "https://oauth2.googleapis.com/token"
)

type GoogleAuthResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int64  `json:"expires_in"`
	IDToken     string `json:"id_token"`
}

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
		config.LOGGER.Error("failed to generated encoded oauthstate", zap.String("provider", GOOGLE_PROVIDER_NAME), zap.Error(err))
		return "", err
	}

	session, err := store.Get(r, GOOGLE_SESSION_NAME)
	if err != nil {
		config.LOGGER.Error("could not get or create session from cookie store", zap.String("provider", GOOGLE_PROVIDER_NAME), zap.Error(err))
		return "", err
	}

	session.Values["pkce_verifier_google"] = verifier
	session.Values["oauth_csrf_token_google"] = oauthState.CsrfToken

	err = session.Save(r, w)
	if err != nil {
		config.LOGGER.Error("failed to save session in cookie store", zap.String("provider", GOOGLE_PROVIDER_NAME), zap.Error(err))
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
		config.LOGGER.Error("failed to decode received state", zap.String("provider", GOOGLE_PROVIDER_NAME), zap.Error(err))
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
		config.LOGGER.Error("failed to cleanup session details", zap.String("provider", GOOGLE_PROVIDER_NAME), zap.Error(err))
	}

	tok, err := p.Config.Exchange(context.Background(), code, oauth2.VerifierOption(storedVerifier))
	if err != nil {
		config.LOGGER.Error("token exchange failed", zap.String("provider", GOOGLE_PROVIDER_NAME), zap.Error(err))
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
		config.LOGGER.Error("failed to create oauth2 service", zap.String("provider", GOOGLE_PROVIDER_NAME), zap.Error(err))
		return nil, fmt.Errorf("failed to create oauth2 service")
	}

	userInfo, err := svc.Userinfo.Get().Do()
	if err != nil {
		config.LOGGER.Error("failed to fetch user info", zap.String("provider", GOOGLE_PROVIDER_NAME), zap.Error(err))
		return nil, fmt.Errorf("failed to fetch user info")
	}

	userAccountInfo := UserAccountInfo{
		Provider:       GOOGLE_PROVIDER_NAME,
		ProviderUserID: userInfo.Id,
		Email:          userInfo.Email,
		Name:           userInfo.Name,
		AvatarURL:      userInfo.Picture,
	}

	return &userAccountInfo, nil
}

func (p *GoogleProvider) SyncFiles(ctx context.Context, conn *pgxpool.Conn, accountID pgtype.UUID, authToken repository.GetAuthTokensRow) error {

	accessToken, err := utils.Decrypt(authToken.AccessToken)
	if err != nil {
		config.LOGGER.Error("could not decrypt access token", zap.String("provider", GOOGLE_PROVIDER_NAME), zap.String("account_id", accountID.String()))
		return err
	}

	refreshToken, err := utils.Decrypt(authToken.RefreshToken)
	if err != nil {
		config.LOGGER.Error("could not decrypt refresh token", zap.String("provider", GOOGLE_PROVIDER_NAME), zap.String("account_id", accountID.String()))
		return err
	}

	httpClient := p.getHTTPClient(accessToken, refreshToken)

	driveService, err := drive.NewService(ctx, option.WithHTTPClient(httpClient))
	if err != nil {
		config.LOGGER.Error("an error occured while initializing google drive service", zap.String("provider", GOOGLE_PROVIDER_NAME), zap.Error(err))
		return err
	}

	pageToken := ""

	query := ""

	queries := repository.New(conn)

	syncDetails, err := queries.GetLatestSyncTimeAndPagetoken(ctx, accountID)

	if err != nil {
		if !errors.Is(err, sql.ErrNoRows) {
			config.LOGGER.Error("could not fetch timestamp and page token for latest sync", zap.String("provider", GOOGLE_PROVIDER_NAME), zap.String("account_id", accountID.String()))
			return err
		}
	}

	if syncDetails.LastSyncedAt.Valid {
		query = fmt.Sprintf("modifiedTime > '%s'", syncDetails.LastSyncedAt.Time.Format(time.RFC3339))
	}

	var files []repository.AddSyncedItemsParams

	totalItemCount := 0

	for {
		var providerFileIDs []string

		fileList, err := driveService.Files.
			List().
			Q(query).
			Fields("files(id, name, size, mimeType, createdTime, modifiedTime, thumbnailLink, fullFileExtension, parents, webViewLink, webContentLink, iconLink, sha256Checksum)").
			PageToken(pageToken).
			PageSize(1000).
			Do()

		if err != nil {
			if gErr, ok := err.(*googleapi.Error); ok {
				if gErr.Code == http.StatusUnauthorized {
					newAccessToken, _, err := p.RenewOAuthTokens(ctx, conn, accountID, refreshToken)

					if err != nil {
						return err
					}

					httpClient = p.getHTTPClient(newAccessToken, refreshToken)
					driveService, err = drive.NewService(ctx, option.WithHTTPClient(httpClient))
					if err != nil {
						config.LOGGER.Error("an error occured while initializing google drive service", zap.String("provider", GOOGLE_PROVIDER_NAME), zap.Error(err))
						return err
					}

					continue
				}
			}

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

			isFolder := file.MimeType == "application/vnd.google-apps.folder"

			previewLink := fmt.Sprintf("https://drive.google.com/file/d/%s/preview", file.Id)

			if isFolder {
				previewLink = fmt.Sprintf("https://drive.google.com/folder/d/%s/preview", file.Id)
			}

			parentFolder := "/"

			if len(file.Parents) > 0 {
				parentFolder = file.Parents[0]
			}

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

			if syncDetails.LastSyncedAt.Valid {
				providerFileIDs = append(providerFileIDs, file.Id)
			}
		}

		var insertedRows int64

		err = utils.WithTransaction(ctx, conn, func(tx pgx.Tx) error {
			qx := queries.WithTx(tx)

			if len(providerFileIDs) > 0 {
				err := qx.DeleteConflictingItems(ctx, repository.DeleteConflictingItemsParams{
					ProviderFileIds: providerFileIDs,
					AccountID:       accountID,
				})

				if err != nil {
					config.LOGGER.Error("an error occured while deleting conflicted files", zap.String("provider", GOOGLE_PROVIDER_NAME), zap.String("account_id", accountID.String()), zap.Error(err))
					return err
				}
			}

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

func (p *GoogleProvider) RenewOAuthTokens(ctx context.Context, conn *pgxpool.Conn, accountID pgtype.UUID, refreshToken string) (string, int64, error) {
	reqUrl := fmt.Sprintf("%s?grant_type=refresh_token&client_id=%s&client_secret=%s&refresh_token=%s", GOOGLE_AUTH_URL, p.Config.ClientID, p.Config.ClientSecret, refreshToken)

	res, err := http.Post(reqUrl, "application/json", nil)
	if err != nil {
		config.LOGGER.Error("http request for google token renewal failed", zap.String("provider", GOOGLE_PROVIDER_NAME))
		return "", 0, err
	}

	body, err := io.ReadAll(res.Body)
	if err != nil {
		config.LOGGER.Error("failed to read http response body for google token renewal", zap.String("provider", GOOGLE_PROVIDER_NAME), zap.Int("status_code", res.StatusCode))
		return "", 0, err
	}

	defer res.Body.Close()

	var googleAuthResponse GoogleAuthResponse

	if err := json.Unmarshal(body, &googleAuthResponse); err != nil {
		config.LOGGER.Error("failed to unmarshal dropbox token renew response", zap.String("provider", GOOGLE_PROVIDER_NAME), zap.Error(err))
		return "", 0, err
	}

	err = utils.WithTransaction(ctx, conn, func(tx pgx.Tx) error {

		encryptedAccessToken, err := utils.Encrypt(googleAuthResponse.AccessToken)
		if err != nil {
			config.LOGGER.Error("failed to encrypt new access token", zap.String("provider", GOOGLE_PROVIDER_NAME), zap.Error(err))
			return err
		}

		qx := repository.New(conn).WithTx(tx)

		err = qx.UpdateRenewedAuthToken(ctx, repository.UpdateRenewedAuthTokenParams{
			AccountID:   accountID,
			AccessToken: encryptedAccessToken,
			TokenType:   db.PGTextField(googleAuthResponse.TokenType),
		})

		return err
	})

	if err != nil {
		config.LOGGER.Error("failed to update google oauth tokens in db", zap.String("provider", GOOGLE_PROVIDER_NAME), zap.Error(err))
		return "", 0, err
	}

	return googleAuthResponse.AccessToken, googleAuthResponse.ExpiresIn, nil
}

func (p *GoogleProvider) getHTTPClient(accessToken, refreshToken string) *http.Client {
	token := &oauth2.Token{AccessToken: accessToken, RefreshToken: refreshToken}

	tokenSource := p.Config.TokenSource(context.Background(), token)

	reusableTokenSource := oauth2.ReuseTokenSource(token, tokenSource)

	return oauth2.NewClient(context.Background(), reusableTokenSource)
}

func (p *GoogleProvider) UploadFiles(ctx context.Context, authTokens repository.GetAuthTokensRow, uploadedFiles []middlewares.UploadedFile) error {

	accessToken, err := utils.Decrypt(authTokens.AccessToken)
	if err != nil {
		config.LOGGER.Error("failed to decrypt access token", zap.String("provider", GOOGLE_PROVIDER_NAME), zap.Error(err))
		return err
	}

	refreshToken, err := utils.Decrypt(authTokens.RefreshToken)
	if err != nil {
		config.LOGGER.Error("failed to decrypt access token", zap.String("provider", GOOGLE_PROVIDER_NAME), zap.Error(err))
		return err
	}

	httpClient := p.getHTTPClient(accessToken, refreshToken)

	driveService, err := drive.NewService(ctx, option.WithHTTPClient(httpClient))
	if err != nil {
		config.LOGGER.Error("an error occured while initializing google drive service", zap.String("provider", GOOGLE_PROVIDER_NAME), zap.Error(err))
		return err
	}

	for _, f := range uploadedFiles {
		mimeType := f.ContentType

		fileMetaData := &drive.File{
			Name: f.FileHeader.Filename,
		}

		_, err := driveService.Files.Create(fileMetaData).Media(f.File, googleapi.ContentType(mimeType)).Do()

		if err != nil {
			config.LOGGER.Error("failed to upload file to google drive", zap.String("provider", GOOGLE_PROVIDER_NAME), zap.Error(err))
			return fmt.Errorf("upload failed for file '%s': %v", f.FileHeader.Filename, err)
		}

	}

	return nil
}
