package pages

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestForms(t *testing.T) {
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
		{"api waking", "POST", "/api/sync", "", Waking, "application/json", `"ServerWaking"`, "10", false},
		{"legacy api waking", "GET", "/v1/patient", "application/json", Waking, "application/json", `"status":503`, "10", false},
		{"browser opening an api path", "GET", "/api/patient", "text/html", Waking, "text/html", `http-equiv="refresh"`, "10", false},
		{"browser waking", "GET", "/patients", "text/html,application/xhtml+xml", Waking, "text/html", `http-equiv="refresh"`, "10", false},
		{"other waking", "GET", "/assets/app.js", "*/*", Waking, "text/plain", "starting up", "10", false},
		{"post is not a browser page", "POST", "/form", "text/html", Waking, "text/plain", "starting up", "10", false},
		{"browser upgrading", "GET", "/", "text/html", Upgrading, "text/html", "being upgraded", "30", false},
		{"api upgrading", "GET", "/api/user/me", "", Upgrading, "application/json", `"ServerUpgrading"`, "30", false},
		{"browser unavailable", "GET", "/", "text/html", Unavailable, "text/html", "cannot be reached", "", false},
		{"api unavailable", "GET", "/api/x", "", Unavailable, "application/json", `"ServerUnavailable"`, "", false},
		{"head", "HEAD", "/", "text/html", Waking, "text/html", "", "10", true},
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

func TestPageCopy(t *testing.T) {
	for _, resp := range []Response{Waking, Upgrading, Unavailable} {
		page := string(resp.page)
		if strings.ContainsRune(page, '—') || strings.ContainsRune(resp.Message, '—') {
			t.Errorf("%s copy has an em-dash", resp.Name)
		}
		if strings.Contains(strings.ToLower(page), "tamanu") {
			t.Errorf("%s page names Tamanu", resp.Name)
		}
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
