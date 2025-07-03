package handlers

import (
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/blackmamoth/cloudmesh/pkg/config"
	"github.com/blackmamoth/cloudmesh/pkg/providers"
	"github.com/blackmamoth/cloudmesh/pkg/utils"
	"github.com/go-chi/chi/v5"
	"github.com/gorilla/sessions"
	"go.uber.org/zap"
)

type LinkHandler struct{}

type OAuthState struct {
	UserID string `json:"user_id"`
	Nonce  string `json:"nonce"`
}

var store *sessions.CookieStore

var oauthProviders map[string]providers.Provider

func init() {
	authKey, err := hex.DecodeString(config.CookieStoreConfig.AUTH_KEY)
	if err != nil {
		config.LOGGER.Fatal("Could not set auth key for cookie store", zap.Error(err))
	}

	encKey, err := hex.DecodeString(config.CookieStoreConfig.ENCRYPTION_KEY)
	if err != nil {
		config.LOGGER.Fatal("Could not set encryption key for cookie store", zap.Error(err))
	}

	store = sessions.NewCookieStore(authKey, encKey)

	store.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   int(7 * 24 * time.Hour / time.Second),
		HttpOnly: true,
		Secure:   config.APIConfig.ENVIRONMENT != "development",
		SameSite: http.SameSiteLaxMode,
	}

	oauthProviders = make(map[string]providers.Provider)
	oauthProviders["google"] = providers.NewGoogleProvider()
}

func NewLinkHandler() *LinkHandler {
	return &LinkHandler{}
}

func (h *LinkHandler) RegisterRoutes() *chi.Mux {
	r := chi.NewRouter()

	r.Get("/{provider}", h.linkAccount)
	r.Get("/{provider}/callback", h.linkAccountCallback)

	return r
}

func (h *LinkHandler) linkAccount(w http.ResponseWriter, r *http.Request) {
	providerName := chi.URLParam(r, "provider")

	providerName = strings.ToLower(providerName)

	state := r.URL.Query().Get("state")

	if state == "" {
		utils.SendAPIErrorResponse(w, http.StatusBadRequest, fmt.Errorf("state not passed in URL"))
		return
	}

	decoded, err := base64.URLEncoding.DecodeString(state)
	if err != nil {
		config.LOGGER.Error("could not deocde base64 encoded state", zap.Error(err))
		utils.SendAPIErrorResponse(w, http.StatusBadRequest, err)
		return
	}

	var oauthState OAuthState
	err = json.Unmarshal(decoded, &oauthState)
	if err != nil {
		config.LOGGER.Error("failed to unmarshal into OAuthState", zap.Error(err))
		utils.SendAPIErrorResponse(w, http.StatusBadRequest, fmt.Errorf("state not passed in URL"))
		return
	}

	provider, ok := oauthProviders[providerName]
	if !ok {
		utils.SendAPIErrorResponse(w, http.StatusBadRequest, providers.ErrUnsupportedProvider)
		return
	}

	consentPageURL, err := provider.GetConsentPageURL(w, r, store, oauthState.UserID)
	if err != nil {
		utils.SendAPIErrorResponse(w, http.StatusInternalServerError, fmt.Errorf("an error occured, please try again later"))
		return
	}

	http.Redirect(w, r, consentPageURL, http.StatusFound)
}

func (h *LinkHandler) linkAccountCallback(w http.ResponseWriter, r *http.Request) {
	providerName := chi.URLParam(r, "provider")

	providerName = strings.ToLower(providerName)

	provider, ok := oauthProviders[providerName]
	if !ok {
		utils.SendAPIErrorResponse(w, http.StatusBadRequest, providers.ErrUnsupportedProvider)
		return
	}

	token, userId, err := provider.GetToken(w, r, store)
	if err != nil {
		utils.SendAPIErrorResponse(w, http.StatusInternalServerError, err)
		return
	}

	utils.SendAPIResponse(w, http.StatusOK, map[string]any{
		"token":   token,
		"user_id": userId,
	})
}
