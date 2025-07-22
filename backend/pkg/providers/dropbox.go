package providers

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime"
	"net/http"
	"net/url"
	"path"
	"path/filepath"
	"strings"
	"sync"
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
	"golang.org/x/sync/errgroup"
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

type DropboxListFolderEntries struct {
	ID             string    `json:"id"`
	Tag            string    `json:".tag,omitempty"`
	Name           string    `json:"name"`
	PathDisplay    string    `json:"path_display"`
	PathLower      string    `json:"path_lower"`
	ClientModified time.Time `json:"client_modified"`
	ServerModified time.Time `json:"server_modified"`
	ContentHash    string    `json:"content_hash"`
	Revision       string    `json:"rev"`
	Size           int       `json:"size"`
}

type DropboxListFolderResponse struct {
	Entries []DropboxListFolderEntries `json:"entries"`
	Cursor  string                     `json:"cursor"`
	HasMore bool                       `json:"has_more"`
}

type DropboxAuthResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int    `json:"expires_in"`
	TokenType   string `json:"token_type"`
	AccountID   string `json:"account_id"`
}

type DropboxFileMetadata struct {
	ID             string    `json:"id"`
	Name           string    `json:"name"`
	PathDisplay    string    `json:"path_display"`
	PathLower      string    `json:"path_lower"`
	ClientModified time.Time `json:"client_modified"`
	ServerModified time.Time `json:"server_modified"`
	Rev            string    `json:"rev"`
	Size           int64     `json:"size"`
	IsDownloadable bool      `json:"is_downloadable"`
}

type DeleteFileResponse struct {
	Metadata DropboxFileMetadata `json:"metadata"`
}

const (
	DROPBOX_SESSION_NAME         = "cloudmesh-dropbox-oauth-session"
	DROPBOX_PROVIDER_NAME        = string(repository.ProviderEnumDropbox)
	DROPBOX_AUTH_ENDPOINT        = "https://api.dropboxapi.com/oauth2/token"
	DROPBOX_ACCOUNT_ENDPOINT     = "https://api.dropboxapi.com/2/users/get_current_account"
	DROPBOX_LIST_FOLDER_ENDPOINT = "https://api.dropboxapi.com/2/files/list_folder"
	DROPBOX_UPLOAD_ENDPOINT      = "https://content.dropboxapi.com/2/files/upload"
	DROPBOX_DELETE_V2_ENDPOINT   = "https://api.dropboxapi.com/2/files/delete_v2"
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
		config.LOGGER.Error("failed to generated encoded oauthstate", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Error(err))
		return "", err
	}

	session, err := store.Get(r, DROPBOX_SESSION_NAME)
	if err != nil {
		config.LOGGER.Error("could not get or create session from cookie store", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Error(err))
		return "", err
	}

	session.Values["pkce_verifier_dropbox"] = verifier
	session.Values["oauth_csrf_token_dropbox"] = oauthState.CsrfToken

	err = session.Save(r, w)
	if err != nil {
		config.LOGGER.Error("failed to save session in cookie store", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Error(err))
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
		config.LOGGER.Error("failed to decode received state", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Error(err))
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

func (p *DropboxProvider) GetAccountInfo(ctx context.Context, token *oauth2.Token) (*UserAccountInfo, error) {

	httpClient := http.Client{}

	req, err := http.NewRequest(http.MethodPost, DROPBOX_ACCOUNT_ENDPOINT, nil)
	if err != nil {
		config.LOGGER.Error("failed to initiate new HTTP POST request", zap.Error(err))
		return nil, err
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token.AccessToken))

	res, err := httpClient.Do(req)
	if err != nil {
		config.LOGGER.Error("dropbox /get_current_account request failed", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Error(err))
		return nil, err
	}

	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		config.LOGGER.Error("failed to read response body for /get_current_account", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Error(err))
		return nil, err
	}

	var response DropboxAccountInfo

	err = json.Unmarshal(body, &response)

	if err != nil {
		config.LOGGER.Error("failed to unmarshal response body for /get_current_account", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Error(err))
		return nil, err
	}

	userInfo := UserAccountInfo{
		Provider:       DROPBOX_PROVIDER_NAME,
		ProviderUserID: response.AccountID,
		Email:          response.Email,
		Name:           response.Name.DisplayName,
		AvatarURL:      response.ProfilePhotoURL,
	}

	return &userInfo, nil
}

func (p *DropboxProvider) SyncFiles(ctx context.Context, conn *pgxpool.Conn, accountID pgtype.UUID, authToken repository.GetAuthTokensRow) error {

	cursor := ""

	totalItemCount := 0

	queries := repository.New(conn)

	syncDetails, err := queries.GetLatestSyncTimeAndPagetoken(ctx, accountID)

	if err != nil {
		if !errors.Is(err, sql.ErrNoRows) {
			config.LOGGER.Error("could not fetch timestamp and page token for latest sync", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.String("account_id", accountID.String()))
			return err
		}
	}

	if syncDetails.LastSyncedAt.Valid && syncDetails.SyncPageToken.Valid {
		cursor = syncDetails.SyncPageToken.String
	}

	accessToken, err := utils.Decrypt(authToken.AccessToken)
	if err != nil {
		config.LOGGER.Error("could not decrypt access token", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.String("account_id", accountID.String()))
		return err
	}

	refreshToken, err := utils.Decrypt(authToken.RefreshToken)
	if err != nil {
		config.LOGGER.Error("could not decrypt refresh token", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.String("account_id", accountID.String()))
		return err
	}

	for {

		dropboxResponse, err := p.getDropboxFolderList(ctx, accountID, conn, accessToken, refreshToken, cursor)

		if err != nil {
			config.LOGGER.Error("request failed to fetch dropbox folder list", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Error(err))
			return err
		}

		files, providerFileIDs := p.convertToSyncedItemSlice(dropboxResponse.Entries, accountID, syncDetails.LastSyncedAt.Valid)

		var insertedRows int64

		insertedRows, err = p.bulkInsertSyncedItems(ctx, conn, *queries, providerFileIDs, accountID, files, dropboxResponse.Cursor)

		if err != nil {
			config.LOGGER.Error("failed to insert synced files", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Error(err))
			return err
		}

		config.LOGGER.Info("batch inserted", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.String("account_id", accountID.String()), zap.Int64("item_count", insertedRows))

		totalItemCount += int(insertedRows)

		cursor = dropboxResponse.Cursor

		if !dropboxResponse.HasMore {
			break
		}
	}

	config.LOGGER.Info("Dropbox sync successful", zap.Int("item_count", totalItemCount))

	return nil
}

func (p *DropboxProvider) getDropboxFolderList(ctx context.Context, accountID pgtype.UUID, conn *pgxpool.Conn, accessToken, refreshToken, cursor string) (*DropboxListFolderResponse, error) {
	dropboxApiURL := DROPBOX_LIST_FOLDER_ENDPOINT
	reqBody := []byte(`{"path": "", "recursive": true}`)

	if cursor != "" {
		dropboxApiURL = fmt.Sprintf("%s/continue", DROPBOX_LIST_FOLDER_ENDPOINT)
		reqBody = fmt.Appendf(nil, "{\"cursor\": \"%s\"}", cursor)
	}

	httpClient := http.Client{}

	req, err := http.NewRequest(http.MethodPost, dropboxApiURL, bytes.NewReader(reqBody))
	if err != nil {
		config.LOGGER.Error("an error occured while generating http request for dropbox sync task", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Error(err))
		return nil, err
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))
	req.Header.Set("Content-Type", "application/json")

	res, err := httpClient.Do(req)
	if err != nil {
		config.LOGGER.Error("http request for dropbox sync task failed", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Error(err))
		return nil, err
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		config.LOGGER.Error("failed to read http response body for dropbox sync task", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Error(err))
		return nil, err
	}

	if res.StatusCode == http.StatusUnauthorized {
		config.LOGGER.Warn("access token expired, attempting to renew", zap.String("provider", DROPBOX_PROVIDER_NAME))

		_, _, err := p.RenewOAuthTokens(ctx, conn, accountID, refreshToken)
		if err != nil {
			return nil, err
		}

		return nil, fmt.Errorf("request has failed with status 401, failing task for it to fetch new token from db instead of using the stale token in next request")
	}

	if res.StatusCode != http.StatusOK {
		config.LOGGER.Error("http request for dropbox sync task did not return 200", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Int("status_code", res.StatusCode))
		return nil, fmt.Errorf("%s", string(body[:]))
	}

	var dropboxResponse DropboxListFolderResponse

	err = json.Unmarshal(body, &dropboxResponse)

	return &dropboxResponse, err
}

func (p *DropboxProvider) RenewOAuthTokens(ctx context.Context, conn *pgxpool.Conn, accountID pgtype.UUID, refreshToken string) (string, int64, error) {
	data := url.Values{}

	data.Add("grant_type", "refresh_token")
	data.Add("refresh_token", refreshToken)
	data.Add("client_id", p.Config.ClientID)
	data.Add("client_secret", p.Config.ClientSecret)

	res, err := http.Post(DROPBOX_AUTH_ENDPOINT, "application/x-www-form-urlencoded", bytes.NewBufferString(data.Encode()))
	if err != nil {
		config.LOGGER.Error("http request for dropbox token renewal failed", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Int("status_code", res.StatusCode))
		return "", 0, err
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		config.LOGGER.Error("failed to read http response body for dropbox token renewal", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Int("status_code", res.StatusCode))
		return "", 0, err
	}

	var dropboxResponse DropboxAuthResponse

	err = json.Unmarshal(body, &dropboxResponse)

	if err != nil {
		config.LOGGER.Error("failed to unmarshal dropbox token renew response", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Error(err))
		return "", 0, err
	}

	expiresIn := time.Now().Add(time.Duration(dropboxResponse.ExpiresIn) * time.Second)

	err = utils.WithTransaction(ctx, conn, func(tx pgx.Tx) error {

		encryptedAccessToken, err := utils.Encrypt(dropboxResponse.AccessToken)
		if err != nil {
			config.LOGGER.Error("failed to encrypt new access token", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Error(err))
			return err
		}

		qx := repository.New(conn).WithTx(tx)

		err = qx.UpdateRenewedAuthToken(ctx, repository.UpdateRenewedAuthTokenParams{
			AccountID:   accountID,
			AccessToken: encryptedAccessToken,
			TokenType:   db.PGTextField(dropboxResponse.TokenType),
			Expiry:      db.PGTimestamptzField(expiresIn),
		})

		return err
	})

	if err != nil {
		config.LOGGER.Error("failed to update dropbox oauth tokens in db", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Error(err))
		return "", 0, err
	}

	return dropboxResponse.AccessToken, int64(dropboxResponse.ExpiresIn), nil
}

func (p *DropboxProvider) UploadFiles(ctx context.Context, accountID *pgtype.UUID, conn *pgxpool.Conn, queries *repository.Queries, authTokens repository.GetAuthTokensRow, uploadedFiles []middlewares.UploadedFile) error {
	fmt.Println("in herer")

	accessToken, err := utils.Decrypt(authTokens.AccessToken)
	if err != nil {
		config.LOGGER.Error("failed to decrypt access token", zap.String("provider", GOOGLE_PROVIDER_NAME), zap.Error(err))
		return err
	}

	fmt.Println("access")

	var (
		mu      sync.Mutex
		results []DropboxListFolderEntries
		g, _    = errgroup.WithContext(ctx)
		sem     = make(chan struct{}, 10)
	)

	for _, f := range uploadedFiles {
		file := f
		g.Go(func() error {
			sem <- struct{}{}
			defer func() { <-sem }()

			uploadedFile, err := p.uploadToDropbox(accessToken, file)
			if err != nil {
				return err
			}

			mu.Lock()
			results = append(results, *uploadedFile)
			mu.Unlock()

			return nil
		})
	}

	fmt.Println("here")

	if err := g.Wait(); err != nil {
		return err
	}

	fmt.Println("asodaslkd")

	files, _ := p.convertToSyncedItemSlice(results, *accountID, false)

	fmt.Println(files)

	_, err = p.bulkInsertSyncedItems(ctx, conn, *queries, []string{}, *accountID, files, "")

	if err != nil {
		config.LOGGER.Error("failed to insert newly uploaded files", zap.String("provider", GOOGLE_PROVIDER_NAME), zap.Error(err))
		return err
	}

	return nil
}

func (p *DropboxProvider) uploadToDropbox(accesstoken string, file middlewares.UploadedFile) (*DropboxListFolderEntries, error) {
	dropboxArgs := map[string]any{
		"path":            fmt.Sprintf("/%s", file.FileHeader.Filename),
		"mode":            "add",
		"autorename":      false,
		"mute":            false,
		"strict_conflict": false,
	}

	argJSON, err := json.Marshal(dropboxArgs)

	if err != nil {
		config.LOGGER.Error("failed to marshal dropbox args", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Error(err))
		return nil, err
	}

	httpClient := http.Client{}

	req, err := http.NewRequest("POST", DROPBOX_UPLOAD_ENDPOINT, file.File)
	if err != nil {
		config.LOGGER.Error("failed to create new request to upload files to dropbox", zap.String("provider", DROPBOX_UPLOAD_ENDPOINT), zap.Error(err))
		return nil, err
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accesstoken))
	req.Header.Set("Dropbox-API-Arg", string(argJSON))
	req.Header.Set("Content-Type", "application/octet-stream")

	res, err := httpClient.Do(req)
	if err != nil {
		config.LOGGER.Error("http request to upload file to dropbox failed", zap.String("provider", DROPBOX_UPLOAD_ENDPOINT), zap.Error(err))
		return nil, err
	}

	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		config.LOGGER.Error("failed to read http response body for dropbox file upload", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Error(err))
		return nil, err
	}

	if res.StatusCode != http.StatusOK {
		config.LOGGER.Error("http request to upload file to dropbox failed with non-200 status", zap.String("provider", DROPBOX_UPLOAD_ENDPOINT), zap.Int("status_code", res.StatusCode))
		return nil, fmt.Errorf("http request to upload file to dropbox failed with non-200 status")
	}

	var response DropboxListFolderEntries

	err = json.Unmarshal(body, &response)

	if err != nil {
		config.LOGGER.Error("failed to unmarshal json response for dropbox file upload response", zap.Error(err))
		return nil, err
	}

	return &response, nil
}

func (p *DropboxProvider) MoveToTrash(ctx context.Context, accountID *pgtype.UUID, conn *pgxpool.Conn, queries *repository.Queries, authTokens repository.GetAuthTokensRow, syncedItemIds []repository.GetProviderFileIdsRow) error {
	accessToken, err := utils.Decrypt(authTokens.AccessToken)
	if err != nil {
		config.LOGGER.Error("failed to decrypt access token", zap.String("provider", GOOGLE_PROVIDER_NAME), zap.Error(err))
		return err
	}

	var (
		fileIDs []pgtype.UUID
		mu      sync.Mutex
		g, _    = errgroup.WithContext(ctx)
		sem     = make(chan struct{}, 10)
	)

	for _, f := range syncedItemIds {
		g.Go(func() error {
			sem <- struct{}{}
			defer func() { <-sem }()

			if err := p.moveToTrash(accessToken, f.Path.String); err != nil {
				return err
			}

			mu.Lock()
			fileIDs = append(fileIDs, f.FileID)
			mu.Unlock()

			return nil
		})
	}

	if err := g.Wait(); err != nil {
		config.LOGGER.Error("failed to move files to trash", zap.Error(err))
		return err
	}

	err = utils.WithTransaction(ctx, conn, func(tx pgx.Tx) error {
		qx := queries.WithTx(tx)

		return qx.SetFileTrashed(ctx, repository.SetFileTrashedParams{
			FileIds:   fileIDs,
			AccountID: *accountID,
		})
	})

	if err != nil {
		config.LOGGER.Error("failed to set is_trashed to true for file ids", zap.Error(err))
		return err
	}

	return nil
}

func (p *DropboxProvider) moveToTrash(accessToken, filePath string) error {
	reqBody := fmt.Appendf(nil, "{\"path\": \"%s\"}", filePath)

	httpClient := http.Client{}

	req, err := http.NewRequest(http.MethodPost, DROPBOX_DELETE_V2_ENDPOINT, bytes.NewReader(reqBody))
	if err != nil {
		config.LOGGER.Error("failed to initialize new http post request for delete action", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Error(err))
		return err
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))
	req.Header.Set("Content-Type", "application/json")

	res, err := httpClient.Do(req)
	if err != nil {
		config.LOGGER.Error("http request for dropbox delete action failed", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Error(err))
		return err
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		config.LOGGER.Error("failed to read http response body for dropbox sync task", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Error(err))
		return err
	}

	if res.StatusCode == http.StatusUnauthorized {
		return fmt.Errorf("request has failed with status 401")
	}

	if res.StatusCode != http.StatusOK {
		config.LOGGER.Error("http request for dropbox delete action did not return 200", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Int("status_code", res.StatusCode))
		return fmt.Errorf("%s", string(body[:]))
	}

	var dropboxResponse DeleteFileResponse

	err = json.Unmarshal(body, &dropboxResponse)

	return err
}

func (p *DropboxProvider) bulkInsertSyncedItems(ctx context.Context, conn *pgxpool.Conn, queries repository.Queries, providerFileIDs []string, accountID pgtype.UUID, files []repository.AddSyncedItemsParams, cursor string) (int64, error) {

	var insertedRowCount int64

	fmt.Println("here")
	fmt.Println(files)

	err := utils.WithTransaction(ctx, conn, func(tx pgx.Tx) error {
		qx := queries.WithTx(tx)

		if len(providerFileIDs) > 0 {
			err := qx.DeleteConflictingItems(ctx, repository.DeleteConflictingItemsParams{
				ProviderFileIds: providerFileIDs,
				AccountID:       accountID,
			})

			if err != nil {
				config.LOGGER.Error("an error occured while deleting conflicted files", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.String("account_id", accountID.String()), zap.Error(err))
				return err
			}
		}

		insertedRows, err := qx.AddSyncedItems(ctx, files)

		if err != nil {
			return err
		}

		insertedRowCount = insertedRows

		return qx.UpdateLastSyncedTimestamp(ctx, repository.UpdateLastSyncedTimestampParams{
			AccountID:     accountID,
			SyncPageToken: db.PGTextField(cursor),
		})
	})

	if err != nil {
		config.LOGGER.Error("failed to bulk insert synced items", zap.String("provider", DROPBOX_PROVIDER_NAME), zap.Error(err))
		return 0, err
	}

	return insertedRowCount, nil
}

func (p *DropboxProvider) convertToSyncedItemSlice(entries []DropboxListFolderEntries, accountID pgtype.UUID, isValidLastSyncedData bool) ([]repository.AddSyncedItemsParams, []string) {

	syncedItems := []repository.AddSyncedItemsParams{}
	providerFileIDs := []string{}

	for _, entry := range entries {

		ext := filepath.Ext(entry.Name)

		mimeType := mime.TypeByExtension(ext)

		parentFolder := path.Dir(entry.PathDisplay)

		syncedItems = append(syncedItems, repository.AddSyncedItemsParams{
			AccountID:      accountID,
			ProviderFileID: entry.ID,
			Name:           entry.Name,
			Extension:      ext,
			Size:           int64(entry.Size),
			Path:           db.PGTextField(entry.PathDisplay),
			MimeType:       db.PGTextField(mimeType),
			ParentFolder:   db.PGTextField(parentFolder),
			IsFolder:       entry.Tag == "folder",
			ContentHash:    db.PGTextField(entry.ContentHash),
			CreatedTime:    db.PGTimestamptzField(time.Time{}),
			ModifiedTime:   db.PGTimestamptzField(entry.ClientModified),
			ThumbnailLink:  db.PGTextField(""),
			PreviewLink:    db.PGTextField(""),
			WebViewLink:    db.PGTextField(""),
			WebContentLink: db.PGTextField(""),
			LinkExpiresAt:  db.PGTimestamptzField(time.Time{}),
		})

		if isValidLastSyncedData {
			providerFileIDs = append(providerFileIDs, entry.ID)
		}
	}

	return syncedItems, providerFileIDs
}
