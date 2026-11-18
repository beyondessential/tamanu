package errorpage

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/caddyserver/caddy/v2/modules/caddyhttp"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/pages"
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

// withPages returns a handler with Tamanu's pages from root.
func withPages(root string) *Handler {
	return &Handler{pages: pages.Load(root)}
}

// spec: SUPV#front-door
func TestErrorPage(t *testing.T) {
	gone := []int{http.StatusBadGateway, http.StatusServiceUnavailable, http.StatusGatewayTimeout}
	tamanu := t.TempDir()
	for _, status := range gone {
		writePage(t, tamanu, fmt.Sprintf("%d.html", status), "<p>Tamanu is currently unavailable</p>")
	}
	tests := []struct {
		name     string
		root     string
		statuses []int
		wantBody string
		passes   bool
	}{
		{name: "Tamanu's page", root: tamanu, statuses: gone, wantBody: "Tamanu is currently unavailable"},
		{name: "no page in the root falls back", root: t.TempDir(), statuses: gone, wantBody: "cannot be reached"},
		{name: "rate limited passes on", statuses: []int{http.StatusTooManyRequests}, passes: true},
		{name: "not found passes on", statuses: []int{http.StatusNotFound}, passes: true},
		{name: "no error passes on", statuses: []int{0}, passes: true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := withPages(tt.root)
			for _, status := range tt.statuses {
				var err error
				if status != 0 {
					err = caddyhttp.Error(status, nil)
				}
				w := serve(t, h, err)
				wantCode, wantBody := status, tt.wantBody
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

// writePage writes a page into root's resources/errors.
func writePage(t *testing.T, root, name, content string) {
	t.Helper()
	dir := filepath.Join(root, "resources", "errors")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, name), []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
}
