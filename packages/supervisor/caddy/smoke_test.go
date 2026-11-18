// Package caddy_test runs the shipped Caddyfiles in Caddy, in process, against
// stand-in parts, and runs the image's entrypoint script.
package caddy_test

import (
	"encoding/json"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"testing"
	"time"

	"github.com/caddyserver/caddy/v2"
	"github.com/caddyserver/caddy/v2/caddyconfig"
	_ "github.com/caddyserver/caddy/v2/modules/standard"
	_ "github.com/mholt/caddy-ratelimit"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/app"
	_ "github.com/beyondessential/tamanu/packages/supervisor/internal/errorpage"
	_ "github.com/beyondessential/tamanu/packages/supervisor/internal/gate"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/pages"
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
// index, an asset, a precompressed asset, a manifest and, given errorPages,
// Tamanu's error page for 502 and its waking page.
func frontRoot(t *testing.T, name string, errorPages bool) string {
	t.Helper()
	root := t.TempDir()
	files := map[string]string{
		"index.html":       "<title>" + name + " index</title>",
		"assets/app.js":    name + " app",
		"assets/app.js.gz": "not really gzip",
		"manifest.json":    `{"name":"` + name + `"}`,
	}
	if errorPages {
		files["resources/errors/502.html"] = "<p>Tamanu is currently unavailable</p>"
		files["resources/errors/waking.html"] = "<head></head><p>Tamanu is starting up</p>"
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

var variable = regexp.MustCompile(`\{(\$|env\.)([A-Za-z0-9_]+)\}`)

// adapt adapts the shipped Caddyfile the entrypoint chose to Caddy's JSON. Its
// {$NAME} variables are filled from env, as Caddy fills them from the
// environment, and so are the {env.NAME} placeholders that env names, which
// Caddy fills from the environment as the configuration runs.
func adapt(t *testing.T, caddyfile string, env map[string]string) []byte {
	t.Helper()
	dir := t.TempDir()
	files, err := filepath.Glob("*.caddyfile")
	if err != nil || len(files) == 0 {
		t.Fatalf("no Caddyfiles: %v", err)
	}
	for _, file := range files {
		text, err := os.ReadFile(file)
		if err != nil {
			t.Fatal(err)
		}
		filled := variable.ReplaceAllStringFunc(string(text), func(v string) string {
			m := variable.FindStringSubmatch(v)
			if value, ok := env[m[2]]; ok || m[1] == "$" {
				return value
			}
			return v
		})
		if err := os.WriteFile(filepath.Join(dir, file), []byte(filled), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	path := filepath.Join(dir, filepath.Base(caddyfile))
	text, _ := os.ReadFile(path)
	raw, _, err := caddyconfig.GetAdapter("caddyfile").Adapt(text, map[string]any{"filename": path})
	if err != nil {
		t.Fatal(err)
	}
	return raw
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

// TestSmoke runs the central server's Caddyfile with a patient portal.
func TestSmoke(t *testing.T) {
	api := upstream(t, "api")
	env, caddyfile := supervisorEnv(t, map[string]string{
		"TAMANU_SUPERVISOR_ROLE":            "central",
		"TAMANU_SUPERVISOR_TRUSTED_PROXIES": "10.0.0.0/8",
		"TAMANU_SUPERVISOR_LISTEN":          freeAddr(t),
		"TAMANU_SUPERVISOR_PORTAL_LISTEN":   freeAddr(t),
		"TAMANU_SUPERVISOR_STATUS_LISTEN":   freeAddr(t),
		"TAMANU_SUPERVISOR_API_UPSTREAMS":   hostPort(api),
		"TAMANU_SUPERVISOR_WEB_ROOT":        frontRoot(t, "web", true),
		"TAMANU_SUPERVISOR_PORTAL_ROOT":     frontRoot(t, "portal", false),
	})
	listen, portal, status := env["TAMANU_SUPERVISOR_LISTEN"], env["TAMANU_SUPERVISOR_PORTAL_LISTEN"], env["TAMANU_SUPERVISOR_STATUS_LISTEN"]
	raw := adapt(t, caddyfile, env)
	if !strings.Contains(string(raw), `"api_token":"{env.TAMANU_SUPERVISOR_API_TOKEN}"`) {
		t.Error("the configuration does not read the api token from the environment as it runs")
	}
	load(t, raw)

	tamanu, err := caddy.ActiveContext().App(app.ID)
	if err != nil {
		t.Fatal(err)
	}
	st := tamanu.(*app.App).State()
	cl := newClient(t)

	t.Run("api", func(t *testing.T) {
		res, body := cl.get(listen, "/api/patient/1")
		if res.StatusCode != 200 || body != "api /api/patient/1" {
			t.Errorf("got %d %q", res.StatusCode, body)
		}
		if cc := res.Header.Get("Cache-Control"); cc != "no-store" {
			t.Errorf("Cache-Control = %q", cc)
		}
	})

	t.Run("index", func(t *testing.T) {
		res, body := cl.get(listen, "/", "Accept", "text/html")
		if res.StatusCode != 200 || body != "<title>web index</title>" || res.Header.Get("Cache-Control") != "no-cache" {
			t.Errorf("got %d %q %q", res.StatusCode, body, res.Header.Get("Cache-Control"))
		}
	})

	t.Run("spa fallback", func(t *testing.T) {
		res, body := cl.get(listen, "/patients/all?page=2", "Accept", "text/html")
		if res.StatusCode != 200 || body != "<title>web index</title>" {
			t.Errorf("got %d %q", res.StatusCode, body)
		}
	})

	t.Run("asset", func(t *testing.T) {
		res, body := cl.get(listen, "/assets/app.js", "Accept-Encoding", "identity")
		if res.StatusCode != 200 || body != "web app" {
			t.Errorf("got %d %q", res.StatusCode, body)
		}
	})

	t.Run("precompressed asset", func(t *testing.T) {
		res, body := cl.get(listen, "/assets/app.js", "Accept-Encoding", "gzip")
		if res.Header.Get("Content-Encoding") != "gzip" || body != "not really gzip" {
			t.Errorf("got %q %q", res.Header.Get("Content-Encoding"), body)
		}
	})

	t.Run("manifest", func(t *testing.T) {
		res, body := cl.get(listen, "/manifest.json")
		if res.StatusCode != 200 || !strings.Contains(body, `"web"`) || res.Header.Get("Cache-Control") != "no-cache" {
			t.Errorf("got %d %q %q", res.StatusCode, body, res.Header.Get("Cache-Control"))
		}
	})

	t.Run("env.js", func(t *testing.T) {
		res, body := cl.get(listen, "/env.js")
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
		res, _ := cl.get(listen, "/v1/login")
		if res.StatusCode != http.StatusPermanentRedirect || res.Header.Get("Location") != "/api/login" {
			t.Errorf("got %d to %q", res.StatusCode, res.Header.Get("Location"))
		}
	})

	t.Run("portal serves its own files", func(t *testing.T) {
		res, body := cl.get(portal, "/somewhere", "Accept", "text/html")
		if res.StatusCode != 200 || body != "<title>portal index</title>" {
			t.Errorf("got %d %q", res.StatusCode, body)
		}
	})

	t.Run("portal api goes to the api", func(t *testing.T) {
		res, body := cl.get(portal, "/api/portal/me")
		if res.StatusCode != 200 || body != "api /api/portal/me" {
			t.Errorf("got %d %q", res.StatusCode, body)
		}
	})

	t.Run("status", func(t *testing.T) {
		res, body := cl.get(status, "/status")
		var s app.Status
		if err := json.Unmarshal([]byte(body), &s); err != nil || res.StatusCode != 200 {
			t.Fatalf("got %d %q %v", res.StatusCode, body, err)
		}
		if s.State != state.Awake || s.CanSleep || !s.Parts[state.API].Ready || s.IdleTime != "15m0s" {
			t.Errorf("status = %+v", s)
		}
		res, _ = cl.get(status, "/health")
		if res.StatusCode != 200 {
			t.Errorf("health = %d", res.StatusCode)
		}
	})

	// spec: SLPWK#activity
	// spec: SLPWK#waking
	t.Run("asleep", func(t *testing.T) {
		st.SetPhase(state.Asleep)
		defer st.SetPhase(state.Awake)
		woken := func() bool {
			select {
			case <-st.WakeRequests():
				return true
			default:
				return false
			}
		}
		browser := []string{"Accept", "text/html"}
		for _, tc := range []struct {
			name    string
			path    string
			headers []string
			status  int
			body    string
			wakes   bool
		}{
			{"time sync", "/api/timesync", nil, 503, "ServerWaking", false},
			{"health probe", "/api/public/ping", nil, 503, "ServerWaking", false},
			{"websocket", "/api/socket.io/?EIO=4&transport=websocket", []string{"Connection", "Upgrade", "Upgrade", "websocket"}, 503, "ServerUnavailable", false},
			{"api", "/api/patient", nil, 503, "ServerWaking", true},
			{"legacy login", "/v1/login", nil, 308, "", false},
			{"index from a probe", "/", nil, 200, "web index", false},
			{"index from a browser", "/", browser, 503, "Tamanu is starting up", true},
			{"page from a browser", "/patients", browser, 503, "Tamanu is starting up", true},
			{"page from anything else", "/patients", nil, 200, "web index", true},
			{"asset", "/assets/app.js", []string{"Accept-Encoding", "identity"}, 200, "web app", true},
			{"env.js", "/env.js", nil, 200, "window.env", true},
		} {
			t.Run(tc.name, func(t *testing.T) {
				woken()
				before := st.Snapshot().LastActivity
				res, body := cl.get(listen, tc.path, tc.headers...)
				if res.StatusCode != tc.status || !strings.Contains(body, tc.body) {
					t.Errorf("got %d %q", res.StatusCode, body)
				}
				// The waking response alone says when to try again.
				waking := tc.status == http.StatusServiceUnavailable && tc.body != "ServerUnavailable"
				if res.Header.Get("Retry-After") != "" != waking {
					t.Errorf("Retry-After = %q", res.Header.Get("Retry-After"))
				}
				if woken() != tc.wakes {
					t.Errorf("woke the server: %v, want %v", !tc.wakes, tc.wakes)
				}
				if active := st.Snapshot().LastActivity != before; active != tc.wakes {
					t.Errorf("counted as activity: %v, want %v", active, tc.wakes)
				}
			})
		}
	})
}

// spec: SUPV#front-door
func TestSmokeErrorPages(t *testing.T) {
	// Nothing listens on port 1, unlike a freed port another test may take.
	env, caddyfile := supervisorEnv(t, map[string]string{
		"TAMANU_SUPERVISOR_ROLE":            "facility",
		"TAMANU_SUPERVISOR_TRUSTED_PROXIES": "10.0.0.0/8",
		"TAMANU_SUPERVISOR_LISTEN":          freeAddr(t),
		"TAMANU_SUPERVISOR_STATUS_LISTEN":   freeAddr(t),
		"TAMANU_SUPERVISOR_API_UPSTREAMS":   "127.0.0.1:1",
		"TAMANU_SUPERVISOR_WEB_ROOT":        frontRoot(t, "web", true),
	})
	listen := env["TAMANU_SUPERVISOR_LISTEN"]
	load(t, adapt(t, caddyfile, env))
	cl := newClient(t)

	res, body := cl.get(listen, "/api/patient", "Accept", "application/json")
	if res.StatusCode != http.StatusBadGateway || !strings.Contains(body, "ServerUnavailable") {
		t.Errorf("api request with the api down = %d %q", res.StatusCode, body)
	}
	if res.Header.Get("Retry-After") != "" {
		t.Error("an unreachable part answered with Retry-After")
	}

	res, body = cl.get(listen, "/api/patient", "Accept", "text/html")
	if res.StatusCode != http.StatusBadGateway || !strings.Contains(body, "Tamanu is currently unavailable") {
		t.Errorf("browser opening an api path with the api down = %d %q", res.StatusCode, body)
	}
}

// TestAPIPathsMatchThePages checks the Caddyfile's api routes against the
// paths the pages answer as an api's, which only comments otherwise keep in
// step.
func TestAPIPathsMatchThePages(t *testing.T) {
	raw, err := os.ReadFile("supervisor.caddyfile")
	if err != nil {
		t.Fatal(err)
	}
	m := regexp.MustCompile(`(?m)^\s*@api path (.+)$`).FindSubmatch(raw)
	if m == nil {
		t.Fatal("no @api matcher in supervisor.caddyfile")
	}
	routed := map[string]bool{}
	for _, pattern := range strings.Fields(string(m[1])) {
		path := strings.Replace(pattern, "*", "patient", 1)
		routed[path] = true
		if !pages.IsAPIPath(path) {
			t.Errorf("%s is routed to the api but its pages are not an api's", path)
		}
	}
	for _, path := range []string{"/api", "/api/patient", "/v1", "/v1/patient"} {
		if !routed[path] {
			t.Errorf("%s is an api's to the pages but is not routed to the api", path)
		}
	}
	for _, path := range []string{"/", "/apis", "/v1x", "/patients"} {
		if pages.IsAPIPath(path) {
			t.Errorf("%s is not routed to the api but its pages are an api's", path)
		}
	}
}

// TestFrontendCaddyfilesAdapt adapts each frontend image's own Caddyfile laid
// out as the image lays it out, with the supervisor's Caddyfiles, whose env.js
// snippet it imports, beside it in supervisor/.
func TestFrontendCaddyfilesAdapt(t *testing.T) {
	for _, app := range []string{"web", "patient-portal"} {
		t.Run(app, func(t *testing.T) {
			dir := t.TempDir()
			if err := os.Mkdir(filepath.Join(dir, "supervisor"), 0o755); err != nil {
				t.Fatal(err)
			}
			snippets, _ := filepath.Glob("*.caddyfile")
			for _, file := range append(snippets, filepath.Join("..", "..", app, "Caddyfile.docker")) {
				text, err := os.ReadFile(file)
				if err != nil {
					t.Fatal(err)
				}
				target := filepath.Join(dir, "supervisor", file)
				if filepath.Base(file) == "Caddyfile.docker" {
					target = filepath.Join(dir, "Caddyfile")
				}
				if err := os.WriteFile(target, text, 0o644); err != nil {
					t.Fatal(err)
				}
			}
			path := filepath.Join(dir, "Caddyfile")
			text, _ := os.ReadFile(path)
			raw, _, err := caddyconfig.GetAdapter("caddyfile").Adapt(text, map[string]any{"filename": path})
			if err != nil {
				t.Fatal(err)
			}
			if !strings.Contains(string(raw), "window.env") {
				t.Error("the configuration does not serve env.js")
			}
		})
	}
}
