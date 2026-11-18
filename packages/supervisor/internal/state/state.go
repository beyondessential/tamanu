// Package state holds the supervisor's run-time view of its server. The gate
// reads it for every request and the sleep and wake machine writes it; it
// knows nothing about Caddy.
package state

import (
	"sync"
	"time"
)

// Phase is where the server is between awake and asleep.
type Phase string

// The phases a server goes through.
const (
	Awake        Phase = "awake"
	GoingToSleep Phase = "going-to-sleep"
	Asleep       Phase = "asleep"
	Waking       Phase = "waking"
)

// Part is one of the server's parts, as the actuator contract names them.
//
// spec: SLPWK#going-to-sleep
type Part string

// The parts a server has.
const (
	Database Part = "database"
	API      Part = "api"
	Sync     Part = "sync"
	Tasks    Part = "tasks"
	FHIR     Part = "fhir"
)

// Parts lists the server's parts.
func Parts() []Part {
	return []Part{Database, API, Sync, Tasks, FHIR}
}

// Admission is what the gate does with a request.
type Admission int

const (
	// Forward sends the request on to its part.
	Forward Admission = iota
	// Hold answers the request with the waking response.
	Hold
	// Upgrading answers the request with the upgrading response.
	Upgrading
)

// Failure is a failed sleep or wake step.
type Failure struct {
	At      time.Time `json:"at"`
	Message string    `json:"message"`
}

// Server is the run-time state of one server. Its methods are safe for
// concurrent use. A new Server is awake with every part ready.
type Server struct {
	mu           sync.Mutex
	phase        Phase
	ready        map[Part]bool
	parts        []Part
	upgrading    bool
	inFlight     int
	lastActivity time.Time
	lastFailure  *Failure
	lastWake     time.Time
	now          func() time.Time
	wake         chan struct{}
	activity     chan struct{}
	reportDue    chan struct{}
}

// New returns the state of a server with the given parts, awake and ready.
func New(parts []Part) *Server {
	s := &Server{
		phase:     Awake,
		ready:     make(map[Part]bool, len(parts)),
		parts:     append([]Part(nil), parts...),
		now:       time.Now,
		wake:      make(chan struct{}, 1),
		activity:  make(chan struct{}, 1),
		reportDue: make(chan struct{}, 1),
	}
	for _, p := range parts {
		s.ready[p] = true
	}
	s.lastActivity = s.now()
	return s
}

// SetClock replaces the clock the state reads, for tests.
func (s *Server) SetClock(now func() time.Time) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.now = now
}

// admit decides with s.mu held. A part the server lacks is never ready.
//
// spec: SLPWK#waking
func (s *Server) admit(part Part) Admission {
	switch {
	case s.upgrading:
		return Upgrading
	case (s.phase == Awake || s.phase == Waking) && s.ready[part]:
		return Forward
	default:
		return Hold
	}
}

// Admit decides what to do with a request to part that is not activity.
func (s *Server) Admit(part Part) Admission {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.admit(part)
}

// AdmitStatic records a request for one of the supervisor's own files, which
// is served in every state and counts as activity. done must be called once
// the request has finished.
//
// spec: SLPWK#waking
func (s *Server) AdmitStatic() (done func()) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.lastActivity = s.now()
	notify(s.activity)
	if s.phase != Awake && !s.upgrading {
		s.requestWake()
	}
	s.inFlight++
	var once sync.Once
	return func() { once.Do(s.endActivity) }
}

// AdmitActivity is Admit for a request that counts as activity. A forwarded
// request is in flight until the caller calls done, which is never nil and
// may be called more than once.
//
// spec: SLPWK#activity
func (s *Server) AdmitActivity(part Part) (admission Admission, done func()) {
	s.mu.Lock()
	defer s.mu.Unlock()
	admission = s.admit(part)
	s.lastActivity = s.now()
	notify(s.activity)

	switch admission {
	case Forward:
		s.inFlight++
		var once sync.Once
		return admission, func() { once.Do(s.endActivity) }
	case Hold:
		// spec: SLPWK#waking
		s.requestWake()
	}
	return admission, func() {}
}

// requestWake asks for a wake, with s.mu held.
func (s *Server) requestWake() {
	s.lastWake = s.now()
	notify(s.wake)
	notify(s.reportDue)
}

func (s *Server) endActivity() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.inFlight--
	s.lastActivity = s.now()
	notify(s.activity)
	if s.inFlight == 0 {
		notify(s.reportDue)
	}
}

// RequestWake asks for the server to be woken. Requests made while one is
// already pending are merged into it.
func (s *Server) RequestWake() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.requestWake()
}

// WakeRequests delivers a value whenever a wake has been asked for since the
// last one was received.
func (s *Server) WakeRequests() <-chan struct{} { return s.wake }

// Activity delivers a value whenever activity has started or finished since
// the last one was received, so an idle timer can rearm itself.
func (s *Server) Activity() <-chan struct{} { return s.activity }

// ReportDue delivers a value whenever a wake has been asked for, or the last
// request in flight has finished, since the last one was received.
func (s *Server) ReportDue() <-chan struct{} { return s.reportDue }

// SetPhase moves the server to phase.
func (s *Server) SetPhase(phase Phase) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.phase = phase
}

// SetReady records whether part is ready to be forwarded requests.
func (s *Server) SetReady(part Part, ready bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, known := s.ready[part]; known {
		s.ready[part] = ready
	}
}

// SetAllReady records whether every part is ready.
func (s *Server) SetAllReady(ready bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for p := range s.ready {
		s.ready[p] = ready
	}
}

// SetUpgrading records whether an upgrade of the server is in progress.
func (s *Server) SetUpgrading(upgrading bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.upgrading = upgrading
}

// SetFailure records the failure of the last sleep or wake, or clears it
// when message is empty.
func (s *Server) SetFailure(message string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if message == "" {
		s.lastFailure = nil
		return
	}
	s.lastFailure = &Failure{At: s.now().UTC(), Message: message}
}

// Snapshot is a consistent copy of the state at one moment.
type Snapshot struct {
	Phase        Phase
	Ready        map[Part]bool
	Parts        []Part
	Upgrading    bool
	InFlight     int
	LastActivity time.Time
	LastFailure  *Failure
	// LastWakeRequest is when a wake was last asked for.
	LastWakeRequest time.Time
}

// Idle reports how long the server has had no activity, which is zero while
// any request that counts as activity is in flight.
func (sn Snapshot) Idle(now time.Time) time.Duration {
	if sn.InFlight > 0 {
		return 0
	}
	return now.Sub(sn.LastActivity)
}

// Snapshot copies the state.
func (s *Server) Snapshot() Snapshot {
	s.mu.Lock()
	defer s.mu.Unlock()
	ready := make(map[Part]bool, len(s.ready))
	for p, r := range s.ready {
		ready[p] = r
	}
	var failure *Failure
	if s.lastFailure != nil {
		f := *s.lastFailure
		failure = &f
	}
	return Snapshot{
		LastWakeRequest: s.lastWake,
		Phase:           s.phase,
		Ready:           ready,
		Parts:           append([]Part(nil), s.parts...),
		Upgrading:       s.upgrading,
		InFlight:        s.inFlight,
		LastActivity:    s.lastActivity,
		LastFailure:     failure,
	}
}

// notify sends on a one-slot channel without blocking, merging with a value
// already waiting.
func notify(ch chan struct{}) {
	select {
	case ch <- struct{}{}:
	default:
	}
}
