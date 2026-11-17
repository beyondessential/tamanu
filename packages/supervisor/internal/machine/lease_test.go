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
	t      *testing.T
	m      *Machine
	st     *state.Server
	cancel context.CancelFunc
	done   chan struct{}
	held   []func()
}

// startOther starts another supervisor with the harness's timing, adjusted
// by tune if it is not nil.
func (h *harness) startOther(instance string, tune func(*Timing)) *other {
	h.t.Helper()
	timing := h.timing
	if tune != nil {
		tune(&timing)
	}
	st := state.New(state.Parts())
	act := actuator.NewClient(h.actURL)
	act.PollInterval = time.Millisecond
	m := New(Config{Parts: state.Parts(), Release: testRelease, Instance: instance, Timing: timing},
		st, act, apiclient.New([]string{h.apiAddr}, fakeapi.Token), zaptest.NewLogger(h.t))
	ctx, cancel := context.WithCancel(context.Background())
	o := &other{t: h.t, m: m, st: st, cancel: cancel, done: make(chan struct{})}
	go func() {
		defer close(o.done)
		m.Run(ctx)
	}()
	h.t.Cleanup(o.stop)
	return o
}

func (o *other) stop() {
	for _, done := range o.held {
		done()
	}
	o.held = nil
	o.m.StepDown()
	o.cancel()
	<-o.done
}

func (o *other) phase() state.Phase { return o.st.Snapshot().Phase }

// activity is a request at this supervisor that counts as activity and
// finishes at once, and what the supervisor did with it.
func (o *other) activity() state.Admission {
	admission, done := o.st.AdmitActivity(state.API)
	done()
	return admission
}

// holdOpen starts a request that counts as activity and stays in flight
// until release or the test ends.
func (o *other) holdOpen() (release func()) {
	admission, done := o.st.AdmitActivity(state.API)
	if admission != state.Forward {
		o.t.Fatalf("the request to hold open was not forwarded: %v", admission)
	}
	o.held = append(o.held, done)
	return done
}

// following waits for o to follow the harness machine's announcement.
func (h *harness) following(o *other) {
	h.t.Helper()
	h.eventually("the other supervisor following", func() bool {
		return o.m.Announcement() == h.machine().Announcement() && o.phase() == h.snapshot().Phase
	})
}

// spec: SUPV#resilience
func TestEverySupervisorForwardsWhileAwake(t *testing.T) {
	h := newHarness(t, false)
	h.timing.IdleTime = time.Hour
	h.start(testRelease)
	h.waitHolding()
	o := h.startOther("second", nil)
	h.following(o)

	if o.m.HoldsLease() {
		t.Error("two supervisors hold the lease")
	}
	if got := o.st.Admit(state.API); got != state.Forward {
		t.Errorf("follower admission = %v", got)
	}
	if got := h.state().Admit(state.API); got != state.Forward {
		t.Errorf("holder admission = %v", got)
	}
	if !o.m.Ready() {
		t.Error("a follower that has read the actuator's state is not ready")
	}
}

// spec: SLPWK#activity
func TestActivityAtAFollowerKeepsTheServerAwake(t *testing.T) {
	h := newHarness(t, false)
	h.timing.IdleTime = 150 * time.Millisecond
	h.start(testRelease)
	h.waitHolding()
	o := h.startOther("second", nil)
	h.following(o)

	t.Run("requests in turn", func(t *testing.T) {
		until := time.Now().Add(4 * h.timing.IdleTime)
		for time.Now().Before(until) {
			if got := o.activity(); got != state.Forward {
				t.Fatalf("follower admission = %v", got)
			}
			time.Sleep(h.timing.IdleTime / 5)
		}
		if len(h.api.Calls()) != 0 {
			t.Errorf("went to sleep with activity at the follower: %q", h.api.Calls())
		}
	})

	t.Run("a request in flight", func(t *testing.T) {
		release := o.holdOpen()
		time.Sleep(4 * h.timing.IdleTime)
		if len(h.api.Calls()) != 0 {
			t.Errorf("went to sleep with a request in flight at the follower: %q", h.api.Calls())
		}
		release()
	})

	h.waitPhase(state.Asleep)
	h.eventually("the follower following asleep", func() bool { return o.phase() == state.Asleep })
}

// spec: SLPWK#waking
func TestWakeRequestedAtAFollower(t *testing.T) {
	h := newHarness(t, false)
	h.start(testRelease)
	h.waitHolding()
	o := h.startOther("second", nil)
	h.waitPhase(state.Asleep)
	h.following(o)

	if got := o.activity(); got != state.Hold {
		t.Fatalf("follower admission while asleep = %v", got)
	}
	h.keepAwakeAfterWake()
	h.waitAwakeAfterWake()
	h.eventually("the follower forwarding again", func() bool {
		return o.phase() == state.Awake && o.st.Admit(state.API) == state.Forward
	})
}

// spec: SLPWK#going-to-sleep
func TestSleepWaitsForAFollowersRequestInFlight(t *testing.T) {
	h := newHarness(t, false)
	h.start(testRelease)
	h.waitHolding()
	// The follower reports only when it must, and its reports last, so the
	// holder decides to sleep without seeing the request it has in flight.
	o := h.startOther("second", func(t *Timing) { t.ReportEvery, t.ReportTTL = time.Hour, time.Hour })
	h.following(o)
	h.eventually("the follower's report of following", func() bool {
		r, ok := h.act.Reports()["second"]
		return ok && r.Follows == h.machine().Announcement()
	})
	release := o.holdOpen()

	h.eventually("going to sleep", func() bool { return h.snapshot().Phase == state.GoingToSleep })
	h.eventually("the follower following", func() bool { return o.phase() == state.GoingToSleep })
	time.Sleep(10 * h.timing.ActuatorPoll)
	if calls := h.api.Calls(); len(calls) != 0 || len(h.act.Puts()) != 0 {
		t.Fatalf("went on with a request in flight at the follower: calls %q, puts %q", calls, h.puts())
	}

	release()
	h.waitPhase(state.Asleep)
}

// spec: SLPWK#going-to-sleep
func TestAnExpiredReportIsNotWaitedFor(t *testing.T) {
	h := newHarness(t, false)
	h.start(testRelease)
	h.waitHolding()
	// A supervisor that stopped reporting, behind on announcements.
	h.act.PutReport("gone", actuator.Report{LastActivity: time.Now().Add(-time.Hour)}, 300*time.Millisecond)

	h.eventually("going to sleep", func() bool { return h.snapshot().Phase == state.GoingToSleep })
	time.Sleep(5 * h.timing.ActuatorPoll)
	if len(h.act.Puts()) != 0 {
		t.Fatalf("stopped parts while waiting for a report: %q", h.puts())
	}
	h.waitPhase(state.Asleep)
}

// spec: SUPV#resilience
func TestHandingOver(t *testing.T) {
	t.Run("awake, with no gap in forwarding", func(t *testing.T) {
		h := newHarness(t, false)
		h.timing.IdleTime = time.Hour
		h.start(testRelease)
		h.waitHolding()
		o := h.startOther("second", nil)
		h.following(o)

		stopped := make(chan struct{})
		go func() {
			defer close(stopped)
			h.stop()
		}()
		for !o.m.HoldsLease() {
			if got := o.st.Admit(state.API); got != state.Forward {
				t.Fatalf("follower admission during the handover = %v", got)
			}
			time.Sleep(time.Millisecond)
		}
		<-stopped
		if got := o.st.Admit(state.API); got != state.Forward || o.phase() != state.Awake {
			t.Errorf("new holder: admission %v, phase %s", got, o.phase())
		}
		if len(h.act.Puts()) != 0 {
			t.Errorf("the handover set desired states: %q", h.puts())
		}
	})

	t.Run("asleep, without waking", func(t *testing.T) {
		h := newHarness(t, false)
		h.start(testRelease)
		h.waitHolding()
		o := h.startOther("second", nil)
		h.waitPhase(state.Asleep)
		h.following(o)
		puts := len(h.act.Puts())

		h.stop()
		h.eventually("the second holding the lease", o.m.HoldsLease)
		time.Sleep(10 * h.timing.ActuatorPoll)
		if o.phase() != state.Asleep || len(h.act.Puts()) != puts {
			t.Errorf("phase %s, puts %q", o.phase(), h.puts()[puts:])
		}
	})

	t.Run("after the holder's lease expires", func(t *testing.T) {
		h := newHarness(t, false)
		h.timing.IdleTime = time.Hour
		h.start(testRelease)
		h.waitHolding()
		o := h.startOther("second", nil)
		h.following(o)

		h.crash()
		h.waitStopped()
		h.eventually("the second holding the lease", o.m.HoldsLease)
	})
}

// spec: SUPV#resilience
func TestSteppingDownKeepsFollowing(t *testing.T) {
	h := newHarness(t, false)
	h.timing.IdleTime = time.Hour
	h.start(testRelease)
	h.waitHolding()
	o := h.startOther("second", nil)
	h.following(o)

	h.machine().StepDown()
	h.eventually("the second holding the lease", o.m.HoldsLease)
	if h.machine().HoldsLease() {
		t.Error("a supervisor that stepped down holds the lease")
	}
	h.eventually("the first following the second", func() bool {
		return h.machine().Announcement() == o.m.Announcement()
	})
	if got := h.state().Admit(state.API); got != state.Forward {
		t.Errorf("a supervisor that stepped down forwards no more: %v", got)
	}
	time.Sleep(10 * h.timing.LeaseRetry)
	if h.machine().HoldsLease() {
		t.Error("a supervisor that stepped down took the lease again")
	}
}

// spec: SLPWK#actuator-contract
func TestLosingTheLeaseStopsActing(t *testing.T) {
	h := newHarness(t, false)
	h.timing.IdleTime = time.Hour
	h.start(testRelease)
	h.waitHolding()

	h.act.TakeLeaseAs("intruder", time.Minute)
	h.eventually("no longer holding", func() bool { return !h.machine().HoldsLease() })
	if got := h.state().Admit(state.API); got != state.Forward {
		t.Errorf("admission after losing the lease = %v", got)
	}

	h.act.ExpireLease()
	h.waitHolding()
}

// spec: SLPWK#actuator-contract
func TestAnnouncementsOutnumberTheHolderBefore(t *testing.T) {
	h := newHarness(t, false)
	h.timing.IdleTime = time.Hour
	h.start(testRelease)
	h.waitHolding()
	o := h.startOther("second", nil)
	h.following(o)
	first := h.machine().Announcement()

	h.stop()
	h.eventually("the second announcing", func() bool { return o.m.HoldsLease() && o.m.Announcement().After(first) })
	if second := o.m.Announcement(); second.Token <= first.Token || second.Sequence != 1 {
		t.Errorf("announcements %s, then %s", first, second)
	}
}

// spec: SLPWK#actuator-contract
func TestAnnouncementsWithLargeTokens(t *testing.T) {
	h := newHarness(t, false)
	h.timing.IdleTime = time.Hour
	h.act.SetLastToken(1 << 62)
	h.start(testRelease)
	h.waitHolding()
	o := h.startOther("second", nil)
	h.following(o)
	if got := o.m.Announcement(); got.Token != 1<<62+1 || got.Sequence != 1 {
		t.Errorf("following %s", got)
	}

	h.stop()
	h.eventually("the second announcing", func() bool {
		got := o.m.Announcement()
		return o.m.HoldsLease() && got.Token == 1<<62+2 && got.Sequence == 1
	})
}

// spec: SLPWK#actuator-contract
func TestReports(t *testing.T) {
	h := newHarness(t, false)
	h.timing.IdleTime = time.Hour
	h.start(testRelease)
	h.waitHolding()

	h.eventually("the holder's report announcing awake", func() bool {
		r := h.act.Reports()["supervisor-1"]
		return r.Phase == state.Awake && r.Announcement == h.machine().Announcement() && r.Follows == r.Announcement
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

func TestReadyOnceTheActuatorIsRead(t *testing.T) {
	h := newHarness(t, false)
	h.act.TakeLeaseAs("another", time.Minute)
	h.start(testRelease)
	h.eventually("ready", h.machine().Ready)
	if h.machine().HoldsLease() {
		t.Error("took a lease another holds")
	}
}
