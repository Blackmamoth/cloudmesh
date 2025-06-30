package handlers

import (
	"encoding/hex"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/blackmamoth/cloudmesh/pkg/config"
	"github.com/blackmamoth/cloudmesh/pkg/providers"
	"github.com/blackmamoth/cloudmesh/pkg/utils"
	"github.com/go-chi/chi/v5"
	"github.com/gorilla/sessions"
	"go.uber.org/zap"
	"golang.org/x/oauth2"
)

type LinkHandler struct {
	GoogleProvider providers.GoogleProvider
}

var store *sessions.CookieStore

var (
	ErrUnsupportedProvider = errors.New("invalid or unsupported provider")
	ErrNoCode              = errors.New("authorization code not found in redirect url")
)

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
}

func NewLinkHandler(googleProvider *providers.GoogleProvider) *LinkHandler {
	return &LinkHandler{
		GoogleProvider: *googleProvider,
	}
}

func (h *LinkHandler) RegisterRoutes() *chi.Mux {
	r := chi.NewRouter()

	r.Get("/{provider}", h.linkAccount)
	r.Get("/{provider}/callback", h.linkAccountCallback)

	return r
}

func (h *LinkHandler) linkAccount(w http.ResponseWriter, r *http.Request) {
	provider := chi.URLParam(r, "provider")

	provider = strings.ToLower(provider)

	var consentPageURL string

	switch provider {
	case "google":
		url, err := h.GoogleProvider.GetConsentPageURL(w, r, store, "google-oauth-session")
		if err != nil {
			utils.SendAPIErrorResponse(w, http.StatusInternalServerError, err)
			return
		}
		consentPageURL = url
	default:
		utils.SendAPIErrorResponse(w, http.StatusUnprocessableEntity, ErrUnsupportedProvider)
		return
	}

	http.Redirect(w, r, consentPageURL, http.StatusFound)
}

func (h *LinkHandler) linkAccountCallback(w http.ResponseWriter, r *http.Request) {
	provider := chi.URLParam(r, "provider")

	provider = strings.ToLower(provider)

	var token *oauth2.Token

	switch provider {
	case "google":
		tok, err := h.GoogleProvider.GetToken(w, r, store, "google-oauth-session")
		if err != nil {
			utils.SendAPIErrorResponse(w, http.StatusInternalServerError, err)
		}
		token = tok
	default:
		utils.SendAPIErrorResponse(w, http.StatusUnprocessableEntity, ErrUnsupportedProvider)
		return
	}

	utils.SendAPIResponse(w, http.StatusOK, token)
}
