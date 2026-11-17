// Command supervisor is Tamanu's supervisor, a build of Caddy. Its
// "tamanu-supervisor" command runs the supervisor; Caddy's own commands stay
// available, so it also stands in for Caddy where a frontend is served alone.
//
// spec: SUPV#front-door
// spec: SUPV#platforms
package main

import (
	caddycmd "github.com/caddyserver/caddy/v2/cmd"

	_ "github.com/caddyserver/caddy/v2/modules/standard"
	_ "github.com/mholt/caddy-ratelimit"

	_ "github.com/beyondessential/tamanu/packages/supervisor/internal/command"
)

func main() {
	caddycmd.Main()
}
