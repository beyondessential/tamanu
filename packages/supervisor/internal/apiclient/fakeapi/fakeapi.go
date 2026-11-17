// Package fakeapi is a stand-in for a Tamanu server's supervisor routes, for
// tests.
package fakeapi

import (
	"encoding/json"
	"net/http"
	"strings"
	"sync"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/apiclient"
)

// Token is the credential the fake api accepts.
const Token = "test-supervisor-token"

// API is a fake api. Use New.
type API struct {
	mu        sync.Mutex
	version   string
	hold      apiclient.TaskHoldResult
	finalSync apiclient.FinalSyncResult
	failing   map[string]int
	held      bool
	calls     []string
	onCall    func(call string)
}

// New returns an api on version that is not busy and whose final syncs
// complete.
func New(version string) *API {
	return &API{
		version:   version,
		finalSync: apiclient.FinalSyncResult{Completed: true},
		failing:   map[string]int{},
	}
}

// SetVersion sets the release the api reports.
func (a *API) SetVersion(v string) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.version = v
}

// SetHold sets the answer to a hold.
func (a *API) SetHold(res apiclient.TaskHoldResult) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.hold = res
}

// SetFinalSync sets the answer to a final sync.
func (a *API) SetFinalSync(res apiclient.FinalSyncResult) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.finalSync = res
}

// Fail makes a call answer with status, until set to zero. A call is the
// method and route, as "POST /tasks/hold".
func (a *API) Fail(call string, status int) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.failing[call] = status
}

// OnCall sets a function called with each call before it is answered.
func (a *API) OnCall(fn func(call string)) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.onCall = fn
}

// Calls lists the calls made so far, as "POST /tasks/hold".
func (a *API) Calls() []string {
	a.mu.Lock()
	defer a.mu.Unlock()
	return append([]string(nil), a.calls...)
}

// Held reports whether a hold is set.
func (a *API) Held() bool {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.held
}

// ServeHTTP answers the supervisor routes.
func (a *API) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	route, ok := strings.CutPrefix(r.URL.Path, "/api/supervisor")
	if !ok {
		http.NotFound(w, r)
		return
	}
	if r.Header.Get("Authorization") != "Bearer "+Token {
		http.Error(w, `{"error":{"message":"Invalid credentials"}}`, http.StatusUnauthorized)
		return
	}
	call := r.Method + " " + route

	a.mu.Lock()
	a.calls = append(a.calls, call)
	onCall := a.onCall
	a.mu.Unlock()
	if onCall != nil {
		onCall(call)
	}

	a.mu.Lock()
	defer a.mu.Unlock()
	if status := a.failing[call]; status != 0 {
		http.Error(w, `{"error":{"message":"fake failure"}}`, status)
		return
	}
	switch call {
	case "POST /tasks/hold":
		a.held = !a.hold.Busy
		writeJSON(w, a.hold)
	case "DELETE /tasks/hold":
		a.held = false
		w.WriteHeader(http.StatusNoContent)
	case "GET /status":
		writeJSON(w, map[string]any{"version": a.version, "extra": "ignored"})
	case "POST /final-sync":
		writeJSON(w, a.finalSync)
	default:
		http.NotFound(w, r)
	}
}

func writeJSON(w http.ResponseWriter, body any) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(body)
}
