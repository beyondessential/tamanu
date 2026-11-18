package machine

import (
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/actuator"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/state"
)

// spec: SUPV#resilience
func TestHandingOver(t *testing.T) {
	for _, tt := range []struct {
		name   string
		asleep bool
		// handOver ends the first supervisor's tenure, checking what is
		// promised meanwhile.
		handOver func(t *testing.T, h *harness, first, second *supervisor)
	}{
		{
			name: "stopped while awake, with no gap in forwarding",
			handOver: func(t *testing.T, _ *harness, first, second *supervisor) {
				stopped := make(chan struct{})
				go func() {
					defer close(stopped)
					first.stop()
				}()
				for !second.m.HoldsLease() {
					if got := second.st.Admit(state.API); got != state.Forward {
						t.Fatalf("follower admission during the handover = %v", got)
					}
					time.Sleep(time.Millisecond)
				}
				<-stopped
			},
		},
		{
			name:     "stopped while asleep",
			asleep:   true,
			handOver: func(_ *testing.T, _ *harness, first, _ *supervisor) { first.stop() },
		},
		{
			name:     "crashed, once its lease expires",
			handOver: func(_ *testing.T, _ *harness, first, _ *supervisor) { first.crash() },
		},
		{
			name: "stepping down",
			handOver: func(t *testing.T, h *harness, first, second *supervisor) {
				first.m.StepDown()
				h.eventually("the second holding the lease", second.m.HoldsLease)
				first.waitFollowing(second)
				if got := first.st.Admit(state.API); got != state.Forward {
					t.Errorf("a supervisor that stepped down forwards no more: %v", got)
				}
			},
		},
	} {
		t.Run(tt.name, func(t *testing.T) {
			h := newHarness(t, false)
			if !tt.asleep {
				h.timing.IdleTime = time.Hour
			}
			first := h.start(testRelease)
			if tt.asleep {
				first.waitPhase(state.Asleep)
			} else {
				first.waitHolding()
			}
			second := h.start(testRelease)
			second.waitFollowing(first)

			if second.m.HoldsLease() {
				t.Error("two supervisors hold the lease")
			}
			if !second.m.Ready() {
				t.Error("a follower that has read the actuator's state is not ready")
			}
			phase, puts := first.phase(), len(h.act.Puts())
			want := state.Forward
			if tt.asleep {
				want = state.Hold
			}
			if got := [2]state.Admission{first.st.Admit(state.API), second.st.Admit(state.API)}; got != [2]state.Admission{want, want} {
				t.Errorf("admissions %v, want %v from each", got, want)
			}

			tt.handOver(t, h, first, second)
			h.eventually("the second holding the lease", second.m.HoldsLease)
			time.Sleep(10 * h.timing.ActuatorPoll)
			if first.m.HoldsLease() {
				t.Error("the first holds the lease again")
			}
			if second.phase() != phase || len(h.act.Puts()) != puts {
				t.Errorf("the new holder: phase %s, puts %q", second.phase(), h.puts()[puts:])
			}
		})
	}
}

// spec: SLPWK#waking
func TestWakeRequestedAtAFollower(t *testing.T) {
	h := newHarness(t, false)
	holder := h.start(testRelease)
	h.eventually("holding the lease", holder.m.HoldsLease)
	// The follower reports only when it must, so the wake request is
	// reported at once.
	h.timing.ReportEvery, h.timing.ReportTTL = time.Hour, time.Hour
	follower := h.start(testRelease)
	holder.waitPhase(state.Asleep)
	follower.waitFollowing(holder)

	holder.keepAwakeAfterWake()
	// Parts take a while to start, so the follower holds many requests
	// while the server wakes, and reports the wake request once.
	h.act.SetDelay(20 * h.timing.ActuatorPoll)
	reports := h.act.ReportPuts(follower.instance)
	for range 20 {
		if got := follower.activity(); got != state.Hold {
			t.Fatalf("follower admission while asleep = %v", got)
		}
		time.Sleep(h.timing.ActuatorPoll / 2)
	}
	holder.waitAwakeAfterWake()
	h.eventually("the follower forwarding again", func() bool {
		return follower.phase() == state.Awake && follower.st.Admit(state.API) == state.Forward
	})
	// One for the wake request, and one for each announcement it followed.
	if got := h.act.ReportPuts(follower.instance) - reports; got > 4 {
		t.Errorf("the follower sent %d reports while the server woke", got)
	}
}

// spec: SLPWK#waking
func TestWakeRequestedWhileFollowingAnEarlierAnnouncement(t *testing.T) {
	h := newHarness(t, false)
	holder := h.start(testRelease)
	holder.waitPhase(state.Asleep)
	holder.keepAwakeAfterWake()
	// A supervisor whose request was held as the holder's announcement
	// changed, or under a holder since replaced.
	h.act.PutReport("supervisor-elsewhere", actuator.Report{
		WakeRequested: true,
		Follows:       actuator.Announcement{Token: 1, Sequence: 1},
	}, time.Hour)
	holder.waitAwakeAfterWake()
}

// spec: SUPV#front-door
func TestEverySupervisorForwardsToAFailedPartWhileAwake(t *testing.T) {
	h := newHarness(t, false)
	h.timing.IdleTime = time.Hour
	holder := h.start(testRelease)
	holder.waitHolding()
	follower := h.start(testRelease)
	follower.waitFollowing(holder)

	h.act.SetPart(state.API, actuator.Up, actuator.Failed)
	time.Sleep(10 * h.timing.ActuatorPoll)
	for _, s := range []*supervisor{holder, follower} {
		if got := s.activity(); got != state.Forward || s.phase() != state.Awake {
			t.Errorf("%s: admission %v, phase %s", s.instance, got, s.phase())
		}
	}
}

// spec: SLPWK#going-to-sleep
func TestSleepWaitsForEverySupervisor(t *testing.T) {
	for _, tt := range []struct {
		name          string
		settleTimeout time.Duration
		// others sets up the other supervisors, and returns what lets the
		// sleep go on, or nil when nothing does.
		others  func(t *testing.T, h *harness, holder *supervisor) (release func())
		failure string
	}{
		{
			name: "a follower's request in flight",
			others: func(t *testing.T, h *harness, holder *supervisor) func() {
				// The follower reports only when it must, and its reports
				// last, so the holder decides to sleep without seeing the
				// request it has in flight.
				h.timing.ReportEvery, h.timing.ReportTTL = time.Hour, time.Hour
				follower := h.start(testRelease)
				follower.waitFollowing(holder)
				h.eventually("the follower's report of following", func() bool {
					r, ok := h.act.Reports()[follower.instance]
					return ok && r.Follows == holder.m.Announcement()
				})
				admission, release := follower.holdOpen()
				if admission != state.Forward {
					t.Fatalf("the follower's request was not forwarded: %v", admission)
				}
				return release
			},
		},
		{
			name: "a report, until it expires",
			others: func(_ *testing.T, h *harness, _ *supervisor) func() {
				// A supervisor that stopped reporting, behind on announcements.
				h.act.PutReport("gone", actuator.Report{IdleSeconds: 3600}, 500*time.Millisecond)
				return func() {}
			},
		},
		{
			name:          "a supervisor that keeps reporting without following",
			settleTimeout: 300 * time.Millisecond,
			others: func(t *testing.T, h *harness, _ *supervisor) func() {
				stop := make(chan struct{})
				t.Cleanup(func() { close(stop) })
				go func() {
					ticker := time.NewTicker(10 * time.Millisecond)
					defer ticker.Stop()
					for {
						h.act.PutReport("stuck", actuator.Report{IdleSeconds: 3600}, 40*time.Millisecond)
						select {
						case <-stop:
							return
						case <-ticker.C:
						}
					}
				}()
				return nil
			},
			failure: "at settled: supervisors still busy or behind: stuck",
		},
	} {
		t.Run(tt.name, func(t *testing.T) {
			h := newHarness(t, false)
			if tt.settleTimeout != 0 {
				h.timing.SettleTimeout = tt.settleTimeout
			}
			holder := h.start(testRelease)
			holder.keepAwakeAfterWake()
			setUp := holder.busy()
			holder.waitHolding()
			release := tt.others(t, h, holder)
			setUp()

			h.eventually("going to sleep", func() bool { return holder.phase() == state.GoingToSleep })
			time.Sleep(10 * h.timing.ActuatorPoll)
			if calls := h.api.Calls(); len(calls) != 0 || len(h.act.Puts()) != 0 {
				t.Fatalf("went on before every supervisor settled: calls %q, puts %q", calls, h.puts())
			}

			if release != nil {
				release()
				holder.waitPhase(state.Asleep)
				return
			}
			holder.waitAwakeAfterWake()
			if f := holder.snapshot().LastFailure; f == nil || !strings.Contains(f.Message, tt.failure) {
				t.Errorf("failure = %+v, want it to mention %q", f, tt.failure)
			}
			if count(h.api.Calls(), "POST /tasks/hold") != 0 || anyDown(h.puts()) {
				t.Errorf("went on after the wait failed: calls %q, puts %q", h.api.Calls(), h.puts())
			}
		})
	}
}

// spec: SLPWK#actuator-contract
func TestLosingTheLeaseStopsActing(t *testing.T) {
	// onPut calls fn the first time the actuator is asked to set part to
	// desired.
	onPut := func(h *harness, part state.Part, desired actuator.Desired, fn func()) {
		var once sync.Once
		h.onPut(func(parts map[state.Part]actuator.Desired) {
			if parts[part] == desired {
				once.Do(fn)
			}
		})
	}
	for _, tt := range []struct {
		name string
		// lose starts the supervisor, and has another take the lease, by
		// calling take, at a point in what the supervisor does.
		lose func(h *harness, take func()) *supervisor
	}{
		{
			name: "while awake",
			lose: func(h *harness, take func()) *supervisor {
				h.timing.IdleTime = time.Hour
				s := h.start(testRelease)
				s.waitHolding()
				take()
				return s
			},
		},
		{
			name: "mid-sleep, its renewal refused",
			lose: func(h *harness, take func()) *supervisor {
				h.act.SetDelay(100 * time.Millisecond)
				onPut(h, state.Tasks, actuator.Down, take)
				return h.start(testRelease)
			},
		},
		{
			name: "mid-sleep, its next request refused",
			lose: func(h *harness, take func()) *supervisor {
				at(h, "POST /tasks/hold", "", take)
				return h.start(testRelease)
			},
		},
		{
			name: "mid-wake, its renewal refused",
			lose: func(h *harness, take func()) *supervisor {
				s := h.start(testRelease)
				s.waitPhase(state.Asleep)
				h.act.SetDelay(100 * time.Millisecond)
				onPut(h, state.Database, actuator.Up, take)
				s.activity()
				return s
			},
		},
		{
			name: "mid-wake, its next request refused",
			lose: func(h *harness, take func()) *supervisor {
				s := h.start(testRelease)
				s.waitPhase(state.Asleep)
				onPut(h, state.Database, actuator.Up, take)
				s.activity()
				return s
			},
		},
	} {
		t.Run(tt.name, func(t *testing.T) {
			h := newHarness(t, false)
			// The actuator passes on only requests carrying the lease's
			// current token, so any it passes on once the lease is taken
			// carry the stale token.
			var lost atomic.Bool
			var stale atomic.Int64
			h.onPut(func(map[state.Part]actuator.Desired) {
				if lost.Load() {
					stale.Add(1)
				}
			})
			var callsAtLoss atomic.Int64
			take := sync.OnceFunc(func() {
				h.act.TakeLeaseAs("intruder", time.Minute)
				callsAtLoss.Store(int64(len(h.api.Calls())))
				lost.Store(true)
			})
			s := tt.lose(h, take)

			h.eventually("losing the lease", func() bool { return lost.Load() && !s.m.HoldsLease() })
			time.Sleep(5 * h.timing.LeaseRenew)
			if n := stale.Load(); n != 0 {
				t.Errorf("%d requests with the stale token went through", n)
			}
			if got := h.api.Calls()[callsAtLoss.Load():]; len(got) != 0 {
				t.Errorf("called the api after losing the lease: %q", got)
			}

			h.act.ExpireLease()
			h.eventually("holding the lease again", s.m.HoldsLease)
		})
	}
}

// spec: SLPWK#actuator-contract
func TestAnnouncementsOutnumberTheHolderBefore(t *testing.T) {
	h := newHarness(t, false)
	h.timing.IdleTime = time.Hour
	first := h.start(testRelease)
	first.waitHolding()
	second := h.start(testRelease)
	second.waitFollowing(first)
	before := first.m.Announcement()

	first.stop()
	h.eventually("the second announcing", func() bool {
		return second.m.HoldsLease() && second.m.Announcement().After(before)
	})
	if after := second.m.Announcement(); after.Token <= before.Token || after.Sequence != 1 {
		t.Errorf("announcements %s, then %s", before, after)
	}
}

// spec: SLPWK#actuator-contract
func TestReports(t *testing.T) {
	h := newHarness(t, false)
	h.timing.IdleTime = time.Hour
	s := h.start(testRelease)
	s.waitHolding()

	h.eventually("the holder's report announcing awake", func() bool {
		r := h.act.Reports()[s.instance]
		return r.Phase == state.Awake && r.Announcement == s.m.Announcement() && r.Follows == r.Announcement
	})
	s.holdOpen()
	h.eventually("a report of the request in flight", func() bool {
		return h.act.Reports()[s.instance].InFlight == 1
	})

	s.crash()
	h.eventually("the report expiring", func() bool {
		_, ok := h.act.Reports()[s.instance]
		return !ok
	})
}

func TestReadyOnceTheActuatorIsRead(t *testing.T) {
	h := newHarness(t, false)
	h.act.TakeLeaseAs("another", time.Minute)
	s := h.start(testRelease)
	h.eventually("ready", s.m.Ready)
	if s.m.HoldsLease() {
		t.Error("took a lease another holds")
	}
}
