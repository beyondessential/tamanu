package caddy_test

import (
	"bytes"
	"os"
	"os/exec"
	"path/filepath"
	"slices"
	"strings"
	"testing"
)

// stubCaddy is a stand-in for Caddy that prints its arguments, a line of its
// own, and its environment.
const stubCaddy = `#!/bin/sh
printf '%s\n' "$@" --env--
env
`

// entrypoint runs the image's entrypoint with args and vars as its only
// environment, the shipped Caddyfiles, and stubCaddy in place of Caddy. It
// returns the arguments and environment Caddy was run with.
func entrypoint(t *testing.T, vars map[string]string, args ...string) (caddyArgs []string, caddyEnv map[string]string, stderr string, err error) {
	t.Helper()
	stub := filepath.Join(t.TempDir(), "caddy")
	if err := os.WriteFile(stub, []byte(stubCaddy), 0o755); err != nil {
		t.Fatal(err)
	}
	caddyfiles, err := filepath.Abs(".")
	if err != nil {
		t.Fatal(err)
	}
	cmd := exec.Command("sh", append([]string{"../entrypoint.sh"}, args...)...)
	cmd.Env = []string{"PATH=" + os.Getenv("PATH"), "CADDY=" + stub, "CADDYFILES=" + caddyfiles}
	for name, value := range vars {
		cmd.Env = append(cmd.Env, name+"="+value)
	}
	var stdout, errOut bytes.Buffer
	cmd.Stdout, cmd.Stderr = &stdout, &errOut
	err = cmd.Run()

	lines := strings.Split(strings.TrimSuffix(stdout.String(), "\n"), "\n")
	end := slices.Index(lines, "--env--")
	if end < 0 {
		return nil, nil, errOut.String(), err
	}
	caddyEnv = map[string]string{}
	for _, line := range lines[end+1:] {
		if name, value, ok := strings.Cut(line, "="); ok {
			caddyEnv[name] = value
		}
	}
	return lines[:end], caddyEnv, errOut.String(), err
}

// supervisorEnv runs the entrypoint with vars, and returns the environment it
// runs Caddy with and the Caddyfile it chose.
func supervisorEnv(t *testing.T, vars map[string]string) (env map[string]string, caddyfile string) {
	t.Helper()
	args, env, stderr, err := entrypoint(t, vars, "supervisor")
	if err != nil {
		t.Fatalf("entrypoint: %v\n%s", err, stderr)
	}
	return env, args[2]
}

// supervisorVars is the environment of a facility server's supervisor, with
// each pair of names (without the TAMANU_SUPERVISOR_ prefix) and values
// changed, or removed where the value is "unset".
func supervisorVars(pairs ...string) map[string]string {
	vars := map[string]string{
		"TAMANU_SUPERVISOR_ROLE":          "facility",
		"TAMANU_SUPERVISOR_API_UPSTREAMS": "api-1:4000 api-2:4000",
		"TAMANU_SUPERVISOR_WEB_ROOT":      "/srv/web",
	}
	for i := 0; i+1 < len(pairs); i += 2 {
		if pairs[i+1] == "unset" {
			delete(vars, "TAMANU_SUPERVISOR_"+pairs[i])
		} else {
			vars["TAMANU_SUPERVISOR_"+pairs[i]] = pairs[i+1]
		}
	}
	return vars
}

// spec: SUPV#configuration
// spec: SUPV#platforms
func TestEntrypoint(t *testing.T) {
	caddyfiles, _ := filepath.Abs(".")
	run := func(caddyfile string) []string {
		return []string{"run", "--config", filepath.Join(caddyfiles, caddyfile), "--adapter", "caddyfile"}
	}
	for _, tc := range []struct {
		name string
		vars map[string]string
		args []string
		// problem is the start of the error, naming the variable.
		problem  string
		wantArgs []string
		wantEnv  map[string]string
	}{
		{
			name:    "missing variable",
			vars:    supervisorVars("WEB_ROOT", "unset"),
			problem: "TAMANU_SUPERVISOR_WEB_ROOT is required",
		},
		{
			name:    "empty variable",
			vars:    supervisorVars("API_UPSTREAMS", ""),
			problem: "TAMANU_SUPERVISOR_API_UPSTREAMS is required",
		},
		{
			name:    "malformed role",
			vars:    supervisorVars("ROLE", "hospital"),
			problem: `TAMANU_SUPERVISOR_ROLE must be central or facility, not "hospital"`,
		},
		{
			name:    "malformed listen address",
			vars:    supervisorVars("LISTEN", "8080"),
			problem: "TAMANU_SUPERVISOR_LISTEN must be an address",
		},
		{
			name:    "malformed upstream",
			vars:    supervisorVars("API_UPSTREAMS", "api-1:4000,api-2:4000"),
			problem: "TAMANU_SUPERVISOR_API_UPSTREAMS must be a space-separated list",
		},
		{
			name:    "malformed idle time",
			vars:    supervisorVars("IDLE_TIME", "30"),
			problem: "TAMANU_SUPERVISOR_IDLE_TIME must be a duration",
		},
		{
			name:    "unknown variable",
			vars:    supervisorVars("IDLE", "1h"),
			problem: "TAMANU_SUPERVISOR_IDLE is not a variable the supervisor reads",
		},
		{
			name:    "portal on a facility server",
			vars:    supervisorVars("PORTAL_LISTEN", ":8082", "PORTAL_ROOT", "/srv/patient-portal"),
			problem: "TAMANU_SUPERVISOR_PORTAL_LISTEN is only for a central server",
		},
		{
			name:    "actuator without a token",
			vars:    supervisorVars("ACTUATOR_URL", "http://actuator:7000"),
			problem: "TAMANU_SUPERVISOR_API_TOKEN is required when TAMANU_SUPERVISOR_ACTUATOR_URL is set",
		},
		{
			name: "central with a portal",
			vars: supervisorVars("ROLE", "central", "PORTAL_LISTEN", "[::]:8082", "PORTAL_ROOT", "/srv/patient-portal",
				"ACTUATOR_URL", "https://actuator:7000", "API_TOKEN", "secret", "TRUSTED_PROXIES", "10.0.0.0/8 fd00::/8"),
			wantArgs: run("supervisor-portal.caddyfile"),
			wantEnv: map[string]string{
				"TAMANU_SUPERVISOR_IDLE_TIME":    "15m",
				"_TAMANU_SUPERVISOR_PORT":        "8080",
				"_TAMANU_SUPERVISOR_PORTAL_PORT": "8082",
			},
		},
		{
			name:     "facility",
			vars:     supervisorVars(),
			wantArgs: run("supervisor.caddyfile"),
			wantEnv: map[string]string{
				"TAMANU_SUPERVISOR_LISTEN":        ":8080",
				"TAMANU_SUPERVISOR_STATUS_LISTEN": "127.0.0.1:8081",
				"TAMANU_SUPERVISOR_IDLE_TIME":     "30m",
				"_TAMANU_SUPERVISOR_PORT":         "8080",
				"_TAMANU_SUPERVISOR_STATUS_PORT":  "8081",
			},
		},
		{
			name:     "adapting the configuration",
			vars:     supervisorVars("IDLE_TIME", "1h30m"),
			args:     []string{"supervisor", "adapt"},
			wantArgs: []string{"adapt", "--config", filepath.Join(caddyfiles, "supervisor.caddyfile"), "--adapter", "caddyfile"},
			wantEnv:  map[string]string{"TAMANU_SUPERVISOR_IDLE_TIME": "1h30m"},
		},
		{
			name:     "without the supervisor command",
			vars:     map[string]string{"TAMANU_SUPERVISOR_UNKNOWN": "x"},
			args:     []string{"run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"},
			wantArgs: []string{"run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"},
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			args := tc.args
			if args == nil {
				args = []string{"supervisor"}
			}
			gotArgs, gotEnv, stderr, err := entrypoint(t, tc.vars, args...)
			if tc.problem != "" {
				if err == nil || gotArgs != nil {
					t.Fatalf("ran Caddy with %q despite the problem", gotArgs)
				}
				if !strings.HasPrefix(stderr, tc.problem) || strings.Count(stderr, "\n") != 1 {
					t.Errorf("stderr = %q, want one line starting %q", stderr, tc.problem)
				}
				return
			}
			if err != nil {
				t.Fatalf("entrypoint: %v\n%s", err, stderr)
			}
			if !slices.Equal(gotArgs, tc.wantArgs) {
				t.Errorf("Caddy run with %q, want %q", gotArgs, tc.wantArgs)
			}
			for name, want := range tc.wantEnv {
				if gotEnv[name] != want {
					t.Errorf("%s = %q, want %q", name, gotEnv[name], want)
				}
			}
		})
	}
}
