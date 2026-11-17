// Command supervisor is Tamanu's supervisor, a build of Caddy. With no
// arguments it runs "caddy tamanu-supervisor"; Caddy's other commands stay
// available.
//
// spec: SUPV#front-door
package main

import (
	"os"

	caddycmd "github.com/caddyserver/caddy/v2/cmd"

	_ "github.com/caddyserver/caddy/v2/modules/standard"
	_ "github.com/mholt/caddy-ratelimit"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/command"
)

func main() {
	if len(os.Args) == 1 {
		os.Args = append(os.Args, command.Name)
	}
	caddycmd.Main()
}
