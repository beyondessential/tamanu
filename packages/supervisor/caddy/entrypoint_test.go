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
