package utils

import (
	"encoding/json"
	"net/http"

	"github.com/blackmamoth/cloudmesh/pkg/config"
	"go.uber.org/zap"
)

func SendAPIResponse(w http.ResponseWriter, status int, data any, cookies ...*http.Cookie) {
	if len(cookies) > 0 {
		for _, cookie := range cookies {
			http.SetCookie(w, cookie)
		}
	}

	w.WriteHeader(status)
	w.Header().Add("Content-Type", "application/json")

	if resErr := json.NewEncoder(w).Encode(generateAPIResponseBody(status, data)); resErr != nil {
		config.LOGGER.Error("failed to send api response", zap.Error(resErr))
	}
}

func SendAPIErrorResponse(w http.ResponseWriter, status int, err any) {
	message := map[string]any{"message": err}
	if e, ok := err.(error); ok {
		message["message"] = e.Error()
	}

	SendAPIResponse(w, status, message)
}

func generateAPIResponseBody(status int, data any) map[string]any {
	if status >= 400 {
		return map[string]any{"status": status, "error": data}
	}

	return map[string]any{"status": status, "data": data}
}

func ParseJSON(r *http.Request, v any) error {
	if r.Body == nil {
		return ErrNoEmptyReqBody
	}

	return json.NewDecoder(r.Body).Decode(v)
}
