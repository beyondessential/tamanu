package app

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/caddyserver/caddy/v2"
	"github.com/caddyserver/caddy/v2/modules/caddyhttp"
)

func init() {
	caddy.RegisterModule(StatusHandler{})
}

// StatusHandler serves the supervisor's read-only status: GET /status for the
// server and GET /health for the supervisor itself. Neither wakes the server
// nor counts as activity, and nothing changes through them.
//
// spec: SUPV#status
type StatusHandler struct {
	app *App
}

// CaddyModule returns the Caddy module information.
func (StatusHandler) CaddyModule() caddy.ModuleInfo {
	return caddy.ModuleInfo{
		ID:  "http.handlers.tamanu_status",
		New: func() caddy.Module { return new(StatusHandler) },
	}
}

// Provision finds the app.
func (h *StatusHandler) Provision(ctx caddy.Context) error {
	a, err := ctx.App(ID)
	if err != nil {
		return fmt.Errorf("finding the %s app: %w", ID, err)
	}
	h.app = a.(*App)
	return nil
}

func (h *StatusHandler) ServeHTTP(w http.ResponseWriter, r *http.Request, _ caddyhttp.Handler) error {
	var body any
	switch r.URL.Path {
	case "/status":
		body = h.app.Status()
	case "/health":
		body = map[string]string{"status": "ok"}
	default:
		return caddyhttp.Error(http.StatusNotFound, nil)
	}
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		w.Header().Set("Allow", "GET, HEAD")
		return caddyhttp.Error(http.StatusMethodNotAllowed, nil)
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(http.StatusOK)
	if r.Method == http.MethodHead {
		return nil
	}
	return json.NewEncoder(w).Encode(body)
}

// Interface guards.
var (
	_ caddy.Provisioner           = (*StatusHandler)(nil)
	_ caddyhttp.MiddlewareHandler = (*StatusHandler)(nil)
)
