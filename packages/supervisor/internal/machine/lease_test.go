package machine

import (
	"context"
	"testing"
	"time"

	"go.uber.org/zap/zaptest"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/actuator"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/apiclient"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/apiclient/fakeapi"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/state"
)

// other is a second supervisor of the harness's server, alongside the
// harness's own machine.
type other struct {
	m      *Machine
	st     *state.Server
	cancel context.CancelFunc
	done   chan struct{}
}

func (h *harness) startOther(instance string) *other {
	h.t.Helper()
	st := state.New(state.Parts())
	act := actuator.NewClient(h.actURL)
	act.PollInterval = time.Millisecond
	m := New(Config{Parts: state.Parts(), Release: testRelease, Instance: instance, Timing: h.timing},
		st, act, apiclient.New([]string{h.apiAddr}, fakeapi.Token), zaptest.NewLogger(h.t))
	ctx, cancel := context.WithCancel(context.Background())
	o := &other{m: m, st: st, cancel: cancel, done: make(chan struct{})}
	go func() {
		defer close(o.done)
		m.Run(ctx)
	}()
	h.t.Cleanup(o.stop)
	return o
}

func (o *other) stop() {
	o.cancel()
	o.m.ReleaseLease()
	<-o.done
}

// spec: SUPV#resilience
func TestServesOnlyWithTheLease(t *testing.T) {
	h := newHarness(t, false)
	h.act.TakeLeaseAs("another", time.Minute)
	h.start(testRelease)

	time.Sleep(5 * h.timing.LeaseRetry)
	if h.snapshot().Serving || h.machine().HoldsLease() {
		t.Fatal("serving without the lease")
	}
	if got := h.state().Admit(state.API); got != state.Standby {
		t.Errorf("admission without the lease = %v", got)
	}
	if len(h.act.Puts()) != 0 || len(h.api.Calls()) != 0 {
		t.Errorf("acted without the lease: puts %q, calls %q", h.puts(), h.api.Calls())
	}

	h.act.ExpireLease()
	h.waitServing()
	if !h.machine().HoldsLease() || h.act.LeaseHolder() != "supervisor-1" {
		t.Errorf("holder = %q", h.act.LeaseHolder())
	}
}

// spec: SUPV#resilience
func TestSecondSupervisorWaits(t *testing.T) {
	t.Run("until the first releases the lease", func(t *testing.T) {
		h := newHarness(t, false)
		h.timing.LeaseTTL = time.Minute
		h.start(testRelease)
		h.waitServing()

		second := h.startOther("second")
		time.Sleep(10 * h.timing.LeaseRetry)
		if second.st.Snapshot().Serving {
			t.Fatal("two supervisors serving at once")
		}

		h.stop()
		if h.act.LeaseHolder() == "supervisor-1" {
			t.Error("a stopped supervisor kept the lease")
		}
		h.eventually("the second serving", func() bool { return second.st.Snapshot().Serving })
		if h.act.LeaseHolder() != "second" {
			t.Errorf("holder = %q", h.act.LeaseHolder())
		}
	})

	t.Run("until the first's lease expires", func(t *testing.T) {
		h := newHarness(t, false)
		h.start(testRelease)
		h.waitServing()
		second := h.startOther("second")

		h.crash()
		h.waitStopped()
		h.eventually("the second serving", func() bool { return second.st.Snapshot().Serving })
	})
}

// spec: SLPWK#actuator-contract
func TestLosingTheLeaseStopsActing(t *testing.T) {
	h := newHarness(t, false)
	h.timing.IdleTime = time.Hour
	h.start(testRelease)
	h.waitServing()

	h.act.TakeLeaseAs("intruder", time.Minute)
	h.eventually("standby", func() bool { return !h.snapshot().Serving && !h.machine().HoldsLease() })
	if got := h.state().Admit(state.API); got != state.Standby {
		t.Errorf("admission after losing the lease = %v", got)
	}

	h.act.ExpireLease()
	h.waitServing()
}

// spec: SLPWK#actuator-contract
func TestReports(t *testing.T) {
	h := newHarness(t, false)
	h.timing.IdleTime = time.Hour
	h.start(testRelease)
	h.waitServing()

	h.eventually("a report", func() bool {
		_, ok := h.act.Reports()["supervisor-1"]
		return ok
	})
	h.holdOpen()
	h.eventually("a report of the request in flight", func() bool {
		return h.act.Reports()["supervisor-1"].InFlight == 1
	})

	h.crash()
	h.waitStopped()
	h.eventually("the report expiring", func() bool {
		_, ok := h.act.Reports()["supervisor-1"]
		return !ok
	})
}

func TestReportsWakeRequests(t *testing.T) {
	h := newHarness(t, false)
	h.start(testRelease)
	h.waitPhase(state.Asleep)

	// Stall the wake, so the request is reported before the server is awake.
	h.act.Stall(state.Database, true)
	h.activity()
	h.eventually("a report of the wake request", func() bool {
		return h.act.Reports()["supervisor-1"].WakeRequested
	})
	h.act.Stall(state.Database, false)
}
