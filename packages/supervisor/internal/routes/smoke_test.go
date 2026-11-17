package routes_test

import (
	"encoding/json"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
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

// frontRoot writes a stand-in for a built front end named name, with its
// index, an asset, a precompressed asset, a manifest and, given errorPage, an
// error page for 502.
func frontRoot(t *testing.T, name string, errorPage bool) string {
	t.Helper()
	root := t.TempDir()
	files := map[string]string{
		"index.html":       "<title>" + name + " index</title>",
		"assets/app.js":    name + " app",
		"assets/app.js.gz": "not really gzip",
		"manifest.json":    `{"name":"` + name + `"}`,
	}
	if errorPage {
		files["resources/errors/502.html"] = "<p>Tamanu is currently unavailable</p>"
	}
	for path, content := range files {
		full := filepath.Join(root, path)
		if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(full, []byte(content), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	return root
}

// load runs raw in Caddy for the rest of the test, with Caddy's storage in an
// empty directory that must stay empty.
func load(t *testing.T, raw []byte) {
	t.Helper()
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
}

type client struct {
	t *testing.T
	c *http.Client
}

func newClient(t *testing.T) client {
	return client{t, &http.Client{
		Timeout:       10 * time.Second,
		CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse },
	}}
}

func (c client) get(base, path string, headers ...string) (*http.Response, string) {
	c.t.Helper()
	req, _ := http.NewRequest("GET", "http://"+base+path, nil)
	for i := 0; i+1 < len(headers); i += 2 {
		req.Header.Set(headers[i], headers[i+1])
	}
	res, err := c.c.Do(req)
	if err != nil {
		c.t.Fatal(err)
	}
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	return res, string(body)
}

// TestSmoke runs the generated configuration in Caddy, in process, against a
// stand-in api and front ends.
func TestSmoke(t *testing.T) {
	api := upstream(t, "api")
	c := config.Config{
		Role:         config.Central,
		Listen:       freeAddr(t),
		PortalListen: freeAddr(t),
		StatusListen: freeAddr(t),
		APIUpstreams: []string{hostPort(api)},
		WebRoot:      frontRoot(t, "web", true),
		PortalRoot:   frontRoot(t, "portal", false),
		IdleTime:     15 * time.Minute,
	}
	raw, err := routes.Build(c)
	if err != nil {
		t.Fatal(err)
	}
	load(t, raw)

	tamanu, err := caddy.ActiveContext().App(app.ID)
	if err != nil {
		t.Fatal(err)
	}
	st := tamanu.(*app.App).State()
	cl := newClient(t)

	t.Run("api", func(t *testing.T) {
		res, body := cl.get(c.Listen, "/api/patient/1")
		if res.StatusCode != 200 || body != "api /api/patient/1" {
			t.Errorf("got %d %q", res.StatusCode, body)
		}
		if cc := res.Header.Get("Cache-Control"); cc != "no-store" {
			t.Errorf("Cache-Control = %q", cc)
		}
	})

	t.Run("index", func(t *testing.T) {
		res, body := cl.get(c.Listen, "/", "Accept", "text/html")
		if res.StatusCode != 200 || body != "<title>web index</title>" || res.Header.Get("Cache-Control") != "no-cache" {
			t.Errorf("got %d %q %q", res.StatusCode, body, res.Header.Get("Cache-Control"))
		}
	})

	t.Run("spa fallback", func(t *testing.T) {
		res, body := cl.get(c.Listen, "/patients/all?page=2", "Accept", "text/html")
		if res.StatusCode != 200 || body != "<title>web index</title>" {
			t.Errorf("got %d %q", res.StatusCode, body)
		}
	})

	t.Run("asset", func(t *testing.T) {
		res, body := cl.get(c.Listen, "/assets/app.js", "Accept-Encoding", "identity")
		if res.StatusCode != 200 || body != "web app" {
			t.Errorf("got %d %q", res.StatusCode, body)
		}
	})

	t.Run("precompressed asset", func(t *testing.T) {
		res, body := cl.get(c.Listen, "/assets/app.js", "Accept-Encoding", "gzip")
		if res.Header.Get("Content-Encoding") != "gzip" || body != "not really gzip" {
			t.Errorf("got %q %q", res.Header.Get("Content-Encoding"), body)
		}
	})

	t.Run("manifest", func(t *testing.T) {
		res, body := cl.get(c.Listen, "/manifest.json")
		if res.StatusCode != 200 || !strings.Contains(body, `"web"`) || res.Header.Get("Cache-Control") != "no-cache" {
			t.Errorf("got %d %q %q", res.StatusCode, body, res.Header.Get("Cache-Control"))
		}
	})

	t.Run("env.js", func(t *testing.T) {
		res, body := cl.get(c.Listen, "/env.js")
		if res.StatusCode != 200 || !strings.Contains(body, "window.env = {") ||
			!strings.HasPrefix(res.Header.Get("Content-Type"), "text/javascript") ||
			res.Header.Get("Cache-Control") != "no-cache" {
			t.Errorf("got %d %q %q", res.StatusCode, body, res.Header)
		}
		if strings.Contains(body, "{env.") {
			t.Errorf("placeholders not replaced in %q", body)
		}
	})

	t.Run("legacy login", func(t *testing.T) {
		res, _ := cl.get(c.Listen, "/v1/login")
		if res.StatusCode != http.StatusPermanentRedirect || res.Header.Get("Location") != "/api/login" {
			t.Errorf("got %d to %q", res.StatusCode, res.Header.Get("Location"))
		}
	})

	t.Run("portal serves its own files", func(t *testing.T) {
		res, body := cl.get(c.PortalListen, "/somewhere", "Accept", "text/html")
		if res.StatusCode != 200 || body != "<title>portal index</title>" {
			t.Errorf("got %d %q", res.StatusCode, body)
		}
	})

	t.Run("portal api goes to the api", func(t *testing.T) {
		res, body := cl.get(c.PortalListen, "/api/portal/me")
		if res.StatusCode != 200 || body != "api /api/portal/me" {
			t.Errorf("got %d %q", res.StatusCode, body)
		}
	})

	t.Run("status", func(t *testing.T) {
		res, body := cl.get(c.StatusListen, "/status")
		var status app.Status
		if err := json.Unmarshal([]byte(body), &status); err != nil || res.StatusCode != 200 {
			t.Fatalf("got %d %q %v", res.StatusCode, body, err)
		}
		if status.State != state.Awake || status.CanSleep || !status.Parts[state.API].Ready {
			t.Errorf("status = %+v", status)
		}
		res, _ = cl.get(c.StatusListen, "/health")
		if res.StatusCode != 200 {
			t.Errorf("health = %d", res.StatusCode)
		}
	})

	t.Run("asleep", func(t *testing.T) {
		st.SetPhase(state.Asleep)
		defer st.SetPhase(state.Awake)
		drain := func() bool {
			select {
			case <-st.WakeRequests():
				return true
			default:
				return false
			}
		}
		drain()

		res, body := cl.get(c.Listen, "/api/public/ping")
		if res.StatusCode != 503 || res.Header.Get("Retry-After") == "" || strings.HasPrefix(body, "api") {
			t.Errorf("ping while asleep = %d %q", res.StatusCode, body)
		}
		if drain() {
			t.Error("a health probe woke the server")
		}

		res, body = cl.get(c.Listen, "/assets/app.js", "Accept-Encoding", "identity")
		if res.StatusCode != 200 || body != "web app" {
			t.Errorf("asset while asleep = %d %q", res.StatusCode, body)
		}
		if !drain() {
			t.Error("an asset request did not wake the server")
		}

		for _, path := range []string{"/", "/patients"} {
			res, body = cl.get(c.Listen, path, "Accept", "text/html")
			if res.StatusCode != 503 || !strings.Contains(body, `http-equiv="refresh"`) {
				t.Errorf("browser opening %s while asleep = %d %q", path, res.StatusCode, body)
			}
			if !drain() {
				t.Errorf("a browser opening %s did not wake the server", path)
			}
		}
	})
}

// spec: SUPV#front-door
func TestSmokeErrorPages(t *testing.T) {
	down := freeAddr(t)
	c := config.Config{
		Role:         config.Facility,
		Listen:       freeAddr(t),
		StatusListen: freeAddr(t),
		APIUpstreams: []string{down},
		WebRoot:      frontRoot(t, "web", true),
		IdleTime:     15 * time.Minute,
	}
	raw, err := routes.Build(c)
	if err != nil {
		t.Fatal(err)
	}
	load(t, raw)
	cl := newClient(t)

	res, body := cl.get(c.Listen, "/api/patient", "Accept", "application/json")
	if res.StatusCode != http.StatusBadGateway || !strings.Contains(body, "ServerUnavailable") {
		t.Errorf("api request with the api down = %d %q", res.StatusCode, body)
	}
	if res.Header.Get("Retry-After") != "" {
		t.Error("an unreachable part answered with Retry-After")
	}

	res, body = cl.get(c.Listen, "/api/patient", "Accept", "text/html")
	if res.StatusCode != http.StatusBadGateway || !strings.Contains(body, "Tamanu is currently unavailable") {
		t.Errorf("browser opening an api path with the api down = %d %q", res.StatusCode, body)
	}
}
