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

type DropboxSearchMatchResult struct {
	HighLightSpans []map[string]any `json:"highlight_spans"`
	MatchType      struct {
		Tag string `json:".tag"`
	}
	MetaData struct {
		Tag      string `json:".tag"`
		MetaData DropboxFileMetadata
	}
}

type DropboxSearchResponse struct {
	HasMore bool                       `json:"has_more"`
	Cursor  string                     `json:"cursor"`
	Matches []DropboxSearchMatchResult `json:"matches"`
}

type DeleteFileResponse struct {
	Metadata DropboxFileMetadata `json:"metadata"`
}

type DropboxSpaceUsageResponse struct {
	Allocation struct {
		Tag       string `json:".tag"`
		Allocated int64  `json:"allocated"`
	} `json:"allocation"`
	Used int64 `json:"used"`
}

const (
	DROPBOX_SESSION_NAME         = "cloudmesh-dropbox-oauth-session"
	DROPBOX_VERIFIER_KEY         = "pkce_verifier_dropbox"
	DROPBOX_CSRF_KEY             = "oauth_csrf_token_dropbox"
	DROPBOX_PROVIDER_NAME        = string(repository.ProviderEnumDropbox)
	DROPBOX_CONTENT_API_BASE_URL = "https://content.dropboxapi.com"
	DROPBOX_API_BASE_URL         = "https://api.dropboxapi.com"
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

func (p *DropboxProvider) GetConsentPageURL(
	w http.ResponseWriter,
	r *http.Request,
	store *sessions.CookieStore,
	userID string,
) (string, error) {
	return getConsentPageURL(
		userID,
		DROPBOX_PROVIDER_NAME,
		DROPBOX_SESSION_NAME,
		DROPBOX_VERIFIER_KEY,
		DROPBOX_CSRF_KEY,
		w,
		r,
		&p.Config,
		store,
	)
}

func (p *DropboxProvider) GetToken(
	w http.ResponseWriter,
	r *http.Request,
	store *sessions.CookieStore,
) (*oauth2.Token, string, *UserAccountInfo, error) {
	return exchangeToken(
		r.Context(),
		r,
		w,
		store,
		DROPBOX_SESSION_NAME,
		DROPBOX_VERIFIER_KEY,
		DROPBOX_CSRF_KEY,
		&p.Config,
		DROPBOX_PROVIDER_NAME,
		p.GetAccountInfo,
	)
}

func (p *DropboxProvider) GetAccountInfo(
	ctx context.Context,
	token *oauth2.Token,
) (*UserAccountInfo, error) {
	httpClient := http.Client{}

	url := DROPBOX_API_BASE_URL + "/2/users/get_current_account"

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, nil)
	if err != nil {
		config.LOGGER.Error("failed to initiate new HTTP POST request", zap.Error(err))

		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+token.AccessToken)

	res, err := httpClient.Do(req)
	if err != nil {
		config.LOGGER.Error(
			"dropbox /get_current_account request failed",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

		return nil, err
	}

	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		config.LOGGER.Error(
			"failed to read response body for /get_current_account",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

		return nil, err
	}

	var response DropboxAccountInfo

	err = json.Unmarshal(body, &response)
	if err != nil {
		config.LOGGER.Error(
			"failed to unmarshal response body for /get_current_account",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

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

func (p *DropboxProvider) SyncFiles(
	ctx context.Context,
	conn *pgxpool.Conn,
	accountID pgtype.UUID,
	authToken repository.GetAuthTokensRow,
) error {
	cursor := ""

	totalItemCount := 0

	queries := repository.New(conn)

	syncDetails, err := queries.GetLatestSyncTimeAndPagetoken(ctx, accountID)
	if err != nil {
		if !errors.Is(err, sql.ErrNoRows) {
			config.LOGGER.Error(
				"could not fetch timestamp and page token for latest sync",
				zap.String("provider", DROPBOX_PROVIDER_NAME),
				zap.String("account_id", accountID.String()),
			)

			return err
		}
	}

	if syncDetails.LastSyncedAt.Valid && syncDetails.SyncPageToken.Valid {
		cursor = syncDetails.SyncPageToken.String
	}

	accessToken, err := utils.Decrypt(authToken.AccessToken)
	if err != nil {
		config.LOGGER.Error(
			"could not decrypt access token",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.String("account_id", accountID.String()),
		)

		return err
	}

	refreshToken, err := utils.Decrypt(authToken.RefreshToken)
	if err != nil {
		config.LOGGER.Error(
			"could not decrypt refresh token",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.String("account_id", accountID.String()),
		)

		return err
	}

	for {
		dropboxResponse, err := p.getDropboxFolderList(
			ctx,
			accountID,
			conn,
			accessToken,
			refreshToken,
			cursor,
		)
		if err != nil {
			config.LOGGER.Error(
				"request failed to fetch dropbox folder list",
				zap.String("provider", DROPBOX_PROVIDER_NAME),
				zap.Error(err),
			)

			return err
		}

		files, providerFileIDs := p.convertToSyncedItemSlice(
			dropboxResponse.Entries,
			accountID,
			syncDetails.LastSyncedAt.Valid,
		)

		var insertedRows int64

		insertedRows, err = p.bulkInsertSyncedItems(
			ctx,
			conn,
			*queries,
			providerFileIDs,
			accountID,
			files,
			dropboxResponse.Cursor,
		)
		if err != nil {
			config.LOGGER.Error(
				"failed to insert synced files",
				zap.String("provider", DROPBOX_PROVIDER_NAME),
				zap.Error(err),
			)

			return err
		}

		config.LOGGER.Info(
			"batch inserted",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.String("account_id", accountID.String()),
			zap.Int64("item_count", insertedRows),
		)

		totalItemCount += int(insertedRows)

		cursor = dropboxResponse.Cursor

		if !dropboxResponse.HasMore {
			break
		}
	}

	config.LOGGER.Info("Dropbox sync successful", zap.Int("item_count", totalItemCount))

	return nil
}

func (p *DropboxProvider) getDropboxFolderList(
	ctx context.Context,
	accountID pgtype.UUID,
	conn *pgxpool.Conn,
	accessToken, refreshToken, cursor string,
) (*DropboxListFolderResponse, error) {
	url := DROPBOX_API_BASE_URL + "/2/files/list_folder"
	reqBody := []byte(`{"path": "", "recursive": true, "include_deleted": true}`)

	if cursor != "" {
		url = url + "/continue"
		reqBody = fmt.Appendf(nil, "{\"cursor\": \"%s\"}", cursor)
	}

	httpClient := http.Client{}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(reqBody))
	if err != nil {
		config.LOGGER.Error(
			"an error occured while generating http request for dropbox sync task",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")

	res, err := httpClient.Do(req)
	if err != nil {
		config.LOGGER.Error(
			"http request for dropbox sync task failed",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

		return nil, err
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		config.LOGGER.Error(
			"failed to read http response body for dropbox sync task",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

		return nil, err
	}

	if res.StatusCode == http.StatusUnauthorized {
		config.LOGGER.Warn(
			"access token expired, attempting to renew",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
		)

		_, _, err := p.RenewOAuthTokens(ctx, conn, accountID, refreshToken)
		if err != nil {
			return nil, err
		}

		return nil, errors.New(
			"request has failed with status 401, failing task for it to fetch new token from db instead of using the stale token in next request",
		)
	}

	if res.StatusCode != http.StatusOK {
		config.LOGGER.Error(
			"http request for dropbox sync task did not return 200",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Int("status_code", res.StatusCode),
		)

		return nil, fmt.Errorf("%s", string(body[:]))
	}

	var dropboxResponse DropboxListFolderResponse

	err = json.Unmarshal(body, &dropboxResponse)

	return &dropboxResponse, err
}

func (p *DropboxProvider) RenewOAuthTokens(
	ctx context.Context,
	conn *pgxpool.Conn,
	accountID pgtype.UUID,
	refreshToken string,
) (string, int64, error) {
	data := url.Values{}

	data.Add("grant_type", "refresh_token")
	data.Add("refresh_token", refreshToken)
	data.Add("client_id", p.Config.ClientID)
	data.Add("client_secret", p.Config.ClientSecret)

	url := DROPBOX_API_BASE_URL + "/oauth2/token"

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		url,
		bytes.NewBufferString(data.Encode()),
	)
	if err != nil {
		config.LOGGER.Error(
			"failed to create http request for dropbox oauth request",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

		return "", 0, err
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	httpClient := http.Client{}

	res, err := httpClient.Do(req)
	if err != nil {
		config.LOGGER.Error(
			"http request for dropbox token renewal failed",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Int("status_code", res.StatusCode),
		)

		return "", 0, err
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		config.LOGGER.Error(
			"failed to read http response body for dropbox token renewal",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Int("status_code", res.StatusCode),
		)

		return "", 0, err
	}

	var dropboxResponse DropboxAuthResponse

	err = json.Unmarshal(body, &dropboxResponse)
	if err != nil {
		config.LOGGER.Error(
			"failed to unmarshal dropbox token renew response",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

		return "", 0, err
	}

	expiresIn := time.Now().Add(time.Duration(dropboxResponse.ExpiresIn) * time.Second)

	err = utils.WithTransaction(ctx, conn, func(ctx context.Context, tx pgx.Tx) error {
		encryptedAccessToken, err := utils.Encrypt(dropboxResponse.AccessToken)
		if err != nil {
			config.LOGGER.Error(
				"failed to encrypt new access token",
				zap.String("provider", DROPBOX_PROVIDER_NAME),
				zap.Error(err),
			)

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
		config.LOGGER.Error(
			"failed to update dropbox oauth tokens in db",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

		return "", 0, err
	}

	return dropboxResponse.AccessToken, int64(dropboxResponse.ExpiresIn), nil
}

func (p *DropboxProvider) GetStorageQuota(
	ctx context.Context,
	userID string,
	accountID *pgtype.UUID,
	encryptedAccessToken, encryptedRefreshToken string,
) (*StorageQuota, error) {
	storageQuotaKey := fmt.Sprintf("storage:dropbox:%s:%s", userID, accountID.String())

	redisClient := db.GetRedisClient()

	cachedStorageQuota := redisClient.Get(ctx, storageQuotaKey)

	if cachedStorageQuota.Err() == nil {
		val, err := cachedStorageQuota.Result()
		if err != nil {
			config.LOGGER.Error(
				"failed to get the result from redis cache",
				zap.String("user_id", userID),
				zap.String("account_id", accountID.String()),
				zap.String("provider", DROPBOX_PROVIDER_NAME),
			)
		} else {
			var storageQuota StorageQuota

			err = json.Unmarshal([]byte(val), &storageQuota)
			if err == nil {
				return &storageQuota, nil
			}

			config.LOGGER.Error("failed to unmarshal storage quota", zap.String("user_id", userID), zap.String("account_id", accountID.String()), zap.String("provider", DROPBOX_PROVIDER_NAME))
		}
	}

	accessToken, err := utils.Decrypt(encryptedAccessToken)
	if err != nil {
		config.LOGGER.Error(
			"failed to decrypt access token",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

		return nil, err
	}

	url := DROPBOX_API_BASE_URL + "/2/users/get_space_usage"

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, nil)
	if err != nil {
		config.LOGGER.Error(
			"failed create new http request for dropbox space usage endpoint",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := http.Client{}

	resp, err := client.Do(req)
	if err != nil {
		config.LOGGER.Error("http request for dropbox space usage endpoint failed", zap.Error(err))

		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		config.LOGGER.Error(
			"failed to read response body for space usage request for dropbox",
			zap.Error(err),
		)

		return nil, err
	}

	var dropboxResponse DropboxSpaceUsageResponse

	err = json.Unmarshal(body, &dropboxResponse)
	if err != nil {
		config.LOGGER.Error(
			"failed to unmarshal http response body for dropbox space usage endpoint",
			zap.Error(err),
		)

		return nil, err
	}

	storageQuota := StorageQuota{
		TotalStorage: dropboxResponse.Allocation.Allocated,
		UsedStorage:  dropboxResponse.Used,
	}

	storageQuotaCache, err := json.Marshal(storageQuota)
	if err != nil {
		config.LOGGER.Error(
			"failed to marshal storage quota for caching",
			zap.String("account_id", accountID.String()),
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

		return nil, err
	}

	storageCache := redisClient.Set(ctx, storageQuotaKey, storageQuotaCache, 15*time.Minute)

	if storageCache.Err() != nil {
		config.LOGGER.Error(
			"failed to cache storage quota",
			zap.String("account_id", accountID.String()),
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)
	}

	return &storageQuota, nil
}

func (p *DropboxProvider) UploadFiles(
	ctx context.Context,
	accountID *pgtype.UUID,
	conn *pgxpool.Conn,
	queries *repository.Queries,
	authTokens repository.GetAuthTokensRow,
	uploadedFiles []middlewares.UploadedFile,
) error {
	accessToken, err := utils.Decrypt(authTokens.AccessToken)
	if err != nil {
		config.LOGGER.Error(
			"failed to decrypt access token",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

		return err
	}

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

			uploadedFile, err := p.uploadToDropbox(ctx, accessToken, file)
			if err != nil {
				return err
			}

			mu.Lock()

			results = append(results, *uploadedFile)

			mu.Unlock()

			return nil
		})
	}

	if err := g.Wait(); err != nil {
		return err
	}

	files, _ := p.convertToSyncedItemSlice(results, *accountID, false)

	_, err = p.bulkInsertSyncedItems(ctx, conn, *queries, []string{}, *accountID, files, "")
	if err != nil {
		config.LOGGER.Error(
			"failed to insert newly uploaded files",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

		return err
	}

	if err := utils.DeleteKeysByPattern(ctx, fmt.Sprintf("search_cache:%s:%s*", DROPBOX_PROVIDER_NAME, accountID.String())); err != nil {
		config.LOGGER.Error(
			"failed to delete cache for content search results",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.String("account_id", accountID.String()),
			zap.Error(err),
		)
	}

	return nil
}

func (p *DropboxProvider) uploadToDropbox(
	ctx context.Context,
	accesstoken string,
	file middlewares.UploadedFile,
) (*DropboxListFolderEntries, error) {
	dropboxArgs := map[string]any{
		"path":            "/" + file.FileHeader.Filename,
		"mode":            "add",
		"autorename":      false,
		"mute":            false,
		"strict_conflict": false,
	}

	argJSON, err := json.Marshal(dropboxArgs)
	if err != nil {
		config.LOGGER.Error(
			"failed to marshal dropbox args",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

		return nil, err
	}

	url := DROPBOX_CONTENT_API_BASE_URL + "/2/files/upload"

	httpClient := http.Client{}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, file.File)
	if err != nil {
		config.LOGGER.Error(
			"failed to create new request to upload files to dropbox",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+accesstoken)
	req.Header.Set("Dropbox-Api-Arg", string(argJSON))
	req.Header.Set("Content-Type", "application/octet-stream")

	res, err := httpClient.Do(req)
	if err != nil {
		config.LOGGER.Error(
			"http request to upload file to dropbox failed",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

		return nil, err
	}

	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		config.LOGGER.Error(
			"failed to read http response body for dropbox file upload",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

		return nil, err
	}

	if res.StatusCode != http.StatusOK {
		config.LOGGER.Error(
			"http request to upload file to dropbox failed with non-200 status",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Int("status_code", res.StatusCode),
		)

		return nil, errors.New("http request to upload file to dropbox failed with non-200 status")
	}

	var response DropboxListFolderEntries

	err = json.Unmarshal(body, &response)
	if err != nil {
		config.LOGGER.Error(
			"failed to unmarshal json response for dropbox file upload response",
			zap.Error(err),
		)

		return nil, err
	}

	return &response, nil
}

func (p *DropboxProvider) MoveToTrash(
	ctx context.Context,
	accountID *pgtype.UUID,
	conn *pgxpool.Conn,
	queries *repository.Queries,
	authTokens repository.GetAuthTokensRow,
	syncedItemIds []repository.GetProviderFileIdsRow,
) error {
	accessToken, err := utils.Decrypt(authTokens.AccessToken)
	if err != nil {
		config.LOGGER.Error(
			"failed to decrypt access token",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

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

			if err := p.moveToTrash(ctx, accessToken, f.Path.String); err != nil {
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

	err = utils.WithTransaction(ctx, conn, func(ctx context.Context, tx pgx.Tx) error {
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

func (p *DropboxProvider) PermanentlyDeleteFiles(
	ctx context.Context,
	accountID *pgtype.UUID,
	conn *pgxpool.Conn,
	queries *repository.Queries,
	authTokens repository.GetAuthTokensRow,
	syncedItemIds []repository.GetProviderFileIdsRow,
) error {
	accessToken, err := utils.Decrypt(authTokens.AccessToken)
	if err != nil {
		config.LOGGER.Error(
			"failed to decrypt access token",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

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

			if err := p.permanentlyDeleteFile(ctx, accessToken, f.Path.String); err != nil {
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

	err = utils.WithTransaction(ctx, conn, func(ctx context.Context, tx pgx.Tx) error {
		qx := queries.WithTx(tx)

		return qx.DeleteSyncedItems(ctx, repository.DeleteSyncedItemsParams{
			FileIds:   fileIDs,
			AccountID: *accountID,
		})
	})
	if err != nil {
		config.LOGGER.Error("failed to set is_trashed to true for file ids", zap.Error(err))

		return err
	}

	if err := utils.DeleteKeysByPattern(ctx, fmt.Sprintf("search_cache:%s:%s*", DROPBOX_PROVIDER_NAME, accountID.String())); err != nil {
		config.LOGGER.Error(
			"failed to delete cache for content search results",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.String("account_id", accountID.String()),
			zap.Error(err),
		)
	}

	return nil
}

func (p *DropboxProvider) SearchByContent(
	ctx context.Context,
	searchText string,
	account repository.GetUserAccountsRow,
	conn *pgxpool.Conn,
	queries *repository.Queries,
) ([]string, error) {
	searchCacheKey := utils.BuildSearchCacheKey(
		string(account.Provider),
		account.ID.String(),
		searchText,
	)

	cachedFileIds, err := utils.GetCachedProviderFileIDs(ctx, searchCacheKey)
	if err == nil {
		return cachedFileIds, nil
	}

	accessToken, err := utils.Decrypt(account.AccessToken)
	if err != nil {
		config.LOGGER.Error(
			"failed to decrypt access token",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

		return nil, err
	}

	refreshToken, err := utils.Decrypt(account.RefreshToken)
	if err != nil {
		config.LOGGER.Error(
			"failed to decrypt access token",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

		return nil, err
	}

	providerFileIDs := []string{}

	cursor := ""

	for {
		fileIds, newCursor, err := p.searchContentResults(
			ctx,
			conn,
			account.ID,
			searchText,
			accessToken,
			refreshToken,
			cursor,
		)
		if err != nil {
			config.LOGGER.Error(
				"dropbox request for content search failed",
				zap.String("provider", DROPBOX_PROVIDER_NAME),
				zap.Error(err),
			)

			return nil, err
		}

		providerFileIDs = append(providerFileIDs, fileIds...)

		if newCursor == "" {
			break
		}

		cursor = newCursor
	}

	expiryTime := config.CacheConfig.DEFAULT_DROPBOX_CACHE_EXPIRY

	if err := utils.CacheProviderFileIDs(ctx, searchCacheKey, providerFileIDs, time.Duration(expiryTime)*time.Minute); err != nil {
		config.LOGGER.Error(
			"failed to cache search results",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.String("account_id", account.ID.String()),
			zap.Error(err),
		)
	}

	return providerFileIDs, nil
}

func (p *DropboxProvider) searchContentResults(
	ctx context.Context,
	conn *pgxpool.Conn,
	accountID pgtype.UUID,
	searchText, accessToken, refreshToken, cursor string,
) ([]string, string, error) {
	reqBody := map[string]any{
		"match_field_options": map[string]bool{
			"include_highlights": false,
		},
		"options": map[string]any{
			"file_status":   "active",
			"filename_only": false,
			"max_results":   1000,
			"path":          "/",
		},
		"query": searchText,
	}

	reqUrl := DROPBOX_API_BASE_URL + "/2/files/search_v2"

	if cursor != "" {
		reqBody = map[string]any{
			"cursor": cursor,
		}

		reqUrl = DROPBOX_API_BASE_URL + "/2/files/search/continue_v2"
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		config.LOGGER.Error(
			"failed to marshal request body",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

		return nil, "", err
	}

	httpClient := http.Client{}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, reqUrl, bytes.NewReader(jsonBody))
	if err != nil {
		config.LOGGER.Error(
			"failed to initialize new http post request for delete action",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

		return nil, "", err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")

	res, err := httpClient.Do(req)
	if err != nil {
		config.LOGGER.Error(
			"http request for dropbox permanent delete action failed",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

		return nil, "", err
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		config.LOGGER.Error(
			"failed to read http response body for dropbox search request",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

		return nil, "", err
	}

	if res.StatusCode == http.StatusUnauthorized {
		config.LOGGER.Warn(
			"access token expired, attempting to renew",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
		)

		_, _, err := p.RenewOAuthTokens(ctx, conn, accountID, refreshToken)
		if err != nil {
			return nil, "", err
		}

		return nil, "", errors.New(
			"request has failed with status 401, failing task for it to fetch new token from db instead of using the stale token in next request",
		)
	}

	if res.StatusCode != http.StatusOK {
		config.LOGGER.Error(
			"http request for dropbox sync task did not return 200",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Int("status_code", res.StatusCode),
		)

		return nil, "", fmt.Errorf("%s", string(body[:]))
	}

	var dropboxResponse DropboxSearchResponse

	err = json.Unmarshal(body, &dropboxResponse)
	if err != nil {
		config.LOGGER.Error(
			"failed to unmarshal request body for http dropbox search request",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

		return nil, "", err
	}

	providerFileIds := []string{}

	for _, file := range dropboxResponse.Matches {
		providerFileIds = append(providerFileIds, file.MetaData.MetaData.ID)
	}

	return providerFileIds, dropboxResponse.Cursor, nil
}

func (p *DropboxProvider) moveToTrash(ctx context.Context, accessToken, filePath string) error {
	reqBody := fmt.Appendf(nil, "{\"path\": \"%s\"}", filePath)

	httpClient := http.Client{}

	url := DROPBOX_API_BASE_URL + "/2/files/delete_v2"

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(reqBody))
	if err != nil {
		config.LOGGER.Error(
			"failed to initialize new http post request for delete action",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

		return err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")

	res, err := httpClient.Do(req)
	if err != nil {
		config.LOGGER.Error(
			"http request for dropbox delete action failed",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

		return err
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		config.LOGGER.Error(
			"failed to read http response body for dropbox sync task",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

		return err
	}

	if res.StatusCode == http.StatusUnauthorized {
		return errors.New("request has failed with status 401")
	}

	if res.StatusCode != http.StatusOK {
		config.LOGGER.Error(
			"http request for dropbox delete action did not return 200",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Int("status_code", res.StatusCode),
		)

		return fmt.Errorf("%s", string(body[:]))
	}

	var dropboxResponse DeleteFileResponse

	err = json.Unmarshal(body, &dropboxResponse)

	return err
}

func (p *DropboxProvider) permanentlyDeleteFile(
	ctx context.Context,
	accessToken, filePath string,
) error {
	reqBody := fmt.Appendf(nil, "{\"path\": \"%s\"}", filePath)

	httpClient := http.Client{}

	url := DROPBOX_API_BASE_URL + "/2/files/permanently_delete"

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(reqBody))
	if err != nil {
		config.LOGGER.Error(
			"failed to initialize new http post request for delete action",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

		return err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")

	res, err := httpClient.Do(req)
	if err != nil {
		config.LOGGER.Error(
			"http request for dropbox permanent delete action failed",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

		return err
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		config.LOGGER.Error(
			"failed to read http response body for dropbox sync task",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

		return err
	}

	if res.StatusCode == http.StatusUnauthorized {
		return errors.New("request has failed with status 401")
	}

	if res.StatusCode != http.StatusOK {
		config.LOGGER.Error(
			"http request for dropbox permanent delete action did not return 200",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Int("status_code", res.StatusCode),
		)

		return fmt.Errorf("%s", string(body[:]))
	}

	return nil
}

func (p *DropboxProvider) bulkInsertSyncedItems(
	ctx context.Context,
	conn *pgxpool.Conn,
	queries repository.Queries,
	providerFileIDs []string,
	accountID pgtype.UUID,
	files []repository.AddSyncedItemsParams,
	cursor string,
) (int64, error) {
	var insertedRowCount int64

	err := utils.WithTransaction(ctx, conn, func(ctx context.Context, tx pgx.Tx) error {
		qx := queries.WithTx(tx)

		if len(providerFileIDs) > 0 {
			err := qx.DeleteConflictingItems(ctx, repository.DeleteConflictingItemsParams{
				ProviderFileIds: providerFileIDs,
				AccountID:       accountID,
			})
			if err != nil {
				config.LOGGER.Error(
					"an error occured while deleting conflicted files",
					zap.String("provider", DROPBOX_PROVIDER_NAME),
					zap.String("account_id", accountID.String()),
					zap.Error(err),
				)

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
		config.LOGGER.Error(
			"failed to bulk insert synced items",
			zap.String("provider", DROPBOX_PROVIDER_NAME),
			zap.Error(err),
		)

		return 0, err
	}

	return insertedRowCount, nil
}

func (p *DropboxProvider) convertToSyncedItemSlice(
	entries []DropboxListFolderEntries,
	accountID pgtype.UUID,
	isValidLastSyncedData bool,
) ([]repository.AddSyncedItemsParams, []string) {
	syncedItems := []repository.AddSyncedItemsParams{}
	providerFileIDs := []string{}

	for _, entry := range entries {
		ext := filepath.Ext(entry.Name)

		mimeType := mime.TypeByExtension(ext)

		parentFolder := path.Dir(entry.PathDisplay)

		if entry.Name == "bgnet_usl_c_1.pdf" {
			config.LOGGER.Info("is_deleted", zap.String("value", entry.Tag))
		}

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
			IsTrashed:      db.PGBool(entry.Tag == "deleted"),
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

func (p *DropboxProvider) CreateFolder(
	ctx context.Context,
	name string,
	parentFolder ParentFolder,
	account repository.GetLinkedAccountRow,
	conn *pgxpool.Conn,
	queries repository.Queries,
) error {
	logFields := []zap.Field{
		zap.String("provider", DROPBOX_PROVIDER_NAME),
	}

	accessToken, err := utils.Decrypt(account.AccessToken)
	if err != nil {
		logFields = append(logFields, zap.Error(err))
		config.LOGGER.Error("failed to decrypt access token", logFields...)

		return err
	}

	parentPath := parentFolder.Path

	reqBody := fmt.Appendf(
		nil,
		"{\"autorename\":false,\"path\": \"%s\"}",
		fmt.Sprintf("%s/%s", parentPath, name),
	)

	url := DROPBOX_API_BASE_URL + "/2/files/create_folder_v2"

	httpClient := http.Client{}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(reqBody))
	if err != nil {
		logFields = append(logFields, zap.Error(err))
		config.LOGGER.Error(
			"failed to create new request for creating new folder in dropbox",
			logFields...)

		return err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")

	res, err := httpClient.Do(req)
	if err != nil {
		logFields = append(logFields, zap.Error(err))
		config.LOGGER.Error("http request for creating new folder in dropbox failed", logFields...)

		return err
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		logFields = append(logFields, zap.Error(err))
		config.LOGGER.Error(
			"failed to read http response body for dropbox folder creation request",
			logFields...)

		return err
	}

	if res.StatusCode != http.StatusOK {
		err = errors.New(
			"http request for creating new folder in dropbox returned a non-ok status code in response",
		)
		logFields = append(
			logFields,
			zap.Error(err),
			zap.String("body", string(body)),
			zap.Int("status_code", res.StatusCode),
		)
		config.LOGGER.Error("http request for creatin new folder in dropbox failed", logFields...)

		return err
	}

	var newFolder DropboxFileMetadata

	err = json.Unmarshal(body, &newFolder)
	if err != nil {
		logFields = append(logFields, zap.Error(err))
		config.LOGGER.Error("failed to unmarshal http response body", logFields...)

		return err
	}

	ext := filepath.Ext(newFolder.Name)

	mimeType := mime.TypeByExtension(ext)

	parentFolderPath := path.Dir(newFolder.PathDisplay)

	err = utils.WithTransaction(ctx, conn, func(ctx context.Context, tx pgx.Tx) error {
		qx := queries.WithTx(tx)

		_, err := qx.AddSyncedItems(ctx, []repository.AddSyncedItemsParams{
			{
				AccountID:      account.ID,
				ProviderFileID: newFolder.ID,
				Name:           newFolder.Name,
				Extension:      ext,
				Size:           newFolder.Size,
				Path:           db.PGTextField(newFolder.PathDisplay),
				MimeType:       db.PGTextField(mimeType),
				ParentFolder:   db.PGTextField(parentFolderPath),
				IsFolder:       true,
				ContentHash:    db.PGTextField(""),
				CreatedTime:    db.PGTimestamptzField(time.Time{}),
				ModifiedTime:   db.PGTimestamptzField(newFolder.ClientModified),
				ThumbnailLink:  db.PGTextField(""),
				PreviewLink:    db.PGTextField(""),
				WebViewLink:    db.PGTextField(""),
				WebContentLink: db.PGTextField(""),
				LinkExpiresAt:  db.PGTimestamptzField(time.Time{}),
			},
		})

		return err
	})
	if err != nil {
		logFields = append(logFields, zap.Error(err))
		config.LOGGER.Error("failed to insert metadata for newly created folder", logFields...)

		return err
	}

	return nil
}
