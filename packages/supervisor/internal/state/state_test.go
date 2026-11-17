package state

import (
	"slices"
	"sync"
	"testing"
	"time"
)

func TestNewIsAwakeAndReady(t *testing.T) {
	s := New(Parts())
	snap := s.Snapshot()
	if snap.Phase != Awake || snap.Upgrading || snap.InFlight != 0 || snap.LastFailure != nil {
		t.Errorf("unexpected initial state %+v", snap)
	}
	for _, p := range Parts() {
		if !snap.Ready[p] {
			t.Errorf("part %s not ready", p)
		}
	}
	if s.Admit(Sync) != Forward || s.Admit(API) != Forward {
		t.Error("a new server does not forward")
	}
}

func TestParts(t *testing.T) {
	want := []Part{Database, API, Sync, Tasks, FHIR}
	if !slices.Equal(Parts(), want) {
		t.Errorf("parts = %v", Parts())
	}
}

func TestAdmit(t *testing.T) {
	tests := []struct {
		name      string
		setup     func(*Server)
		part      Part
		want      Admission
		wantsWake bool
	}{
		{"awake", func(*Server) {}, API, Forward, false},
		{"asleep", func(s *Server) { s.SetPhase(Asleep) }, API, Hold, true},
		{"waking", func(s *Server) { s.SetPhase(Waking); s.SetReady(API, false) }, API, Hold, true},
		{"waking with the part ready", func(s *Server) { s.SetPhase(Waking); s.SetReady(Sync, false) }, API, Forward, false},
		{"asleep with the part ready", func(s *Server) { s.SetPhase(Asleep) }, API, Hold, true},
		{"going to sleep", func(s *Server) { s.SetPhase(GoingToSleep) }, API, Hold, true},
		{"part not ready", func(s *Server) { s.SetReady(API, false) }, API, Hold, true},
		{"other part not ready", func(s *Server) { s.SetReady(Sync, false) }, API, Forward, false},
		{"part the server lacks", func(*Server) {}, Part("web"), Hold, true},
		{"upgrading", func(s *Server) { s.SetUpgrading(true) }, API, Upgrading, false},
		{"upgrading while asleep", func(s *Server) { s.SetPhase(Asleep); s.SetUpgrading(true) }, API, Upgrading, false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := New(Parts())
			tt.setup(s)
			if got := s.Admit(tt.part); got != tt.want {
				t.Errorf("Admit = %v, want %v", got, tt.want)
			}
			if wakes(s) {
				t.Error("Admit asked for a wake")
			}
			got, done := s.AdmitActivity(tt.part)
			done()
			if got != tt.want {
				t.Errorf("AdmitActivity = %v, want %v", got, tt.want)
			}
			if w := wakes(s); w != tt.wantsWake {
				t.Errorf("wake requested = %v, want %v", w, tt.wantsWake)
			}
		})
	}
}

func TestActivityCountsUntilDone(t *testing.T) {
	clock := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	s := New(Parts())
	s.SetClock(func() time.Time { return clock })

	_, done := s.AdmitActivity(API)
	if n := s.Snapshot().InFlight; n != 1 {
		t.Fatalf("in flight = %d, want 1", n)
	}
	clock = clock.Add(time.Hour)
	if idle := s.Snapshot().Idle(clock); idle != 0 {
		t.Errorf("idle with a request in flight = %v", idle)
	}
	done()
	done()
	snap := s.Snapshot()
	if snap.InFlight != 0 {
		t.Errorf("in flight after done = %d", snap.InFlight)
	}
	if !snap.LastActivity.Equal(clock) {
		t.Errorf("last activity = %v, want the end of the request %v", snap.LastActivity, clock)
	}
	if idle := snap.Idle(clock.Add(time.Minute)); idle != time.Minute {
		t.Errorf("idle = %v", idle)
	}
}

func TestHeldActivityIsNotInFlight(t *testing.T) {
	s := New(Parts())
	s.SetPhase(Asleep)
	_, done := s.AdmitActivity(API)
	if n := s.Snapshot().InFlight; n != 0 {
		t.Errorf("held request counted in flight: %d", n)
	}
	done()
	if n := s.Snapshot().InFlight; n != 0 {
		t.Errorf("done on a held request changed in flight: %d", n)
	}
}

func TestActivityNotifies(t *testing.T) {
	s := New(Parts())
	_, done := s.AdmitActivity(API)
	<-s.Activity()
	done()
	<-s.Activity()
}

func TestWakeRequestsMerge(t *testing.T) {
	s := New(Parts())
	s.RequestWake()
	s.RequestWake()
	if !wakes(s) {
		t.Fatal("no wake request")
	}
	if wakes(s) {
		t.Error("wake requests not merged")
	}
}

func TestConcurrentActivity(t *testing.T) {
	s := New(Parts())
	var wg sync.WaitGroup
	for range 100 {
		wg.Go(func() {
			_, done := s.AdmitActivity(API)
			done()
		})
	}
	wg.Wait()
	if n := s.Snapshot().InFlight; n != 0 {
		t.Errorf("in flight = %d", n)
	}
}

func TestSetAllReady(t *testing.T) {
	s := New(Parts())
	s.SetAllReady(false)
	for p, ready := range s.Snapshot().Ready {
		if ready {
			t.Errorf("%s still ready", p)
		}
	}
}

func TestAdmitStatic(t *testing.T) {
	tests := []struct {
		name      string
		setup     func(*Server)
		wantsWake bool
	}{
		{"awake", func(*Server) {}, false},
		{"asleep", func(s *Server) { s.SetPhase(Asleep) }, true},
		{"going to sleep", func(s *Server) { s.SetPhase(GoingToSleep) }, true},
		{"waking", func(s *Server) { s.SetPhase(Waking) }, true},
		{"upgrading while asleep", func(s *Server) { s.SetPhase(Asleep); s.SetUpgrading(true) }, false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := New(Parts())
			tt.setup(s)
			admission, done := s.AdmitStatic()
			if admission != Forward {
				t.Errorf("admission = %v", admission)
			}
			if n := s.Snapshot().InFlight; n != 1 {
				t.Errorf("in flight = %d", n)
			}
			done()
			done()
			if n := s.Snapshot().InFlight; n != 0 {
				t.Errorf("in flight after done = %d", n)
			}
			if got := wakes(s); got != tt.wantsWake {
				t.Errorf("wake requested = %v, want %v", got, tt.wantsWake)
			}
			select {
			case <-s.Activity():
			default:
				t.Error("not recorded as activity")
			}
		})
	}
}

// spec: SUPV#resilience
func TestStandby(t *testing.T) {
	s := New(Parts())
	s.SetServing(false)
	s.SetPhase(Asleep)
	if got := s.Admit(API); got != Standby {
		t.Errorf("Admit = %v", got)
	}
	if got, done := s.AdmitActivity(API); got != Standby {
		t.Errorf("AdmitActivity = %v", got)
	} else {
		done()
	}
	if got, done := s.AdmitStatic(); got != Standby {
		t.Errorf("AdmitStatic = %v", got)
	} else {
		done()
	}
	if wakes(s) {
		t.Error("a request on standby asked for a wake")
	}
	select {
	case <-s.Activity():
		t.Error("a request on standby counted as activity")
	default:
	}
	s.SetServing(true)
	if got := s.Admit(API); got != Hold {
		t.Errorf("Admit once serving = %v", got)
	}
}

func TestLastWakeRequest(t *testing.T) {
	at := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	s := New(Parts())
	s.SetClock(func() time.Time { return at })
	s.SetPhase(Asleep)
	_, done := s.AdmitActivity(API)
	done()
	if got := s.Snapshot().LastWakeRequest; !got.Equal(at) {
		t.Errorf("last wake request = %v", got)
	}
}

func TestFailure(t *testing.T) {
	s := New(Parts())
	s.SetFailure("database did not start")
	snap := s.Snapshot()
	if snap.LastFailure == nil || snap.LastFailure.Message != "database did not start" {
		t.Fatalf("failure = %+v", snap.LastFailure)
	}
	snap.LastFailure.Message = "changed"
	if s.Snapshot().LastFailure.Message != "database did not start" {
		t.Error("snapshot shares the failure")
	}
	s.SetFailure("")
	if s.Snapshot().LastFailure != nil {
		t.Error("failure not cleared")
	}
}

func wakes(s *Server) bool {
	select {
	case <-s.WakeRequests():
		return true
	default:
		return false
	}
}
