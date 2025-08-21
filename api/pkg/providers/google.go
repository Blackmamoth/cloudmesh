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
	GOOGLE_VERIFIER_KEY  = "pkce_verifier_google"
	GOOGLE_CSRF_KEY      = "oauth_csrf_token_google"
	GOOGLE_PROVIDER_NAME = string(repository.ProviderEnumGoogle)
	GOOGLE_AUTH_ENDPOINT = "https://oauth2.googleapis.com/token"
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

func (p *GoogleProvider) GetConsentPageURL(
	w http.ResponseWriter,
	r *http.Request,
	store *sessions.CookieStore,
	userID string,
) (string, error) {
	return getConsentPageURL(
		userID,
		GOOGLE_PROVIDER_NAME,
		GOOGLE_SESSION_NAME,
		GOOGLE_VERIFIER_KEY,
		GOOGLE_CSRF_KEY,
		w,
		r,
		&p.Config,
		store,
	)
}

func (p *GoogleProvider) GetToken(
	w http.ResponseWriter,
	r *http.Request,
	store *sessions.CookieStore,
) (*oauth2.Token, string, *UserAccountInfo, error) {
	return exchangeToken(
		r.Context(),
		r,
		w,
		store,
		GOOGLE_SESSION_NAME,
		GOOGLE_VERIFIER_KEY,
		GOOGLE_CSRF_KEY,
		&p.Config,
		GOOGLE_PROVIDER_NAME,
		p.GetAccountInfo,
	)
}

func (p *GoogleProvider) GetAccountInfo(
	ctx context.Context,
	token *oauth2.Token,
) (*UserAccountInfo, error) {
	httpClient := p.GetHTTPClient(ctx, token.AccessToken, token.RefreshToken)

	svc, err := oauth2Google.NewService(ctx, option.WithHTTPClient(httpClient))
	if err != nil {
		config.LOGGER.Error(
			"failed to create oauth2 service",
			zap.String("provider", GOOGLE_PROVIDER_NAME),
			zap.Error(err),
		)

		return nil, errors.New("failed to create oauth2 service")
	}

	userInfo, err := svc.Userinfo.Get().Do()
	if err != nil {
		config.LOGGER.Error(
			"failed to fetch user info",
			zap.String("provider", GOOGLE_PROVIDER_NAME),
			zap.Error(err),
		)

		return nil, errors.New("failed to fetch user info")
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

func (p *GoogleProvider) SyncFiles(
	ctx context.Context,
	conn *pgxpool.Conn,
	accountID pgtype.UUID,
	authToken repository.GetAuthTokensRow,
) error {
	accessToken, err := utils.Decrypt(authToken.AccessToken)
	if err != nil {
		config.LOGGER.Error(
			"could not decrypt access token",
			zap.String("provider", GOOGLE_PROVIDER_NAME),
			zap.String("account_id", accountID.String()),
		)

		return err
	}

	refreshToken, err := utils.Decrypt(authToken.RefreshToken)
	if err != nil {
		config.LOGGER.Error(
			"could not decrypt refresh token",
			zap.String("provider", GOOGLE_PROVIDER_NAME),
			zap.String("account_id", accountID.String()),
		)

		return err
	}

	_, pool := db.GetPGClient()

	accessToken, err = EnsureValidAccesstoken(ctx, pool, accountID, accessToken, refreshToken, p)
	if err != nil {
		config.LOGGER.Error("failed to validate access token", zap.Error(err))
	}

	httpClient := p.GetHTTPClient(ctx, accessToken, refreshToken)

	driveService, err := drive.NewService(ctx, option.WithHTTPClient(httpClient))
	if err != nil {
		config.LOGGER.Error(
			"an error occurred while initializing google drive service",
			zap.String("provider", GOOGLE_PROVIDER_NAME),
			zap.Error(err),
		)

		return err
	}

	pageToken := ""

	query := ""

	queries := repository.New(conn)

	syncDetails, err := queries.GetLatestSyncTimeAndPagetoken(ctx, accountID)
	if err != nil {
		if !errors.Is(err, sql.ErrNoRows) {
			config.LOGGER.Error(
				"could not fetch timestamp and page token for latest sync",
				zap.String("provider", GOOGLE_PROVIDER_NAME),
				zap.String("account_id", accountID.String()),
			)

			return err
		}
	}

	if syncDetails.LastSyncedAt.Valid {
		query = fmt.Sprintf(
			"modifiedTime > '%s'",
			syncDetails.LastSyncedAt.Time.Format(time.RFC3339),
		)
	}

	totalItemCount := 0

	for {
		fileList, err := driveService.Files.
			List().
			Q(query).
			Fields("files(id, name, size, mimeType, createdTime, modifiedTime, thumbnailLink, fullFileExtension, parents, webViewLink, webContentLink, iconLink, sha256Checksum, trashed,owners,ownedByMe)").
			PageToken(pageToken).
			PageSize(1000).
			Do()
		if err != nil {
			gErr := &googleapi.Error{}
			if !errors.As(err, &gErr) || gErr.Code != http.StatusUnauthorized {
				config.LOGGER.Error(
					"an error occurred while synching google drive files",
					zap.String("provider", GOOGLE_PROVIDER_NAME),
					zap.Error(err),
				)

				return err
			}

			newAccessToken, _, err := p.RenewOAuthTokens(ctx, conn, accountID, refreshToken)
			if err != nil {
				return err
			}

			httpClient = p.GetHTTPClient(ctx, newAccessToken, refreshToken)

			driveService, err = drive.NewService(ctx, option.WithHTTPClient(httpClient))
			if err != nil {
				config.LOGGER.Error(
					"an error occurred while initializing google drive service",
					zap.String("provider", GOOGLE_PROVIDER_NAME),
					zap.Error(err),
				)

				return err
			}

			continue
		}

		files, providerFileIDs := p.convertToSyncedItemSlice(
			fileList.Files,
			accountID,
			syncDetails.LastSyncedAt.Valid,
		)

		var insertedRows int64

		insertedRows, err = p.bulkInsertSyncedItems(
			ctx,
			conn,
			queries,
			providerFileIDs,
			accountID,
			files,
		)
		if err != nil {
			config.LOGGER.Error(
				"failed to bulk insert synced items",
				zap.String("provider", GOOGLE_PROVIDER_NAME),
				zap.String("account_id", accountID.String()),
				zap.Error(err),
			)

			return err
		}

		config.LOGGER.Info(
			"batch inserted",
			zap.String("provider", GOOGLE_PROVIDER_NAME),
			zap.String("account_id", accountID.String()),
			zap.Int64("item_count", insertedRows),
		)

		totalItemCount += int(insertedRows)

		pageToken = fileList.NextPageToken

		if pageToken == "" {
			break
		}
	}

	config.LOGGER.Info("Google drive sync successful", zap.Int("item_count", totalItemCount))

	return nil
}

func (p *GoogleProvider) RenewOAuthTokens(
	ctx context.Context,
	conn *pgxpool.Conn,
	accountID pgtype.UUID,
	refreshToken string,
) (string, int64, error) {
	reqUrl := fmt.Sprintf(
		"%s?grant_type=refresh_token&client_id=%s&client_secret=%s&refresh_token=%s",
		GOOGLE_AUTH_ENDPOINT,
		p.Config.ClientID,
		p.Config.ClientSecret,
		refreshToken,
	)

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		reqUrl,
		nil,
	) // #nosec G107 -- reqUrl is internal, not user-controlled
	if err != nil {
		config.LOGGER.Error(
			"failed to create new http request for google oauth",
			zap.String("provider", GOOGLE_PROVIDER_NAME),
			zap.Error(err),
		)
	}

	req.Header.Set("Content-Type", "application/json")

	httpClient := http.Client{}

	res, err := httpClient.Do(req)
	if err != nil {
		config.LOGGER.Error(
			"http request for google token renewal failed",
			zap.String("provider", GOOGLE_PROVIDER_NAME),
		)

		return "", 0, err
	}

	body, err := io.ReadAll(res.Body)
	if err != nil {
		config.LOGGER.Error(
			"failed to read http response body for google token renewal",
			zap.String("provider", GOOGLE_PROVIDER_NAME),
			zap.Int("status_code", res.StatusCode),
		)

		return "", 0, err
	}

	defer res.Body.Close()

	var googleAuthResponse GoogleAuthResponse

	if err := json.Unmarshal(body, &googleAuthResponse); err != nil {
		config.LOGGER.Error(
			"failed to unmarshal dropbox token renew response",
			zap.String("provider", GOOGLE_PROVIDER_NAME),
			zap.Error(err),
		)

		return "", 0, err
	}

	err = utils.WithTransaction(ctx, conn, func(ctx context.Context, tx pgx.Tx) error {
		encryptedAccessToken, err := utils.Encrypt(googleAuthResponse.AccessToken)
		if err != nil {
			config.LOGGER.Error(
				"failed to encrypt new access token",
				zap.String("provider", GOOGLE_PROVIDER_NAME),
				zap.Error(err),
			)

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
		config.LOGGER.Error(
			"failed to update google oauth tokens in db",
			zap.String("provider", GOOGLE_PROVIDER_NAME),
			zap.Error(err),
		)

		return "", 0, err
	}

	return googleAuthResponse.AccessToken, googleAuthResponse.ExpiresIn, nil
}

func (p *GoogleProvider) GetHTTPClient(
	ctx context.Context,
	accessToken, refreshToken string,
) *http.Client {
	token := &oauth2.Token{AccessToken: accessToken, RefreshToken: refreshToken}

	tokenSource := p.Config.TokenSource(ctx, token)

	reusableTokenSource := oauth2.ReuseTokenSource(token, tokenSource)

	return oauth2.NewClient(ctx, reusableTokenSource)
}

func (p *GoogleProvider) GetStorageQuota(
	ctx context.Context,
	userID string,
	accountID pgtype.UUID,
	encryptedAccessToken, encryptedRefreshToken string,
) (*StorageQuota, error) {
	storageQuotaKey := fmt.Sprintf("storage:google:%s:%s", userID, accountID.String())

	redisClient := db.GetRedisClient()

	cachedStorageQuota := redisClient.Get(ctx, storageQuotaKey)

	if cachedStorageQuota.Err() == nil {
		val, err := cachedStorageQuota.Result()
		if err != nil {
			config.LOGGER.Error(
				"failed to get the result from redis cache",
				zap.String("user_id", userID),
				zap.String("account_id", accountID.String()),
				zap.String("provider", GOOGLE_PROVIDER_NAME),
			)
		} else {
			var storageQuota StorageQuota

			err = json.Unmarshal([]byte(val), &storageQuota)
			if err == nil {
				return &storageQuota, nil
			}

			config.LOGGER.Error("failed to unmarshal storage quota", zap.String("user_id", userID), zap.String("account_id", accountID.String()), zap.String("provider", GOOGLE_PROVIDER_NAME))
		}
	}

	accessToken, err := utils.Decrypt(encryptedAccessToken)
	if err != nil {
		config.LOGGER.Error(
			"failed to decrypt access token",
			zap.String("provider", GOOGLE_PROVIDER_NAME),
			zap.Error(err),
		)

		return nil, err
	}

	refreshToken, err := utils.Decrypt(encryptedRefreshToken)
	if err != nil {
		config.LOGGER.Error(
			"failed to decrypt access token",
			zap.String("provider", GOOGLE_PROVIDER_NAME),
			zap.Error(err),
		)

		return nil, err
	}

	_, pool := db.GetPGClient()

	accessToken, err = EnsureValidAccesstoken(ctx, pool, accountID, accessToken, refreshToken, p)
	if err != nil {
		config.LOGGER.Error("failed to validate access token", zap.Error(err))
	}

	httpClient := p.GetHTTPClient(ctx, accessToken, refreshToken)

	driveService, err := drive.NewService(ctx, option.WithHTTPClient(httpClient))
	if err != nil {
		config.LOGGER.Error(
			"an error occurred while initializing google drive service",
			zap.String("provider", GOOGLE_PROVIDER_NAME),
			zap.Error(err),
		)

		return nil, err
	}

	about, err := driveService.About.Get().Fields("storageQuota").Do()
	if err != nil {
		config.LOGGER.Error(
			"failed to get storage quota from google drive service",
			zap.String("account_id", accountID.String()),
			zap.String("provider", GOOGLE_PROVIDER_NAME),
			zap.Error(err),
		)

		return nil, err
	}

	storageQuota := StorageQuota{
		TotalStorage: about.StorageQuota.Limit,
		UsedStorage:  about.StorageQuota.Usage,
	}

	storageQuotaCache, err := json.Marshal(storageQuota)
	if err != nil {
		config.LOGGER.Error(
			"failed to marshal storage quota for caching",
			zap.String("account_id", accountID.String()),
			zap.String("provider", GOOGLE_PROVIDER_NAME),
			zap.Error(err),
		)

		return nil, err
	}

	storageCache := redisClient.Set(ctx, storageQuotaKey, storageQuotaCache, 15*time.Minute)

	if storageCache.Err() != nil {
		config.LOGGER.Error(
			"failed to cache storage quota",
			zap.String("account_id", accountID.String()),
			zap.String("provider", GOOGLE_PROVIDER_NAME),
			zap.Error(err),
		)
	}

	return &storageQuota, nil
}

func (p *GoogleProvider) UploadFiles(
	ctx context.Context,
	accountID pgtype.UUID,
	conn *pgxpool.Conn,
	queries *repository.Queries,
	authTokens repository.GetAuthTokensRow,
	uploadedFiles []middlewares.UploadedFile,
) error {
	accessToken, err := utils.Decrypt(authTokens.AccessToken)
	if err != nil {
		config.LOGGER.Error(
			"failed to decrypt access token",
			zap.String("provider", GOOGLE_PROVIDER_NAME),
			zap.Error(err),
		)

		return err
	}

	refreshToken, err := utils.Decrypt(authTokens.RefreshToken)
	if err != nil {
		config.LOGGER.Error(
			"failed to decrypt access token",
			zap.String("provider", GOOGLE_PROVIDER_NAME),
			zap.Error(err),
		)

		return err
	}

	_, pool := db.GetPGClient()

	accessToken, err = EnsureValidAccesstoken(ctx, pool, accountID, accessToken, refreshToken, p)
	if err != nil {
		config.LOGGER.Error("failed to validate access token", zap.Error(err))
	}

	httpClient := p.GetHTTPClient(ctx, accessToken, refreshToken)

	driveService, err := drive.NewService(ctx, option.WithHTTPClient(httpClient))
	if err != nil {
		config.LOGGER.Error(
			"an error occurred while initializing google drive service",
			zap.String("provider", GOOGLE_PROVIDER_NAME),
			zap.Error(err),
		)

		return err
	}

	var (
		mu      sync.Mutex
		results []*drive.File
		g, _    = errgroup.WithContext(ctx)
		sem     = make(chan struct{}, 10)
	)

	for _, f := range uploadedFiles {
		file := f

		g.Go(func() error {
			sem <- struct{}{}

			defer func() { <-sem }()

			uploadedFile, err := p.uploadToDrive(driveService, file)
			if err != nil {
				return err
			}

			mu.Lock()

			results = append(results, uploadedFile)

			mu.Unlock()

			return nil
		})
	}

	if err := g.Wait(); err != nil {
		return err
	}

	files, _ := p.convertToSyncedItemSlice(results, accountID, false)

	_, err = p.bulkInsertSyncedItems(ctx, conn, queries, []string{}, accountID, files)
	if err != nil {
		config.LOGGER.Error(
			"failed to insert newly uploaded files",
			zap.String("provider", GOOGLE_PROVIDER_NAME),
			zap.Error(err),
		)

		return err
	}

	if err := utils.DeleteKeysByPattern(ctx, fmt.Sprintf("search_cache:%s:%s*", GOOGLE_PROVIDER_NAME, accountID.String())); err != nil {
		config.LOGGER.Error(
			"failed to delete cache for content search results",
			zap.String("provider", GOOGLE_PROVIDER_NAME),
			zap.String("account_id", accountID.String()),
			zap.Error(err),
		)
	}

	return nil
}

func (p *GoogleProvider) MoveToTrash(
	ctx context.Context,
	accountID pgtype.UUID,
	conn *pgxpool.Conn,
	queries *repository.Queries,
	authTokens repository.GetAuthTokensRow,
	syncedItemIds []repository.GetProviderFileIdsRow,
) error {
	accessToken, err := utils.Decrypt(authTokens.AccessToken)
	if err != nil {
		config.LOGGER.Error(
			"failed to decrypt access token",
			zap.String("provider", GOOGLE_PROVIDER_NAME),
			zap.Error(err),
		)

		return err
	}

	refreshToken, err := utils.Decrypt(authTokens.RefreshToken)
	if err != nil {
		config.LOGGER.Error(
			"failed to decrypt access token",
			zap.String("provider", GOOGLE_PROVIDER_NAME),
			zap.Error(err),
		)

		return err
	}

	_, pool := db.GetPGClient()

	accessToken, err = EnsureValidAccesstoken(ctx, pool, accountID, accessToken, refreshToken, p)
	if err != nil {
		config.LOGGER.Error("failed to validate access token", zap.Error(err))
	}

	httpClient := p.GetHTTPClient(ctx, accessToken, refreshToken)

	driveService, err := drive.NewService(ctx, option.WithHTTPClient(httpClient))
	if err != nil {
		config.LOGGER.Error(
			"an error occurred while initializing google drive service",
			zap.String("provider", GOOGLE_PROVIDER_NAME),
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

			if err := p.moveToTrash(driveService, f.ProviderFileID); err != nil {
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
			AccountID: accountID,
		})
	})
	if err != nil {
		config.LOGGER.Error("failed to set is_trashed to true for file ids", zap.Error(err))

		return err
	}

	return nil
}

func (p *GoogleProvider) PermanentlyDeleteFiles(
	ctx context.Context,
	accountID pgtype.UUID,
	conn *pgxpool.Conn,
	queries *repository.Queries,
	authTokens repository.GetAuthTokensRow,
	syncedItemIds []repository.GetProviderFileIdsRow,
) error {
	accessToken, err := utils.Decrypt(authTokens.AccessToken)
	if err != nil {
		config.LOGGER.Error(
			"failed to decrypt access token",
			zap.String("provider", GOOGLE_PROVIDER_NAME),
			zap.Error(err),
		)

		return err
	}

	refreshToken, err := utils.Decrypt(authTokens.RefreshToken)
	if err != nil {
		config.LOGGER.Error(
			"failed to decrypt access token",
			zap.String("provider", GOOGLE_PROVIDER_NAME),
			zap.Error(err),
		)

		return err
	}

	_, pool := db.GetPGClient()

	accessToken, err = EnsureValidAccesstoken(ctx, pool, accountID, accessToken, refreshToken, p)
	if err != nil {
		config.LOGGER.Error("failed to validate access token", zap.Error(err))
	}

	httpClient := p.GetHTTPClient(ctx, accessToken, refreshToken)

	driveService, err := drive.NewService(ctx, option.WithHTTPClient(httpClient))
	if err != nil {
		config.LOGGER.Error(
			"an error occurred while initializing google drive service",
			zap.String("provider", GOOGLE_PROVIDER_NAME),
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

			if err := p.permanentlyDeleteFile(driveService, f.ProviderFileID); err != nil {
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
			AccountID: accountID,
		})
	})
	if err != nil {
		config.LOGGER.Error("failed to set is_trashed to true for file ids", zap.Error(err))

		return err
	}

	if err := utils.DeleteKeysByPattern(ctx, fmt.Sprintf("search_cache:%s:%s*", GOOGLE_PROVIDER_NAME, accountID.String())); err != nil {
		config.LOGGER.Error(
			"failed to delete cache for content search results",
			zap.String("provider", GOOGLE_PROVIDER_NAME),
			zap.String("account_id", accountID.String()),
			zap.Error(err),
		)
	}

	return nil
}

func (p *GoogleProvider) SearchByContent(
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
			zap.String("provider", GOOGLE_PROVIDER_NAME),
			zap.Error(err),
		)

		return nil, err
	}

	refreshToken, err := utils.Decrypt(account.RefreshToken)
	if err != nil {
		config.LOGGER.Error(
			"failed to decrypt access token",
			zap.String("provider", GOOGLE_PROVIDER_NAME),
			zap.Error(err),
		)

		return nil, err
	}

	_, pool := db.GetPGClient()

	accessToken, err = EnsureValidAccesstoken(ctx, pool, account.ID, accessToken, refreshToken, p)
	if err != nil {
		config.LOGGER.Error("failed to validate access token", zap.Error(err))
	}

	httpClient := p.GetHTTPClient(ctx, accessToken, refreshToken)

	driveService, err := drive.NewService(ctx, option.WithHTTPClient(httpClient))
	if err != nil {
		config.LOGGER.Error(
			"an error occurred while initializing google drive service",
			zap.String("provider", GOOGLE_PROVIDER_NAME),
			zap.Error(err),
		)

		return nil, err
	}

	var providerFileIDs []string

	pageToken := ""

	query := fmt.Sprintf("fullText contains '%s'", searchText)

	for {
		fileList, err := driveService.Files.
			List().
			Q(query).
			Fields("files(id)").
			PageToken(pageToken).
			PageSize(1000).
			Do()
		if err != nil {
			gErr := &googleapi.Error{}
			if !errors.As(err, &gErr) {
				config.LOGGER.Error(
					"failed to fetch file metadata from google drive",
					zap.String("provider", GOOGLE_PROVIDER_NAME),
					zap.Error(err),
				)

				return nil, err
			}

			if gErr.Code != http.StatusUnauthorized {
				config.LOGGER.Error(
					"failed to fetch file metadata from google drive",
					zap.String("provider", GOOGLE_PROVIDER_NAME),
					zap.Int("status_code", gErr.Code),
					zap.Error(err),
				)

				return nil, err
			}

			newAccessToken, _, err := p.RenewOAuthTokens(ctx, conn, account.ID, refreshToken)
			if err != nil {
				return nil, err
			}

			httpClient = p.GetHTTPClient(ctx, newAccessToken, refreshToken)

			driveService, err = drive.NewService(ctx, option.WithHTTPClient(httpClient))
			if err != nil {
				config.LOGGER.Error(
					"an error occurred while initializing google drive service",
					zap.String("provider", GOOGLE_PROVIDER_NAME),
					zap.Error(err),
				)

				return nil, err
			}

			continue
		}

		for _, file := range fileList.Files {
			providerFileIDs = append(providerFileIDs, file.Id)
		}

		if fileList.NextPageToken == "" {
			break
		}

		pageToken = fileList.NextPageToken
	}

	expiryTime := config.CacheConfig.DEFAULT_GOOGLE_CACHE_EXPIRY

	if err := utils.CacheProviderFileIDs(ctx, searchCacheKey, providerFileIDs, time.Duration(expiryTime)*time.Minute); err != nil {
		config.LOGGER.Error(
			"failed to cache search results",
			zap.String("provider", GOOGLE_PROVIDER_NAME),
			zap.String("account_id", account.ID.String()),
			zap.Error(err),
		)
	}

	return providerFileIDs, nil
}

func (p *GoogleProvider) uploadToDrive(
	service *drive.Service,
	file middlewares.UploadedFile,
) (*drive.File, error) {
	mimeType := file.ContentType

	fileMeta := &drive.File{Name: file.FileHeader.Filename}

	uploadedFile, err := service.Files.Create(fileMeta).
		Media(file.File, googleapi.ContentType(mimeType)).
		Do()
	if err != nil {
		config.LOGGER.Error(
			"upload failed",
			zap.String("file", file.FileHeader.Filename),
			zap.String("provider", GOOGLE_PROVIDER_NAME),
			zap.Error(err),
		)

		return nil, fmt.Errorf("upload failed for file '%s': %w", file.FileHeader.Filename, err)
	}

	return uploadedFile, nil
}

func (p *GoogleProvider) moveToTrash(service *drive.Service, fileId string) error {
	fileMetadata := &drive.File{
		Trashed: true,
	}

	_, err := service.Files.Update(fileId, fileMetadata).Fields("id").Do()

	return err
}

func (p *GoogleProvider) permanentlyDeleteFile(service *drive.Service, fileId string) error {
	return service.Files.Delete(fileId).Do()
}

func (p *GoogleProvider) convertToSyncedItemSlice(
	files []*drive.File,
	accountID pgtype.UUID,
	isValidLastSyncedData bool,
) ([]repository.AddSyncedItemsParams, []string) {
	syncedItems := []repository.AddSyncedItemsParams{}
	providerFileIDs := []string{}

	for _, file := range files {
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

		var ownerInfoJSON []byte
		if len(file.Owners) > 0 {
			ownerInfo := map[string]string{
				"display_name": file.Owners[0].DisplayName,
				"email":        file.Owners[0].EmailAddress,
				"photo_link":   file.Owners[0].PhotoLink,
			}

			var err error
			ownerInfoJSON, err = json.Marshal(ownerInfo)
			if err != nil {
				config.LOGGER.Error("failed to marshal owner info", zap.Error(err))
				ownerInfoJSON = []byte("{}")
			}
		} else {
			ownerInfoJSON = []byte("{}")
		}

		syncedItems = append(syncedItems, repository.AddSyncedItemsParams{
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
			IsTrashed:      db.PGBool(file.Trashed),
			OwnerInfo:      ownerInfoJSON,
			ContentHash:    db.PGTextField(file.Sha256Checksum),
			ThumbnailLink:  db.PGTextField(file.ThumbnailLink),
			PreviewLink:    db.PGTextField(previewLink),
			WebViewLink:    db.PGTextField(file.WebViewLink),
			WebContentLink: db.PGTextField(file.WebContentLink),
			LinkExpiresAt:  db.PGTimestamptzField(time.Time{}),
		})

		if isValidLastSyncedData {
			providerFileIDs = append(providerFileIDs, file.Id)
		}
	}

	return syncedItems, providerFileIDs
}

func (p *GoogleProvider) bulkInsertSyncedItems(
	ctx context.Context,
	conn *pgxpool.Conn,
	queries *repository.Queries,
	providerFileIDs []string,
	accountID pgtype.UUID,
	files []repository.AddSyncedItemsParams,
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
					"an error occurred while deleting conflicted files",
					zap.String("provider", GOOGLE_PROVIDER_NAME),
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
			SyncPageToken: db.PGTextField(""),
			AccountID:     accountID,
		})
	})
	if err != nil {
		config.LOGGER.Error(
			"failed to bulk insert synced item",
			zap.String("provider", GOOGLE_PROVIDER_NAME),
			zap.Error(err),
		)

		return 0, err
	}

	return insertedRowCount, nil
}

func (p *GoogleProvider) CreateFolder(
	ctx context.Context,
	name string,
	parentFolder ParentFolder,
	account repository.GetLinkedAccountRow,
	conn *pgxpool.Conn,
	queries *repository.Queries,
) error {
	logFields := []zap.Field{
		zap.String("provider", GOOGLE_PROVIDER_NAME),
	}

	accessToken, err := utils.Decrypt(account.AccessToken)
	if err != nil {
		config.LOGGER.Error("failed to decrypt access token", logFields...)

		return err
	}

	refreshToken, err := utils.Decrypt(account.RefreshToken)
	if err != nil {
		config.LOGGER.Error("failed to decrypt access token", logFields...)

		return err
	}

	_, pool := db.GetPGClient()

	accessToken, err = EnsureValidAccesstoken(ctx, pool, account.ID, accessToken, refreshToken, p)
	if err != nil {
		config.LOGGER.Error("failed to validate access token", zap.Error(err))
	}

	httpClient := p.GetHTTPClient(ctx, accessToken, refreshToken)

	driveService, err := drive.NewService(ctx, option.WithHTTPClient(httpClient))
	if err != nil {
		config.LOGGER.Error(
			"an error occurred while initializing google drive service",
			logFields...)

		return err
	}

	driveFolder := drive.File{
		Name:     name,
		MimeType: "application/vnd.google-apps.folder",
		Parents:  []string{},
	}

	if parentFolder.ID != "" {
		driveFolder.Parents = append(driveFolder.Parents, parentFolder.ID)
	}

	folder, err := driveService.Files.Create(&driveFolder).
		Fields("id, name, size, mimeType, createdTime, modifiedTime, thumbnailLink, fullFileExtension, parents, webViewLink, webContentLink, iconLink, sha256Checksum, trashed, owners, ownedByMe").
		Do()
	if err != nil {
		logFields = append(logFields, zap.Error(err))
		config.LOGGER.Error("failed to create new folder in google drive", logFields...)

		return err
	}

	previewLink := fmt.Sprintf("https://drive.google.com/file/d/%s/preview", folder.Id)

	parsedCreatedTime, err := time.Parse(time.RFC3339, folder.CreatedTime)
	if err != nil {
		parsedCreatedTime = time.Time{}
	}

	parsedModifiedTime, err := time.Parse(time.RFC3339, folder.ModifiedTime)
	if err != nil {
		parsedModifiedTime = time.Time{}
	}

	err = utils.WithTransaction(ctx, conn, func(ctx context.Context, tx pgx.Tx) error {
		qx := queries.WithTx(tx)

		_, err := qx.AddSyncedItems(ctx, []repository.AddSyncedItemsParams{
			{
				AccountID:      account.ID,
				ProviderFileID: folder.Id,
				Name:           folder.Name,
				Extension:      folder.FullFileExtension,
				Size:           folder.Size,
				MimeType:       db.PGTextField(folder.MimeType),
				CreatedTime:    db.PGTimestamptzField(parsedCreatedTime),
				ModifiedTime:   db.PGTimestamptzField(parsedModifiedTime),
				ParentFolder:   db.PGTextField(parentFolder.ID),
				IsFolder:       true,
				IsTrashed:      db.PGBool(folder.Trashed),
				ContentHash:    db.PGTextField(folder.Sha256Checksum),
				ThumbnailLink:  db.PGTextField(folder.ThumbnailLink),
				PreviewLink:    db.PGTextField(previewLink),
				WebViewLink:    db.PGTextField(folder.WebViewLink),
				WebContentLink: db.PGTextField(folder.WebContentLink),
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
