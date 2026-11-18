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
	"github.com/beyondessential/tamanu/packages/supervisor/internal/state"
)

// Actuator is the part of the actuator client the machine uses.
type Actuator interface {
	State(ctx context.Context) (actuator.State, error)
	Set(ctx context.Context, parts map[state.Part]actuator.Desired) (actuator.State, error)
	Await(ctx context.Context, parts []state.Part, want actuator.Observed, timeout time.Duration, seen func(actuator.State)) error
	TakeLease(ctx context.Context, holder string, ttl time.Duration) (actuator.LeaseInfo, error)
	RenewLease(ctx context.Context, holder string, ttl time.Duration) (actuator.LeaseInfo, error)
	ReleaseLease(ctx context.Context) error
	Report(ctx context.Context, instance string, r actuator.Report, ttl time.Duration) error
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
	// LeaseTTL is how long the lease lasts unless renewed, every LeaseRenew.
	// A supervisor that cannot renew it within LeaseTTL-LeaseRenew of the last
	// renewal stops acting, before the lease can expire under it.
	LeaseTTL   time.Duration
	LeaseRenew time.Duration
	// LeaseRetry is how often a supervisor waiting for the lease asks for it.
	LeaseRetry time.Duration
	// ReportEvery is how often the supervisor reports its activity, each
	// report lasting ReportTTL.
	ReportEvery time.Duration
	ReportTTL   time.Duration
	// SettleTimeout bounds the wait, going to sleep, for every supervisor to
	// follow the announcement with nothing in flight.
	SettleTimeout time.Duration
}

// DefaultTiming is the timing in production, with the given idle time.
func DefaultTiming(idle time.Duration) Timing {
	return Timing{
		IdleTime:       idle,
		BusyRecheck:    time.Minute,
		ActuatorPoll:   time.Second,
		PartTimeout:    10 * time.Minute,
		WakeBackoff:    5 * time.Second,
		WakeBackoffMax: 2 * time.Minute,
		LeaseTTL:       30 * time.Second,
		LeaseRenew:     10 * time.Second,
		LeaseRetry:     2 * time.Second,
		ReportEvery:    10 * time.Second,
		ReportTTL:      30 * time.Second,
		SettleTimeout:  time.Minute,
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
	// Instance identifies this supervisor to the actuator, as the lease's
	// holder and in its reports.
	Instance string
	Timing   Timing
}

var (
	errBusy          = errors.New("the server is busy")
	errActivity      = errors.New("activity arrived")
	errUpgrade       = errors.New("an upgrade started")
	errNotControlled = errors.New("the actuator no longer controls the parts")
)

// Machine is the sleep and wake state machine.
type Machine struct {
	cfg Config
	st  *state.Server
	act Actuator
	api API
	log *zap.Logger

	// roleMu orders taking and giving up the lease against following.
	roleMu       sync.Mutex
	holding      atomic.Bool
	tenureCancel context.CancelFunc
	retiring     atomic.Bool
	// seen is whether the actuator's state has been read; latest is the last
	// read, and polled is notified of each read while holding the lease.
	seen   atomic.Bool
	latest atomic.Pointer[actuator.State]
	polled chan struct{}

	annMu     sync.Mutex
	ann       announcement
	reportNow chan struct{}

	// changed is notified when the actuator's upgrading or controlsParts
	// changes.
	changed   chan struct{}
	controls  atomic.Bool
	upgrading atomic.Bool

	// Owned by the Run goroutine.
	token       int64
	nextAttempt time.Time
	wakeFailed  bool
	devLogged   bool
}

// New returns a machine over the shared state st. Until it has read the
// actuator's state, st holds requests as for a waking server.
func New(cfg Config, st *state.Server, act Actuator, api API, log *zap.Logger) *Machine {
	st.SetAllReady(false)
	st.SetPhase(state.Waking)
	return &Machine{
		cfg:       cfg,
		st:        st,
		act:       act,
		api:       api,
		log:       log.With(zap.String("instance", cfg.Instance)),
		changed:   make(chan struct{}, 1),
		polled:    make(chan struct{}, 1),
		reportNow: make(chan struct{}, 1),
	}
}

// HoldsLease reports whether this supervisor holds the actuator's lease.
func (m *Machine) HoldsLease() bool { return m.holding.Load() }

// Ready reports whether the supervisor has read the actuator's state, and so
// knows what to do with requests.
func (m *Machine) Ready() bool { return m.seen.Load() }

// Announcement is the announcement this supervisor made or follows.
func (m *Machine) Announcement() actuator.Announcement { return m.current().id }

// ControlsParts reports whether the actuator last said it controls the
// server's parts, and so whether the server can sleep.
func (m *Machine) ControlsParts() bool { return m.controls.Load() }

// Run runs the machine until ctx is done. It follows the holder of the lease,
// takes the lease when it is free, acts while it holds it, and follows again
// if it loses it.
//
// spec: SUPV#resilience
func (m *Machine) Run(ctx context.Context) {
	var background sync.WaitGroup
	background.Go(func() { m.pollActuator(ctx) })
	background.Go(func() { m.report(ctx) })
	defer background.Wait()

	for {
		lease, ok := m.acquire(ctx)
		if !ok {
			return
		}
		tenure, lose := context.WithCancel(ctx)
		m.roleMu.Lock()
		m.tenureCancel = lose
		m.roleMu.Unlock()
		m.token = lease.Token

		var keeper sync.WaitGroup
		keeper.Go(func() { m.keepLease(tenure, lose) })
		m.actAsHolder(tenure)
		lose()
		keeper.Wait()

		m.roleMu.Lock()
		m.holding.Store(false)
		m.tenureCancel = nil
		m.roleMu.Unlock()
	}
}

// StepDown gives up the lease at once, if this supervisor holds it, and stops
// it taking the lease again, so another can take over acting. The supervisor
// goes on following and passing traffic until Run's context ends.
//
// spec: SUPV#resilience
func (m *Machine) StepDown() {
	if m.retiring.Swap(true) {
		return
	}
	m.roleMu.Lock()
	lose, holding := m.tenureCancel, m.holding.Load()
	m.roleMu.Unlock()
	if lose != nil {
		lose()
	}
	if holding {
		m.releaseLease()
	}
}

func (m *Machine) releaseLease() {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := m.act.ReleaseLease(ctx); err != nil {
		m.log.Warn("releasing the actuator's lease", zap.Error(err))
		return
	}
	m.log.Info("released the actuator's lease")
}

// acquire waits until this supervisor takes the lease. It reports false if
// ctx ended first, and waits for ctx while the supervisor is stepping down.
func (m *Machine) acquire(ctx context.Context) (actuator.LeaseInfo, bool) {
	waiting := false
	for {
		if m.retiring.Load() {
			<-ctx.Done()
			return actuator.LeaseInfo{}, false
		}
		lease, err := m.act.TakeLease(ctx, m.cfg.Instance, m.cfg.Timing.LeaseTTL)
		if err == nil {
			m.roleMu.Lock()
			m.holding.Store(true)
			m.roleMu.Unlock()
			if m.retiring.Load() {
				m.releaseLease()
				m.holding.Store(false)
				continue
			}
			m.log.Info("took the actuator's lease")
			return lease, true
		}
		if ctx.Err() != nil {
			return actuator.LeaseInfo{}, false
		}
		if !waiting {
			m.log.Info("waiting for the actuator's lease", zap.Error(err))
			waiting = true
		}
		if !sleepCtx(ctx, m.cfg.Timing.LeaseRetry) {
			return actuator.LeaseInfo{}, false
		}
	}
}

// keepLease renews the lease until ctx ends, and calls lose as soon as the
// lease is lost or may have expired.
func (m *Machine) keepLease(ctx context.Context, lose context.CancelFunc) {
	t := m.cfg.Timing
	ticker := time.NewTicker(t.LeaseRenew)
	defer ticker.Stop()
	renewed := time.Now()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
		_, err := m.act.RenewLease(ctx, m.cfg.Instance, t.LeaseTTL)
		switch {
		case err == nil:
			renewed = time.Now()
		case ctx.Err() != nil:
			return
		case actuator.IsConflict(err) || time.Since(renewed) >= t.LeaseTTL-t.LeaseRenew:
			m.log.Warn("lost the actuator's lease", zap.Error(err))
			lose()
			return
		default:
			m.log.Warn("renewing the actuator's lease", zap.Error(err))
		}
	}
}

// actAsHolder runs the machine while this supervisor holds the lease.
func (m *Machine) actAsHolder(ctx context.Context) {
	s, ok := m.readActuator(ctx)
	if !ok {
		return
	}
	if s.Upgrading {
		// spec: SUPV#upgrades
		m.serveAs(state.Waking, s)
		if !m.waitUpgrade(ctx) {
			return
		}
		// spec: SLPWK#rollouts
		m.wake(ctx)
	} else {
		m.takeOver(ctx, s)
	}
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

// takeOver sets the server's phase from the state of its parts, and wakes a
// server that is not asleep.
//
// spec: SUPV#resilience
func (m *Machine) takeOver(ctx context.Context, s actuator.State) {
	parts := m.cfg.Parts
	switch {
	case !m.controls.Load():
		m.setAwake()
	case s.AllDesired(parts, actuator.Down) && s.AllObserved(parts, actuator.Stopped):
		m.log.Info("taking over an asleep server; keeping it asleep")
		m.serveAs(state.Asleep, s)
	case s.AllDesired(parts, actuator.Up) && s.AllObserved(parts, actuator.Ready):
		m.serveAs(state.Awake, s)
	default:
		m.log.Info("taking over a server neither awake nor asleep; waking it")
		m.serveAs(state.Waking, s)
		m.wake(ctx)
	}
}

// serveAs sets each part ready as the actuator observes it, and announces
// phase.
func (m *Machine) serveAs(phase state.Phase, s actuator.State) {
	for _, p := range m.cfg.Parts {
		m.st.SetReady(p, s.Parts[p].Observed == actuator.Ready)
	}
	m.announce(phase)
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
	othersActivity, othersInFlight := m.others()
	lastActivity := snap.LastActivity
	if othersActivity.After(lastActivity) {
		lastActivity = othersActivity
	}
	var timeout <-chan time.Time
	if snap.InFlight+othersInFlight == 0 {
		due := lastActivity.Add(m.cfg.Timing.IdleTime)
		if m.nextAttempt.After(due) {
			due = m.nextAttempt
		}
		wait := time.Until(due)
		if wait <= 0 {
			m.goToSleep(ctx)
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
	case <-m.polled:
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
		{"settled", m.settle},
		{"checked", m.checkRelease},
		{"held", m.hold},
		{"tasks-stopped", func(ctx context.Context) error { return m.stop(ctx, state.Tasks, state.FHIR) }},
	}
	if !m.cfg.Central {
		steps = append(steps, sleepStep{"synced", m.finalSync})
	}
	return append(steps,
		sleepStep{"parts-stopped", func(ctx context.Context) error {
			return m.stop(ctx, state.Sync, state.API)
		}},
		sleepStep{"database-stopped", func(ctx context.Context) error { return m.stop(ctx, state.Database) }},
	)
}

// goToSleep puts the server to sleep.
//
// spec: SLPWK#going-to-sleep
func (m *Machine) goToSleep(ctx context.Context) {
	drain(m.st.WakeRequests())
	m.announce(state.GoingToSleep)
	m.log.Info("going to sleep")

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
	for _, s := range m.sleepSteps() {
		if err = s.run(sleepCtx); err != nil || sleepCtx.Err() != nil {
			failedStep = s.name
			break
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
		m.announce(state.Awake)
	case err != nil:
		m.fail(fmt.Sprintf("going to sleep, at %s: %v", failedStep, err))
		m.nextAttempt = time.Now().Add(m.cfg.Timing.IdleTime)
		m.wake(ctx)
	default:
		m.st.SetFailure("")
		m.wakeFailed = false
		m.announce(state.Asleep)
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
	if err := m.set(context.WithoutCancel(ctx), desired); err != nil {
		return err
	}
	return m.act.Await(ctx, parts, actuator.Stopped, m.cfg.Timing.PartTimeout, m.observe)
}

// set sets parts' desired states, and observes the state the actuator
// answers with, so an upgrade it reports is seen before the next poll.
func (m *Machine) set(ctx context.Context, desired map[state.Part]actuator.Desired) error {
	s, err := m.act.Set(ctx, desired)
	if err == nil {
		m.observe(s)
	}
	return err
}

// spec: SLPWK#waking
func (m *Machine) wake(ctx context.Context) {
	m.announce(state.Waking)
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
	m.setAwake()
	drain(m.st.WakeRequests())
	m.log.Info("awake")
}

func (m *Machine) wakeOnce(ctx context.Context) error {
	markReady := func(s actuator.State) {
		m.observe(s)
		for _, p := range m.cfg.Parts {
			if s.Parts[p].Observed == actuator.Ready {
				m.st.SetReady(p, true)
			}
		}
	}
	if err := m.set(ctx, map[state.Part]actuator.Desired{state.Database: actuator.Up}); err != nil {
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
	if err := m.set(ctx, desired); err != nil {
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
	m.announce(state.Awake)
}

func (m *Machine) fail(message string) {
	m.log.Warn(message)
	m.st.SetFailure(message)
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
