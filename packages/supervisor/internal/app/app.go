// Package app is the supervisor's Caddy app, "tamanu". It owns the server's
// run-time state, which the gate in every route reads, and is where the sleep
// and wake machinery runs.
package app

import (
	"fmt"
	"slices"
	"time"

	"github.com/caddyserver/caddy/v2"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/state"
)

func init() {
	caddy.RegisterModule(App{})
}

// ID is the app's module ID, by which handlers find it.
const ID = "tamanu"

// App is the supervisor's Caddy app.
type App struct {
	// Role is "central" or "facility".
	Role string `json:"role"`
	// Parts lists the server's parts. Defaults to the parts of the role.
	Parts []state.Part `json:"parts,omitempty"`
	// IdleTime is how long the server goes without activity before sleeping.
	IdleTime caddy.Duration `json:"idle_time,omitempty"`
	// ActuatorURL is the actuator's base URL. Without one the server never
	// sleeps.
	ActuatorURL string `json:"actuator_url,omitempty"`
	// APIToken is the credential for the api's supervisor routes. Placeholders
	// are replaced, so it can name an environment variable as
	// {env.TAMANU_SUPERVISOR_API_TOKEN} and stay out of the printed config.
	APIToken string `json:"api_token,omitempty"`
	// DataDir is where the supervisor keeps its state.
	DataDir string `json:"data_dir,omitempty"`

	state    *state.Server
	apiToken string
}

// CaddyModule returns the Caddy module information.
func (App) CaddyModule() caddy.ModuleInfo {
	return caddy.ModuleInfo{
		ID:  ID,
		New: func() caddy.Module { return new(App) },
	}
}

// pool keeps the state across config reloads: the incoming config's app
// takes the state from the outgoing one rather than starting afresh.
var pool = caddy.NewUsagePool()

const poolKey = "state"

type pooledState struct{ *state.Server }

func (pooledState) Destruct() error { return nil }

// Provision sets up the app and takes the shared state.
func (a *App) Provision(ctx caddy.Context) error {
	if len(a.Parts) == 0 {
		a.Parts = state.PartsFor(a.Role == "central")
	}
	a.apiToken = caddy.NewReplacer().ReplaceAll(a.APIToken, "")

	parts := a.Parts
	val, _, err := pool.LoadOrNew(poolKey, func() (caddy.Destructor, error) {
		return pooledState{state.New(parts)}, nil
	})
	if err != nil {
		return err
	}
	a.state = val.(pooledState).Server
	return nil
}

// Validate checks the app's configuration.
func (a *App) Validate() error {
	if a.Role != "central" && a.Role != "facility" {
		return fmt.Errorf("role must be central or facility, not %q", a.Role)
	}
	for _, p := range a.Parts {
		if !slices.Contains(state.PartsFor(true), p) {
			return fmt.Errorf("unknown part %q", p)
		}
	}
	if a.ActuatorURL != "" && (a.apiToken == "" || a.DataDir == "") {
		return fmt.Errorf("an actuator needs an api token and a data directory")
	}
	return nil
}

// Start starts the app. Without an actuator there is nothing to run: the
// server stays awake with every part ready.
//
// spec: SUPV#platforms
func (a *App) Start() error { return nil }

// Stop stops the app.
func (a *App) Stop() error { return nil }

// Cleanup releases the app's hold on the shared state.
func (a *App) Cleanup() error {
	_, err := pool.Delete(poolKey)
	return err
}

// State is the server's run-time state.
func (a *App) State() *state.Server { return a.state }

// CanSleep reports whether this supervisor ever puts its server to sleep.
func (a *App) CanSleep() bool { return a.ActuatorURL != "" }

// PartStatus is one part's entry in the status.
type PartStatus struct {
	Ready bool `json:"ready"`
}

// Status is what the supervisor reports about its server.
//
// spec: SUPV#status
type Status struct {
	State        state.Phase               `json:"state"`
	Parts        map[state.Part]PartStatus `json:"parts"`
	Upgrading    bool                      `json:"upgrading"`
	LastFailure  *state.Failure            `json:"lastFailure"`
	InFlight     int                       `json:"inFlight"`
	LastActivity time.Time                 `json:"lastActivity"`
	IdleTime     string                    `json:"idleTime"`
	CanSleep     bool                      `json:"canSleep"`
}

// Status reports the server's state.
func (a *App) Status() Status {
	snap := a.state.Snapshot()
	parts := make(map[state.Part]PartStatus, len(snap.Parts))
	for _, p := range snap.Parts {
		parts[p] = PartStatus{Ready: snap.Ready[p]}
	}
	return Status{
		State:        snap.Phase,
		Parts:        parts,
		Upgrading:    snap.Upgrading,
		LastFailure:  snap.LastFailure,
		InFlight:     snap.InFlight,
		LastActivity: snap.LastActivity.UTC(),
		IdleTime:     time.Duration(a.IdleTime).String(),
		CanSleep:     a.CanSleep(),
	}
}

// Interface guards.
var (
	_ caddy.App          = (*App)(nil)
	_ caddy.Provisioner  = (*App)(nil)
	_ caddy.Validator    = (*App)(nil)
	_ caddy.CleanerUpper = (*App)(nil)
)
