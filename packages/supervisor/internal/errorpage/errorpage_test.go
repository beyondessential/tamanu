package errorpage

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/caddyserver/caddy/v2/modules/caddyhttp"
)

func TestErrorPage(t *testing.T) {
	passed := caddyhttp.HandlerFunc(func(w http.ResponseWriter, r *http.Request) error {
		w.WriteHeader(http.StatusTeapot)
		return nil
	})
	tests := []struct {
		name     string
		err      error
		accept   string
		wantCode int
		wantBody string
	}{
		{"bad gateway page", caddyhttp.Error(http.StatusBadGateway, nil), "text/html", http.StatusBadGateway, "Server unavailable"},
		{"service unavailable page", caddyhttp.Error(http.StatusServiceUnavailable, nil), "text/html", http.StatusServiceUnavailable, "Server unavailable"},
		{"gateway timeout page", caddyhttp.Error(http.StatusGatewayTimeout, nil), "text/html", http.StatusGatewayTimeout, "Server unavailable"},
		{"rate limited passes on", caddyhttp.Error(http.StatusTooManyRequests, nil), "text/html", http.StatusTeapot, ""},
		{"not found passes on", caddyhttp.Error(http.StatusNotFound, nil), "text/html", http.StatusTeapot, ""},
		{"no error passes on", nil, "text/html", http.StatusTeapot, ""},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := httptest.NewRequest("GET", "/", nil)
			r.Header.Set("Accept", tt.accept)
			if tt.err != nil {
				r = r.WithContext(context.WithValue(r.Context(), caddyhttp.ErrorCtxKey, tt.err))
			}
			w := httptest.NewRecorder()
			if err := (Handler{}).ServeHTTP(w, r, passed); err != nil {
				t.Fatal(err)
			}
			if w.Code != tt.wantCode || !strings.Contains(w.Body.String(), tt.wantBody) {
				t.Errorf("got %d %q", w.Code, w.Body)
			}
			if w.Header().Get("Retry-After") != "" {
				t.Error("an error page has a Retry-After")
			}
		})
	}
}
