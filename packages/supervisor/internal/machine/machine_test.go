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
			h.start(testRelease)
			h.waitPhase(state.Asleep)

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
			for p, ready := range h.snapshot().Ready {
				if ready {
					t.Errorf("%s ready while asleep", p)
				}
			}
			if h.state().Admit(state.API) != state.Hold {
				t.Error("the gate forwards while asleep")
			}

			h.keepAwakeAfterWake()
			h.activity()
			h.waitAwakeAfterWake()

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
			if h.state().Admit(state.Sync) != state.Forward {
				t.Error("the gate does not forward once awake")
			}
		})
	}
}

// spec: SLPWK#activity
func TestActivityKeepsTheServerAwake(t *testing.T) {
	h := newHarness(t, false)
	h.timing.IdleTime = 200 * time.Millisecond
	h.start(testRelease)
	h.waitHolding()
	h.holdOpen()
	time.Sleep(3 * h.timing.IdleTime)
	if len(h.api.Calls()) != 0 || h.snapshot().Phase != state.Awake {
		t.Errorf("slept with a request in flight: %q", h.api.Calls())
	}
	h.release()
	h.waitPhase(state.Asleep)
}

// spec: SLPWK#going-to-sleep
func TestBusyServerStaysAwakeAndIsAskedAgain(t *testing.T) {
	h := newHarness(t, false)
	h.timing.BusyRecheck = 150 * time.Millisecond
	h.api.SetHold(apiclient.TaskHoldResult{Busy: true, RunningTasks: []string{"ReportRequestProcessor"}})
	h.start(testRelease)

	h.eventually("a hold", func() bool { return countCalls(h.api.Calls(), "POST /tasks/hold") == 1 })
	h.eventually("awake after the busy answer", func() bool { return h.snapshot().Phase == state.Awake })
	if f := h.snapshot().LastFailure; f != nil {
		t.Errorf("busy recorded as a failure: %+v", f)
	}
	if h.state().Admit(state.API) != state.Forward {
		t.Error("a busy server is not forwarded requests")
	}
	h.eventually("a second hold", func() bool { return countCalls(h.api.Calls(), "POST /tasks/hold") >= 2 })
	if len(h.act.Puts()) != 0 {
		t.Errorf("a busy server had parts stopped: %q", h.puts())
	}

	h.api.SetHold(apiclient.TaskHoldResult{})
	h.waitPhase(state.Asleep)
}

func TestBusyRecheckWaitsAMinute(t *testing.T) {
	h := newHarness(t, true)
	h.timing.BusyRecheck = time.Hour
	h.api.SetHold(apiclient.TaskHoldResult{Busy: true})
	h.start(testRelease)
	h.eventually("a hold", func() bool { return countCalls(h.api.Calls(), "POST /tasks/hold") == 1 })
	time.Sleep(5 * h.timing.IdleTime)
	if n := countCalls(h.api.Calls(), "POST /tasks/hold"); n != 1 {
		t.Errorf("asked %d times within the recheck interval", n)
	}
}

// spec: SLPWK#going-to-sleep
func TestIncompleteFinalSyncKeepsTheFacilityAwake(t *testing.T) {
	h := newHarness(t, false)
	h.api.SetFinalSync(apiclient.FinalSyncResult{Reason: "Sync was queued by the central server"})
	h.keepAwakeAfterWake()
	h.start(testRelease)
	h.waitAwakeAfterWake()

	snap := h.snapshot()
	if snap.LastFailure == nil || !strings.Contains(snap.LastFailure.Message, "final sync did not complete: Sync was queued") {
		t.Errorf("failure = %+v", snap.LastFailure)
	}
	want := append([]string{"fhir=down tasks=down"}, wakePuts()...)
	if got := h.puts(); !slices.Equal(got, want) {
		t.Errorf("puts = %q, want %q", got, want)
	}
	if h.api.Held() || !h.allUp() {
		t.Errorf("held %v, parts %+v", h.api.Held(), h.act.State().Parts)
	}
}

// spec: SUPV#compatibility
func TestAnotherPatchOfTheLineSleeps(t *testing.T) {
	h := newHarness(t, true)
	h.api.SetVersion("2.70.4")
	h.start(testRelease)
	h.waitPhase(state.Asleep)
}

func TestReleaseMismatchKeepsTheServerAwake(t *testing.T) {
	h := newHarness(t, true)
	h.api.SetVersion("2.69.0")
	h.keepAwakeAfterWake()
	h.start(testRelease)
	h.waitAwakeAfterWake()

	snap := h.snapshot()
	if snap.LastFailure == nil || !strings.Contains(snap.LastFailure.Message, "runs release 2.69.0") {
		t.Errorf("failure = %+v", snap.LastFailure)
	}
	if slices.Contains(h.api.Calls(), "POST /tasks/hold") {
		t.Error("held tasks on a server of another release")
	}
	for _, put := range h.puts() {
		if strings.Contains(put, "down") {
			t.Errorf("stopped a part: %s", put)
		}
	}
}

func TestDevelopmentBuildSkipsTheReleaseCheck(t *testing.T) {
	h := newHarness(t, true)
	h.api.SetVersion("2.69.0")
	h.start(buildinfo.Dev)
	h.waitPhase(state.Asleep)
	if slices.Contains(h.api.Calls(), "GET /status") {
		t.Error("a development build asked for the server's release")
	}
}

// sleepStepHooks are points in a facility's sleep, each matched by an api
// call or an actuator request.
var sleepStepHooks = []struct {
	name  string
	call  string
	parts state.Part
}{
	{name: "release check", call: "GET /status"},
	{name: "hold", call: "POST /tasks/hold"},
	{name: "stopping tasks", parts: state.Tasks},
	{name: "final sync", call: "POST /final-sync"},
	{name: "stopping the api", parts: state.API},
	{name: "stopping the database", parts: state.Database},
}

// onceAt calls fn the first time the step is reached.
func onceAt(h *harness, call string, part state.Part, fn func()) {
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
	for _, step := range sleepStepHooks {
		t.Run(step.name, func(t *testing.T) {
			h := newHarness(t, false)
			onceAt(h, step.call, step.parts, h.activity)
			h.keepAwakeAfterWake()
			h.start(testRelease)
			h.waitAwakeAfterWake()
			if !h.allUp() || h.api.Held() {
				t.Errorf("not woken: held %v, parts %+v", h.api.Held(), h.act.State().Parts)
			}
			if f := h.snapshot().LastFailure; f != nil {
				t.Errorf("activity recorded as a failure: %+v", f)
			}
		})
	}
}

// spec: SLPWK#going-to-sleep
func TestFailedStepCancelsTheSleep(t *testing.T) {
	steps := []struct {
		name  string
		setup func(*harness)
		want  string
	}{
		{"hold", func(h *harness) { h.api.Fail("POST /tasks/hold", http.StatusInternalServerError) }, "at held"},
		{"stopping tasks", func(h *harness) { failFirstDown(h, state.Tasks) }, "at tasks-stopped"},
		{"stopping the api", func(h *harness) { failFirstDown(h, state.API) }, "at parts-stopped"},
		{"stopping the database", func(h *harness) { failFirstDown(h, state.Database) }, "at database-stopped"},
		{"database never stops", func(h *harness) {
			onceAt(h, "", state.Database, func() { h.act.Stall(state.Database, true) })
		}, "timed out waiting for database (stopping)"},
	}
	for _, step := range steps {
		t.Run(step.name, func(t *testing.T) {
			h := newHarness(t, true)
			h.timing.PartTimeout = 50 * time.Millisecond
			step.setup(h)
			h.keepAwakeAfterWake()
			h.start(testRelease)
			h.eventually("the failure", func() bool { return h.snapshot().LastFailure != nil })
			f := h.snapshot().LastFailure
			if !strings.Contains(f.Message, step.want) {
				t.Errorf("failure = %+v, want it to mention %q", f, step.want)
			}

			// Let a stalled database go, so the wake can finish.
			h.act.Stall(state.Database, false)
			h.waitAwakeAfterWake()
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
			h.start(testRelease)
			h.eventually("holding the lease, "+string(tt.want), func() bool {
				return h.machine().HoldsLease() && h.snapshot().Phase == tt.want
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
			if phase := h.snapshot().Phase; phase != tt.want {
				t.Errorf("phase %s, want %s", phase, tt.want)
			}
			wantAdmission := state.Forward
			if tt.want == state.Asleep {
				wantAdmission = state.Hold
			} else if !h.allUp() {
				t.Errorf("parts not all up: %+v", h.act.State().Parts)
			}
			if got := h.state().Admit(state.Sync); got != wantAdmission {
				t.Errorf("the gate answers %v, want %v", got, wantAdmission)
			}
		})
	}
}

// spec: SUPV#upgrades
func TestUpgradeBlocksSleepAndWake(t *testing.T) {
	h := newHarness(t, false)
	h.act.SetUpgrading(true)
	h.start(testRelease)
	h.eventually("upgrading", func() bool { return h.snapshot().Upgrading })
	if h.state().Admit(state.Sync) != state.Upgrading {
		t.Error("the gate does not answer upgrading")
	}
	time.Sleep(5 * h.timing.IdleTime)
	if len(h.api.Calls()) != 0 || len(h.act.Puts()) != 0 {
		t.Errorf("acted during an upgrade: calls %q, puts %q", h.api.Calls(), h.puts())
	}

	h.act.SetUpgrading(false)
	h.waitPhase(state.Asleep)

	h.act.SetUpgrading(true)
	h.eventually("upgrading", func() bool { return h.snapshot().Upgrading })
	puts := len(h.puts())
	if admission, done := h.state().AdmitActivity(state.API); admission != state.Upgrading {
		t.Errorf("activity during an upgrade = %v", admission)
	} else {
		done()
	}
	time.Sleep(5 * h.timing.IdleTime)
	if len(h.puts()) != puts || h.snapshot().Phase != state.Asleep {
		t.Errorf("woke during an upgrade: %q", h.puts()[puts:])
	}

	h.keepAwakeAfterWake()
	h.act.SetUpgrading(false)
	h.waitAwakeAfterWake()
}

// spec: SUPV#upgrades
func TestNoAPICallsDuringAnUpgrade(t *testing.T) {
	h := newHarness(t, false)
	h.start(testRelease)
	h.waitPhase(state.Asleep)

	// The upgrade starts once the wake has asked for the database, so the
	// wake finishes during it.
	var once sync.Once
	h.onPut(func(parts map[state.Part]actuator.Desired) {
		if parts[state.Database] == actuator.Up {
			once.Do(func() { h.act.SetUpgrading(true) })
		}
	})
	calls := len(h.api.Calls())
	h.activity()
	h.eventually("parts up during the upgrade", func() bool {
		return h.snapshot().Upgrading && h.allUp()
	})
	time.Sleep(5 * h.timing.ActuatorPoll)
	if got := h.api.Calls()[calls:]; len(got) != 0 {
		t.Errorf("called the api during an upgrade: %q", got)
	}

	h.keepAwakeAfterWake()
	h.act.SetUpgrading(false)
	h.waitAwakeAfterWake()
	if h.api.Held() {
		t.Error("the task hold was not released after the upgrade")
	}
}

func TestUpgradeCancelsASleep(t *testing.T) {
	h := newHarness(t, false)
	// Parts take longer to stop than the actuator takes to be polled, so the
	// upgrade is seen while the sleep is under way.
	h.act.SetDelay(50 * time.Millisecond)
	onceAt(h, "POST /final-sync", "", func() { h.act.SetUpgrading(true) })
	h.start(testRelease)
	h.eventually("upgrading", func() bool { return h.snapshot().Upgrading })
	time.Sleep(5 * h.timing.IdleTime)
	if slices.Contains(h.puts(), "database=down") {
		t.Errorf("the sleep went on during an upgrade: %q", h.puts())
	}
	h.keepAwakeAfterWake()
	h.act.SetUpgrading(false)
	h.waitAwakeAfterWake()
	if !h.allUp() {
		t.Errorf("parts not all up after the upgrade: %+v", h.act.State().Parts)
	}
}

// spec: SUPV#platforms
func TestActuatorThatDoesNotControlPartsNeverSleeps(t *testing.T) {
	h := newHarness(t, true)
	h.act.SetControlsParts(false)
	h.start(testRelease)
	time.Sleep(5 * h.timing.IdleTime)
	if len(h.api.Calls()) != 0 || len(h.act.Puts()) != 0 || h.snapshot().Phase != state.Awake {
		t.Errorf("calls %q, puts %q, phase %s", h.api.Calls(), h.puts(), h.snapshot().Phase)
	}
	if h.state().Admit(state.API) != state.Forward {
		t.Error("not forwarding")
	}

	h.act.SetUpgrading(true)
	h.eventually("upgrading", func() bool { return h.state().Admit(state.API) == state.Upgrading })
}

// spec: SLPWK#waking
func TestStalledWakeIsRetried(t *testing.T) {
	h := newHarness(t, false)
	h.timing.PartTimeout = 30 * time.Millisecond
	h.start(testRelease)
	h.waitPhase(state.Asleep)

	h.act.Stall(state.Database, true)
	h.keepAwakeAfterWake()
	h.activity()
	h.eventually("the wake's failure", func() bool {
		f := h.snapshot().LastFailure
		return f != nil && strings.Contains(f.Message, "waking")
	})
	if snap := h.snapshot(); snap.Phase != state.Waking || h.state().Admit(state.API) != state.Hold {
		t.Errorf("phase %s while the wake stalls", snap.Phase)
	}
	h.eventually("a retry", func() bool { return countPuts(h.puts(), "database=up") >= 2 })

	h.act.Stall(state.Database, false)
	h.waitAwakeAfterWake()
	if f := h.snapshot().LastFailure; f != nil {
		t.Errorf("the wake's failure outlived it: %+v", f)
	}
}

func TestPartsForwardedAsTheyBecomeReady(t *testing.T) {
	h := newHarness(t, false)
	h.start(testRelease)
	h.waitPhase(state.Asleep)

	h.act.Stall(state.Sync, true)
	h.activity()
	h.eventually("api forwarded while sync starts", func() bool {
		return h.snapshot().Phase == state.Waking && h.state().Admit(state.API) == state.Forward
	})
	if h.state().Admit(state.Sync) != state.Hold {
		t.Error("sync forwarded before it was ready")
	}
	h.keepAwakeAfterWake()
	h.act.Stall(state.Sync, false)
	h.waitAwakeAfterWake()
}

func countCalls(calls []string, call string) int {
	n := 0
	for _, c := range calls {
		if c == call {
			n++
		}
	}
	return n
}

func countPuts(puts []string, put string) int { return countCalls(puts, put) }
