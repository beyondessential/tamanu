package gate

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/caddyserver/caddy/v2/modules/caddyhttp"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/state"
)

// condition sets the server up for a case.
type condition struct {
	name  string
	setup func(*state.Server)
}

var (
	awake         = condition{"awake", func(*state.Server) {}}
	asleep        = condition{"asleep", func(s *state.Server) { s.SetPhase(state.Asleep) }}
	waking        = condition{"waking", func(s *state.Server) { s.SetPhase(state.Waking) }}
	goingToSleep  = condition{"going to sleep", func(s *state.Server) { s.SetPhase(state.GoingToSleep) }}
	apiNotReady   = condition{"api not ready", func(s *state.Server) { s.SetReady(state.API, false) }}
	upgrading     = condition{"upgrading", func(s *state.Server) { s.SetUpgrading(true) }}
	upgradeAsleep = condition{"upgrading while asleep", func(s *state.Server) { s.SetPhase(state.Asleep); s.SetUpgrading(true) }}
)

// outcome is what a request met.
type outcome string

const (
	forwarded   outcome = "forwarded"
	wakingResp  outcome = "waking"
	upgradeResp outcome = "upgrading"
	refused     outcome = "refused"
)

// result is what a request met, whether it asked for a wake, and whether it
// was recorded as activity.
type result struct {
	outcome outcome
	wakes   bool
	counted bool
}

func TestGate(t *testing.T) {
	tests := []struct {
		class Class
		cond  condition
		want  result
	}{
		{Activity, awake, result{forwarded, false, true}},
		{Activity, asleep, result{wakingResp, true, true}},
		{Activity, waking, result{wakingResp, true, true}},
		{Activity, goingToSleep, result{wakingResp, true, true}},
		{Activity, apiNotReady, result{wakingResp, true, true}},
		{Activity, upgrading, result{upgradeResp, false, true}},
		{Activity, upgradeAsleep, result{upgradeResp, false, true}},

		{Exempt, awake, result{forwarded, false, false}},
		{Exempt, asleep, result{wakingResp, false, false}},
		{Exempt, waking, result{wakingResp, false, false}},
		{Exempt, goingToSleep, result{wakingResp, false, false}},
		{Exempt, apiNotReady, result{wakingResp, false, false}},
		{Exempt, upgrading, result{upgradeResp, false, false}},

		{Websocket, awake, result{forwarded, false, false}},
		{Websocket, asleep, result{refused, false, false}},
		{Websocket, waking, result{refused, false, false}},
		{Websocket, goingToSleep, result{refused, false, false}},
		{Websocket, apiNotReady, result{refused, false, false}},
		{Websocket, upgrading, result{upgradeResp, false, false}},
	}
	for _, tt := range tests {
		t.Run(string(tt.class)+"/"+tt.cond.name, func(t *testing.T) {
			s := state.New(state.PartsFor(false))
			tt.cond.setup(s)
			g := &Gate{Class: tt.class, Part: state.API, state: s}

			inFlightDuring := -1
			next := caddyhttp.HandlerFunc(func(w http.ResponseWriter, r *http.Request) error {
				inFlightDuring = s.Snapshot().InFlight
				w.WriteHeader(http.StatusTeapot)
				return nil
			})
			r := httptest.NewRequest("GET", "/api/patient", nil)
			w := httptest.NewRecorder()
			if err := g.ServeHTTP(w, r, next); err != nil {
				t.Fatal(err)
			}

			got := result{
				outcome: classify(w),
				wakes:   drained(s.WakeRequests()),
				counted: drained(s.Activity()),
			}
			if got != tt.want {
				t.Errorf("got %+v, want %+v", got, tt.want)
			}
			if got.outcome == forwarded {
				wantInFlight := 0
				if tt.class == Activity {
					wantInFlight = 1
				}
				if inFlightDuring != wantInFlight {
					t.Errorf("in flight while forwarded = %d, want %d", inFlightDuring, wantInFlight)
				}
			}
			if n := s.Snapshot().InFlight; n != 0 {
				t.Errorf("in flight after the request = %d", n)
			}
		})
	}
}

// classify reads which response the gate gave.
func classify(w *httptest.ResponseRecorder) outcome {
	switch {
	case w.Code == http.StatusTeapot:
		return forwarded
	case w.Code != http.StatusServiceUnavailable:
		return outcome("status " + http.StatusText(w.Code))
	case strings.Contains(w.Body.String(), "ServerWaking") && w.Header().Get("Retry-After") == "10":
		return wakingResp
	case strings.Contains(w.Body.String(), "ServerUpgrading") && w.Header().Get("Retry-After") != "":
		return upgradeResp
	case w.Header().Get("Retry-After") == "":
		return refused
	}
	return outcome("unrecognised 503: " + w.Body.String())
}

func TestBrowserGetsWakingPage(t *testing.T) {
	s := state.New(state.PartsFor(false))
	s.SetPhase(state.Asleep)
	g := &Gate{Class: Activity, Part: state.Web, state: s}
	r := httptest.NewRequest("GET", "/", nil)
	r.Header.Set("Accept", "text/html,application/xhtml+xml")
	w := httptest.NewRecorder()
	if err := g.ServeHTTP(w, r, nil); err != nil {
		t.Fatal(err)
	}
	if w.Code != http.StatusServiceUnavailable || !strings.Contains(w.Body.String(), `http-equiv="refresh"`) {
		t.Errorf("got %d %q", w.Code, w.Body)
	}
	if !drained(s.WakeRequests()) {
		t.Error("browser request did not wake the server")
	}
}

func TestPartNotReadyHoldsOnlyThatPart(t *testing.T) {
	s := state.New(state.PartsFor(false))
	s.SetReady(state.Web, false)
	ok := caddyhttp.HandlerFunc(func(w http.ResponseWriter, r *http.Request) error {
		w.WriteHeader(http.StatusTeapot)
		return nil
	})

	w := httptest.NewRecorder()
	_ = (&Gate{Class: Activity, Part: state.API, state: s}).ServeHTTP(w, httptest.NewRequest("GET", "/api/x", nil), ok)
	if w.Code != http.StatusTeapot {
		t.Errorf("api request with web not ready = %d", w.Code)
	}

	w = httptest.NewRecorder()
	_ = (&Gate{Class: Activity, Part: state.Web, state: s}).ServeHTTP(w, httptest.NewRequest("GET", "/", nil), ok)
	if w.Code != http.StatusServiceUnavailable {
		t.Errorf("web request with web not ready = %d", w.Code)
	}
}

// spec: SLPWK#activity
func TestSlowRequestCountsForItsWholeDuration(t *testing.T) {
	clock := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	tick := make(chan time.Time, 1)
	s := state.New(state.PartsFor(false))
	s.SetClock(func() time.Time {
		select {
		case clock = <-tick:
		default:
		}
		return clock
	})
	g := &Gate{Class: Activity, Part: state.API, state: s}

	started := make(chan struct{})
	release := make(chan struct{})
	next := caddyhttp.HandlerFunc(func(w http.ResponseWriter, r *http.Request) error {
		close(started)
		<-release
		return nil
	})
	finished := make(chan struct{})
	go func() {
		defer close(finished)
		_ = g.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest("POST", "/api/admin/import", nil), next)
	}()

	<-started
	for range 3 {
		snap := s.Snapshot()
		if snap.InFlight != 1 {
			t.Fatalf("in flight while running = %d", snap.InFlight)
		}
		if idle := snap.Idle(clock.Add(time.Hour)); idle != 0 {
			t.Fatalf("idle while running = %v", idle)
		}
	}
	end := clock.Add(2 * time.Hour)
	tick <- end
	close(release)
	<-finished

	snap := s.Snapshot()
	if snap.InFlight != 0 {
		t.Errorf("in flight after = %d", snap.InFlight)
	}
	if !snap.LastActivity.Equal(end) {
		t.Errorf("last activity = %v, want the request's end %v", snap.LastActivity, end)
	}
}

func TestFailingRequestStillEnds(t *testing.T) {
	s := state.New(state.PartsFor(false))
	g := &Gate{Class: Activity, Part: state.API, state: s}
	err := g.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest("GET", "/api/x", nil),
		caddyhttp.HandlerFunc(func(http.ResponseWriter, *http.Request) error {
			return caddyhttp.Error(http.StatusBadGateway, nil)
		}))
	if err == nil {
		t.Error("the part's error was swallowed")
	}
	if n := s.Snapshot().InFlight; n != 0 {
		t.Errorf("in flight after a failed request = %d", n)
	}
}

func TestPanickingRequestStillEnds(t *testing.T) {
	s := state.New(state.PartsFor(false))
	g := &Gate{Class: Activity, Part: state.API, state: s}
	func() {
		defer func() { _ = recover() }()
		_ = g.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest("GET", "/api/x", nil),
			caddyhttp.HandlerFunc(func(http.ResponseWriter, *http.Request) error { panic("boom") }))
	}()
	if n := s.Snapshot().InFlight; n != 0 {
		t.Errorf("in flight after a panic = %d", n)
	}
}

func TestValidate(t *testing.T) {
	for _, g := range []Gate{
		{Class: "chatty", Part: state.API},
		{Class: Activity, Part: state.Database},
		{Class: Activity},
	} {
		if err := g.Validate(); err == nil {
			t.Errorf("%+v validated", g)
		}
	}
	if err := (&Gate{Class: Websocket, Part: state.Portal}).Validate(); err != nil {
		t.Error(err)
	}
}

func drained(ch <-chan struct{}) bool {
	select {
	case <-ch:
		return true
	default:
		return false
	}
}
