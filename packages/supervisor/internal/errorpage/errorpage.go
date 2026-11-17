// Package errorpage answers requests whose part could not be reached with the
// supervisor's unavailable response.
package errorpage

import (
	"errors"
	"net/http"

	"github.com/caddyserver/caddy/v2"
	"github.com/caddyserver/caddy/v2/modules/caddyhttp"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/pages"
)

func init() {
	caddy.RegisterModule(Handler{})
}

// Handler is the http.handlers.tamanu_error_page handler, for a server's
// error routes. It answers the reverse proxy's 502, 503 and 504 with the
// unavailable response, and passes any other error on.
//
// spec: SUPV#front-door
type Handler struct{}

// CaddyModule returns the Caddy module information.
func (Handler) CaddyModule() caddy.ModuleInfo {
	return caddy.ModuleInfo{
		ID:  "http.handlers.tamanu_error_page",
		New: func() caddy.Module { return new(Handler) },
	}
}

func (Handler) ServeHTTP(w http.ResponseWriter, r *http.Request, next caddyhttp.Handler) error {
	err, _ := r.Context().Value(caddyhttp.ErrorCtxKey).(error)
	var handlerErr caddyhttp.HandlerError
	if !errors.As(err, &handlerErr) {
		return next.ServeHTTP(w, r)
	}
	switch handlerErr.StatusCode {
	case http.StatusBadGateway, http.StatusServiceUnavailable, http.StatusGatewayTimeout:
		pages.Unavailable.Write(w, r, handlerErr.StatusCode)
		return nil
	}
	return next.ServeHTTP(w, r)
}

// Interface guard.
var _ caddyhttp.MiddlewareHandler = Handler{}
