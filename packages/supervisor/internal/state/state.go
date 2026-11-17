// Package state holds the supervisor's view of its server at run time: whether
// the server is awake, which of its parts are ready, whether an upgrade is in
// progress, and the activity passing through.
//
// The gate reads it for every request; the sleep and wake machinery writes it.
// It knows nothing about Caddy.
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

// The parts a server can have.
const (
	Database Part = "database"
	API      Part = "api"
	Web      Part = "web"
	Portal   Part = "portal"
	Sync     Part = "sync"
	Tasks    Part = "tasks"
	FHIR     Part = "fhir"
)

// PartsFor lists the parts of a server, central or not.
func PartsFor(central bool) []Part {
	parts := []Part{Database, API, Web, Sync, Tasks, FHIR}
	if central {
		parts = append(parts, Portal)
	}
	return parts
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
// concurrent use. A new Server is awake with every part ready, which is where
// a supervisor with no actuator stays.
type Server struct {
	mu           sync.Mutex
	phase        Phase
	ready        map[Part]bool
	parts        []Part
	upgrading    bool
	inFlight     int
	lastActivity time.Time
	lastFailure  *Failure
	now          func() time.Time
	wake         chan struct{}
	activity     chan struct{}
}

// New returns the state of a server with the given parts, awake and ready.
func New(parts []Part) *Server {
	s := &Server{
		phase:    Awake,
		ready:    make(map[Part]bool, len(parts)),
		parts:    append([]Part(nil), parts...),
		now:      time.Now,
		wake:     make(chan struct{}, 1),
		activity: make(chan struct{}, 1),
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

// admit decides under the lock. A part the server does not have is never
// ready.
func (s *Server) admit(part Part) Admission {
	switch {
	case s.upgrading:
		return Upgrading
	case s.phase == Awake && s.ready[part]:
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

// AdmitActivity decides what to do with a request to part that counts as
// activity, and records the activity. When the request is to be forwarded it
// is counted as in flight until done is called, which the caller must do
// once the request has finished. When it is held, the server is asked to wake.
// done is never nil and is safe to call more than once.
//
// spec: SLPWK#activity
func (s *Server) AdmitActivity(part Part) (admission Admission, done func()) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.lastActivity = s.now()
	notify(s.activity)

	admission = s.admit(part)
	switch admission {
	case Forward:
		s.inFlight++
		var once sync.Once
		return admission, func() { once.Do(s.endActivity) }
	case Hold:
		// spec: SLPWK#waking
		notify(s.wake)
	}
	return admission, func() {}
}

func (s *Server) endActivity() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.inFlight--
	s.lastActivity = s.now()
	notify(s.activity)
}

// RequestWake asks for the server to be woken. Requests made while one is
// already pending are merged into it.
func (s *Server) RequestWake() { notify(s.wake) }

// WakeRequests delivers a value whenever a wake has been asked for since the
// last one was received. A request that counts as activity while the server
// is not forwarding it asks for a wake, as does a call to RequestWake.
func (s *Server) WakeRequests() <-chan struct{} { return s.wake }

// Activity delivers a value whenever activity has started or finished since
// the last one was received, so an idle timer can rearm itself.
func (s *Server) Activity() <-chan struct{} { return s.activity }

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
	s.lastFailure = &Failure{At: s.now(), Message: message}
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
		Phase:        s.phase,
		Ready:        ready,
		Parts:        append([]Part(nil), s.parts...),
		Upgrading:    s.upgrading,
		InFlight:     s.inFlight,
		LastActivity: s.lastActivity,
		LastFailure:  failure,
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
