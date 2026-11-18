package pages

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// spec: SUPV#front-door
func TestForms(t *testing.T) {
	root := t.TempDir()
	dir := filepath.Join(root, "resources", "errors")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		t.Fatal(err)
	}
	for name, content := range map[string]string{
		"waking.html": "<html><head><title>Tamanu</title></head><body>Tamanu is starting up</body></html>",
		"526.html":    "<html><head></head><body><img src=\"logo.svg\">Maintenance in progress</body></html>",
		"503.html":    "<p>Tamanu is currently unavailable</p>",
	} {
		if err := os.WriteFile(filepath.Join(dir, name), []byte(content), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	tamanu := Load(root)
	unavailable, _ := tamanu.Unavailable(http.StatusServiceUnavailable)
	missing, _ := tamanu.Unavailable(http.StatusBadGateway)

	tests := []struct {
		name       string
		method     string
		path       string
		accept     string
		resp       Response
		wantType   string
		wantInBody string
		wantRetry  string
		wantNoBody bool
	}{
		{"api waking", "POST", "/api/sync", "", tamanu.Waking, "application/json", `"ServerWaking"`, "10", false},
		{"browser waking", "GET", "/patients", "text/html,application/xhtml+xml", tamanu.Waking, "text/html", "<head><base href=\"/resources/errors/\"><title>", "10", false},
		{"other waking", "GET", "/assets/app.js", "*/*", tamanu.Waking, "text/plain", "starting up", "10", false},
		{"post is not a browser page", "POST", "/form", "text/html", tamanu.Waking, "text/plain", "starting up", "10", false},
		{"browser upgrading", "GET", "/", "text/html", tamanu.Upgrading, "text/html", "Maintenance in progress", "30", false},
		{"api upgrading", "GET", "/api/user/me", "", tamanu.Upgrading, "application/json", `"ServerUpgrading"`, "30", false},
		{"browser unavailable", "GET", "/", "text/html", unavailable, "text/html", "currently unavailable", "", false},
		{"browser with no page", "GET", "/", "text/html", missing, "text/plain", "cannot be reached", "", false},
		{"api unavailable", "GET", "/api/x", "", unavailable, "application/json", `"ServerUnavailable"`, "", false},
		{"head", "HEAD", "/", "text/html", tamanu.Waking, "text/html", "", "10", true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := httptest.NewRequest(tt.method, tt.path, nil)
			if tt.accept != "" {
				r.Header.Set("Accept", tt.accept)
			}
			w := httptest.NewRecorder()
			tt.resp.Write(w, r, http.StatusServiceUnavailable)

			if w.Code != http.StatusServiceUnavailable {
				t.Errorf("status = %d", w.Code)
			}
			if got := w.Header().Get("Content-Type"); !strings.HasPrefix(got, tt.wantType) {
				t.Errorf("content type = %q, want %q", got, tt.wantType)
			}
			if got := w.Header().Get("Retry-After"); got != tt.wantRetry {
				t.Errorf("Retry-After = %q, want %q", got, tt.wantRetry)
			}
			if got := w.Header().Get("Cache-Control"); got != "no-store" {
				t.Errorf("Cache-Control = %q", got)
			}
			if tt.wantNoBody && w.Body.Len() != 0 {
				t.Errorf("HEAD has a body")
			}
			if !strings.Contains(w.Body.String(), tt.wantInBody) {
				t.Errorf("body %q does not contain %q", w.Body.String(), tt.wantInBody)
			}
			if tt.wantType == "application/json" && !json.Valid(w.Body.Bytes()) {
				t.Errorf("invalid JSON %q", w.Body.String())
			}
		})
	}
}

func TestIsAPIPath(t *testing.T) {
	for path, want := range map[string]bool{
		"/api": true, "/api/": true, "/api/login": true, "/v1/login": true,
		"/": false, "/apis": false, "/v10/x": false, "/env.js": false,
	} {
		if got := IsAPIPath(path); got != want {
			t.Errorf("IsAPIPath(%q) = %v", path, got)
		}
	}
}
