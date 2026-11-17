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
	waking        = condition{"waking", func(s *state.Server) { s.SetPhase(state.Waking); s.SetAllReady(false) }}
	wakingAPI     = condition{"waking with the api ready", func(s *state.Server) { s.SetPhase(state.Waking); s.SetReady(state.Sync, false) }}
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
		// spec: SLPWK#waking
		{Static, awake, result{forwarded, false, true}},
		{Static, asleep, result{forwarded, true, true}},
		{Static, waking, result{forwarded, true, true}},
		{Static, goingToSleep, result{forwarded, true, true}},
		{Static, upgrading, result{forwarded, false, true}},
		{Static, upgradeAsleep, result{forwarded, false, true}},

		{Activity, awake, result{forwarded, false, true}},
		{Activity, asleep, result{wakingResp, true, true}},
		{Activity, waking, result{wakingResp, true, true}},
		{Activity, wakingAPI, result{forwarded, false, true}},
		{Activity, goingToSleep, result{wakingResp, true, true}},
		{Activity, apiNotReady, result{wakingResp, true, true}},
		{Activity, upgrading, result{upgradeResp, false, true}},
		{Activity, upgradeAsleep, result{upgradeResp, false, true}},

		{Exempt, awake, result{forwarded, false, false}},
		{Exempt, asleep, result{wakingResp, false, false}},
		{Exempt, waking, result{wakingResp, false, false}},
		{Exempt, wakingAPI, result{forwarded, false, false}},
		{Exempt, goingToSleep, result{wakingResp, false, false}},
		{Exempt, apiNotReady, result{wakingResp, false, false}},
		{Exempt, upgrading, result{upgradeResp, false, false}},

		{Websocket, awake, result{forwarded, false, false}},
		{Websocket, asleep, result{refused, false, false}},
		{Websocket, waking, result{refused, false, false}},
		{Websocket, wakingAPI, result{forwarded, false, false}},
		{Websocket, goingToSleep, result{refused, false, false}},
		{Websocket, apiNotReady, result{refused, false, false}},
		{Websocket, upgrading, result{upgradeResp, false, false}},
	}
	for _, tt := range tests {
		t.Run(string(tt.class)+"/"+tt.cond.name, func(t *testing.T) {
			s := state.New(state.Parts())
			tt.cond.setup(s)
			g := &Gate{Class: tt.class, state: s}

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
				if tt.class == Activity || tt.class == Static {
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

// spec: SLPWK#waking
func TestPage(t *testing.T) {
	tests := []struct {
		name   string
		accept string
		cond   condition
		want   result
	}{
		{"browser, awake", "text/html", awake, result{forwarded, false, true}},
		{"browser, asleep", "text/html", asleep, result{wakingResp, true, true}},
		{"browser, waking", "text/html", waking, result{wakingResp, true, true}},
		{"browser, upgrading", "text/html", upgrading, result{upgradeResp, false, true}},
		{"other, asleep", "*/*", asleep, result{forwarded, true, true}},
		{"other, upgrading", "*/*", upgrading, result{forwarded, false, true}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := state.New(state.Parts())
			tt.cond.setup(s)
			r := httptest.NewRequest("GET", "/patients/all", nil)
			r.Header.Set("Accept", tt.accept)
			w := httptest.NewRecorder()
			next := caddyhttp.HandlerFunc(func(w http.ResponseWriter, r *http.Request) error {
				w.WriteHeader(http.StatusTeapot)
				return nil
			})
			if err := (&Gate{Class: Page, state: s}).ServeHTTP(w, r, next); err != nil {
				t.Fatal(err)
			}
			got := result{classifyPage(w), drained(s.WakeRequests()), drained(s.Activity())}
			if got != tt.want {
				t.Errorf("got %+v, want %+v", got, tt.want)
			}
		})
	}
}

// classifyPage reads which response the gate gave to a page request.
func classifyPage(w *httptest.ResponseRecorder) outcome {
	switch {
	case w.Code == http.StatusTeapot:
		return forwarded
	case strings.Contains(w.Body.String(), "Starting up"):
		return wakingResp
	case strings.Contains(w.Body.String(), "Upgrade in progress"):
		return upgradeResp
	}
	return outcome(w.Body.String())
}

func TestBrowserGetsWakingPage(t *testing.T) {
	s := state.New(state.Parts())
	s.SetPhase(state.Asleep)
	g := &Gate{Class: Activity, state: s}
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

// spec: SLPWK#activity
func TestSlowRequestCountsForItsWholeDuration(t *testing.T) {
	clock := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	tick := make(chan time.Time, 1)
	s := state.New(state.Parts())
	s.SetClock(func() time.Time {
		select {
		case clock = <-tick:
		default:
		}
		return clock
	})
	g := &Gate{Class: Activity, state: s}

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
	s := state.New(state.Parts())
	g := &Gate{Class: Activity, state: s}
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
	s := state.New(state.Parts())
	g := &Gate{Class: Activity, state: s}
	func() {
		defer func() { _ = recover() }()
		_ = g.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest("GET", "/api/x", nil),
			caddyhttp.HandlerFunc(func(http.ResponseWriter, *http.Request) error { panic("boom") }))
	}()
	if n := s.Snapshot().InFlight; n != 0 {
		t.Errorf("in flight after a panic = %d", n)
	}
}

// spec: SLPWK#activity
func TestIndex(t *testing.T) {
	tests := []struct {
		name   string
		accept string
		cond   condition
		want   result
	}{
		{"browser, awake", "text/html", awake, result{forwarded, false, true}},
		{"browser, asleep", "text/html", asleep, result{wakingResp, true, true}},
		{"probe, awake", "*/*", awake, result{forwarded, false, false}},
		{"probe, asleep", "*/*", asleep, result{forwarded, false, false}},
		{"probe, upgrading", "", upgrading, result{forwarded, false, false}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := state.New(state.Parts())
			tt.cond.setup(s)
			r := httptest.NewRequest("GET", "/", nil)
			if tt.accept != "" {
				r.Header.Set("Accept", tt.accept)
			}
			w := httptest.NewRecorder()
			next := caddyhttp.HandlerFunc(func(w http.ResponseWriter, r *http.Request) error {
				w.WriteHeader(http.StatusTeapot)
				return nil
			})
			if err := (&Gate{Class: Index, state: s}).ServeHTTP(w, r, next); err != nil {
				t.Fatal(err)
			}
			got := result{classifyPage(w), drained(s.WakeRequests()), drained(s.Activity())}
			if got != tt.want {
				t.Errorf("got %+v, want %+v", got, tt.want)
			}
			if n := s.Snapshot().InFlight; n != 0 {
				t.Errorf("in flight after the request = %d", n)
			}
		})
	}
}

func TestValidate(t *testing.T) {
	if err := (&Gate{Class: "chatty"}).Validate(); err == nil {
		t.Error("an unknown class validated")
	}
	for _, class := range []Class{Activity, Exempt, Websocket, Static, Page, Index} {
		if err := (&Gate{Class: class}).Validate(); err != nil {
			t.Error(err)
		}
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
