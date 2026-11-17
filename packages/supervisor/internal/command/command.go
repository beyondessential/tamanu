// Package command registers the "caddy tamanu-supervisor" command, which
// builds Caddy's configuration from the environment in memory and runs it.
//
// spec: SUPV#configuration
package command

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"os"

	"github.com/KimMachineGun/automemlimit/memlimit"
	"github.com/caddyserver/caddy/v2"
	caddycmd "github.com/caddyserver/caddy/v2/cmd"
	"go.uber.org/zap"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/config"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/routes"
)

// Name is the command's name.
const Name = "tamanu-supervisor"

func init() {
	flags := flag.NewFlagSet(Name, flag.ExitOnError)
	flags.Bool("print-config", false, "print the generated Caddy configuration as JSON and exit")

	caddycmd.RegisterCommand(caddycmd.Command{
		Name:  Name,
		Usage: "[--print-config]",
		Short: "Runs the Tamanu supervisor, configured from the environment",
		Long: `
Runs the Tamanu supervisor in the foreground. It is configured entirely by
environment variables prefixed with ` + config.Prefix + `; a missing or
malformed variable stops it from starting, with an error naming the variable.

With --print-config, it prints the Caddy configuration it would run, as JSON,
and exits.`,
		Flags: flags,
		Func:  run,
	})
}

func run(fl caddycmd.Flags) (int, error) {
	cfg, err := config.FromProcess()
	if err != nil {
		return caddy.ExitCodeFailedStartup, fmt.Errorf("configuration:\n%w", err)
	}
	raw, err := routes.Build(cfg)
	if err != nil {
		return caddy.ExitCodeFailedStartup, fmt.Errorf("building the Caddy configuration: %w", err)
	}

	if fl.Bool("print-config") {
		var out bytes.Buffer
		if err := json.Indent(&out, raw, "", "  "); err != nil {
			return caddy.ExitCodeFailedStartup, err
		}
		out.WriteByte('\n')
		if _, err := out.WriteTo(os.Stdout); err != nil {
			return caddy.ExitCodeFailedStartup, err
		}
		return caddy.ExitCodeSuccess, nil
	}

	// "caddy run" sets the memory limit, and this command bypasses it.
	//
	// spec: SUPV#resilience
	_, _ = memlimit.Set(memlimit.WithProvider(
		memlimit.ApplyFallback(memlimit.FromCgroup, memlimit.FromSystem),
	))

	caddy.TrapSignals()
	if err := caddy.Load(raw, true); err != nil {
		return caddy.ExitCodeFailedStartup, fmt.Errorf("loading the configuration: %w", err)
	}
	caddy.Log().Info("tamanu supervisor running", zap.String("role", string(cfg.Role)), zap.Bool("can_sleep", cfg.HasActuator()))
	select {}
}
