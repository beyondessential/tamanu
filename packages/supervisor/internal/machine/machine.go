// Package machine puts the server to sleep when it goes quiet and wakes it
// when it is used. One goroutine, Run, owns every transition; the gate reads
// the outcome from the shared state.
//
// spec: SLPWK#going-to-sleep
// spec: SLPWK#waking
package machine

import (
	"cmp"
	"context"
	"errors"
	"fmt"
	"slices"
	"sync"
	"sync/atomic"
	"time"

	"go.uber.org/zap"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/actuator"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/apiclient"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/buildinfo"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/persist"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/state"
)

// Actuator is the part of the actuator client the machine uses.
type Actuator interface {
	State(ctx context.Context) (actuator.State, error)
	Set(ctx context.Context, parts map[state.Part]actuator.Desired) (actuator.State, error)
	Await(ctx context.Context, parts []state.Part, want actuator.Observed, timeout time.Duration, seen func(actuator.State)) error
}

// API is the part of the api client the machine uses.
type API interface {
	HoldTasks(ctx context.Context) (apiclient.TaskHoldResult, error)
	ReleaseTasks(ctx context.Context) error
	Version(ctx context.Context) (string, error)
	FinalSync(ctx context.Context) (apiclient.FinalSyncResult, error)
}

// Timing holds the machine's durations.
type Timing struct {
	// IdleTime is how long the server goes without activity before sleeping.
	IdleTime time.Duration
	// BusyRecheck is how long after finding the server busy it is asked again.
	BusyRecheck time.Duration
	// ActuatorPoll is how often the actuator's state is read, to follow
	// upgrades.
	ActuatorPoll time.Duration
	// PartTimeout bounds the wait for parts to start or stop.
	PartTimeout time.Duration
	// WakeBackoff is the wait before retrying a failed wake, doubling up to
	// WakeBackoffMax.
	WakeBackoff    time.Duration
	WakeBackoffMax time.Duration
}

// DefaultTiming is the timing in production, with the given idle time.
func DefaultTiming(idle time.Duration) Timing {
	return Timing{
		IdleTime:       idle,
		BusyRecheck:    time.Minute,
		ActuatorPoll:   5 * time.Second,
		PartTimeout:    10 * time.Minute,
		WakeBackoff:    5 * time.Second,
		WakeBackoffMax: 2 * time.Minute,
	}
}

// Config is the machine's configuration.
type Config struct {
	// Central is true on a central server, which has no final sync.
	Central bool
	// Parts are the server's parts.
	Parts []state.Part
	// Release is the supervisor's own release.
	Release string
	Timing  Timing
}

// The steps of going to sleep, by the name persisted once each completes.
const (
	stepChecked         = "checked"
	stepHeld            = "held"
	stepTasksStopped    = "tasks-stopped"
	stepSynced          = "synced"
	stepPartsStopped    = "parts-stopped"
	stepDatabaseStopped = "database-stopped"
)

var (
	errBusy          = errors.New("the server is busy")
	errActivity      = errors.New("activity arrived")
	errUpgrade       = errors.New("an upgrade started")
	errNotControlled = errors.New("the actuator no longer controls the parts")
)

// Machine is the sleep and wake state machine.
type Machine struct {
	cfg   Config
	st    *state.Server
	act   Actuator
	api   API
	store *persist.Store
	log   *zap.Logger

	// changed is notified when the actuator's upgrading or controlsParts
	// changes.
	changed   chan struct{}
	controls  atomic.Bool
	upgrading atomic.Bool

	// Owned by the Run goroutine.
	nextAttempt time.Time
	wakeFailed  bool
	devLogged   bool
}

// New returns a machine over the shared state st.
func New(cfg Config, st *state.Server, act Actuator, api API, store *persist.Store, log *zap.Logger) *Machine {
	return &Machine{
		cfg:     cfg,
		st:      st,
		act:     act,
		api:     api,
		store:   store,
		log:     log,
		changed: make(chan struct{}, 1),
	}
}

// ControlsParts reports whether the actuator last said it controls the
// server's parts, and so whether the server can sleep.
func (m *Machine) ControlsParts() bool { return m.controls.Load() }

// Run runs the machine until ctx is done.
func (m *Machine) Run(ctx context.Context) {
	s, ok := m.readActuator(ctx)
	if !ok {
		return
	}
	var pollers sync.WaitGroup
	pollers.Go(func() { m.pollActuator(ctx) })
	defer pollers.Wait()

	// spec: SUPV#upgrades
	if !m.waitUpgrade(ctx) {
		return
	}
	m.resume(ctx, s)
	for ctx.Err() == nil {
		m.next(ctx)
	}
}

// readActuator reads the actuator's state, trying until it answers.
func (m *Machine) readActuator(ctx context.Context) (actuator.State, bool) {
	for {
		s, err := m.act.State(ctx)
		if err == nil {
			m.observe(s)
			return s, true
		}
		m.log.Warn("reading the actuator's state", zap.Error(err))
		if !sleepCtx(ctx, m.cfg.Timing.ActuatorPoll) {
			return actuator.State{}, false
		}
	}
}

// spec: SUPV#upgrades
func (m *Machine) pollActuator(ctx context.Context) {
	ticker := time.NewTicker(m.cfg.Timing.ActuatorPoll)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
		s, err := m.act.State(ctx)
		if err != nil {
			if ctx.Err() == nil {
				m.log.Warn("reading the actuator's state", zap.Error(err))
			}
			continue
		}
		m.observe(s)
	}
}

func (m *Machine) observe(s actuator.State) {
	m.st.SetUpgrading(s.Upgrading)
	wasUpgrading := m.upgrading.Swap(s.Upgrading)
	controlled := m.controls.Swap(s.ControlsParts)
	if wasUpgrading != s.Upgrading || controlled != s.ControlsParts {
		m.log.Info("actuator state changed",
			zap.Bool("upgrading", s.Upgrading), zap.Bool("controls_parts", s.ControlsParts))
		notify(m.changed)
	}
}

// spec: SUPV#resilience
func (m *Machine) resume(ctx context.Context, s actuator.State) {
	if !m.controls.Load() {
		m.setAwake()
		return
	}
	rec, found, err := m.store.Load()
	if err != nil {
		m.log.Warn("reading the persisted state; continuing as though there were none", zap.Error(err))
		found = false
	}
	if found {
		m.st.RestoreFailure(rec.LastFailure)
	}
	sameLine := found && buildinfo.SameLine(rec.Release, m.cfg.Release)
	log := m.log.With(zap.String("persisted_phase", string(rec.Phase)), zap.String("persisted_step", rec.Step),
		zap.String("persisted_release", rec.Release))

	switch {
	case found && rec.Phase == state.Asleep && sameLine && s.AllDesired(m.cfg.Parts, actuator.Down):
		log.Info("starting on an asleep server; keeping it asleep")
		m.st.SetAllReady(false)
		m.st.SetPhase(state.Asleep)
	case found && rec.Phase == state.GoingToSleep && sameLine:
		log.Info("continuing an interrupted sleep")
		m.goToSleep(ctx, rec.Step)
	case found && rec.Phase != state.Awake:
		// spec: SLPWK#rollouts
		log.Info("waking the server on start")
		m.wake(ctx)
	case s.AllObserved(m.cfg.Parts, actuator.Ready):
		m.persistOrLog(state.Awake, "")
		m.setAwake()
	default:
		log.Info("starting with parts not ready; waking the server")
		m.wake(ctx)
	}
}

// next waits for and makes the next transition.
func (m *Machine) next(ctx context.Context) {
	snap := m.st.Snapshot()
	switch {
	case snap.Upgrading:
		// spec: SUPV#upgrades
		if m.waitUpgrade(ctx) {
			m.log.Info("upgrade finished; waking the server")
			m.wake(ctx)
		}
	case !m.controls.Load():
		// spec: SUPV#platforms
		m.setAwake()
		select {
		case <-ctx.Done():
		case <-m.changed:
		}
	case snap.Phase == state.Asleep:
		select {
		case <-ctx.Done():
		case <-m.changed:
		case <-m.st.WakeRequests():
			m.log.Info("activity while asleep; waking the server")
			m.wake(ctx)
		}
	case snap.Phase != state.Awake:
		m.wake(ctx)
	default:
		m.awaitIdle(ctx, snap)
	}
}

// awaitIdle goes to sleep once the server is idle, or returns when something
// changes.
//
// spec: SLPWK#activity
func (m *Machine) awaitIdle(ctx context.Context, snap state.Snapshot) {
	var timeout <-chan time.Time
	if snap.InFlight == 0 {
		due := snap.LastActivity.Add(m.cfg.Timing.IdleTime)
		if m.nextAttempt.After(due) {
			due = m.nextAttempt
		}
		wait := time.Until(due)
		if wait <= 0 {
			m.goToSleep(ctx, "")
			return
		}
		timer := time.NewTimer(wait)
		defer timer.Stop()
		timeout = timer.C
	}
	select {
	case <-ctx.Done():
	case <-timeout:
	case <-m.st.Activity():
	case <-m.changed:
	case <-m.st.WakeRequests():
		// Nothing to wake while awake.
	}
}

type sleepStep struct {
	name string
	run  func(context.Context) error
}

func (m *Machine) sleepSteps() []sleepStep {
	steps := []sleepStep{
		{stepChecked, m.checkRelease},
		{stepHeld, m.hold},
		{stepTasksStopped, func(ctx context.Context) error { return m.stop(ctx, state.Tasks, state.FHIR) }},
	}
	if !m.cfg.Central {
		steps = append(steps, sleepStep{stepSynced, m.finalSync})
	}
	return append(steps,
		sleepStep{stepPartsStopped, func(ctx context.Context) error {
			return m.stop(ctx, state.Sync, state.API)
		}},
		sleepStep{stepDatabaseStopped, func(ctx context.Context) error { return m.stop(ctx, state.Database) }},
	)
}

// resumeIndex is the step to continue an interrupted sleep from. Before tasks
// have stopped it starts again, since the hold may have expired meanwhile.
func resumeIndex(steps []sleepStep, from string) int {
	reached := slices.IndexFunc(steps, func(s sleepStep) bool { return s.name == from })
	tasksStopped := slices.IndexFunc(steps, func(s sleepStep) bool { return s.name == stepTasksStopped })
	if reached < tasksStopped {
		return 0
	}
	return reached + 1
}

// goToSleep puts the server to sleep, continuing after the step named from.
//
// spec: SLPWK#going-to-sleep
func (m *Machine) goToSleep(ctx context.Context, from string) {
	drain(m.st.WakeRequests())
	m.st.SetPhase(state.GoingToSleep)
	m.log.Info("going to sleep", zap.String("from_step", from))

	sleepCtx, cancel := context.WithCancelCause(ctx)
	defer cancel(nil)
	stop := make(chan struct{})
	var watcher sync.WaitGroup
	watcher.Go(func() { m.watchSleep(sleepCtx, stop, cancel) })
	stopWatching := func() {
		close(stop)
		watcher.Wait()
	}

	var failedStep string
	var err error
	if err = m.persist(state.GoingToSleep, from); err != nil {
		failedStep = "persisting"
	} else {
		steps := m.sleepSteps()
		for _, s := range steps[resumeIndex(steps, from):] {
			if err = s.run(sleepCtx); err == nil {
				err = m.persist(state.GoingToSleep, s.name)
			}
			if err != nil || sleepCtx.Err() != nil {
				failedStep = s.name
				break
			}
		}
	}
	stopWatching()

	if ctx.Err() != nil {
		return
	}
	switch cause := context.Cause(sleepCtx); {
	case errors.Is(cause, errActivity):
		m.log.Info("activity cancelled the sleep; waking the server", zap.String("step", failedStep))
		m.wake(ctx)
	case cause != nil || errors.Is(err, errUpgrade):
		m.log.Info("sleep cancelled", zap.Error(cmp.Or(cause, err)), zap.String("step", failedStep))
	case errors.Is(err, errBusy):
		m.log.Info("not sleeping", zap.Error(err))
		m.nextAttempt = time.Now().Add(m.cfg.Timing.BusyRecheck)
		m.persistOrLog(state.Awake, "")
		m.st.SetPhase(state.Awake)
	case err != nil:
		m.fail(fmt.Sprintf("going to sleep, at %s: %v", failedStep, err))
		m.nextAttempt = time.Now().Add(m.cfg.Timing.IdleTime)
		m.wake(ctx)
	default:
		m.st.SetFailure("")
		m.wakeFailed = false
		m.persistOrLog(state.Asleep, "")
		m.st.SetPhase(state.Asleep)
		m.log.Info("asleep")
	}
}

// watchSleep cancels a sleep when activity arrives, an upgrade starts, or the
// actuator stops controlling the parts.
func (m *Machine) watchSleep(ctx context.Context, stop <-chan struct{}, cancel context.CancelCauseFunc) {
	for {
		select {
		case <-stop:
			return
		case <-ctx.Done():
			return
		case <-m.st.WakeRequests():
			cancel(errActivity)
			return
		case <-m.changed:
			switch {
			case m.upgrading.Load():
				cancel(errUpgrade)
				return
			case !m.controls.Load():
				cancel(errNotControlled)
				return
			}
		}
	}
}

// spec: SLPWK#going-to-sleep
func (m *Machine) checkRelease(ctx context.Context) error {
	if err := m.notUpgrading(); err != nil {
		return err
	}
	if m.cfg.Release == buildinfo.Dev {
		if !m.devLogged {
			m.log.Warn("a development build does not know its release; not checking the server's")
			m.devLogged = true
		}
		return nil
	}
	version, err := m.api.Version(ctx)
	if err != nil {
		return err
	}
	if !buildinfo.SameLine(version, m.cfg.Release) {
		return fmt.Errorf("the server runs release %s, and the supervisor %s, of another line", version, m.cfg.Release)
	}
	return nil
}

func (m *Machine) hold(ctx context.Context) error {
	if err := m.notUpgrading(); err != nil {
		return err
	}
	res, err := m.api.HoldTasks(ctx)
	if err != nil {
		return err
	}
	if res.Busy {
		return fmt.Errorf("%w: running tasks %v, FHIR jobs %d", errBusy, res.RunningTasks, res.FHIRJobs)
	}
	return nil
}

// spec: SLPWK#going-to-sleep
func (m *Machine) finalSync(ctx context.Context) error {
	if err := m.notUpgrading(); err != nil {
		return err
	}
	res, err := m.api.FinalSync(ctx)
	if err != nil {
		return err
	}
	if !res.Completed {
		return fmt.Errorf("the final sync did not complete: %s", res.Reason)
	}
	return nil
}

// stop stops those of the parts the server has, and waits until they have.
// Cancelling the sleep cancels the wait but not the request, which could
// otherwise reach the actuator after the wake's and stop the parts again.
func (m *Machine) stop(ctx context.Context, parts ...state.Part) error {
	parts = slices.DeleteFunc(parts, func(p state.Part) bool { return !slices.Contains(m.cfg.Parts, p) })
	desired := make(map[state.Part]actuator.Desired, len(parts))
	for _, p := range parts {
		m.st.SetReady(p, false)
		desired[p] = actuator.Down
	}
	if _, err := m.act.Set(context.WithoutCancel(ctx), desired); err != nil {
		return err
	}
	return m.act.Await(ctx, parts, actuator.Stopped, m.cfg.Timing.PartTimeout, nil)
}

// spec: SLPWK#waking
func (m *Machine) wake(ctx context.Context) {
	m.st.SetPhase(state.Waking)
	m.persistOrLog(state.Waking, "")
	backoff := m.cfg.Timing.WakeBackoff
	for {
		// spec: SUPV#upgrades
		if !m.waitUpgrade(ctx) {
			return
		}
		if !m.controls.Load() {
			m.setAwake()
			return
		}
		err := m.wakeOnce(ctx)
		if err == nil {
			break
		}
		if ctx.Err() != nil {
			return
		}
		m.fail(fmt.Sprintf("waking: %v", err))
		m.wakeFailed = true
		m.persistOrLog(state.Waking, "")
		if !sleepCtx(ctx, backoff) {
			return
		}
		backoff = min(2*backoff, m.cfg.Timing.WakeBackoffMax)
	}

	// The hold expires by itself, so failing to release it does not stop the
	// wake. During an upgrade it is left for the wake that follows the upgrade.
	if err := m.notUpgrading(); err == nil {
		if err := m.api.ReleaseTasks(ctx); err != nil {
			m.log.Warn("releasing the task hold", zap.Error(err))
		}
	}
	if m.wakeFailed {
		m.st.SetFailure("")
		m.wakeFailed = false
	}
	m.persistOrLog(state.Awake, "")
	m.setAwake()
	drain(m.st.WakeRequests())
	m.log.Info("awake")
}

func (m *Machine) wakeOnce(ctx context.Context) error {
	markReady := func(s actuator.State) {
		for _, p := range m.cfg.Parts {
			if s.Parts[p].Observed == actuator.Ready {
				m.st.SetReady(p, true)
			}
		}
	}
	if _, err := m.act.Set(ctx, map[state.Part]actuator.Desired{state.Database: actuator.Up}); err != nil {
		return err
	}
	if err := m.act.Await(ctx, []state.Part{state.Database}, actuator.Ready, m.cfg.Timing.PartTimeout, markReady); err != nil {
		return err
	}
	rest := slices.DeleteFunc(slices.Clone(m.cfg.Parts), func(p state.Part) bool { return p == state.Database })
	desired := make(map[state.Part]actuator.Desired, len(rest))
	for _, p := range rest {
		desired[p] = actuator.Up
	}
	if _, err := m.act.Set(ctx, desired); err != nil {
		return err
	}
	return m.act.Await(ctx, rest, actuator.Ready, m.cfg.Timing.PartTimeout, markReady)
}

// waitUpgrade waits while an upgrade is in progress. It reports false if ctx
// ended first.
func (m *Machine) waitUpgrade(ctx context.Context) bool {
	for m.upgrading.Load() {
		select {
		case <-ctx.Done():
			return false
		case <-m.changed:
		}
	}
	return ctx.Err() == nil
}

// notUpgrading refuses a call to the api while an upgrade is in progress.
//
// spec: SUPV#upgrades
func (m *Machine) notUpgrading() error {
	if m.upgrading.Load() {
		return errUpgrade
	}
	return nil
}

func (m *Machine) setAwake() {
	m.st.SetAllReady(true)
	m.st.SetPhase(state.Awake)
}

func (m *Machine) fail(message string) {
	m.log.Warn(message)
	m.st.SetFailure(message)
}

// persist records phase and step. Callers persist a phase before setting it
// in the shared state, so the status never reports what is not on disk.
func (m *Machine) persist(phase state.Phase, step string) error {
	return m.store.Save(persist.Record{
		Release:     m.cfg.Release,
		Phase:       phase,
		Step:        step,
		LastFailure: m.st.Snapshot().LastFailure,
		UpdatedAt:   time.Now().UTC(),
	})
}

func (m *Machine) persistOrLog(phase state.Phase, step string) {
	if err := m.persist(phase, step); err != nil {
		m.log.Error("persisting the supervisor's state", zap.Error(err))
	}
}

func notify(ch chan struct{}) {
	select {
	case ch <- struct{}{}:
	default:
	}
}

func drain(ch <-chan struct{}) {
	select {
	case <-ch:
	default:
	}
}

// sleepCtx waits for d, reporting false if ctx ended first.
func sleepCtx(ctx context.Context, d time.Duration) bool {
	t := time.NewTimer(d)
	defer t.Stop()
	select {
	case <-ctx.Done():
		return false
	case <-t.C:
		return true
	}
}
