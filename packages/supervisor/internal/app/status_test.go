package app

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/caddyserver/caddy/v2"
	"github.com/caddyserver/caddy/v2/modules/caddyhttp"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/state"
)

func newTestApp() *App {
	return &App{
		Role:     "central",
		IdleTime: caddy.Duration(15 * time.Minute),
		state:    state.New(state.Parts()),
	}
}

func serve(t *testing.T, h *StatusHandler, method, path string) (*httptest.ResponseRecorder, error) {
	t.Helper()
	w := httptest.NewRecorder()
	err := h.ServeHTTP(w, httptest.NewRequest(method, path, nil), nil)
	return w, err
}

// spec: SUPV#status
func TestStatus(t *testing.T) {
	tests := []struct {
		name      string
		setup     func(*state.Server)
		wantState string
		apiReady  bool
		failure   string
		inFlight  int
		idle      bool
	}{
		{
			name:      "awake and idle",
			setup:     func(*state.Server) {},
			wantState: "awake", apiReady: true, idle: true,
		},
		{
			name: "asleep, after a failure",
			setup: func(s *state.Server) {
				s.SetPhase(state.Asleep)
				s.SetReady(state.API, false)
				s.SetFailure("fhir did not stop")
			},
			wantState: "asleep", failure: "fhir did not stop", idle: true,
		},
		{
			name:      "a request in flight",
			setup:     func(s *state.Server) { s.AdmitActivity(state.API) },
			wantState: "awake", apiReady: true, inFlight: 1,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			a := newTestApp()
			a.state.SetPhase(state.Awake)
			tt.setup(a.state)

			w, err := serve(t, &StatusHandler{app: a}, "GET", "/status")
			if err != nil || w.Code != http.StatusOK {
				t.Fatalf("status = %d, %v", w.Code, err)
			}
			var got struct {
				State       string
				Parts       map[string]struct{ Ready bool }
				Upgrading   bool
				LastFailure *struct{ Message string }
				InFlight    int
				IdleSince   *time.Time
				IdleTime    string
				CanSleep    bool
				Release     string
				Lease       string
				Instance    string
			}
			if err := json.Unmarshal(w.Body.Bytes(), &got); err != nil {
				t.Fatalf("%v in %s", err, w.Body)
			}
			if got.State != tt.wantState || got.Upgrading || got.CanSleep || got.IdleTime != "15m0s" || got.Release != "dev" {
				t.Errorf("status = %s", w.Body)
			}
			if len(got.Parts) != 5 || got.Parts["api"].Ready != tt.apiReady || !got.Parts["sync"].Ready {
				t.Errorf("parts = %+v", got.Parts)
			}
			var failure string
			if got.LastFailure != nil {
				failure = got.LastFailure.Message
			}
			if failure != tt.failure {
				t.Errorf("last failure = %q, want %q", failure, tt.failure)
			}
			if got.InFlight != tt.inFlight || (got.IdleSince != nil) != tt.idle {
				t.Errorf("in flight %d, idle since %v", got.InFlight, got.IdleSince)
			}
			if got.Lease != "" || got.Instance != "" {
				t.Errorf("a supervisor without an actuator reports a lease: %s", w.Body)
			}
		})
	}
}

// spec: SUPV#status
func TestEndpoints(t *testing.T) {
	a := newTestApp()
	a.state.SetPhase(state.Asleep)
	h := &StatusHandler{app: a}
	for _, tt := range []struct {
		method, path string
		wantCode     int
		wantBody     string
	}{
		{"GET", "/ready", http.StatusOK, "{\"ready\":true}\n"},
		{"GET", "/health", http.StatusOK, "{\"status\":\"ok\"}\n"},
		{"POST", "/status", http.StatusMethodNotAllowed, ""},
		{"PUT", "/status", http.StatusMethodNotAllowed, ""},
		{"DELETE", "/status", http.StatusMethodNotAllowed, ""},
		{"PATCH", "/status", http.StatusMethodNotAllowed, ""},
		{"GET", "/config/", http.StatusNotFound, ""},
	} {
		w, err := serve(t, h, tt.method, tt.path)
		code := w.Code
		var herr caddyhttp.HandlerError
		if errors.As(err, &herr) {
			code = herr.StatusCode
		} else if err != nil {
			t.Fatalf("%s %s: %v", tt.method, tt.path, err)
		}
		if code != tt.wantCode || w.Body.String() != tt.wantBody {
			t.Errorf("%s %s = %d %q, want %d %q", tt.method, tt.path, code, w.Body, tt.wantCode, tt.wantBody)
		}
	}
	if n := a.state.Snapshot().InFlight; n != 0 {
		t.Errorf("an endpoint counted as activity")
	}
	select {
	case <-a.state.WakeRequests():
		t.Error("an endpoint asked for a wake")
	default:
	}
}
