package routes

import (
	"encoding/json"
	"maps"
	"net/url"
	"slices"
	"strings"
	"testing"
	"time"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/config"
)

// generated is the part of the generated configuration the tests read.
type generated struct {
	Admin struct {
		Disabled bool `json:"disabled"`
		Config   struct {
			Persist *bool `json:"persist"`
		} `json:"config"`
	} `json:"admin"`
	Apps struct {
		HTTP struct {
			Servers map[string]server `json:"servers"`
		} `json:"http"`
		TLS    map[string]any `json:"tls"`
		Tamanu map[string]any `json:"tamanu"`
	} `json:"apps"`
}

type server struct {
	Listen         []string                  `json:"listen"`
	Protocols      []string                  `json:"protocols"`
	AutoHTTPS      struct{ Disable bool }    `json:"automatic_https"`
	Routes         []route                   `json:"routes"`
	Errors         *struct{ Routes []route } `json:"errors"`
	TrustedProxies map[string]any            `json:"trusted_proxies"`
}

type route struct {
	Match    []map[string]json.RawMessage `json:"match"`
	Handle   []map[string]any             `json:"handle"`
	Terminal bool                         `json:"terminal"`
}

func (r route) paths() []string {
	if len(r.Match) == 0 {
		return nil
	}
	var paths []string
	_ = json.Unmarshal(r.Match[0]["path"], &paths)
	return paths
}

func (r route) handlers() []string {
	var names []string
	for _, h := range r.Handle {
		names = append(names, h["handler"].(string))
	}
	return names
}

func (r route) gate() (class, part string) {
	h := r.Handle[0]
	if h["handler"] != "tamanu_gate" {
		return "", ""
	}
	return h["class"].(string), h["part"].(string)
}

func (r route) upstreams() []string {
	var dials []string
	for _, h := range r.Handle {
		if h["handler"] != "reverse_proxy" {
			continue
		}
		for _, u := range h["upstreams"].([]any) {
			dials = append(dials, u.(map[string]any)["dial"].(string))
		}
	}
	return dials
}

func build(t *testing.T, c config.Config) generated {
	t.Helper()
	raw, err := Build(c)
	if err != nil {
		t.Fatal(err)
	}
	var g generated
	if err := json.Unmarshal(raw, &g); err != nil {
		t.Fatal(err)
	}
	return g
}

func facility() config.Config {
	return config.Config{
		Role:         config.Facility,
		Listen:       ":8080",
		StatusListen: "127.0.0.1:8081",
		APIUpstreams: []string{"api-1:4000", "api-2:4000"},
		WebUpstreams: []string{"web:80"},
		IdleTime:     30 * time.Minute,
	}
}

func central(withPortal bool) config.Config {
	c := facility()
	c.Role = config.Central
	c.IdleTime = 15 * time.Minute
	if withPortal {
		c.PortalListen = ":8082"
		c.PortalUpstreams = []string{"portal:80"}
	}
	return c
}

// wantRoute is what one route in a front server should be.
type wantRoute struct {
	paths     []string
	class     string
	part      string
	handlers  []string
	upstreams []string
}

func wantFrontRoutes(front string, frontUpstreams []string) []wantRoute {
	api := []string{"api-1:4000", "api-2:4000"}
	return []wantRoute{
		{[]string{"/v1/login"}, "", "", []string{"static_response"}, nil},
		{[]string{"/api/socket.io/*"}, "websocket", "api", []string{"tamanu_gate", "rate_limit", "reverse_proxy"}, api},
		{[]string{"/api/public/ping", "/api/timesync"}, "exempt", "api", []string{"tamanu_gate", "rate_limit", "headers", "reverse_proxy"}, api},
		{[]string{"/api/*", "/v1/*"}, "activity", "api", []string{"tamanu_gate", "rate_limit", "headers", "encode", "reverse_proxy"}, api},
		{[]string{"/", "/manifest.json", "/env.js"}, "activity", front, []string{"tamanu_gate", "headers", "encode", "reverse_proxy"}, frontUpstreams},
		{nil, "activity", front, []string{"tamanu_gate", "encode", "reverse_proxy"}, frontUpstreams},
	}
}

func checkFrontServer(t *testing.T, name string, srv server, listen string, want []wantRoute) {
	t.Helper()
	if !slices.Equal(srv.Listen, []string{listen}) {
		t.Errorf("%s listens on %q", name, srv.Listen)
	}
	if !slices.Equal(srv.Protocols, []string{"h1", "h2c"}) {
		t.Errorf("%s protocols = %q", name, srv.Protocols)
	}
	if !srv.AutoHTTPS.Disable {
		t.Errorf("%s has automatic HTTPS", name)
	}
	if srv.Errors == nil || len(srv.Errors.Routes) != 1 || srv.Errors.Routes[0].handlers()[0] != "tamanu_error_page" {
		t.Errorf("%s error routes = %+v", name, srv.Errors)
	}
	if len(srv.Routes) != len(want) {
		t.Fatalf("%s has %d routes, want %d", name, len(srv.Routes), len(want))
	}
	for i, w := range want {
		r := srv.Routes[i]
		if !r.Terminal {
			t.Errorf("%s route %d is not terminal", name, i)
		}
		if got := r.paths(); !slices.Equal(got, w.paths) {
			t.Errorf("%s route %d paths = %q, want %q", name, i, got, w.paths)
		}
		if class, part := r.gate(); class != w.class || part != w.part {
			t.Errorf("%s route %d gate = %s %s, want %s %s", name, i, class, part, w.class, w.part)
		}
		if got := r.handlers(); !slices.Equal(got, w.handlers) {
			t.Errorf("%s route %d handlers = %q, want %q", name, i, got, w.handlers)
		}
		if got := r.upstreams(); !slices.Equal(got, w.upstreams) {
			t.Errorf("%s route %d upstreams = %q, want %q", name, i, got, w.upstreams)
		}
	}
}

func TestFacility(t *testing.T) {
	g := build(t, facility())
	servers := g.Apps.HTTP.Servers
	if len(servers) != 2 || servers[ServerPortal].Listen != nil {
		t.Errorf("servers = %v", slices.Collect(maps.Keys(servers)))
	}
	checkFrontServer(t, ServerMain, servers[ServerMain], ":8080", wantFrontRoutes("web", []string{"web:80"}))
	if g.Apps.Tamanu["role"] != "facility" || g.Apps.Tamanu["idle_time"] != float64(30*time.Minute) {
		t.Errorf("tamanu app = %v", g.Apps.Tamanu)
	}
	if parts := g.Apps.Tamanu["parts"].([]any); slices.Contains(parts, any("portal")) {
		t.Errorf("facility parts include the portal: %v", parts)
	}
}

func TestCentralWithoutPortal(t *testing.T) {
	g := build(t, central(false))
	servers := g.Apps.HTTP.Servers
	if _, ok := servers[ServerPortal]; ok || len(servers) != 2 {
		t.Errorf("servers = %v", slices.Collect(maps.Keys(servers)))
	}
	checkFrontServer(t, ServerMain, servers[ServerMain], ":8080", wantFrontRoutes("web", []string{"web:80"}))
	if parts := g.Apps.Tamanu["parts"].([]any); !slices.Contains(parts, any("portal")) {
		t.Errorf("central parts lack the portal: %v", parts)
	}
}

func TestCentralWithPortal(t *testing.T) {
	g := build(t, central(true))
	servers := g.Apps.HTTP.Servers
	if len(servers) != 3 {
		t.Errorf("servers = %v", slices.Collect(maps.Keys(servers)))
	}
	checkFrontServer(t, ServerMain, servers[ServerMain], ":8080", wantFrontRoutes("web", []string{"web:80"}))
	checkFrontServer(t, ServerPortal, servers[ServerPortal], ":8082", wantFrontRoutes("portal", []string{"portal:80"}))
}

func TestStatusServer(t *testing.T) {
	srv := build(t, facility()).Apps.HTTP.Servers[ServerStatus]
	if !slices.Equal(srv.Listen, []string{"127.0.0.1:8081"}) || !srv.AutoHTTPS.Disable {
		t.Errorf("status server = %+v", srv)
	}
	if len(srv.Routes) != 1 || !slices.Equal(srv.Routes[0].handlers(), []string{"tamanu_status"}) {
		t.Errorf("status routes = %+v", srv.Routes)
	}
}

func TestAdminDisabled(t *testing.T) {
	g := build(t, facility())
	if !g.Admin.Disabled || g.Admin.Config.Persist == nil || *g.Admin.Config.Persist {
		t.Errorf("admin = %+v", g.Admin)
	}
}

func TestNoCertificateStorage(t *testing.T) {
	tls := build(t, facility()).Apps.TLS
	if tls["disable_storage_check"] != true || tls["disable_storage_clean"] != true {
		t.Errorf("tls app = %v", tls)
	}
}

func TestRateLimits(t *testing.T) {
	api := build(t, facility()).Apps.HTTP.Servers[ServerMain].Routes[3]
	rl := api.Handle[1]["rate_limits"].(map[string]any)
	zone := rl["tamanu_api"].(map[string]any)
	if zone["max_events"] != float64(1000) || zone["window"] != float64(time.Second) || zone["key"] != "{http.request.client_ip}" {
		t.Errorf("api zone = %v", zone)
	}
	login := rl["tamanu_login"].(map[string]any)
	if login["max_events"] != float64(10) || login["window"] != float64(time.Second) {
		t.Errorf("login zone = %v", login)
	}
	if m, _ := json.Marshal(login["match"]); string(m) != `[{"path":["/api/login"]}]` {
		t.Errorf("login zone matches %s", m)
	}
}

func TestCacheControl(t *testing.T) {
	routes := build(t, facility()).Apps.HTTP.Servers[ServerMain].Routes
	for i, want := range map[int]string{2: "no-store", 3: "no-store", 4: "no-cache"} {
		var h map[string]any
		for _, candidate := range routes[i].Handle {
			if candidate["handler"] == "headers" {
				h = candidate
			}
		}
		b, _ := json.Marshal(h["response"])
		if !strings.Contains(string(b), `"Cache-Control":["`+want+`"]`) || !strings.Contains(string(b), `"deferred":true`) {
			t.Errorf("route %d headers = %s, want deferred %s", i, b, want)
		}
	}
}

func TestLoadBalancing(t *testing.T) {
	api := build(t, facility()).Apps.HTTP.Servers[ServerMain].Routes[3]
	proxy := api.Handle[len(api.Handle)-1]
	b, _ := json.Marshal(proxy)
	for _, want := range []string{`"policy":"least_conn"`, `"retries":2`, `"try_duration":`, `"keep_alive":{"enabled":true`} {
		if !strings.Contains(string(b), want) {
			t.Errorf("reverse proxy %s lacks %s", b, want)
		}
	}
}

func TestTrustedProxies(t *testing.T) {
	c := central(true)
	c.TrustedProxies = []string{"10.0.0.0/8"}
	servers := build(t, c).Apps.HTTP.Servers
	for _, name := range []string{ServerMain, ServerPortal} {
		tp := servers[name].TrustedProxies
		if tp["source"] != "static" || tp["ranges"].([]any)[0] != "10.0.0.0/8" {
			t.Errorf("%s trusted proxies = %v", name, tp)
		}
	}
	if build(t, facility()).Apps.HTTP.Servers[ServerMain].TrustedProxies != nil {
		t.Error("trusted proxies without any configured")
	}
}

func TestActuatorAndToken(t *testing.T) {
	c := facility()
	c.ActuatorURL, _ = url.Parse("http://actuator:7000")
	c.APIToken = "super-secret"
	c.DataDir = "/var/lib/supervisor"
	raw, err := Build(c)
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(raw), "super-secret") {
		t.Error("the generated configuration carries the api token")
	}
	var g generated
	_ = json.Unmarshal(raw, &g)
	app := g.Apps.Tamanu
	if app["actuator_url"] != "http://actuator:7000" || app["api_token"] != "{env.TAMANU_SUPERVISOR_API_TOKEN}" || app["data_dir"] != "/var/lib/supervisor" {
		t.Errorf("tamanu app = %v", app)
	}
}
