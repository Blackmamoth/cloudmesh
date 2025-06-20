package utils

import (
	"encoding/json"
	"fmt"
	"net/http"
)

func SendAPIResponse(w http.ResponseWriter, status int, data any, cookies ...*http.Cookie) error {
	if len(cookies) > 0 {
		for _, cookie := range cookies {
			http.SetCookie(w, cookie)
		}
	}

	w.WriteHeader(status)
	w.Header().Add("Content-Type", "application/json")
	return json.NewEncoder(w).Encode(generateAPIResponseBody(status, data))
}

func SendAPIErrorResponse(w http.ResponseWriter, status int, err any) {
	if e, ok := err.(error); ok {
		SendAPIResponse(w, status, map[string]any{"message": e.Error()})
	} else {
		SendAPIResponse(w, status, map[string]any{"message": err})
	}
}

func generateAPIResponseBody(status int, data any) map[string]any {
	if status >= 400 {
		return map[string]any{"status": status, "error": data}
	}
	return map[string]any{"status": status, "data": data}
}

func ParseJSON(r *http.Request, v any) error {
	if r.Body == nil {
		return fmt.Errorf("request body should not be empty")
	}
	return json.NewDecoder(r.Body).Decode(v)
}
