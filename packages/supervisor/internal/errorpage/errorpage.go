// Package errorpage answers requests whose part could not be reached.
package errorpage

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"github.com/caddyserver/caddy/v2"
	"github.com/caddyserver/caddy/v2/caddyconfig/httpcaddyfile"
	"github.com/caddyserver/caddy/v2/modules/caddyhttp"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/pages"
)

func init() {
	caddy.RegisterModule(Handler{})
	httpcaddyfile.RegisterHandlerDirective("tamanu_error_page", parseCaddyfile)
	httpcaddyfile.RegisterDirectiveOrder("tamanu_error_page", httpcaddyfile.Before, "respond")
}

// parseCaddyfile reads the tamanu_error_page directive:
// tamanu_error_page [<root>].
func parseCaddyfile(h httpcaddyfile.Helper) (caddyhttp.MiddlewareHandler, error) {
	h.Next()
	handler := new(Handler)
	h.Args(&handler.Root)
	if h.NextArg() {
		return nil, h.ArgErr()
	}
	return handler, nil
}

// statuses are the errors the reverse proxy raises when no instance of a part
// answers.
var statuses = []int{http.StatusBadGateway, http.StatusServiceUnavailable, http.StatusGatewayTimeout}

// Handler is the http.handlers.tamanu_error_page handler, for a server's
// error routes. It answers the reverse proxy's errors with Tamanu's page for
// the status from Root, or the supervisor's own when Root has none, and
// passes any other error on.
//
// spec: SUPV#front-door
type Handler struct {
	// Root is the web app's directory, holding resources/errors/{status}.html.
	Root string `json:"root,omitempty"`

	responses map[int]pages.Response
}

// CaddyModule returns the Caddy module information.
func (Handler) CaddyModule() caddy.ModuleInfo {
	return caddy.ModuleInfo{
		ID:  "http.handlers.tamanu_error_page",
		New: func() caddy.Module { return new(Handler) },
	}
}

// Provision reads the pages Root has.
func (h *Handler) Provision(caddy.Context) error {
	h.responses = make(map[int]pages.Response, len(statuses))
	for _, status := range statuses {
		h.responses[status] = pages.Unavailable
		if h.Root == "" {
			continue
		}
		page, err := os.ReadFile(filepath.Join(h.Root, "resources", "errors", fmt.Sprintf("%d.html", status)))
		if err == nil {
			h.responses[status] = pages.Unavailable.WithPage(page)
		}
	}
	return nil
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request, next caddyhttp.Handler) error {
	err, _ := r.Context().Value(caddyhttp.ErrorCtxKey).(error)
	var handlerErr caddyhttp.HandlerError
	if !errors.As(err, &handlerErr) {
		return next.ServeHTTP(w, r)
	}
	resp, ok := h.responses[handlerErr.StatusCode]
	if !ok {
		return next.ServeHTTP(w, r)
	}
	resp.Write(w, r, handlerErr.StatusCode)
	return nil
}

// Interface guards.
var (
	_ caddy.Provisioner           = (*Handler)(nil)
	_ caddyhttp.MiddlewareHandler = (*Handler)(nil)
)
