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

// harness runs supervisors of one server against a fake actuator and a fake
// api, over HTTP. The actuator, which keeps the lease and the parts, outlives
// each supervisor, as it does a restart.
type harness struct {
	t       *testing.T
	central bool
	act     *fake.Actuator
	api     *fakeapi.API
	actURL  *url.URL
	apiAddr string
	// timing is the timing of the supervisors started from now on.
	timing Timing

	mu          sync.Mutex
	supervisors []*supervisor
	apiHooks    []func(call string)
	putHooks    []func(parts map[state.Part]actuator.Desired)
}

// supervisor is one supervisor the harness started.
type supervisor struct {
	h        *harness
	instance string
	st       *state.Server
	m        *Machine
	cancel   context.CancelFunc
	done     chan struct{}

	mu   sync.Mutex
	held []func()
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
		h.mu.Lock()
		supervisors := h.supervisors
		h.mu.Unlock()
		for _, s := range supervisors {
			s.stop()
		}
		actSrv.Close()
		apiSrv.Close()
	})
	return h
}

// start runs a new supervisor of release, with the harness's timing.
func (h *harness) start(release string) *supervisor {
	h.t.Helper()
	parts := state.Parts()
	act := actuator.NewClient(h.actURL)
	act.PollInterval = time.Millisecond
	api := apiclient.New([]string{h.apiAddr}, fakeapi.Token)
	h.mu.Lock()
	s := &supervisor{h: h, instance: fmt.Sprintf("supervisor-%d", len(h.supervisors)+1), st: state.New(parts), done: make(chan struct{})}
	h.supervisors = append(h.supervisors, s)
	h.mu.Unlock()
	s.m = New(Config{Central: h.central, Parts: parts, Release: release, Instance: s.instance, Timing: h.timing},
		s.st, act, api, zaptest.NewLogger(h.t))

	ctx, cancel := context.WithCancel(context.Background())
	s.cancel = cancel
	go func() {
		defer close(s.done)
		s.m.Run(ctx)
	}()
	return s
}

// crash stops the supervisor without releasing the lease, as a killed
// supervisor would, and waits for it.
func (s *supervisor) crash() {
	s.cancel()
	<-s.done
}

// stop stops the supervisor as a supervisor that is stopped does, giving up
// the lease first, and waits for it. It ends the requests s holds open.
func (s *supervisor) stop() {
	s.mu.Lock()
	held := s.held
	s.held = nil
	s.mu.Unlock()
	for _, done := range held {
		done()
	}
	s.m.StepDown()
	s.crash()
}

func (s *supervisor) snapshot() state.Snapshot { return s.st.Snapshot() }

func (s *supervisor) phase() state.Phase { return s.snapshot().Phase }

// activity is a request at s that counts as activity and finishes at once,
// and what s did with it.
func (s *supervisor) activity() state.Admission {
	admission, done := s.st.AdmitActivity(state.API)
	done()
	return admission
}

// holdOpen starts a request at s that counts as activity, and what s did with
// it. A forwarded request stays in flight until release or s stops.
func (s *supervisor) holdOpen() (admission state.Admission, release func()) {
	admission, done := s.st.AdmitActivity(state.API)
	s.mu.Lock()
	s.held = append(s.held, done)
	s.mu.Unlock()
	return admission, done
}

// busy keeps the server awake, from as soon as s starts, until release: it
// holds open a request for one of the supervisor's own files, which is in
// flight whatever the phase.
func (s *supervisor) busy() (release func()) {
	done := s.st.AdmitStatic()
	s.mu.Lock()
	s.held = append(s.held, done)
	s.mu.Unlock()
	return done
}

// keepAwakeAfterWake holds a request open at s as soon as a wake releases the
// task hold, its last step, so the server cannot fall asleep again while the
// test looks at it.
func (s *supervisor) keepAwakeAfterWake() {
	s.h.onAPI(func(call string) {
		if call == "DELETE /tasks/hold" {
			s.holdOpen()
		}
	})
}

// onAPI adds a function called with each api call before it is answered.
func (h *harness) onAPI(fn func(call string)) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.apiHooks = append(h.apiHooks, fn)
}

// onPut adds a function called with each actuator request carrying the
// lease's token, before it is acted on.
func (h *harness) onPut(fn func(parts map[state.Part]actuator.Desired)) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.putHooks = append(h.putHooks, fn)
}

func (h *harness) eventually(what string, cond func() bool) {
	h.t.Helper()
	deadline := time.Now().Add(5 * time.Second)
	for !cond() {
		if time.Now().After(deadline) {
			h.mu.Lock()
			var phases []string
			for _, s := range h.supervisors {
				snap := s.snapshot()
				phases = append(phases, fmt.Sprintf("%s %s, failure %+v", s.instance, snap.Phase, snap.LastFailure))
			}
			h.mu.Unlock()
			h.t.Fatalf("timed out waiting for %s; %s; puts %v, calls %v",
				what, strings.Join(phases, "; "), h.puts(), h.api.Calls())
		}
		time.Sleep(time.Millisecond)
	}
}

// waitHolding waits for s to hold the lease and have announced the server
// awake.
func (s *supervisor) waitHolding() {
	s.h.t.Helper()
	s.h.eventually(s.instance+" holding the lease, awake", func() bool {
		return s.m.HoldsLease() && s.phase() == state.Awake && !s.m.Announcement().IsZero()
	})
}

func (s *supervisor) waitPhase(phase state.Phase) {
	s.h.t.Helper()
	s.h.eventually(s.instance+" "+string(phase), func() bool { return s.phase() == phase })
}

// waitFollowing waits for s to follow the holder's announcement.
func (s *supervisor) waitFollowing(holder *supervisor) {
	s.h.t.Helper()
	s.h.eventually(s.instance+" following "+holder.instance, func() bool {
		ann := holder.m.Announcement()
		return !ann.IsZero() && s.m.Announcement() == ann && s.phase() == holder.phase()
	})
}

// waitAwakeAfterWake waits for a wake to finish, with keepAwakeAfterWake set.
func (s *supervisor) waitAwakeAfterWake() {
	s.h.t.Helper()
	s.h.eventually(s.instance+" awake, held open", func() bool {
		snap := s.snapshot()
		return snap.Phase == state.Awake && snap.InFlight > 0
	})
}

// puts returns the actuator requests so far, each as its sorted "part=state"
// pairs joined by spaces.
func (h *harness) puts() []string {
	var out []string
	for _, put := range h.act.Puts() {
		var pairs []string
		for _, p := range slices.Sorted(maps.Keys(put)) {
			pairs = append(pairs, string(p)+"="+string(put[p]))
		}
		out = append(out, strings.Join(pairs, " "))
	}
	return out
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

// count is how many of calls are call.
func count(calls []string, call string) int {
	n := 0
	for _, c := range calls {
		if c == call {
			n++
		}
	}
	return n
}

// anyDown reports whether any of puts stops a part.
func anyDown(puts []string) bool {
	return slices.ContainsFunc(puts, func(put string) bool { return strings.Contains(put, "=down") })
}
