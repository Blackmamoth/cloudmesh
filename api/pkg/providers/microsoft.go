package providers

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"mime"
	"net/http"
	"net/url"
	"path/filepath"
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

type MicrosoftOneDriveInfoResponse struct {
	ODataContext         string `json:"@odata.context"`
	CreatedDateTime      string `json:"createdDateTime"`
	Description          string `json:"description"`
	ID                   string `json:"id"`
	LastModifiedDateTime string `json:"lastModifiedDateTime"`
	Name                 string `json:"name"`
	WebURL               string `json:"webUrl"`
	DriveType            string `json:"driveType"`

	CreatedBy struct {
		User struct {
			DisplayName string `json:"displayName"`
		} `json:"user"`
	} `json:"createdBy"`

	LastModifiedBy struct {
		User struct {
			DisplayName string `json:"displayName"`
		} `json:"user"`
	} `json:"lastModifiedBy"`

	Owner struct {
		User struct {
			Email       string `json:"email"`
			DisplayName string `json:"displayName"`
		} `json:"user"`
	} `json:"owner"`

	Quota struct {
		Deleted                int64  `json:"deleted"`
		Remaining              int64  `json:"remaining"`
		State                  string `json:"state"`
		Total                  int64  `json:"total"`
		Used                   int64  `json:"used"`
		StoragePlanInformation struct {
			UpgradeAvailable bool `json:"upgradeAvailable"`
		} `json:"storagePlanInformation"`
	} `json:"quota"`
}

type OneDriveItem struct {
	DownloadURL          string    `json:"@microsoft.graph.downloadUrl,omitempty"`
	CreatedDateTime      time.Time `json:"createdDateTime"`
	ETag                 string    `json:"eTag"`
	ID                   string    `json:"id"`
	LastModifiedDateTime time.Time `json:"lastModifiedDateTime"`
	Name                 string    `json:"name"`
	WebURL               string    `json:"webUrl"`
	CTag                 string    `json:"cTag"`
	Size                 int64     `json:"size"`

	CreatedBy struct {
		User struct {
			Email       string `json:"email"`
			ID          string `json:"id"`
			DisplayName string `json:"displayName"`
		} `json:"user"`
	} `json:"createdBy"`

	LastModifiedBy struct {
		User struct {
			Email       string `json:"email"`
			ID          string `json:"id"`
			DisplayName string `json:"displayName"`
		} `json:"user"`
	} `json:"lastModifiedBy"`

	ParentReference struct {
		DriveType string `json:"driveType"`
		DriveID   string `json:"driveId"`
		ID        string `json:"id"`
		Name      string `json:"name"`
		Path      string `json:"path"`
		SiteID    string `json:"siteId"`
	} `json:"parentReference"`

	FileSystemInfo struct {
		CreatedDateTime      string `json:"createdDateTime"`
		LastModifiedDateTime string `json:"lastModifiedDateTime"`
	} `json:"fileSystemInfo"`

	File *struct {
		MimeType string `json:"mimeType"`
		Hashes   struct {
			QuickXorHash string `json:"quickXorHash"`
			Sha1Hash     string `json:"sha1Hash"`
			Sha256Hash   string `json:"sha256Hash"`
		} `json:"hashes"`
	} `json:"file,omitempty"`

	Folder *struct {
		ChildCount int `json:"childCount"`
		View       struct {
			SortBy    string `json:"sortBy"`
			SortOrder string `json:"sortOrder"`
			ViewType  string `json:"viewType"`
		} `json:"view"`
	} `json:"folder,omitempty"`

	SpecialFolder *struct {
		Name string `json:"name"`
	} `json:"specialFolder,omitempty"`
}

type MicrosoftAuthResponse struct {
	TokenType     string `json:"token_type"`
	Scope         string `json:"scope"`
	ExpiresIn     int64  `json:"expires_in"`
	ExtExpiresInt int64  `json:"ext_expires_in"`
	AccessToken   string `json:"access_token"`
	RefreshToken  string `json:"refresh_token"`
	IDToken       string `json:"id_token"`
}

type MicrosoftGetDriveItemsResponse struct {
	DataContext   string         `json:"@odata.context"`
	DataNextLink  string         `json:"@odata.nextLink"`
	DataDeltaLink string         `json:"@odata.deltaLink"`
	Value         []OneDriveItem `json:"value"`
}

const (
	MICROSOFT_SESSION_NAME       = "cloudmesh-microsoft-oauth-session"
	MICROSOFT_PROVIDER_NAME      = string(repository.ProviderEnumMicrosoft)
	MICROSOFT_GRAPH_API_BASE_URL = "https://graph.microsoft.com/v1.0"
	MICROSOFT_OAUTH_ENDPOINT     = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
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
	url := fmt.Sprintf("%s/me", MICROSOFT_GRAPH_API_BASE_URL)

	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		config.LOGGER.Error("failed to create request body for microsoft account info request", zap.String("provider", MICROSOFT_PROVIDER_NAME), zap.Error(err))
		return nil, err
	}

	httpClient := http.Client{}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token.AccessToken))

	res, err := httpClient.Do(req)
	if err != nil {
		config.LOGGER.Error("http request for getting microsoft account details failed", zap.String("provider", MICROSOFT_PROVIDER_NAME), zap.Error(err))
		return nil, err
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		config.LOGGER.Error("failed to read http resonse body for getting microsoft account details", zap.String("provider", MICROSOFT_PROVIDER_NAME), zap.Error(err))
		return nil, err
	}

	if res.StatusCode != http.StatusOK {
		err = fmt.Errorf("%s", string(body))
		config.LOGGER.Error("http resonse for getting microsoft account details returned a non 200 resonse", zap.Int("status_code", res.StatusCode), zap.String("provider", MICROSOFT_PROVIDER_NAME), zap.Error(err))
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
	logFields := []zap.Field{
		zap.String("account_id", accountID.String()),
		zap.String("provider", MICROSOFT_PROVIDER_NAME),
	}

	deltaToken := ""

	totalItemCount := 0

	queries := repository.New(conn)

	syncDetails, err := queries.GetLatestSyncTimeAndPagetoken(ctx, accountID)
	if err != nil {
		if !errors.Is(err, sql.ErrNoRows) {
			logFields = append(logFields, zap.Error(err))
			config.LOGGER.Error("could not fetch timestamp and page token for latest sync", logFields...)
			return err
		}
	}

	if syncDetails.LastSyncedAt.Valid && syncDetails.SyncPageToken.Valid {
		deltaToken = syncDetails.SyncPageToken.String
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
		oneDriveResponse, err := p.getOneDriveDeltaFiles(ctx, accountID, conn, accessToken, refreshToken, deltaToken)
		if err != nil {
			logFields = append(logFields, zap.Error(err))
			config.LOGGER.Error("failed to retrieve files for onedrive", logFields...)
			return err
		}

		if oneDriveResponse.DataDeltaLink != "" {
			deltaLink, err := url.Parse(oneDriveResponse.DataDeltaLink)
			if err != nil {
				logFields = append(logFields, zap.Error(err))
				config.LOGGER.Error("could not parse delta link from onedrive get file request", logFields...)
				logFields = logFields[:len(logFields)-1]
			} else {
				deltaToken = deltaLink.Query().Get("token")
			}
		}

		files, providerFileIDs := p.convertToSyncedItemSlice(oneDriveResponse.Value, accountID, syncDetails.LastSyncedAt.Valid)

		var insertedRows int64

		insertedRows, err = p.bulkInsertSyncedItems(ctx, conn, *queries, providerFileIDs, accountID, files, deltaToken)
		if err != nil {
			logFields = append(logFields, zap.Error(err))
			config.LOGGER.Error("failed to insert synced files", logFields...)
			return err
		}

		logFields = append(logFields, zap.Int64("item_count", insertedRows))
		config.LOGGER.Info("batch inserted", logFields...)
		logFields = logFields[:len(logFields)-1]

		totalItemCount += int(insertedRows)

		if oneDriveResponse.DataNextLink == "" {
			break
		}

	}

	logFields = append(logFields, zap.Int("item_count", totalItemCount))
	config.LOGGER.Info("OneDrive sync successful", logFields...)

	return nil
}

func (p *MicrosoftProvider) getOneDriveDeltaFiles(ctx context.Context, accountID pgtype.UUID, conn *pgxpool.Conn, accessToken, refreshToken, deltaToken string) (*MicrosoftGetDriveItemsResponse, error) {
	logFields := []zap.Field{
		zap.String("account_id", accountID.String()),
		zap.String("provider", MICROSOFT_PROVIDER_NAME),
	}

	oneDriveApiURL := fmt.Sprintf("%s/me/drive/root/delta?$top=1000", MICROSOFT_GRAPH_API_BASE_URL)

	if deltaToken != "" {
		oneDriveApiURL = fmt.Sprintf("%s&token=%s", oneDriveApiURL, deltaToken)
	}

	httpClient := http.Client{}

	req, err := http.NewRequest(http.MethodGet, oneDriveApiURL, nil)
	if err != nil {
		logFields = append(logFields, zap.Error(err))
		config.LOGGER.Error("failed to create new http request to get one drive files", logFields...)
		return nil, err
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))

	res, err := httpClient.Do(req)
	if err != nil {
		logFields = append(logFields, zap.Error(err))
		config.LOGGER.Error("http request to get onedrive files failed", logFields...)
		return nil, err
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		logFields = append(logFields, zap.Error(err))
		config.LOGGER.Error("failed to read http response body for one drive file request", logFields...)
		return nil, err
	}

	if res.StatusCode == http.StatusUnauthorized {
		err = fmt.Errorf("%s", string(body))
		logFields = append(logFields, zap.Error(err))
		config.LOGGER.Error("access token expired or invalid", logFields...)
		return nil, err
	}

	if res.StatusCode != http.StatusOK {
		err = fmt.Errorf("%s", string(body))
		logFields = append(logFields, zap.Error(err))
		config.LOGGER.Error("access token expired or invalid", logFields...)
		return nil, err
	}

	var oneDriveResponse MicrosoftGetDriveItemsResponse

	err = json.Unmarshal(body, &oneDriveResponse)

	return &oneDriveResponse, err
}

func (p *MicrosoftProvider) convertToSyncedItemSlice(items []OneDriveItem, accountID pgtype.UUID, isValidLastSyncedData bool) ([]repository.AddSyncedItemsParams, []string) {
	syncedItems := []repository.AddSyncedItemsParams{}
	providerFileIDs := []string{}

	for _, item := range items {
		ext := filepath.Ext(item.Name)

		mimeType := mime.TypeByExtension(ext)

		contentHash := ""

		if item.File != nil {
			mimeType = item.File.MimeType
			contentHash = item.File.Hashes.Sha256Hash
		}

		syncedItems = append(syncedItems, repository.AddSyncedItemsParams{
			AccountID:      accountID,
			ProviderFileID: item.ID,
			Name:           item.Name,
			Extension:      ext,
			Size:           item.Size,
			Path:           db.PGTextField(item.ParentReference.Path),
			MimeType:       db.PGTextField(mimeType),
			ParentFolder:   db.PGTextField(item.ParentReference.ID),
			IsFolder:       item.Folder != nil,
			ContentHash:    db.PGTextField(contentHash),
			CreatedTime:    db.PGTimestamptzField(item.CreatedDateTime),
			ModifiedTime:   db.PGTimestamptzField(item.LastModifiedDateTime),
			ThumbnailLink:  db.PGTextField(""),
			PreviewLink:    db.PGTextField(""),
			IsTrashed:      db.PGBool(false),
			WebViewLink:    db.PGTextField(""),
			WebContentLink: db.PGTextField(""),
			LinkExpiresAt:  db.PGTimestamptzField(time.Time{}),
		})

		if isValidLastSyncedData {
			providerFileIDs = append(providerFileIDs, item.ID)
		}
	}

	return syncedItems, providerFileIDs
}

func (p *MicrosoftProvider) bulkInsertSyncedItems(ctx context.Context, conn *pgxpool.Conn, queries repository.Queries, providerFileIDs []string, accountID pgtype.UUID, files []repository.AddSyncedItemsParams, cursor string) (int64, error) {
	logFields := []zap.Field{
		zap.String("provider", MICROSOFT_PROVIDER_NAME),
		zap.String("account_id", accountID.String()),
	}

	var insertedRowCount int64

	err := utils.WithTransaction(ctx, conn, func(tx pgx.Tx) error {
		qx := queries.WithTx(tx)
		if len(providerFileIDs) > 0 {
			err := qx.DeleteConflictingItems(ctx, repository.DeleteConflictingItemsParams{
				ProviderFileIds: providerFileIDs,
				AccountID:       accountID,
			})
			if err != nil {
				logFields = append(logFields, zap.Error(err))
				config.LOGGER.Error("an error occured while deleting conflicted files", logFields...)
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
		logFields = append(logFields, zap.Error(err))
		config.LOGGER.Error("failed to bulk insert synced items", logFields...)
		return 0, err
	}

	return insertedRowCount, nil
}

func (p *MicrosoftProvider) RenewOAuthTokens(ctx context.Context, conn *pgxpool.Conn, accountID pgtype.UUID, refreshToken string) (string, int64, error) {
	logFields := []zap.Field{
		zap.String("account_id", accountID.String()),
		zap.String("provider", MICROSOFT_PROVIDER_NAME),
	}

	data := url.Values{}

	data.Add("grant_type", "refresh_token")
	data.Add("refresh_token", refreshToken)
	data.Add("client_id", p.Config.ClientID)
	data.Add("client_secret", p.Config.ClientSecret)

	res, err := http.Post(MICROSOFT_OAUTH_ENDPOINT, "application/x-www-form-urlencoded", bytes.NewBufferString(data.Encode()))
	if err != nil {
		logFields = append(logFields, zap.Error(err))
		config.LOGGER.Error("http request for onedrive token renewal failed", logFields...)
		return "", 0, err
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		logFields = append(logFields, zap.Error(err))
		config.LOGGER.Error("failed to read http response body for onedrive token renewal", logFields...)
		return "", 0, err
	}

	if res.StatusCode != http.StatusOK {
		err = fmt.Errorf("%s", string(body))
		logFields = append(logFields, zap.Error(err))
		config.LOGGER.Error("http request for onedrive token renewal retuned a non-ok response", logFields...)
		return "", 0, err
	}

	var oneDriveResponse MicrosoftAuthResponse

	err = json.Unmarshal(body, &oneDriveResponse)
	if err != nil {
		logFields = append(logFields, zap.Error(err))
		config.LOGGER.Error("failed to unmarshal onedrive token renewal response body", logFields...)
		return "", 0, err
	}

	expiresIn := time.Now().Add(time.Duration(oneDriveResponse.ExpiresIn) * time.Second)

	err = utils.WithTransaction(ctx, conn, func(tx pgx.Tx) error {
		encryptedAccessToken, err := utils.Encrypt(oneDriveResponse.AccessToken)
		if err != nil {
			logFields = append(logFields, zap.Error(err))
			config.LOGGER.Error("failed to encrypte new access token", logFields...)
			return err
		}

		encryptedRefreshToken, err := utils.Encrypt(oneDriveResponse.RefreshToken)
		if err != nil {
			logFields = append(logFields, zap.Error(err))
			config.LOGGER.Error("failed to encrypte refresh token", logFields...)
			return err
		}

		qx := repository.New(conn).WithTx(tx)

		return qx.UpdateAuthTokens(ctx, repository.UpdateAuthTokensParams{
			AccessToken:  encryptedAccessToken,
			RefreshToken: encryptedRefreshToken,
			TokenType:    db.PGTextField(oneDriveResponse.TokenType),
			Expiry:       db.PGTimestamptzField(expiresIn),
			AccountID:    accountID,
		})
	})

	if err != nil {
		logFields = append(logFields, zap.Error(err))
		config.LOGGER.Error("failed to update new oauth tokens", logFields...)
		return "", 0, nil
	}

	return oneDriveResponse.AccessToken, oneDriveResponse.ExpiresIn, nil
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
	return []string{}, nil
}

func (p *MicrosoftProvider) GetStorageQuota(ctx context.Context, userID string, accountID *pgtype.UUID, encryptedAccessToken, encryptedRefreshToken string) (*StorageQuota, error) {
	logFields := []zap.Field{
		zap.String("user_id", userID),
		zap.String("account_id", accountID.String()),
		zap.String("provider", MICROSOFT_PROVIDER_NAME),
	}

	storageQuotaKey := fmt.Sprintf("storage:microsoft:%s:%s", userID, accountID.String())

	redisClient := db.GetRedisClient()

	cachedStorageQuota := redisClient.Get(ctx, storageQuotaKey)

	if cachedStorageQuota.Err() == nil {

		val, err := cachedStorageQuota.Result()
		if err != nil {
			logFields = append(logFields, zap.Error(err))
			config.LOGGER.Error("failed to get the result from redis cache", logFields...)
		} else {

			var storageQuota StorageQuota
			err = json.Unmarshal([]byte(val), &storageQuota)
			if err == nil {
				return &storageQuota, nil
			}
			logFields = append(logFields, zap.Error(err))
			config.LOGGER.Error("failed to unmarshal storage quota", logFields...)
		}
	}

	accessToken, err := utils.Decrypt(encryptedAccessToken)
	if err != nil {
		logFields = append(logFields, zap.Error(err))
		config.LOGGER.Error("failed to decrypt access token", logFields...)
		return nil, err
	}

	url := fmt.Sprintf("%s/me/drive", MICROSOFT_GRAPH_API_BASE_URL)

	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		logFields = append(logFields, zap.Error(err))
		config.LOGGER.Error("failed to create new http request to get storage quota", logFields...)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))

	httpClient := http.Client{}

	res, err := httpClient.Do(req)
	if err != nil {
		logFields = append(logFields, zap.Error(err))
		config.LOGGER.Error("http request for getting onedrive storage quota failed", logFields...)
		return nil, err
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		logFields = append(logFields, zap.Error(err))
		config.LOGGER.Error("failed to read resonse body of onedrive storage request", logFields...)
		return nil, err
	}

	if res.StatusCode != http.StatusOK {
		logFields = append(logFields, zap.Error(fmt.Errorf("%s", string(body))))
		config.LOGGER.Error("http resonse for getting onedrive storage quota returned a non-200 resonse", logFields...)
		return nil, err
	}

	var resonse MicrosoftOneDriveInfoResponse

	err = json.Unmarshal(body, &resonse)
	if err != nil {
		logFields = append(logFields, zap.Error(err))
		config.LOGGER.Error("failed to unmarshal http resonse body for onedrive storage quota request", logFields...)
		return nil, err
	}

	storageQuota := StorageQuota{
		TotalStorage: resonse.Quota.Total,
		UsedStorage:  resonse.Quota.Used,
	}

	storageQuotaCache, err := json.Marshal(storageQuota)
	if err != nil {
		logFields = append(logFields, zap.Error(err))
		config.LOGGER.Error("failed to marshal storage quota for caching", logFields...)
		return nil, err
	}

	storageCache := redisClient.Set(ctx, storageQuotaKey, storageQuotaCache, 15*time.Minute)

	if storageCache.Err() != nil {
		logFields = append(logFields, zap.Error(err))
		config.LOGGER.Error("failed to cache storage quota", logFields...)
	}

	return &storageQuota, nil
}
