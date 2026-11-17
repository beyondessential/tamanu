package routes_test

import (
	"encoding/json"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/caddyserver/caddy/v2"
	_ "github.com/caddyserver/caddy/v2/modules/standard"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/app"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/config"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/routes"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/state"
)

// freeAddr finds a loopback address nothing is listening on.
func freeAddr(t *testing.T) string {
	t.Helper()
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer ln.Close()
	return ln.Addr().String()
}

// upstream is a part that names itself in every response, and says what
// Cache-Control it would have sent.
func upstream(t *testing.T, name string) *httptest.Server {
	t.Helper()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "public, max-age=3600")
		w.Header().Set("X-Part", name)
		_, _ = io.WriteString(w, name+" "+r.URL.Path)
	}))
	t.Cleanup(srv.Close)
	return srv
}

func hostPort(srv *httptest.Server) string { return strings.TrimPrefix(srv.URL, "http://") }

// TestSmoke runs the generated configuration in Caddy, in process, against
// stand-in parts.
func TestSmoke(t *testing.T) {
	api := upstream(t, "api")
	web := upstream(t, "web")
	// The portal is down, so its pages show the unavailable page.
	down := freeAddr(t)

	c := config.Config{
		Role:            config.Central,
		Listen:          freeAddr(t),
		PortalListen:    freeAddr(t),
		StatusListen:    freeAddr(t),
		APIUpstreams:    []string{hostPort(api)},
		WebUpstreams:    []string{hostPort(web)},
		PortalUpstreams: []string{down},
		IdleTime:        15 * time.Minute,
	}
	raw, err := routes.Build(c)
	if err != nil {
		t.Fatal(err)
	}
	// Point Caddy's storage at an empty directory, which must stay empty:
	// the supervisor writes nothing to Caddy's storage.
	storage := t.TempDir()
	var withStorage map[string]any
	_ = json.Unmarshal(raw, &withStorage)
	withStorage["storage"] = map[string]any{"module": "file_system", "root": storage}
	raw, _ = json.Marshal(withStorage)
	t.Cleanup(func() {
		if entries, _ := os.ReadDir(storage); len(entries) > 0 {
			t.Errorf("Caddy wrote to its storage: %v", entries)
		}
	})
	if err := caddy.Load(raw, true); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = caddy.Stop() })

	tamanu, err := caddy.ActiveContext().App(app.ID)
	if err != nil {
		t.Fatal(err)
	}
	st := tamanu.(*app.App).State()

	client := &http.Client{
		Timeout:       10 * time.Second,
		CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse },
	}
	get := func(t *testing.T, base, path, accept string) (*http.Response, string) {
		t.Helper()
		req, _ := http.NewRequest("GET", "http://"+base+path, nil)
		if accept != "" {
			req.Header.Set("Accept", accept)
		}
		res, err := client.Do(req)
		if err != nil {
			t.Fatal(err)
		}
		defer res.Body.Close()
		body, _ := io.ReadAll(res.Body)
		return res, string(body)
	}

	t.Run("api", func(t *testing.T) {
		res, body := get(t, c.Listen, "/api/patient/1", "")
		if res.StatusCode != 200 || body != "api /api/patient/1" {
			t.Errorf("got %d %q", res.StatusCode, body)
		}
		if cc := res.Header.Get("Cache-Control"); cc != "no-store" {
			t.Errorf("Cache-Control = %q", cc)
		}
	})

	t.Run("web document", func(t *testing.T) {
		res, body := get(t, c.Listen, "/", "text/html")
		if res.StatusCode != 200 || body != "web /" || res.Header.Get("Cache-Control") != "no-cache" {
			t.Errorf("got %d %q %q", res.StatusCode, body, res.Header.Get("Cache-Control"))
		}
	})

	t.Run("web asset", func(t *testing.T) {
		res, body := get(t, c.Listen, "/assets/app.js", "")
		if res.StatusCode != 200 || body != "web /assets/app.js" || res.Header.Get("Cache-Control") != "public, max-age=3600" {
			t.Errorf("got %d %q %q", res.StatusCode, body, res.Header.Get("Cache-Control"))
		}
	})

	t.Run("legacy login", func(t *testing.T) {
		res, _ := get(t, c.Listen, "/v1/login", "")
		if res.StatusCode != http.StatusPermanentRedirect || res.Header.Get("Location") != "/api/login" {
			t.Errorf("got %d to %q", res.StatusCode, res.Header.Get("Location"))
		}
	})

	t.Run("portal api goes to the api", func(t *testing.T) {
		res, body := get(t, c.PortalListen, "/api/portal/me", "")
		if res.StatusCode != 200 || body != "api /api/portal/me" {
			t.Errorf("got %d %q", res.StatusCode, body)
		}
	})

	t.Run("portal down gives the unavailable page", func(t *testing.T) {
		res, body := get(t, c.PortalListen, "/", "text/html")
		if res.StatusCode != http.StatusBadGateway || !strings.Contains(body, "Server unavailable") {
			t.Errorf("got %d %q", res.StatusCode, body)
		}
		if res.Header.Get("Retry-After") != "" {
			t.Error("an unreachable part answered with Retry-After")
		}
	})

	t.Run("status", func(t *testing.T) {
		res, body := get(t, c.StatusListen, "/status", "")
		var status app.Status
		if err := json.Unmarshal([]byte(body), &status); err != nil || res.StatusCode != 200 {
			t.Fatalf("got %d %q %v", res.StatusCode, body, err)
		}
		if status.State != state.Awake || status.CanSleep || !status.Parts[state.API].Ready {
			t.Errorf("status = %+v", status)
		}
		res, _ = get(t, c.StatusListen, "/health", "")
		if res.StatusCode != 200 {
			t.Errorf("health = %d", res.StatusCode)
		}
	})

	t.Run("asleep", func(t *testing.T) {
		st.SetPhase(state.Asleep)
		defer st.SetPhase(state.Awake)
		select {
		case <-st.WakeRequests():
		default:
		}

		res, body := get(t, c.Listen, "/api/public/ping", "")
		if res.StatusCode != 503 || res.Header.Get("Retry-After") == "" || strings.HasPrefix(body, "api") {
			t.Errorf("ping while asleep = %d %q", res.StatusCode, body)
		}
		select {
		case <-st.WakeRequests():
			t.Error("a health probe woke the server")
		default:
		}

		res, body = get(t, c.Listen, "/patients", "text/html")
		if res.StatusCode != 503 || !strings.Contains(body, `http-equiv="refresh"`) {
			t.Errorf("browser while asleep = %d %q", res.StatusCode, body)
		}
		select {
		case <-st.WakeRequests():
		default:
			t.Error("a browser request did not wake the server")
		}
	})
}
