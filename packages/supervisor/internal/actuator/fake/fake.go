// Package fake is an actuator that keeps its parts in memory, for tests and
// for running the supervisor locally. It implements the actuator contract, and
// has knobs for how parts behave.
package fake

import (
	"encoding/json"
	"maps"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/actuator"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/state"
)

// AllParts are the parts the contract names.
var AllParts = []state.Part{
	state.Database, state.API, state.Sync, state.Tasks, state.FHIR,
}

type part struct {
	desired  actuator.Desired
	observed actuator.Observed
	// generation counts desired-state changes, so a transition scheduled for
	// an earlier change does not land after a later one.
	generation int
}

// Actuator is a fake actuator. Its zero value is not usable; use New.
type Actuator struct {
	mu        sync.Mutex
	parts     map[state.Part]*part
	controls  bool
	upgrading bool
	delay     time.Duration
	stalled   map[state.Part]bool
	failing   map[state.Part]bool
	failPut   func(map[state.Part]actuator.Desired) bool
	puts      []map[state.Part]actuator.Desired
	onPut     func(map[state.Part]actuator.Desired)

	lease   lease
	reports map[string]actuator.Report
}

// New returns an actuator that controls parts, with every part up and ready.
func New() *Actuator {
	a := &Actuator{
		parts:    map[state.Part]*part{},
		controls: true,
		stalled:  map[state.Part]bool{},
		failing:  map[state.Part]bool{},
		reports:  map[string]actuator.Report{},
	}
	for _, p := range AllParts {
		a.parts[p] = &part{desired: actuator.Up, observed: actuator.Ready}
	}
	return a
}

// SetDelay sets how long a part takes to start or stop. Zero is at once.
func (a *Actuator) SetDelay(d time.Duration) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.delay = d
}

// SetControlsParts sets whether the actuator controls the parts.
func (a *Actuator) SetControlsParts(controls bool) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.controls = controls
}

// SetUpgrading sets whether an upgrade is in progress.
func (a *Actuator) SetUpgrading(upgrading bool) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.upgrading = upgrading
}

// SetPart sets p's desired and observed state at once.
func (a *Actuator) SetPart(p state.Part, desired actuator.Desired, observed actuator.Observed) {
	a.mu.Lock()
	defer a.mu.Unlock()
	part := a.parts[p]
	part.desired, part.observed = desired, observed
	part.generation++
}

// Stall makes p stay starting or stopping until it is let go.
func (a *Actuator) Stall(p state.Part, stall bool) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.stalled[p] = stall
	if !stall {
		a.settle(p)
	}
}

// Fail makes p fail rather than reach its desired state, until cleared.
func (a *Actuator) Fail(p state.Part, fail bool) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.failing[p] = fail
	if !fail && a.parts[p].observed == actuator.Failed {
		a.begin(p)
	}
}

// FailPuts makes a request to set desired states fail with a server error
// whenever match returns true for its body. nil fails none.
func (a *Actuator) FailPuts(match func(map[state.Part]actuator.Desired) bool) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.failPut = match
}

// OnPut sets a function called with each request to set desired states,
// before the actuator acts on it.
func (a *Actuator) OnPut(fn func(map[state.Part]actuator.Desired)) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.onPut = fn
}

// Puts returns the bodies of every request to set desired states so far,
// including failed ones.
func (a *Actuator) Puts() []map[state.Part]actuator.Desired {
	a.mu.Lock()
	defer a.mu.Unlock()
	return append([]map[state.Part]actuator.Desired(nil), a.puts...)
}

// State returns the actuator's state, as GET /v1/state would.
func (a *Actuator) State() actuator.State {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.stateLocked()
}

func (a *Actuator) stateLocked() actuator.State {
	parts := make(map[state.Part]actuator.PartState, len(a.parts))
	for name, p := range a.parts {
		parts[name] = actuator.PartState{Desired: p.desired, Observed: p.observed}
	}
	s := actuator.State{ControlsParts: a.controls, Upgrading: a.upgrading, Parts: parts, Reports: map[string]actuator.Report{}}
	now := time.Now()
	if a.lease.heldAt(now) {
		s.Lease = &actuator.LeaseInfo{Holder: a.lease.holder, ExpiresAt: a.lease.expires}
	}
	for instance, r := range a.reports {
		if r.ExpiresAt.After(now) {
			s.Reports[instance] = r
		}
	}
	return s
}

// ServeHTTP implements the contract, plus PUT /fake/upgrading and
// PUT /fake/controls-parts with a body of true or false, for driving a local
// run by hand.
func (a *Actuator) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	switch {
	case r.URL.Path == "/v1/state" && r.Method == http.MethodGet:
		writeJSON(w, http.StatusOK, a.State())
	case r.URL.Path == "/v1/state" && r.Method == http.MethodPut:
		a.put(w, r)
	case r.URL.Path == "/v1/lease":
		a.serveLease(w, r)
	case strings.HasPrefix(r.URL.Path, "/v1/reports/") && r.Method == http.MethodPut:
		a.serveReport(w, r)
	case r.URL.Path == "/fake/upgrading" && r.Method == http.MethodPut:
		a.knob(w, r, a.SetUpgrading)
	case r.URL.Path == "/fake/controls-parts" && r.Method == http.MethodPut:
		a.knob(w, r, a.SetControlsParts)
	default:
		http.NotFound(w, r)
	}
}

func (a *Actuator) knob(w http.ResponseWriter, r *http.Request, set func(bool)) {
	var value bool
	if err := json.NewDecoder(r.Body).Decode(&value); err != nil {
		http.Error(w, "body must be true or false", http.StatusBadRequest)
		return
	}
	set(value)
	writeJSON(w, http.StatusOK, a.State())
}

func (a *Actuator) put(w http.ResponseWriter, r *http.Request) {
	var body actuator.DesiredState
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	for name, d := range body.Parts {
		if _, ok := a.parts[name]; !ok || (d != actuator.Up && d != actuator.Down) {
			http.Error(w, "unknown part or state: "+string(name)+" "+string(d), http.StatusBadRequest)
			return
		}
	}

	a.mu.Lock()
	a.puts = append(a.puts, maps.Clone(body.Parts))
	onPut, failPut, controls := a.onPut, a.failPut, a.controls
	current := a.lease.current(r)
	a.mu.Unlock()

	if !current {
		a.refuse(w)
		return
	}
	if onPut != nil {
		onPut(body.Parts)
	}
	if failPut != nil && failPut(body.Parts) {
		http.Error(w, "fake failure", http.StatusInternalServerError)
		return
	}
	if !controls {
		http.Error(w, "this actuator does not control the server's parts", http.StatusForbidden)
		return
	}

	a.mu.Lock()
	for name, d := range body.Parts {
		p := a.parts[name]
		if p.desired == d && p.observed != actuator.Failed {
			continue
		}
		p.desired = d
		a.begin(name)
	}
	s := a.stateLocked()
	a.mu.Unlock()
	writeJSON(w, http.StatusAccepted, s)
}

// begin starts moving p towards its desired state. Called with the lock held.
func (a *Actuator) begin(name state.Part) {
	p := a.parts[name]
	p.generation++
	if p.desired == actuator.Up {
		p.observed = actuator.Starting
	} else {
		p.observed = actuator.Stopping
	}
	if a.delay == 0 {
		a.settle(name)
		return
	}
	gen := p.generation
	time.AfterFunc(a.delay, func() {
		a.mu.Lock()
		defer a.mu.Unlock()
		if p.generation == gen {
			a.settle(name)
		}
	})
}

// settle finishes moving p, unless it is stalled. Called with the lock held.
func (a *Actuator) settle(name state.Part) {
	p := a.parts[name]
	if a.stalled[name] || (p.observed != actuator.Starting && p.observed != actuator.Stopping) {
		return
	}
	switch {
	case a.failing[name]:
		p.observed = actuator.Failed
	case p.desired == actuator.Up:
		p.observed = actuator.Ready
	default:
		p.observed = actuator.Stopped
	}
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	b, _ := json.Marshal(body)
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Length", strconv.Itoa(len(b)))
	w.WriteHeader(status)
	_, _ = w.Write(b)
}
