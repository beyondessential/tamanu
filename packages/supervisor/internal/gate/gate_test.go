package gate

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/caddyserver/caddy/v2/modules/caddyhttp"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/pages"
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

// Accept headers: none, as an api client sends; a browser opening a page;
// anything else, such as a health probe.
const (
	client  = ""
	browser = "text/html,application/xhtml+xml"
	probe   = "*/*"
)

var acceptNames = map[string]string{client: "client", browser: "browser", probe: "probe"}

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

// spec: SLPWK#activity
// spec: SLPWK#waking
func TestGate(t *testing.T) {
	tests := []struct {
		class  Class
		accept string
		cond   condition
		want   result
	}{
		{Static, client, awake, result{forwarded, false, true}},
		{Static, client, asleep, result{forwarded, true, true}},
		{Static, client, waking, result{forwarded, true, true}},
		{Static, client, goingToSleep, result{forwarded, true, true}},
		{Static, client, upgrading, result{forwarded, false, true}},
		{Static, client, upgradeAsleep, result{forwarded, false, true}},

		{Activity, client, awake, result{forwarded, false, true}},
		{Activity, client, asleep, result{wakingResp, true, true}},
		{Activity, browser, asleep, result{wakingResp, true, true}},
		{Activity, client, waking, result{wakingResp, true, true}},
		{Activity, client, wakingAPI, result{forwarded, false, true}},
		{Activity, client, goingToSleep, result{wakingResp, true, true}},
		{Activity, client, apiNotReady, result{wakingResp, true, true}},
		{Activity, client, upgrading, result{upgradeResp, false, true}},
		{Activity, client, upgradeAsleep, result{upgradeResp, false, true}},

		{Exempt, client, awake, result{forwarded, false, false}},
		{Exempt, client, asleep, result{wakingResp, false, false}},
		{Exempt, client, waking, result{wakingResp, false, false}},
		{Exempt, client, wakingAPI, result{forwarded, false, false}},
		{Exempt, client, goingToSleep, result{wakingResp, false, false}},
		{Exempt, client, apiNotReady, result{wakingResp, false, false}},
		{Exempt, client, upgrading, result{upgradeResp, false, false}},

		{Websocket, client, awake, result{forwarded, false, false}},
		{Websocket, client, asleep, result{refused, false, false}},
		{Websocket, client, waking, result{refused, false, false}},
		{Websocket, client, wakingAPI, result{forwarded, false, false}},
		{Websocket, client, goingToSleep, result{refused, false, false}},
		{Websocket, client, apiNotReady, result{refused, false, false}},
		{Websocket, client, upgrading, result{upgradeResp, false, false}},

		{Page, browser, awake, result{forwarded, false, true}},
		{Page, browser, asleep, result{wakingResp, true, true}},
		{Page, browser, waking, result{wakingResp, true, true}},
		{Page, browser, upgrading, result{upgradeResp, false, true}},
		{Page, probe, asleep, result{forwarded, true, true}},
		{Page, probe, upgrading, result{forwarded, false, true}},

		{Index, browser, awake, result{forwarded, false, true}},
		{Index, browser, asleep, result{wakingResp, true, true}},
		{Index, probe, awake, result{forwarded, false, false}},
		{Index, probe, asleep, result{forwarded, false, false}},
		{Index, client, upgrading, result{forwarded, false, false}},
	}
	for _, tt := range tests {
		t.Run(string(tt.class)+"/"+acceptNames[tt.accept]+"/"+tt.cond.name, func(t *testing.T) {
			s := state.New(state.Parts())
			tt.cond.setup(s)
			g := &Gate{Class: tt.class, state: s, pages: pages.Load("")}

			inFlightDuring := -1
			next := caddyhttp.HandlerFunc(func(w http.ResponseWriter, r *http.Request) error {
				inFlightDuring = s.Snapshot().InFlight
				w.WriteHeader(http.StatusTeapot)
				return nil
			})
			r := httptest.NewRequest("GET", "/api/patient", nil)
			if tt.accept != "" {
				r.Header.Set("Accept", tt.accept)
			}
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
			wantInFlight := 0
			if tt.want.counted {
				wantInFlight = 1
			}
			if got.outcome == forwarded && inFlightDuring != wantInFlight {
				t.Errorf("in flight while forwarded = %d, want %d", inFlightDuring, wantInFlight)
			}
			if n := s.Snapshot().InFlight; n != 0 {
				t.Errorf("in flight after the request = %d", n)
			}
		})
	}
}

// classify reads which response the gate gave, as a page or an api error.
func classify(w *httptest.ResponseRecorder) outcome {
	body, retry := w.Body.String(), w.Header().Get("Retry-After")
	switch {
	case w.Code == http.StatusTeapot:
		return forwarded
	case w.Code != http.StatusServiceUnavailable:
		return outcome("status " + http.StatusText(w.Code))
	case strings.Contains(body, "starting up") && retry == "10":
		return wakingResp
	case strings.Contains(body, "being upgraded") && retry != "":
		return upgradeResp
	case retry == "":
		return refused
	}
	return outcome("unrecognised 503: " + body)
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

func TestRequestEndsHoweverThePartAnswers(t *testing.T) {
	for _, tt := range []struct {
		name string
		next caddyhttp.HandlerFunc
	}{
		{"error", func(http.ResponseWriter, *http.Request) error {
			return caddyhttp.Error(http.StatusBadGateway, nil)
		}},
		{"panic", func(http.ResponseWriter, *http.Request) error { panic("boom") }},
	} {
		t.Run(tt.name, func(t *testing.T) {
			s := state.New(state.Parts())
			g := &Gate{Class: Activity, state: s}
			var err error
			func() {
				defer func() { _ = recover() }()
				err = g.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest("GET", "/api/x", nil), tt.next)
			}()
			if tt.name == "error" && err == nil {
				t.Error("the part's error was swallowed")
			}
			if n := s.Snapshot().InFlight; n != 0 {
				t.Errorf("in flight after the request = %d", n)
			}
		})
	}
}

func TestConcurrentRequests(t *testing.T) {
	s := state.New(state.Parts())
	g := &Gate{Class: Activity, state: s}
	next := caddyhttp.HandlerFunc(func(http.ResponseWriter, *http.Request) error { return nil })
	var wg sync.WaitGroup
	for range 100 {
		wg.Go(func() {
			_ = g.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest("GET", "/api/x", nil), next)
		})
	}
	wg.Wait()
	if n := s.Snapshot().InFlight; n != 0 {
		t.Errorf("in flight = %d", n)
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
