// Package app is the supervisor's Caddy app, "tamanu", which owns the
// server's run-time state and runs the sleep and wake machine.
package app

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/url"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/caddyserver/caddy/v2"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/actuator"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/apiclient"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/buildinfo"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/machine"
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
	// APIUpstreams are the api instances (host:port) the supervisor calls.
	APIUpstreams []string `json:"api_upstreams,omitempty"`

	state    *state.Server
	apiToken string
	instance string
	machine  *machine.Machine
	cancel   context.CancelFunc
	done     chan struct{}
	signals  chan os.Signal
}

// CaddyModule returns the Caddy module information.
func (App) CaddyModule() caddy.ModuleInfo {
	return caddy.ModuleInfo{
		ID:  ID,
		New: func() caddy.Module { return new(App) },
	}
}

// Provision sets up the app and its state.
func (a *App) Provision(ctx caddy.Context) error {
	a.apiToken = caddy.NewReplacer().ReplaceAll(a.APIToken, "")
	a.state = state.New(state.Parts())

	if a.ActuatorURL == "" {
		return nil
	}
	actuatorURL, err := url.Parse(a.ActuatorURL)
	if err != nil {
		return fmt.Errorf("actuator url: %w", err)
	}
	a.instance = newInstanceID()
	a.machine = machine.New(machine.Config{
		Central:  a.Role == "central",
		Parts:    state.Parts(),
		Release:  buildinfo.Version,
		Instance: a.instance,
		Timing:   machine.DefaultTiming(time.Duration(a.IdleTime)),
	},
		a.state,
		actuator.NewClient(actuatorURL),
		apiclient.New(a.APIUpstreams, a.apiToken),
		ctx.Logger(a),
	)
	return nil
}

// newInstanceID names this process to the actuator.
func newInstanceID() string {
	b := make([]byte, 8)
	_, _ = rand.Read(b)
	host, _ := os.Hostname()
	if host == "" {
		return hex.EncodeToString(b)
	}
	return host + "-" + hex.EncodeToString(b)
}

// Validate checks the app's configuration.
func (a *App) Validate() error {
	if a.Role != "central" && a.Role != "facility" {
		return fmt.Errorf("role must be central or facility, not %q", a.Role)
	}
	if a.ActuatorURL != "" && (a.apiToken == "" || len(a.APIUpstreams) == 0) {
		return fmt.Errorf("an actuator needs an api token and the api's addresses")
	}
	if a.ActuatorURL != "" && time.Duration(a.IdleTime) <= 0 {
		return fmt.Errorf("an actuator needs an idle time")
	}
	return nil
}

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
		a.machine.Run(ctx)
	}()

	// Caddy drains connections before it stops the apps, so the lease is
	// given up here, as the signal arrives, and the machine goes on following
	// while the connections drain.
	//
	// spec: SUPV#resilience
	a.signals = make(chan os.Signal, 1)
	signal.Notify(a.signals, os.Interrupt, syscall.SIGTERM)
	go func() {
		if _, ok := <-a.signals; ok {
			a.machine.StepDown()
		}
	}()
	return nil
}

// Stop gives up the lease, stops the machine and waits for it.
func (a *App) Stop() error {
	if a.cancel == nil {
		return nil
	}
	signal.Stop(a.signals)
	close(a.signals)
	a.machine.StepDown()
	a.cancel()
	<-a.done
	return nil
}

// Ready reports whether the supervisor knows what to do with requests: at
// once without an actuator, and once it has read the actuator's state with
// one, whether or not it holds the lease.
func (a *App) Ready() bool { return a.machine == nil || a.machine.Ready() }

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
	// Lease is "holder" or "follower" with an actuator, and empty without.
	Lease string `json:"lease,omitempty"`
	// Announcement is the phase announcement this supervisor made or follows.
	Announcement *actuator.Announcement `json:"announcement,omitempty"`
	Instance     string                 `json:"instance,omitempty"`
	Ready        bool                   `json:"ready"`
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
		Lease:        a.leaseState(),
		Announcement: a.announcement(),
		Instance:     a.instance,
		Ready:        a.Ready(),
	}
}

func (a *App) announcement() *actuator.Announcement {
	if a.machine == nil {
		return nil
	}
	id := a.machine.Announcement()
	return &id
}

func (a *App) leaseState() string {
	switch {
	case a.machine == nil:
		return ""
	case a.machine.HoldsLease():
		return "holder"
	default:
		return "follower"
	}
}

// Interface guards.
var (
	_ caddy.App         = (*App)(nil)
	_ caddy.Provisioner = (*App)(nil)
	_ caddy.Validator   = (*App)(nil)
)
