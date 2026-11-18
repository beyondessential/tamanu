package machine

import (
	"context"
	"fmt"
	"maps"
	"slices"
	"strings"
	"time"

	"go.uber.org/zap"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/actuator"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/state"
)

// announcement is a phase the holder announced, or the one a supervisor
// follows.
type announcement struct {
	phase state.Phase
	id    actuator.Announcement
}

func (m *Machine) current() announcement {
	m.annMu.Lock()
	defer m.annMu.Unlock()
	return m.ann
}

// announce moves the server to phase and, if the phase changed or this holder
// has not announced under its token yet, makes a new announcement and reports
// it at once.
//
// spec: SLPWK#actuator-contract
func (m *Machine) announce(phase state.Phase) {
	m.st.SetPhase(phase)
	m.annMu.Lock()
	ours := m.ann.id.Token == m.token
	if ours && m.ann.phase == phase {
		m.annMu.Unlock()
		return
	}
	id := actuator.Announcement{Token: m.token, Sequence: 1}
	if ours {
		id.Sequence = m.ann.id.Sequence + 1
	}
	m.ann = announcement{phase: phase, id: id}
	m.annMu.Unlock()
	notify(m.reportNow)
}

// pollActuator reads the actuator's state for as long as the machine runs. A
// supervisor that does not hold the lease follows the holder from it; the
// holder learns of the others' activity from it. While the actuator cannot be
// reached, a follower keeps to the last phase and readiness it saw.
//
// spec: SLPWK#waking
func (m *Machine) pollActuator(ctx context.Context) {
	ticker := time.NewTicker(m.cfg.Timing.ActuatorPoll)
	defer ticker.Stop()
	failing := false
	var received map[string]receivedReport
	for {
		asked := time.Now()
		s, err := m.act.State(ctx)
		switch {
		case err == nil:
			failing = false
			m.seen.Store(true)
			received = m.receive(s, received)
			m.latest.Store(&s)
			m.observe(s, asked)
			m.roleMu.Lock()
			holding := m.holding.Load()
			if !holding {
				m.follow(s)
			}
			m.roleMu.Unlock()
			if holding {
				m.takeWakeRequests(s)
				notify(m.polled)
			}
		case ctx.Err() == nil && !failing:
			m.log.Warn("reading the actuator's state", zap.Error(err))
			failing = true
		}
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}

// follow takes the phase from the holder's newest announcement, and each
// part's readiness from the actuator. A supervisor that has followed nothing
// yet goes by the parts alone. While the server is awake every part counts as
// ready, as it does for the holder, so a part that stops answering gets the
// error page from every supervisor alike. Called with roleMu held.
func (m *Machine) follow(s actuator.State) {
	if !m.controls.Load() {
		m.st.SetAllReady(true)
		m.st.SetPhase(state.Awake)
		return
	}
	m.followPhase(s)
	if m.st.Snapshot().Phase == state.Awake {
		m.st.SetAllReady(true)
		return
	}
	for _, p := range m.cfg.Parts {
		m.st.SetReady(p, s.Parts[p].Observed == actuator.Ready)
	}
}

func (m *Machine) followPhase(s actuator.State) {
	if s.Lease != nil && s.Lease.Holder != m.cfg.Instance {
		if r, ok := s.Reports[s.Lease.Holder]; ok && !r.Announcement.IsZero() {
			m.annMu.Lock()
			newer := r.Announcement.After(m.ann.id)
			if newer {
				m.ann = announcement{phase: r.Phase, id: r.Announcement}
			}
			m.annMu.Unlock()
			if newer {
				m.st.SetPhase(r.Phase)
				notify(m.reportNow)
			}
			return
		}
	}
	if m.current().id.IsZero() {
		switch {
		case s.AllObserved(m.cfg.Parts, actuator.Ready):
			m.st.SetPhase(state.Awake)
		case s.AllDesired(m.cfg.Parts, actuator.Down):
			m.st.SetPhase(state.Asleep)
		default:
			m.st.SetPhase(state.Waking)
		}
	}
}

// takeWakeRequests asks the holder for a wake when another supervisor
// reports one pending. A supervisor's request stays pending until it follows
// an awake server, so one made as the announcement changed still counts.
//
// spec: SLPWK#waking
func (m *Machine) takeWakeRequests(s actuator.State) {
	ann := m.current()
	if ann.phase == state.Awake {
		return
	}
	for instance, r := range s.Reports {
		if instance != m.cfg.Instance && r.WakeRequested {
			m.st.RequestWake()
			return
		}
	}
}

// receivedReport is when this supervisor first read a report, which the
// actuator's expiry identifies.
type receivedReport struct {
	expires time.Time
	at      time.Time
}

// receive records when each other supervisor last saw activity, counting its
// report's idle time back from when this supervisor first read the report,
// never by the reporter's clock. It can only make another's activity seem
// later, by up to the time between polls.
func (m *Machine) receive(s actuator.State, before map[string]receivedReport) map[string]receivedReport {
	now := time.Now()
	received := make(map[string]receivedReport, len(s.Reports))
	activity := make(map[string]time.Time, len(s.Reports))
	for instance, r := range s.Reports {
		if instance == m.cfg.Instance {
			continue
		}
		seen, ok := before[instance]
		if !ok || !seen.expires.Equal(r.ExpiresAt) {
			seen = receivedReport{expires: r.ExpiresAt, at: now}
		}
		received[instance] = seen
		activity[instance] = seen.at.Add(-time.Duration(r.IdleSeconds * float64(time.Second)))
	}
	m.activity.Store(&activity)
	return received
}

// others folds the other supervisors' reports: their latest activity, and
// how many requests that count as activity they have in flight.
//
// spec: SLPWK#activity
func (m *Machine) others() (lastActivity time.Time, inFlight int) {
	s, activity := m.latest.Load(), m.activity.Load()
	if s == nil {
		return time.Time{}, 0
	}
	for instance, r := range s.Reports {
		if instance == m.cfg.Instance {
			continue
		}
		if active := (*activity)[instance]; active.After(lastActivity) {
			lastActivity = active
		}
		inFlight += r.InFlight
	}
	return lastActivity, inFlight
}

// settle waits until every supervisor reporting follows the current
// announcement with nothing in flight, as must this one.
//
// spec: SLPWK#going-to-sleep
func (m *Machine) settle(ctx context.Context) error {
	id := m.current().id
	timeout := time.NewTimer(m.cfg.Timing.SettleTimeout)
	defer timeout.Stop()
	for {
		waiting := m.unsettled(id)
		if len(waiting) == 0 {
			// Reports sent as supervisors followed the announcement show
			// activity since the decision to sleep, which the reports it was
			// made on, sent only now and then while awake, could not.
			if last, _ := m.others(); time.Since(last) < m.cfg.Timing.IdleTime {
				return fmt.Errorf("%w: another supervisor saw activity %s ago", errBusy, time.Since(last).Round(time.Second))
			}
			return nil
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-timeout.C:
			return fmt.Errorf("supervisors still busy or behind: %s", strings.Join(waiting, ", "))
		case <-m.polled:
		case <-m.st.Activity():
		}
	}
}

func (m *Machine) unsettled(id actuator.Announcement) []string {
	var waiting []string
	if n := m.st.Snapshot().InFlight; n > 0 {
		waiting = append(waiting, fmt.Sprintf("%s (%d in flight)", m.cfg.Instance, n))
	}
	s := m.latest.Load()
	if s == nil {
		return waiting
	}
	for _, instance := range slices.Sorted(maps.Keys(s.Reports)) {
		r := s.Reports[instance]
		switch {
		case instance == m.cfg.Instance:
		case r.Follows != id:
			waiting = append(waiting, fmt.Sprintf("%s (following %s)", instance, r.Follows))
		case r.InFlight > 0:
			waiting = append(waiting, fmt.Sprintf("%s (%d in flight)", instance, r.InFlight))
		}
	}
	return waiting
}

// report sends this supervisor's report to the actuator until ctx ends: on
// every tick, on a new announcement, and while the server is not awake, as
// soon as a wake is asked for or the last request in flight finishes.
//
// spec: SLPWK#actuator-contract
func (m *Machine) report(ctx context.Context) {
	ticker := time.NewTicker(m.cfg.Timing.ReportEvery)
	defer ticker.Stop()
	failing := false
	for {
		err := m.act.Report(ctx, m.cfg.Instance, m.ownReport(), m.cfg.Timing.ReportTTL)
		switch {
		case err == nil:
			failing = false
		case ctx.Err() == nil && !failing:
			m.log.Warn("reporting to the actuator", zap.Error(err))
			failing = true
		}
		if !m.awaitReport(ctx, ticker.C) {
			return
		}
	}
}

// awaitReport waits until a report is due, and reports false if ctx ended
// first.
func (m *Machine) awaitReport(ctx context.Context, tick <-chan time.Time) bool {
	for {
		select {
		case <-ctx.Done():
			return false
		case <-tick:
			return true
		case <-m.reportNow:
			return true
		case <-m.st.ReportDue():
			if m.st.Snapshot().Phase != state.Awake {
				return true
			}
		}
	}
}

func (m *Machine) ownReport() actuator.Report {
	ann := m.current()
	snap := m.st.Snapshot()
	r := actuator.Report{
		IdleSeconds:   max(time.Since(snap.LastActivity).Seconds(), 0),
		InFlight:      snap.InFlight,
		WakeRequested: snap.WakePending,
		Follows:       ann.id,
	}
	if m.holding.Load() {
		r.Phase = ann.phase
		r.Announcement = ann.id
	}
	return r
}
