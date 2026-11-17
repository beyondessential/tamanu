// Package gate is the handler at the head of every route that reaches one of
// the server's parts. It decides, from the server's run-time state, whether
// the request goes on to its part or the supervisor answers it, and it counts
// the requests that are activity.
package gate

import (
	"fmt"
	"net/http"

	"github.com/caddyserver/caddy/v2"
	"github.com/caddyserver/caddy/v2/modules/caddyhttp"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/app"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/pages"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/state"
)

func init() {
	caddy.RegisterModule(Gate{})
}

// Class is how a route's requests bear on sleep and wake.
//
// spec: SLPWK#activity
type Class string

const (
	// Activity requests hold the server awake while they run, and wake it
	// when it is asleep.
	Activity Class = "activity"
	// Exempt requests, such as health probes and time synchronisation,
	// neither count as activity nor wake the server.
	Exempt Class = "exempt"
	// Websocket upgrade requests neither count as activity nor wake the
	// server, and are refused while it is not awake.
	Websocket Class = "websocket"
)

// Gate is the http.handlers.tamanu_gate handler.
//
// spec: SUPV#front-door
type Gate struct {
	// Class is the class of the route's requests.
	Class Class `json:"class"`
	// Part is the part the route's requests go to.
	Part state.Part `json:"part"`

	state *state.Server
}

// CaddyModule returns the Caddy module information.
func (Gate) CaddyModule() caddy.ModuleInfo {
	return caddy.ModuleInfo{
		ID:  "http.handlers.tamanu_gate",
		New: func() caddy.Module { return new(Gate) },
	}
}

// Provision takes the server's state from the tamanu app.
func (g *Gate) Provision(ctx caddy.Context) error {
	a, err := ctx.App(app.ID)
	if err != nil {
		return fmt.Errorf("finding the %s app: %w", app.ID, err)
	}
	g.state = a.(*app.App).State()
	return nil
}

// Validate checks the gate's configuration.
func (g *Gate) Validate() error {
	switch g.Class {
	case Activity, Exempt, Websocket:
	default:
		return fmt.Errorf("unknown class %q", g.Class)
	}
	switch g.Part {
	case state.API, state.Web, state.Portal:
	default:
		return fmt.Errorf("part %q is not one requests are routed to", g.Part)
	}
	return nil
}

func (g *Gate) ServeHTTP(w http.ResponseWriter, r *http.Request, next caddyhttp.Handler) error {
	var admission state.Admission
	if g.Class == Activity {
		var done func()
		admission, done = g.state.AdmitActivity(g.Part)
		defer done()
	} else {
		admission = g.state.Admit(g.Part)
	}

	switch admission {
	case state.Forward:
		return next.ServeHTTP(w, r)
	case state.Upgrading:
		// spec: SUPV#upgrades
		pages.Upgrading.Write(w, r, http.StatusServiceUnavailable)
	default:
		if g.Class == Websocket {
			// spec: SLPWK#waking
			pages.Unavailable.Write(w, r, http.StatusServiceUnavailable)
		} else {
			// spec: SLPWK#waking
			pages.Waking.Write(w, r, http.StatusServiceUnavailable)
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
