// Package routes builds the supervisor's Caddy configuration from its own
// configuration: Tamanu's routing for the server's role and parts, the gate at
// the head of each route, and the status server.
//
// spec: SUPV#front-door
package routes

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/caddyserver/caddy/v2"
	"github.com/caddyserver/caddy/v2/caddyconfig"
	"github.com/caddyserver/caddy/v2/modules/caddyhttp"
	"github.com/caddyserver/caddy/v2/modules/caddyhttp/encode"
	caddygzip "github.com/caddyserver/caddy/v2/modules/caddyhttp/encode/gzip"
	caddyzstd "github.com/caddyserver/caddy/v2/modules/caddyhttp/encode/zstd"
	"github.com/caddyserver/caddy/v2/modules/caddyhttp/headers"
	"github.com/caddyserver/caddy/v2/modules/caddyhttp/reverseproxy"
	"github.com/caddyserver/caddy/v2/modules/caddytls"
	ratelimit "github.com/mholt/caddy-ratelimit"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/app"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/config"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/errorpage"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/gate"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/state"
)

// The names of the servers in the generated configuration.
const (
	ServerMain   = "server"
	ServerPortal = "portal"
	ServerStatus = "status"
)

// Paths with routing of their own.
var (
	// apiPaths go to the api.
	apiPaths = []string{"/api/*", "/v1/*"}
	// websocketPath is where the api accepts websocket connections.
	websocketPath = "/api/socket.io/*"
	// exemptPaths are health probes and time synchronisation, which are not
	// activity.
	//
	// spec: SLPWK#activity
	exemptPaths = []string{"/api/public/ping", "/api/timesync"}
	// loginPath is rate limited more tightly than the rest of the api.
	loginPath = "/api/login"
	// legacyLoginPath is redirected to loginPath.
	legacyLoginPath = "/v1/login"
	// documentPaths are the frontend's entry points, which browsers must
	// revalidate so a new release reaches them.
	documentPaths = []string{"/", "/manifest.json", "/env.js"}
)

// Rate limits, per client address, shared by every route and server.
const (
	apiRateLimit   = 1000
	loginRateLimit = 10
	rateWindow     = time.Second
)

// Upstream load balancing.
const (
	upstreamRetries      = 2
	upstreamTryDuration  = 5 * time.Second
	keepAliveIdle        = 2 * time.Minute
	keepAliveIdlePerHost = 32
)

// gracePeriod bounds how long the supervisor waits for open connections when
// it stops, so a restart or upgrade is never held up by a long request or an
// open websocket.
const gracePeriod = 10 * time.Second

// Build generates the Caddy configuration for c, as JSON.
func Build(c config.Config) ([]byte, error) {
	servers := map[string]*caddyhttp.Server{
		ServerMain: frontServer(c, c.Listen, state.Web, c.WebUpstreams),
		ServerStatus: {
			Listen:    []string{c.StatusListen},
			Protocols: []string{"h1", "h2c"},
			AutoHTTPS: &caddyhttp.AutoHTTPSConfig{Disabled: true},
			Routes: caddyhttp.RouteList{{
				HandlersRaw: []json.RawMessage{handler("tamanu_status", app.StatusHandler{})},
			}},
		},
	}
	if c.HasPortal() {
		servers[ServerPortal] = frontServer(c, c.PortalListen, state.Portal, c.PortalUpstreams)
	}

	tamanu := app.App{
		Role:         string(c.Role),
		Parts:        state.PartsFor(c.Role == config.Central),
		IdleTime:     caddy.Duration(c.IdleTime),
		DataDir:      c.DataDir,
		APIUpstreams: c.APIUpstreams,
	}
	if c.HasActuator() {
		tamanu.ActuatorURL = c.ActuatorURL.String()
	}
	if c.APIToken != "" {
		// Read from the environment when the app starts, so the printed
		// configuration does not carry the credential.
		tamanu.APIToken = "{env." + config.VarAPIToken + "}"
	}

	persist := false
	cfg := caddy.Config{
		// The admin API would be a second control surface. The status server
		// is read-only.
		//
		// spec: SUPV#status
		Admin: &caddy.AdminConfig{
			Disabled: true,
			Config:   &caddy.ConfigSettings{Persist: &persist},
		},
		AppsRaw: caddy.ModuleMap{
			"http": caddyconfig.JSON(caddyhttp.App{
				Servers:     servers,
				GracePeriod: caddy.Duration(gracePeriod),
			}, nil),
			// The supervisor has no certificates, so Caddy's certificate
			// storage is never checked or cleaned, and it writes nothing to
			// disk.
			"tls": caddyconfig.JSON(caddytls.TLS{
				DisableStorageCheck: true,
				DisableStorageClean: true,
			}, nil),
			app.ID: caddyconfig.JSON(tamanu, nil),
		},
	}
	return json.Marshal(cfg)
}

// frontServer is a server that takes the server's traffic or the patient
// portal's: the api's routes, and everything else to front.
//
// spec: SUPV#front-door
func frontServer(c config.Config, listen string, front state.Part, frontUpstreams []string) *caddyhttp.Server {
	srv := &caddyhttp.Server{
		Listen:    []string{listen},
		Protocols: []string{"h1", "h2c"},
		AutoHTTPS: &caddyhttp.AutoHTTPSConfig{Disabled: true},
		Routes:    frontRoutes(c, front, frontUpstreams),
		Errors: &caddyhttp.HTTPErrorConfig{Routes: caddyhttp.RouteList{{
			HandlersRaw: []json.RawMessage{handler("tamanu_error_page", errorpage.Handler{})},
		}}},
	}
	if len(c.TrustedProxies) > 0 {
		srv.TrustedProxiesRaw = caddyconfig.JSONModuleObject(
			caddyhttp.StaticIPRange{Ranges: c.TrustedProxies}, "source", "static", nil)
	}
	return srv
}

// frontRoutes lists the routes in the order they are tried. The websocket and
// exempt routes come before the api's general route, which would otherwise
// take their requests.
func frontRoutes(c config.Config, front state.Part, frontUpstreams []string) caddyhttp.RouteList {
	api := proxy(c.APIUpstreams)
	return caddyhttp.RouteList{
		{
			MatcherSetsRaw: match(caddyhttp.MatchPath{legacyLoginPath}, nil),
			HandlersRaw: []json.RawMessage{handler("static_response", caddyhttp.StaticResponse{
				StatusCode: caddyhttp.WeakString("308"),
				Headers:    http.Header{"Location": {loginPath}},
			})},
			Terminal: true,
		},
		{
			// spec: SLPWK#activity
			MatcherSetsRaw: match(caddyhttp.MatchPath{websocketPath}, caddyhttp.MatchHeaderRE{
				"Connection": {Pattern: `(?i)(^|[\s,])upgrade($|[\s,])`},
				"Upgrade":    {Pattern: `(?i)^websocket$`},
			}),
			HandlersRaw: []json.RawMessage{
				gateHandler(gate.Websocket, state.API),
				rateLimit(),
				api,
			},
			Terminal: true,
		},
		{
			MatcherSetsRaw: match(caddyhttp.MatchPath(exemptPaths), nil),
			HandlersRaw: []json.RawMessage{
				gateHandler(gate.Exempt, state.API),
				rateLimit(),
				cacheControl("no-store"),
				api,
			},
			Terminal: true,
		},
		{
			MatcherSetsRaw: match(caddyhttp.MatchPath(apiPaths), nil),
			HandlersRaw: []json.RawMessage{
				gateHandler(gate.Activity, state.API),
				rateLimit(),
				cacheControl("no-store"),
				compress(),
				api,
			},
			Terminal: true,
		},
		{
			MatcherSetsRaw: match(caddyhttp.MatchPath(documentPaths), nil),
			HandlersRaw: []json.RawMessage{
				gateHandler(gate.Activity, front),
				cacheControl("no-cache"),
				compress(),
				proxy(frontUpstreams),
			},
			Terminal: true,
		},
		{
			HandlersRaw: []json.RawMessage{
				gateHandler(gate.Activity, front),
				compress(),
				proxy(frontUpstreams),
			},
			Terminal: true,
		},
	}
}

func match(path caddyhttp.MatchPath, header caddyhttp.MatchHeaderRE) caddyhttp.RawMatcherSets {
	set := caddy.ModuleMap{"path": caddyconfig.JSON(path, nil)}
	if header != nil {
		set["header_regexp"] = caddyconfig.JSON(header, nil)
	}
	return caddyhttp.RawMatcherSets{set}
}

func handler(name string, h any) json.RawMessage {
	return caddyconfig.JSONModuleObject(h, "handler", name, nil)
}

func gateHandler(class gate.Class, part state.Part) json.RawMessage {
	return handler("tamanu_gate", gate.Gate{Class: class, Part: part})
}

// spec: SUPV#front-door
func rateLimit() json.RawMessage {
	key := "{http.request.client_ip}"
	return handler("rate_limit", ratelimit.Handler{
		RateLimits: map[string]*ratelimit.RateLimit{
			"tamanu_api": {
				Key:       key,
				MaxEvents: apiRateLimit,
				Window:    caddy.Duration(rateWindow),
			},
			"tamanu_login": {
				MatcherSetsRaw: match(caddyhttp.MatchPath{loginPath}, nil),
				Key:            key,
				MaxEvents:      loginRateLimit,
				Window:         caddy.Duration(rateWindow),
			},
		},
	})
}

// cacheControl sets the Cache-Control response header, replacing any the
// part sent.
func cacheControl(value string) json.RawMessage {
	return handler("headers", headers.Handler{
		Response: &headers.RespHeaderOps{
			HeaderOps: &headers.HeaderOps{Set: http.Header{"Cache-Control": {value}}},
			Deferred:  true,
		},
	})
}

func compress() json.RawMessage {
	return handler("encode", encode.Encode{
		EncodingsRaw: caddy.ModuleMap{
			"zstd": caddyconfig.JSON(caddyzstd.Zstd{}, nil),
			"gzip": caddyconfig.JSON(caddygzip.Gzip{}, nil),
		},
		Prefer: []string{"zstd", "gzip"},
	})
}

func proxy(upstreams []string) json.RawMessage {
	pool := make(reverseproxy.UpstreamPool, 0, len(upstreams))
	for _, addr := range upstreams {
		pool = append(pool, &reverseproxy.Upstream{Dial: addr})
	}
	keepAlive := true
	return handler("reverse_proxy", reverseproxy.Handler{
		Upstreams: pool,
		LoadBalancing: &reverseproxy.LoadBalancing{
			SelectionPolicyRaw: caddyconfig.JSONModuleObject(
				reverseproxy.LeastConnSelection{}, "policy", "least_conn", nil),
			Retries:     upstreamRetries,
			TryDuration: caddy.Duration(upstreamTryDuration),
		},
		TransportRaw: caddyconfig.JSONModuleObject(reverseproxy.HTTPTransport{
			KeepAlive: &reverseproxy.KeepAlive{
				Enabled:             &keepAlive,
				IdleConnTimeout:     caddy.Duration(keepAliveIdle),
				MaxIdleConnsPerHost: keepAliveIdlePerHost,
			},
		}, "protocol", "http", nil),
	})
}
