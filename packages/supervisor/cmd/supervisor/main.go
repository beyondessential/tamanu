// Command supervisor is Tamanu's supervisor: a build of Caddy carrying
// Tamanu's own modules, which stands in front of every Tamanu server as its
// front door.
//
// spec: SUPV#front-door
package main

import (
	caddycmd "github.com/caddyserver/caddy/v2/cmd"

	_ "github.com/caddyserver/caddy/v2/modules/standard"
	_ "github.com/mholt/caddy-ratelimit"
)

func main() {
	caddycmd.Main()
}
