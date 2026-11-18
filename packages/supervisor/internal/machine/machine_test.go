package machine

import (
	"net/http"
	"slices"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/actuator"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/apiclient"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/buildinfo"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/state"
)

func roles() map[string]bool { return map[string]bool{"facility": false, "central": true} }

// spec: SLPWK#going-to-sleep
// spec: SLPWK#waking
func TestSleepAndWake(t *testing.T) {
	for name, central := range roles() {
		t.Run(name, func(t *testing.T) {
			h := newHarness(t, central)
			s := h.start(testRelease)
			s.waitPhase(state.Asleep)

			if got, want := h.puts(), sleepPuts(); !slices.Equal(got, want) {
				t.Errorf("sleep puts = %q, want %q", got, want)
			}
			wantCalls := []string{"GET /status", "POST /tasks/hold"}
			if !central {
				wantCalls = append(wantCalls, "POST /final-sync")
			}
			if got := h.api.Calls(); !slices.Equal(got, wantCalls) {
				t.Errorf("sleep calls = %q, want %q", got, wantCalls)
			}
			if !h.allDown() {
				t.Errorf("parts not all down: %+v", h.act.State().Parts)
			}
			for p, ready := range s.snapshot().Ready {
				if ready {
					t.Errorf("%s ready while asleep", p)
				}
			}
			if s.st.Admit(state.API) != state.Hold {
				t.Error("the gate forwards while asleep")
			}

			s.keepAwakeAfterWake()
			s.activity()
			s.waitAwakeAfterWake()

			if got, want := h.puts()[3:], wakePuts(); !slices.Equal(got, want) {
				t.Errorf("wake puts = %q, want %q", got, want)
			}
			calls := h.api.Calls()
			if calls[len(calls)-1] != "DELETE /tasks/hold" || h.api.Held() {
				t.Errorf("hold not released: %q", calls)
			}
			if !h.allUp() {
				t.Errorf("parts not all up: %+v", h.act.State().Parts)
			}
			if s.st.Admit(state.Sync) != state.Forward {
				t.Error("the gate does not forward once awake")
			}
		})
	}
}

// spec: SLPWK#activity
func TestActivityKeepsTheServerAwake(t *testing.T) {
	for _, tt := range []struct {
		name                 string
		atFollower, inFlight bool
	}{
		{"requests in turn at the holder", false, false},
		{"a request in flight at the holder", false, true},
		{"requests in turn at a follower", true, false},
		{"a request in flight at a follower", true, true},
	} {
		t.Run(tt.name, func(t *testing.T) {
			h := newHarness(t, false)
			h.timing.IdleTime = 150 * time.Millisecond
			// Reports outlast a slow test machine's delays in renewing them.
			h.timing.ReportTTL = time.Second
			holder := h.start(testRelease)
			setUp := holder.busy()
			holder.waitHolding()
			busy := holder
			if tt.atFollower {
				busy = h.start(testRelease)
				busy.waitFollowing(holder)
			}
			setUp()

			if tt.inFlight {
				admission, release := busy.holdOpen()
				if admission != state.Forward {
					t.Fatalf("admission = %v", admission)
				}
				time.Sleep(4 * h.timing.IdleTime)
				release()
			} else {
				for until := time.Now().Add(4 * h.timing.IdleTime); time.Now().Before(until); {
					if got := busy.activity(); got != state.Forward {
						t.Fatalf("admission = %v", got)
					}
					time.Sleep(h.timing.IdleTime / 5)
				}
			}
			if calls := h.api.Calls(); len(calls) != 0 {
				t.Errorf("went to sleep with activity: %q", calls)
			}

			holder.waitPhase(state.Asleep)
			busy.waitPhase(state.Asleep)
		})
	}
}

// spec: SLPWK#going-to-sleep
func TestBusyServerStaysAwakeAndIsAskedAgain(t *testing.T) {
	h := newHarness(t, false)
	h.timing.BusyRecheck = 400 * time.Millisecond
	h.api.SetHold(apiclient.TaskHoldResult{Busy: true, RunningTasks: []string{"ReportRequestProcessor"}})
	s := h.start(testRelease)

	h.eventually("a hold", func() bool { return count(h.api.Calls(), "POST /tasks/hold") == 1 })
	h.eventually("awake after the busy answer", func() bool { return s.phase() == state.Awake })
	if f := s.snapshot().LastFailure; f != nil {
		t.Errorf("busy recorded as a failure: %+v", f)
	}
	if s.st.Admit(state.API) != state.Forward {
		t.Error("a busy server is not forwarded requests")
	}
	time.Sleep(5 * h.timing.IdleTime)
	if n := count(h.api.Calls(), "POST /tasks/hold"); n != 1 {
		t.Errorf("asked %d times within the recheck interval", n)
	}
	h.eventually("a second hold", func() bool { return count(h.api.Calls(), "POST /tasks/hold") == 2 })
	if len(h.act.Puts()) != 0 {
		t.Errorf("a busy server had parts stopped: %q", h.puts())
	}

	h.api.SetHold(apiclient.TaskHoldResult{})
	s.waitPhase(state.Asleep)
}

// spec: SUPV#compatibility
// spec: SLPWK#going-to-sleep
func TestSleepsOnlyOnItsOwnReleaseLine(t *testing.T) {
	for _, tt := range []struct {
		name, server, supervisor string
		sleeps                   bool
	}{
		{"another patch of the line", "2.70.4", testRelease, true},
		{"another line", "2.69.0", testRelease, false},
		{"a development build", "2.69.0", buildinfo.Dev, true},
	} {
		t.Run(tt.name, func(t *testing.T) {
			h := newHarness(t, true)
			h.api.SetVersion(tt.server)
			s := h.start(tt.supervisor)
			if tt.sleeps {
				s.waitPhase(state.Asleep)
				if asked := slices.Contains(h.api.Calls(), "GET /status"); asked != (tt.supervisor != buildinfo.Dev) {
					t.Errorf("asked for the server's release: %v", asked)
				}
				return
			}

			s.keepAwakeAfterWake()
			s.waitAwakeAfterWake()
			if f := s.snapshot().LastFailure; f == nil || !strings.Contains(f.Message, "runs release "+tt.server) {
				t.Errorf("failure = %+v", f)
			}
			if slices.Contains(h.api.Calls(), "POST /tasks/hold") || anyDown(h.puts()) {
				t.Errorf("went on with a server of another line: calls %q, puts %q", h.api.Calls(), h.puts())
			}
		})
	}
}

// at calls fn the first time the api is called with call, or the first time
// the actuator is asked to stop part.
func at(h *harness, call string, part state.Part, fn func()) {
	var once sync.Once
	if call != "" {
		h.onAPI(func(c string) {
			if c == call {
				once.Do(fn)
			}
		})
		return
	}
	h.onPut(func(parts map[state.Part]actuator.Desired) {
		if parts[part] == actuator.Down {
			once.Do(fn)
		}
	})
}

// spec: SLPWK#going-to-sleep
func TestActivityCancelsTheSleepAtEachStep(t *testing.T) {
	for _, step := range []struct {
		name string
		call string
		part state.Part
	}{
		{name: "release check", call: "GET /status"},
		{name: "hold", call: "POST /tasks/hold"},
		{name: "stopping tasks", part: state.Tasks},
		{name: "final sync", call: "POST /final-sync"},
		{name: "stopping the api", part: state.API},
		{name: "stopping the database", part: state.Database},
	} {
		t.Run(step.name, func(t *testing.T) {
			h := newHarness(t, false)
			started := make(chan *supervisor, 1)
			at(h, step.call, step.part, func() { (<-started).activity() })
			s := h.start(testRelease)
			started <- s
			s.keepAwakeAfterWake()
			s.waitAwakeAfterWake()
			if !h.allUp() || h.api.Held() {
				t.Errorf("not woken: held %v, parts %+v", h.api.Held(), h.act.State().Parts)
			}
			if f := s.snapshot().LastFailure; f != nil {
				t.Errorf("activity recorded as a failure: %+v", f)
			}
		})
	}
}

// spec: SLPWK#going-to-sleep
func TestFailedStepCancelsTheSleep(t *testing.T) {
	for _, step := range []struct {
		name  string
		setup func(*harness)
		want  string
	}{
		{"hold", func(h *harness) { h.api.Fail("POST /tasks/hold", http.StatusInternalServerError) }, "at held"},
		{"stopping tasks", func(h *harness) { failFirstDown(h, state.Tasks) }, "at tasks-stopped"},
		{"incomplete final sync", func(h *harness) {
			h.api.SetFinalSync(apiclient.FinalSyncResult{Reason: "Sync was queued by the central server"})
		}, "at synced: the final sync did not complete: Sync was queued"},
		{"stopping the api", func(h *harness) { failFirstDown(h, state.API) }, "at parts-stopped"},
		{"stopping the database", func(h *harness) { failFirstDown(h, state.Database) }, "at database-stopped"},
		{"database never stops", func(h *harness) {
			at(h, "", state.Database, func() { h.act.Stall(state.Database, true) })
		}, "timed out waiting for database (stopping)"},
	} {
		t.Run(step.name, func(t *testing.T) {
			h := newHarness(t, false)
			h.timing.PartTimeout = 50 * time.Millisecond
			step.setup(h)
			s := h.start(testRelease)
			s.keepAwakeAfterWake()
			h.eventually("the failure", func() bool { return s.snapshot().LastFailure != nil })
			if f := s.snapshot().LastFailure; !strings.Contains(f.Message, step.want) {
				t.Errorf("failure = %+v, want it to mention %q", f, step.want)
			}

			// Let a stalled database go, so the wake can finish.
			h.act.Stall(state.Database, false)
			s.waitAwakeAfterWake()
			if !h.allUp() || h.api.Held() {
				t.Errorf("not woken: held %v, parts %+v", h.api.Held(), h.act.State().Parts)
			}
		})
	}
}

func failFirstDown(h *harness, part state.Part) {
	var mu sync.Mutex
	failed := false
	h.act.FailPuts(func(parts map[state.Part]actuator.Desired) bool {
		mu.Lock()
		defer mu.Unlock()
		if !failed && parts[part] == actuator.Down {
			failed = true
			return true
		}
		return false
	})
}

// spec: SUPV#resilience
func TestNewHolderDerivesPhase(t *testing.T) {
	type part struct {
		desired  actuator.Desired
		observed actuator.Observed
	}
	down := part{actuator.Down, actuator.Stopped}
	for _, tt := range []struct {
		name string
		// parts are the parts not up and ready when the holder takes over.
		parts map[state.Part]part
		want  state.Phase
		wakes bool
	}{
		{name: "all up and ready", want: state.Awake},
		{
			name:  "all down and stopped",
			parts: map[state.Part]part{state.Database: down, state.API: down, state.Sync: down, state.Tasks: down, state.FHIR: down},
			want:  state.Asleep,
		},
		{
			name:  "a sleep cut short",
			parts: map[state.Part]part{state.Tasks: down, state.FHIR: down},
			want:  state.Awake,
			wakes: true,
		},
		{
			name: "database stopping",
			parts: map[state.Part]part{
				state.Database: {actuator.Down, actuator.Stopping},
				state.API:      down, state.Sync: down, state.Tasks: down, state.FHIR: down,
			},
			want:  state.Awake,
			wakes: true,
		},
		{
			name:  "a wake cut short",
			parts: map[state.Part]part{state.API: down, state.Sync: down, state.Tasks: down, state.FHIR: down},
			want:  state.Awake,
			wakes: true,
		},
	} {
		t.Run(tt.name, func(t *testing.T) {
			h := newHarness(t, false)
			h.timing.IdleTime = time.Hour
			for p, s := range tt.parts {
				h.act.SetPart(p, s.desired, s.observed)
			}
			s := h.start(testRelease)
			h.eventually("holding the lease, "+string(tt.want), func() bool {
				return s.m.HoldsLease() && s.phase() == tt.want
			})
			time.Sleep(5 * h.timing.ActuatorPoll)

			var wantPuts, wantCalls []string
			if tt.wakes {
				wantPuts, wantCalls = wakePuts(), []string{"DELETE /tasks/hold"}
			}
			if got := h.puts(); !slices.Equal(got, wantPuts) {
				t.Errorf("puts = %q, want %q", got, wantPuts)
			}
			if got := h.api.Calls(); !slices.Equal(got, wantCalls) {
				t.Errorf("calls = %q, want %q", got, wantCalls)
			}
			if phase := s.phase(); phase != tt.want {
				t.Errorf("phase %s, want %s", phase, tt.want)
			}
			wantAdmission := state.Forward
			if tt.want == state.Asleep {
				wantAdmission = state.Hold
			} else if !h.allUp() {
				t.Errorf("parts not all up: %+v", h.act.State().Parts)
			}
			if got := s.st.Admit(state.Sync); got != wantAdmission {
				t.Errorf("the gate answers %v, want %v", got, wantAdmission)
			}
		})
	}
}

// spec: SUPV#upgrades
// spec: SLPWK#rollouts
func TestUpgrades(t *testing.T) {
	upgrade := func(h *harness) { h.act.SetUpgrading(true) }
	for _, tt := range []struct {
		name string
		// begin starts the supervisor and the upgrade.
		begin func(h *harness) *supervisor
		// settled, if not nil, is when the step under way as the upgrade
		// started has finished.
		settled func(h *harness) bool
		// untouched are parts whose desired state the upgrade must leave as
		// it was when the upgrade started.
		untouched []state.Part
	}{
		{
			name: "at startup, awake",
			begin: func(h *harness) *supervisor {
				upgrade(h)
				return h.start(testRelease)
			},
		},
		{
			name: "at startup, asleep",
			begin: func(h *harness) *supervisor {
				for _, p := range state.Parts() {
					h.act.SetPart(p, actuator.Down, actuator.Stopped)
				}
				upgrade(h)
				return h.start(testRelease)
			},
		},
		{
			name: "while asleep",
			begin: func(h *harness) *supervisor {
				s := h.start(testRelease)
				s.waitPhase(state.Asleep)
				upgrade(h)
				return s
			},
		},
		{
			name: "mid-wake",
			begin: func(h *harness) *supervisor {
				s := h.start(testRelease)
				s.waitPhase(state.Asleep)
				var once sync.Once
				h.onPut(func(parts map[state.Part]actuator.Desired) {
					if parts[state.Database] == actuator.Up {
						once.Do(func() { upgrade(h) })
					}
				})
				s.activity()
				return s
			},
			untouched: []state.Part{state.API, state.Sync, state.Tasks, state.FHIR},
		},
		{
			name: "mid-sleep",
			begin: func(h *harness) *supervisor {
				// Parts take longer to stop than the actuator takes to be
				// polled, so the upgrade is seen while the sleep is under way.
				h.act.SetDelay(50 * time.Millisecond)
				at(h, "POST /final-sync", "", func() { upgrade(h) })
				return h.start(testRelease)
			},
		},
	} {
		t.Run(tt.name, func(t *testing.T) {
			h := newHarness(t, false)
			s := tt.begin(h)
			h.eventually("upgrading", func() bool { return s.snapshot().Upgrading })
			if tt.settled != nil {
				h.eventually("the step under way", func() bool { return tt.settled(h) })
			}
			time.Sleep(5 * h.timing.ActuatorPoll)
			calls, puts := len(h.api.Calls()), len(h.act.Puts())

			if admission := s.activity(); admission != state.Upgrading {
				t.Errorf("activity during the upgrade = %v", admission)
			}
			time.Sleep(5 * h.timing.IdleTime)
			if got := h.api.Calls()[calls:]; len(got) != 0 {
				t.Errorf("called the api during the upgrade: %q", got)
			}
			if got := h.puts()[puts:]; len(got) != 0 {
				t.Errorf("set desired states during the upgrade: %q", got)
			}
			if got := s.st.Admit(state.API); got != state.Upgrading {
				t.Errorf("the gate answers %v during the upgrade", got)
			}
			for _, p := range tt.untouched {
				if got := h.act.State().Parts[p].Desired; got != actuator.Down {
					t.Errorf("%s desired %s during the upgrade", p, got)
				}
			}

			s.keepAwakeAfterWake()
			h.act.SetUpgrading(false)
			s.waitAwakeAfterWake()
			if !h.allUp() || h.api.Held() {
				t.Errorf("after the upgrade: held %v, parts %+v", h.api.Held(), h.act.State().Parts)
			}
		})
	}
}

// spec: SUPV#platforms
func TestActuatorThatDoesNotControlPartsNeverSleeps(t *testing.T) {
	h := newHarness(t, true)
	h.act.SetControlsParts(false)
	s := h.start(testRelease)
	time.Sleep(5 * h.timing.IdleTime)
	if len(h.api.Calls()) != 0 || len(h.act.Puts()) != 0 || s.phase() != state.Awake {
		t.Errorf("calls %q, puts %q, phase %s", h.api.Calls(), h.puts(), s.phase())
	}
	if s.st.Admit(state.API) != state.Forward {
		t.Error("not forwarding")
	}

	h.act.SetUpgrading(true)
	h.eventually("upgrading", func() bool { return s.st.Admit(state.API) == state.Upgrading })
}

// spec: SLPWK#waking
func TestStalledWakeIsRetried(t *testing.T) {
	h := newHarness(t, false)
	h.timing.PartTimeout = 30 * time.Millisecond
	s := h.start(testRelease)
	s.waitPhase(state.Asleep)

	h.act.Stall(state.Database, true)
	s.keepAwakeAfterWake()
	s.activity()
	h.eventually("the wake's failure", func() bool {
		f := s.snapshot().LastFailure
		return f != nil && strings.Contains(f.Message, "waking")
	})
	if s.phase() != state.Waking || s.st.Admit(state.API) != state.Hold {
		t.Errorf("phase %s while the wake stalls", s.phase())
	}
	h.eventually("a retry", func() bool { return count(h.puts(), "database=up") >= 2 })

	h.act.Stall(state.Database, false)
	s.waitAwakeAfterWake()
	if f := s.snapshot().LastFailure; f != nil {
		t.Errorf("the wake's failure outlived it: %+v", f)
	}
}

// spec: SLPWK#waking
func TestPartsForwardedAsTheyBecomeReady(t *testing.T) {
	h := newHarness(t, false)
	s := h.start(testRelease)
	s.waitPhase(state.Asleep)

	h.act.Stall(state.Sync, true)
	s.activity()
	h.eventually("api forwarded while sync starts", func() bool {
		return s.phase() == state.Waking && s.st.Admit(state.API) == state.Forward
	})
	s.keepAwakeAfterWake()
	h.act.Stall(state.Sync, false)
	s.waitAwakeAfterWake()
}
