package errorpage

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/caddyserver/caddy/v2"
	"github.com/caddyserver/caddy/v2/modules/caddyhttp"
)

// serve runs h on a request to path that met err.
func serve(t *testing.T, h *Handler, path, accept string, err error) *httptest.ResponseRecorder {
	t.Helper()
	passed := caddyhttp.HandlerFunc(func(w http.ResponseWriter, r *http.Request) error {
		w.WriteHeader(http.StatusTeapot)
		return nil
	})
	r := httptest.NewRequest("GET", path, nil)
	r.Header.Set("Accept", accept)
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

func TestErrorPage(t *testing.T) {
	tests := []struct {
		name     string
		err      error
		wantCode int
		wantBody string
	}{
		{"bad gateway page", caddyhttp.Error(http.StatusBadGateway, nil), http.StatusBadGateway, "Server unavailable"},
		{"service unavailable page", caddyhttp.Error(http.StatusServiceUnavailable, nil), http.StatusServiceUnavailable, "Server unavailable"},
		{"gateway timeout page", caddyhttp.Error(http.StatusGatewayTimeout, nil), http.StatusGatewayTimeout, "Server unavailable"},
		{"rate limited passes on", caddyhttp.Error(http.StatusTooManyRequests, nil), http.StatusTeapot, ""},
		{"not found passes on", caddyhttp.Error(http.StatusNotFound, nil), http.StatusTeapot, ""},
		{"no error passes on", nil, http.StatusTeapot, ""},
	}
	h := provisioned(t, "")
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := serve(t, h, "/", "text/html", tt.err)
			if w.Code != tt.wantCode || !strings.Contains(w.Body.String(), tt.wantBody) {
				t.Errorf("got %d %q", w.Code, w.Body)
			}
			if w.Header().Get("Retry-After") != "" {
				t.Error("an error page has a Retry-After")
			}
		})
	}
}

// spec: SUPV#front-door
func TestTamanuPagesFromTheRoot(t *testing.T) {
	root := t.TempDir()
	errorsDir := filepath.Join(root, "resources", "errors")
	if err := os.MkdirAll(errorsDir, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(errorsDir, "502.html"), []byte("<p>Tamanu is currently unavailable</p>"), 0o644); err != nil {
		t.Fatal(err)
	}
	h := provisioned(t, root)

	w := serve(t, h, "/", "text/html", caddyhttp.Error(http.StatusBadGateway, nil))
	if w.Code != http.StatusBadGateway || !strings.Contains(w.Body.String(), "Tamanu is currently unavailable") {
		t.Errorf("502 = %d %q", w.Code, w.Body)
	}

	w = serve(t, h, "/", "text/html", caddyhttp.Error(http.StatusGatewayTimeout, nil))
	if !strings.Contains(w.Body.String(), "Server unavailable") {
		t.Errorf("504 without a page in the root = %q", w.Body)
	}

	w = serve(t, h, "/api/patient", "application/json", caddyhttp.Error(http.StatusBadGateway, nil))
	if !strings.Contains(w.Body.String(), `"ServerUnavailable"`) {
		t.Errorf("api 502 = %q", w.Body)
	}
}
