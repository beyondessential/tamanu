// Package gate is the handler at the head of every route of the server's and
// the patient portal's addresses.
package gate

import (
	"fmt"
	"net/http"

	"github.com/caddyserver/caddy/v2"
	"github.com/caddyserver/caddy/v2/caddyconfig/httpcaddyfile"
	"github.com/caddyserver/caddy/v2/modules/caddyhttp"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/app"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/pages"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/state"
)

func init() {
	caddy.RegisterModule(Gate{})
	httpcaddyfile.RegisterHandlerDirective("tamanu_gate", parseCaddyfile)
	// Ahead of anything that sets response headers or answers, so a request
	// the gate answers itself gets the gate's response alone.
	httpcaddyfile.RegisterDirectiveOrder("tamanu_gate", httpcaddyfile.Before, "header")
}

// parseCaddyfile reads the tamanu_gate directive: tamanu_gate <class>.
func parseCaddyfile(h httpcaddyfile.Helper) (caddyhttp.MiddlewareHandler, error) {
	h.Next()
	var class string
	if !h.Args(&class) || h.NextArg() {
		return nil, h.ArgErr()
	}
	return &Gate{Class: Class(class)}, nil
}

// Class is how a route's requests bear on sleep and wake.
//
// spec: SLPWK#activity
type Class string

const (
	// Activity, Exempt and Websocket requests go to the api.
	Activity  Class = "activity"
	Exempt    Class = "exempt"
	Websocket Class = "websocket"
	// Static requests are for the supervisor's own files.
	Static Class = "static"
	// Page requests are those the web app's index page answers: a browser
	// opening one is treated as Activity, anything else as Static.
	Page Class = "page"
	// Index requests are for the root of the web app or patient portal: a
	// browser opening it is treated as Activity, and anything else is a
	// health probe, served without counting as activity.
	Index Class = "index"
)

// Gate is the http.handlers.tamanu_gate handler.
//
// spec: SUPV#front-door
type Gate struct {
	// Class is the class of the route's requests.
	Class Class `json:"class"`

	state *state.Server
	pages *pages.Pages
}

// CaddyModule returns the Caddy module information.
func (Gate) CaddyModule() caddy.ModuleInfo {
	return caddy.ModuleInfo{
		ID:  "http.handlers.tamanu_gate",
		New: func() caddy.Module { return new(Gate) },
	}
}

// Provision takes the server's state and the pages from the tamanu app.
func (g *Gate) Provision(ctx caddy.Context) error {
	a, err := ctx.App(app.ID)
	if err != nil {
		return fmt.Errorf("finding the %s app: %w", app.ID, err)
	}
	g.state = a.(*app.App).State()
	g.pages = a.(*app.App).Pages()
	return nil
}

// Validate checks the gate's configuration.
func (g *Gate) Validate() error {
	switch g.Class {
	case Activity, Exempt, Websocket, Static, Page, Index:
		return nil
	}
	return fmt.Errorf("unknown class %q", g.Class)
}

func (g *Gate) ServeHTTP(w http.ResponseWriter, r *http.Request, next caddyhttp.Handler) error {
	class := g.Class
	if class == Index {
		if !pages.IsBrowser(r) {
			// spec: SLPWK#activity
			return next.ServeHTTP(w, r)
		}
		class = Activity
	}
	if class == Page {
		class = Static
		if pages.IsBrowser(r) {
			class = Activity
		}
	}

	var admission state.Admission
	switch class {
	case Static:
		// spec: SLPWK#waking
		defer g.state.AdmitStatic()()
		return next.ServeHTTP(w, r)
	case Activity:
		var done func()
		admission, done = g.state.AdmitActivity(state.API)
		defer done()
	default:
		admission = g.state.Admit(state.API)
	}

	switch admission {
	case state.Forward:
		return next.ServeHTTP(w, r)
	case state.Upgrading:
		// spec: SUPV#upgrades
		g.pages.Upgrading.Write(w, r, http.StatusServiceUnavailable)
	default:
		if class == Websocket {
			// spec: SLPWK#waking
			unavailable, _ := g.pages.Unavailable(http.StatusServiceUnavailable)
			unavailable.Write(w, r, http.StatusServiceUnavailable)
		} else {
			// spec: SLPWK#waking
			g.pages.Waking.Write(w, r, http.StatusServiceUnavailable)
		}
	}
	return nil
}

// Interface guards.
var (
	_ caddy.Provisioner           = (*Gate)(nil)
	_ caddy.Validator             = (*Gate)(nil)
	_ caddyhttp.MiddlewareHandler = (*Gate)(nil)
)
