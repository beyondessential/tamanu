package machine

import (
	"context"
	"fmt"
	"maps"
	"net/http/httptest"
	"net/url"
	"slices"
	"strings"
	"sync"
	"testing"
	"time"

	"go.uber.org/zap/zaptest"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/actuator"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/actuator/fake"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/apiclient"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/apiclient/fakeapi"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/persist"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/state"
)

const testRelease = "2.70.0"

func testTiming() Timing {
	return Timing{
		IdleTime:       40 * time.Millisecond,
		BusyRecheck:    60 * time.Millisecond,
		ActuatorPoll:   5 * time.Millisecond,
		PartTimeout:    300 * time.Millisecond,
		WakeBackoff:    10 * time.Millisecond,
		WakeBackoffMax: 40 * time.Millisecond,
		LeaseTTL:       150 * time.Millisecond,
		LeaseRenew:     30 * time.Millisecond,
		LeaseRetry:     5 * time.Millisecond,
		ReportEvery:    10 * time.Millisecond,
		ReportTTL:      40 * time.Millisecond,
		SettleTimeout:  2 * time.Second,
	}
}

// harness runs machines against a fake actuator and a fake api, over HTTP.
// The actuator, which keeps the lease and the saved state, outlives each
// machine, as it does a restart.
type harness struct {
	t       *testing.T
	central bool
	act     *fake.Actuator
	api     *fakeapi.API
	actURL  *url.URL
	apiAddr string
	timing  Timing
	started int

	mu       sync.Mutex
	st       *state.Server
	m        *Machine
	cancel   context.CancelFunc
	done     chan struct{}
	apiHooks []func(call string)
	putHooks []func(parts map[state.Part]actuator.Desired)
	held     []func()
}

func newHarness(t *testing.T, central bool) *harness {
	t.Helper()
	h := &harness{
		t:       t,
		central: central,
		act:     fake.New(),
		api:     fakeapi.New(testRelease),
		timing:  testTiming(),
	}
	actSrv := httptest.NewServer(h.act)
	apiSrv := httptest.NewServer(h.api)
	h.actURL, _ = url.Parse(actSrv.URL)
	h.apiAddr = strings.TrimPrefix(apiSrv.URL, "http://")
	h.api.OnCall(func(call string) {
		h.mu.Lock()
		hooks := slices.Clone(h.apiHooks)
		h.mu.Unlock()
		for _, hook := range hooks {
			hook(call)
		}
	})
	h.act.OnPut(func(parts map[state.Part]actuator.Desired) {
		h.mu.Lock()
		hooks := slices.Clone(h.putHooks)
		h.mu.Unlock()
		for _, hook := range hooks {
			hook(parts)
		}
	})
	t.Cleanup(func() {
		h.stop()
		h.release()
		actSrv.Close()
		apiSrv.Close()
	})
	return h
}

// start runs a new machine, as a newly started supervisor of release would.
func (h *harness) start(release string) {
	h.t.Helper()
	parts := state.Parts()
	st := state.New(parts)
	act := actuator.NewClient(h.actURL)
	act.PollInterval = time.Millisecond
	api := apiclient.New([]string{h.apiAddr}, fakeapi.Token)
	h.mu.Lock()
	h.started++
	instance := fmt.Sprintf("supervisor-%d", h.started)
	h.mu.Unlock()
	m := New(Config{Central: h.central, Parts: parts, Release: release, Instance: instance, Timing: h.timing},
		st, act, api, zaptest.NewLogger(h.t))

	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan struct{})
	h.mu.Lock()
	h.st, h.m, h.cancel, h.done = st, m, cancel, done
	h.mu.Unlock()
	go func() {
		defer close(done)
		m.Run(ctx)
	}()
}

// crash stops the machine without releasing the lease, as a killed
// supervisor would, without waiting. Safe to call from a hook.
func (h *harness) crash() {
	h.mu.Lock()
	cancel := h.cancel
	h.mu.Unlock()
	if cancel != nil {
		cancel()
	}
}

// waitStopped waits for a crashed machine to stop.
func (h *harness) waitStopped() {
	h.mu.Lock()
	done := h.done
	h.mu.Unlock()
	if done != nil {
		<-done
	}
}

// stop stops the machine as a supervisor that is stopped does, giving up the
// lease first, and waits for it.
func (h *harness) stop() {
	h.mu.Lock()
	m := h.m
	h.mu.Unlock()
	if m != nil {
		m.StepDown()
	}
	h.crash()
	h.waitStopped()
}

// machine is the latest machine started.
func (h *harness) machine() *Machine {
	h.mu.Lock()
	defer h.mu.Unlock()
	return h.m
}

func (h *harness) state() *state.Server {
	h.mu.Lock()
	defer h.mu.Unlock()
	return h.st
}

func (h *harness) snapshot() state.Snapshot { return h.state().Snapshot() }

// activity is a request that counts as activity and finishes at once.
func (h *harness) activity() {
	_, done := h.state().AdmitActivity(state.API)
	done()
}

// holdOpen starts a request that counts as activity and stays in flight
// until the test ends, keeping an awake server awake.
func (h *harness) holdOpen() {
	_, done := h.state().AdmitActivity(state.API)
	h.mu.Lock()
	h.held = append(h.held, done)
	h.mu.Unlock()
}

func (h *harness) release() {
	h.mu.Lock()
	held := h.held
	h.held = nil
	h.mu.Unlock()
	for _, done := range held {
		done()
	}
}

// keepAwakeAfterWake holds a request open as soon as a wake releases the
// task hold, its last step, so the server cannot fall asleep again while the
// test looks at it.
func (h *harness) keepAwakeAfterWake() {
	h.onAPI(func(call string) {
		if call == "DELETE /tasks/hold" {
			h.holdOpen()
		}
	})
}

// onAPI adds a function called with each api call before it is answered.
func (h *harness) onAPI(fn func(call string)) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.apiHooks = append(h.apiHooks, fn)
}

// onPut adds a function called with each actuator request before it is
// acted on.
func (h *harness) onPut(fn func(parts map[state.Part]actuator.Desired)) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.putHooks = append(h.putHooks, fn)
}

// clearHooks removes every hook.
func (h *harness) clearHooks() {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.apiHooks, h.putHooks = nil, nil
}

func (h *harness) eventually(what string, cond func() bool) {
	h.t.Helper()
	deadline := time.Now().Add(5 * time.Second)
	for !cond() {
		if time.Now().After(deadline) {
			snap := h.snapshot()
			h.t.Fatalf("timed out waiting for %s; phase %s, failure %+v, puts %v, calls %v",
				what, snap.Phase, snap.LastFailure, h.act.Puts(), h.api.Calls())
		}
		time.Sleep(time.Millisecond)
	}
}

// waitHolding waits for the harness's machine to hold the lease and have
// announced the server awake.
func (h *harness) waitHolding() {
	h.t.Helper()
	h.eventually("holding the lease, awake", func() bool {
		return h.machine().HoldsLease() && h.snapshot().Phase == state.Awake && !h.machine().Announcement().IsZero()
	})
}

func (h *harness) waitPhase(phase state.Phase) {
	h.t.Helper()
	h.eventually("phase "+string(phase), func() bool { return h.snapshot().Phase == phase })
}

// waitAwakeAfterWake waits for a wake to finish, with keepAwakeAfterWake set.
func (h *harness) waitAwakeAfterWake() {
	h.t.Helper()
	h.eventually("awake, held open", func() bool {
		snap := h.snapshot()
		return snap.Phase == state.Awake && snap.InFlight > 0
	})
}

// persisted is the state saved with the actuator.
func (h *harness) persisted() persist.Record {
	h.t.Helper()
	doc := h.act.SavedState()
	if doc == nil {
		return persist.Record{}
	}
	rec, _, err := persist.Decode(doc)
	if err != nil {
		h.t.Fatal(err)
	}
	return rec
}

// save saves rec with the actuator, as a supervisor before would have.
func (h *harness) save(rec persist.Record) {
	h.t.Helper()
	doc, err := persist.Encode(rec)
	if err != nil {
		h.t.Fatal(err)
	}
	h.act.SetSavedState(doc)
}

// puts returns the actuator requests so far, each as its sorted "part=state"
// pairs joined by spaces.
func (h *harness) puts() []string {
	var out []string
	for _, put := range h.act.Puts() {
		out = append(out, describePut(put))
	}
	return out
}

func describePut(put map[state.Part]actuator.Desired) string {
	var pairs []string
	for _, p := range slices.Sorted(maps.Keys(put)) {
		pairs = append(pairs, string(p)+"="+string(put[p]))
	}
	return strings.Join(pairs, " ")
}

// sleepPuts are the actuator requests of a full sleep.
func sleepPuts() []string {
	return []string{"fhir=down tasks=down", "api=down sync=down", "database=down"}
}

// wakePuts are the actuator requests of a full wake.
func wakePuts() []string {
	return []string{"database=up", "api=up fhir=up sync=up tasks=up"}
}

func (h *harness) allUp() bool {
	parts := state.Parts()
	s := h.act.State()
	return s.AllDesired(parts, actuator.Up) && s.AllObserved(parts, actuator.Ready)
}

func (h *harness) allDown() bool {
	parts := state.Parts()
	s := h.act.State()
	return s.AllDesired(parts, actuator.Down) && s.AllObserved(parts, actuator.Stopped)
}
