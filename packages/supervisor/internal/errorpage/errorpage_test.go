package errorpage

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/caddyserver/caddy/v2"
	"github.com/caddyserver/caddy/v2/modules/caddyhttp"
)

// serve runs h on a browser's request that met err.
func serve(t *testing.T, h *Handler, err error) *httptest.ResponseRecorder {
	t.Helper()
	passed := caddyhttp.HandlerFunc(func(w http.ResponseWriter, r *http.Request) error {
		w.WriteHeader(http.StatusTeapot)
		return nil
	})
	r := httptest.NewRequest("GET", "/", nil)
	r.Header.Set("Accept", "text/html")
	if err != nil {
		r = r.WithContext(context.WithValue(r.Context(), caddyhttp.ErrorCtxKey, err))
	}
	w := httptest.NewRecorder()
	if err := h.ServeHTTP(w, r, passed); err != nil {
		t.Fatal(err)
	}
	return w
}

func provisioned(t *testing.T, root string) *Handler {
	t.Helper()
	h := &Handler{Root: root}
	if err := h.Provision(caddy.Context{}); err != nil {
		t.Fatal(err)
	}
	return h
}

// spec: SUPV#front-door
func TestErrorPage(t *testing.T) {
	gone := []int{http.StatusBadGateway, http.StatusServiceUnavailable, http.StatusGatewayTimeout}
	tests := []struct {
		name     string
		root     string
		statuses []int
		passes   bool
	}{
		{name: "no part answered", statuses: gone},
		{name: "no page in the root falls back", root: t.TempDir(), statuses: gone},
		{name: "rate limited passes on", statuses: []int{http.StatusTooManyRequests}, passes: true},
		{name: "not found passes on", statuses: []int{http.StatusNotFound}, passes: true},
		{name: "no error passes on", statuses: []int{0}, passes: true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := provisioned(t, tt.root)
			for _, status := range tt.statuses {
				var err error
				if status != 0 {
					err = caddyhttp.Error(status, nil)
				}
				w := serve(t, h, err)
				wantCode, wantBody := status, "Server unavailable"
				if tt.passes {
					wantCode, wantBody = http.StatusTeapot, ""
				}
				if w.Code != wantCode || !strings.Contains(w.Body.String(), wantBody) {
					t.Errorf("%d: got %d %q", status, w.Code, w.Body)
				}
				if w.Header().Get("Retry-After") != "" {
					t.Errorf("%d: an error page has a Retry-After", status)
				}
			}
		})
	}
}
