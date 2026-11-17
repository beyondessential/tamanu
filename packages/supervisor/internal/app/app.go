// Package app is the supervisor's Caddy app, "tamanu", which owns the
// server's run-time state and runs the sleep and wake machine.
package app

import (
	"context"
	"fmt"
	"net/url"
	"sync"
	"time"

	"github.com/caddyserver/caddy/v2"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/actuator"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/apiclient"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/buildinfo"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/machine"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/persist"
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
	// IdleTime is how long the server goes without activity before sleeping.
	IdleTime caddy.Duration `json:"idle_time,omitempty"`
	// ActuatorURL is the actuator's base URL, if there is one.
	ActuatorURL string `json:"actuator_url,omitempty"`
	// APIToken is the credential for the api's supervisor routes. Placeholders
	// are replaced, so it can name an environment variable as
	// {env.TAMANU_SUPERVISOR_API_TOKEN} and stay out of the printed config.
	APIToken string `json:"api_token,omitempty"`
	// DataDir is where the supervisor keeps its state.
	DataDir string `json:"data_dir,omitempty"`
	// APIUpstreams are the api instances (host:port) the supervisor calls.
	APIUpstreams []string `json:"api_upstreams,omitempty"`

	state    *state.Server
	apiToken string
	machine  *machine.Machine
	cancel   context.CancelFunc
	done     chan struct{}
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
	a.apiToken = caddy.NewReplacer().ReplaceAll(a.APIToken, "")

	val, _, err := pool.LoadOrNew(poolKey, func() (caddy.Destructor, error) {
		return pooledState{state.New(state.Parts())}, nil
	})
	if err != nil {
		return err
	}
	a.state = val.(pooledState).Server

	if a.ActuatorURL == "" {
		return nil
	}
	actuatorURL, err := url.Parse(a.ActuatorURL)
	if err != nil {
		return fmt.Errorf("actuator url: %w", err)
	}
	store, err := persist.Open(a.DataDir)
	if err != nil {
		return err
	}
	a.machine = machine.New(machine.Config{
		Central: a.Role == "central",
		Parts:   state.Parts(),
		Release: buildinfo.Version,
		Timing:  machine.DefaultTiming(time.Duration(a.IdleTime)),
	},
		a.state,
		actuator.NewClient(actuatorURL),
		apiclient.New(a.APIUpstreams, a.apiToken),
		store,
		ctx.Logger(a),
	)
	return nil
}

// Validate checks the app's configuration.
func (a *App) Validate() error {
	if a.Role != "central" && a.Role != "facility" {
		return fmt.Errorf("role must be central or facility, not %q", a.Role)
	}
	if a.ActuatorURL != "" && (a.apiToken == "" || a.DataDir == "" || len(a.APIUpstreams) == 0) {
		return fmt.Errorf("an actuator needs an api token, a data directory and the api's addresses")
	}
	if a.ActuatorURL != "" && time.Duration(a.IdleTime) <= 0 {
		return fmt.Errorf("an actuator needs an idle time")
	}
	return nil
}

// runMu lets one machine run at a time. Caddy starts a new config's apps
// before it stops the old config's, so a new machine waits for the old one to
// stop, then continues from what it left on disk.
var runMu sync.Mutex

// Start starts the sleep and wake machine, if there is an actuator.
//
// spec: SUPV#platforms
func (a *App) Start() error {
	if a.machine == nil {
		return nil
	}
	ctx, cancel := context.WithCancel(context.Background())
	a.cancel, a.done = cancel, make(chan struct{})
	go func() {
		defer close(a.done)
		runMu.Lock()
		defer runMu.Unlock()
		if ctx.Err() == nil {
			a.machine.Run(ctx)
		}
	}()
	return nil
}

// Stop stops the machine and waits for it.
func (a *App) Stop() error {
	if a.cancel == nil {
		return nil
	}
	a.cancel()
	<-a.done
	return nil
}

// Cleanup releases the app's hold on the shared state.
func (a *App) Cleanup() error {
	_, err := pool.Delete(poolKey)
	return err
}

// State is the server's run-time state.
func (a *App) State() *state.Server { return a.state }

// CanSleep reports whether there is an actuator and it controls the parts.
func (a *App) CanSleep() bool { return a.machine != nil && a.machine.ControlsParts() }

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
	// IdleSince is when the server last had activity, or null while a
	// request that counts as activity is in flight.
	IdleSince *time.Time `json:"idleSince"`
	IdleTime  string     `json:"idleTime"`
	CanSleep  bool       `json:"canSleep"`
	Release   string     `json:"release"`
}

// Status reports the server's state.
func (a *App) Status() Status {
	snap := a.state.Snapshot()
	parts := make(map[state.Part]PartStatus, len(snap.Parts))
	for _, p := range snap.Parts {
		parts[p] = PartStatus{Ready: snap.Ready[p]}
	}
	var idleSince *time.Time
	if snap.InFlight == 0 {
		at := snap.LastActivity.UTC()
		idleSince = &at
	}
	return Status{
		State:        snap.Phase,
		Parts:        parts,
		Upgrading:    snap.Upgrading,
		LastFailure:  snap.LastFailure,
		InFlight:     snap.InFlight,
		LastActivity: snap.LastActivity.UTC(),
		IdleSince:    idleSince,
		IdleTime:     time.Duration(a.IdleTime).String(),
		CanSleep:     a.CanSleep(),
		Release:      buildinfo.Version,
	}
}

// Interface guards.
var (
	_ caddy.App          = (*App)(nil)
	_ caddy.Provisioner  = (*App)(nil)
	_ caddy.Validator    = (*App)(nil)
	_ caddy.CleanerUpper = (*App)(nil)
)
