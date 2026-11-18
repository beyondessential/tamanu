package app

import (
	"github.com/caddyserver/caddy/v2"
	"github.com/caddyserver/caddy/v2/caddyconfig"
	"github.com/caddyserver/caddy/v2/caddyconfig/caddyfile"
	"github.com/caddyserver/caddy/v2/caddyconfig/httpcaddyfile"
	"github.com/caddyserver/caddy/v2/modules/caddyhttp"
)

func init() {
	httpcaddyfile.RegisterGlobalOption(ID, parseGlobalOption)
	httpcaddyfile.RegisterHandlerDirective("tamanu_status", parseStatus)
	httpcaddyfile.RegisterDirectiveOrder("tamanu_status", httpcaddyfile.Before, "respond")
}

// parseGlobalOption reads the app from the Caddyfile's global options:
//
//	tamanu {
//		role          central|facility
//		api_upstreams <host:port...>
//		actuator_url  [<url>]
//		idle_time     <duration>
//		api_token     [<token>]
//		web_root      <directory>
//	}
//
// An actuator_url or api_token with no value, as an unset environment
// variable leaves it, means none.
//
// spec: SUPV#configuration
func parseGlobalOption(d *caddyfile.Dispenser, _ any) (any, error) {
	var a App
	d.Next()
	if d.NextArg() {
		return nil, d.ArgErr()
	}
	for d.NextBlock(0) {
		name, args := d.Val(), d.RemainingArgs()
		if len(args) > 1 && name != "api_upstreams" {
			return nil, d.ArgErr()
		}
		value := ""
		if len(args) == 1 {
			value = args[0]
		}
		switch name {
		case "role":
			a.Role = value
		case "api_upstreams":
			a.APIUpstreams = args
		case "actuator_url":
			a.ActuatorURL = value
		case "api_token":
			a.APIToken = value
		case "web_root":
			a.WebRoot = value
		case "idle_time":
			idle, err := caddy.ParseDuration(value)
			if err != nil {
				return nil, d.Errf("idle_time: %v", err)
			}
			a.IdleTime = caddy.Duration(idle)
		default:
			return nil, d.Errf("unknown option %q", name)
		}
	}
	return httpcaddyfile.App{Name: ID, Value: caddyconfig.JSON(a, nil)}, nil
}

// parseStatus reads the tamanu_status directive, which takes no arguments.
func parseStatus(h httpcaddyfile.Helper) (caddyhttp.MiddlewareHandler, error) {
	h.Next()
	if h.NextArg() {
		return nil, h.ArgErr()
	}
	return new(StatusHandler), nil
}
