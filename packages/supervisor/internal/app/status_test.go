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
		state:    state.New(state.PartsFor(true)),
	}
}

func serve(t *testing.T, h *StatusHandler, method, path string) (*httptest.ResponseRecorder, error) {
	t.Helper()
	w := httptest.NewRecorder()
	err := h.ServeHTTP(w, httptest.NewRequest(method, path, nil), nil)
	return w, err
}

func TestStatus(t *testing.T) {
	a := newTestApp()
	a.state.SetPhase(state.Asleep)
	a.state.SetReady(state.API, false)
	a.state.SetFailure("fhir did not stop")
	h := &StatusHandler{app: a}

	w, err := serve(t, h, "GET", "/status")
	if err != nil {
		t.Fatal(err)
	}
	if w.Code != http.StatusOK {
		t.Errorf("an asleep server reports status %d, not 200", w.Code)
	}
	var got struct {
		State       string                          `json:"state"`
		Parts       map[string]struct{ Ready bool } `json:"parts"`
		Upgrading   bool                            `json:"upgrading"`
		LastFailure *struct{ Message string }       `json:"lastFailure"`
		IdleTime    string                          `json:"idleTime"`
		CanSleep    bool                            `json:"canSleep"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &got); err != nil {
		t.Fatalf("%v in %s", err, w.Body)
	}
	if got.State != "asleep" || got.Upgrading || got.CanSleep || got.IdleTime != "15m0s" {
		t.Errorf("status = %s", w.Body)
	}
	if len(got.Parts) != 7 || got.Parts["api"].Ready || !got.Parts["portal"].Ready {
		t.Errorf("parts = %+v", got.Parts)
	}
	if got.LastFailure == nil || got.LastFailure.Message != "fhir did not stop" {
		t.Errorf("last failure = %+v", got.LastFailure)
	}
}

func TestIdleSince(t *testing.T) {
	a := newTestApp()
	h := &StatusHandler{app: a}
	read := func() map[string]any {
		w, err := serve(t, h, "GET", "/status")
		if err != nil {
			t.Fatal(err)
		}
		var got map[string]any
		if err := json.Unmarshal(w.Body.Bytes(), &got); err != nil {
			t.Fatal(err)
		}
		return got
	}

	if got := read(); got["idleSince"] == nil || got["release"] != "dev" {
		t.Errorf("idle status = %v", got)
	}
	_, done := a.state.AdmitActivity(state.API)
	if got := read(); got["idleSince"] != nil || got["inFlight"] != float64(1) {
		t.Errorf("status with a request in flight = %v", got)
	}
	done()
}

func TestHealth(t *testing.T) {
	a := newTestApp()
	a.state.SetPhase(state.Asleep)
	w, err := serve(t, &StatusHandler{app: a}, "GET", "/health")
	if err != nil || w.Code != http.StatusOK || w.Body.String() != "{\"status\":\"ok\"}\n" {
		t.Errorf("health = %d %q %v", w.Code, w.Body, err)
	}
	if n := a.state.Snapshot().InFlight; n != 0 {
		t.Errorf("health counted as activity")
	}
	select {
	case <-a.state.WakeRequests():
		t.Error("health asked for a wake")
	default:
	}
}

func TestStatusIsReadOnly(t *testing.T) {
	h := &StatusHandler{app: newTestApp()}
	for _, method := range []string{"POST", "PUT", "DELETE", "PATCH"} {
		_, err := serve(t, h, method, "/status")
		var herr caddyhttp.HandlerError
		if !errors.As(err, &herr) || herr.StatusCode != http.StatusMethodNotAllowed {
			t.Errorf("%s /status = %v, want 405", method, err)
		}
	}
	_, err := serve(t, h, "GET", "/config/")
	var herr caddyhttp.HandlerError
	if !errors.As(err, &herr) || herr.StatusCode != http.StatusNotFound {
		t.Errorf("GET /config/ = %v, want 404", err)
	}
}
