// Package errorpage answers requests whose part could not be reached.
package errorpage

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/caddyserver/caddy/v2"
	"github.com/caddyserver/caddy/v2/caddyconfig/httpcaddyfile"
	"github.com/caddyserver/caddy/v2/modules/caddyhttp"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/app"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/pages"
)

func init() {
	caddy.RegisterModule(Handler{})
	httpcaddyfile.RegisterHandlerDirective("tamanu_error_page", parseCaddyfile)
	httpcaddyfile.RegisterDirectiveOrder("tamanu_error_page", httpcaddyfile.Before, "respond")
}

// parseCaddyfile reads the tamanu_error_page directive, which takes no
// arguments.
func parseCaddyfile(h httpcaddyfile.Helper) (caddyhttp.MiddlewareHandler, error) {
	h.Next()
	if h.NextArg() {
		return nil, h.ArgErr()
	}
	return new(Handler), nil
}

// Handler is the http.handlers.tamanu_error_page handler, for a server's
// error routes. It answers the reverse proxy's errors when no instance of a
// part answers with Tamanu's page for the status, and passes any other error
// on.
//
// spec: SUPV#front-door
type Handler struct {
	pages *pages.Pages
}

// CaddyModule returns the Caddy module information.
func (Handler) CaddyModule() caddy.ModuleInfo {
	return caddy.ModuleInfo{
		ID:  "http.handlers.tamanu_error_page",
		New: func() caddy.Module { return new(Handler) },
	}
}

// Provision takes the pages from the tamanu app.
func (h *Handler) Provision(ctx caddy.Context) error {
	a, err := ctx.App(app.ID)
	if err != nil {
		return fmt.Errorf("finding the %s app: %w", app.ID, err)
	}
	h.pages = a.(*app.App).Pages()
	return nil
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request, next caddyhttp.Handler) error {
	err, _ := r.Context().Value(caddyhttp.ErrorCtxKey).(error)
	var handlerErr caddyhttp.HandlerError
	if !errors.As(err, &handlerErr) {
		return next.ServeHTTP(w, r)
	}
	resp, ok := h.pages.Unavailable(handlerErr.StatusCode)
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
