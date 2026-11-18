package caddy_test

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/actuator"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/actuator/fake"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/apiclient/fakeapi"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/state"
)

// TestSmokeSleepAndWake runs the central server's Caddyfile with a fake
// actuator, and checks a request wakes a server that went to sleep.
func TestSmokeSleepAndWake(t *testing.T) {
	act := fake.New()
	actSrv := httptest.NewServer(act)
	t.Cleanup(actSrv.Close)

	supervisorRoutes := fakeapi.New("2.70.0")
	api := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/supervisor/") {
			supervisorRoutes.ServeHTTP(w, r)
			return
		}
		_, _ = io.WriteString(w, "api "+r.URL.Path)
	}))
	t.Cleanup(api.Close)

	env, caddyfile := supervisorEnv(t, map[string]string{
		"TAMANU_SUPERVISOR_ROLE":          "central",
		"TAMANU_SUPERVISOR_LISTEN":        freeAddr(t),
		"TAMANU_SUPERVISOR_STATUS_LISTEN": freeAddr(t),
		"TAMANU_SUPERVISOR_API_UPSTREAMS": hostPort(api),
		"TAMANU_SUPERVISOR_WEB_ROOT":      frontRoot(t, "web", false),
		"TAMANU_SUPERVISOR_ACTUATOR_URL":  actSrv.URL,
		"TAMANU_SUPERVISOR_IDLE_TIME":     "200ms",
		"TAMANU_SUPERVISOR_API_TOKEN":     fakeapi.Token,
	})
	listen, statusAddr := env["TAMANU_SUPERVISOR_LISTEN"], env["TAMANU_SUPERVISOR_STATUS_LISTEN"]
	load(t, adapt(t, caddyfile, env))

	client := &http.Client{Timeout: 10 * time.Second}
	status := func() (phase string, canSleep bool, lease string) {
		res, err := client.Get("http://" + statusAddr + "/status")
		if err != nil {
			t.Fatal(err)
		}
		defer res.Body.Close()
		var s struct {
			State    state.Phase `json:"state"`
			CanSleep bool        `json:"canSleep"`
			Lease    string      `json:"lease"`
		}
		_ = json.NewDecoder(res.Body).Decode(&s)
		return string(s.State), s.CanSleep, s.Lease
	}
	eventually := func(what string, cond func() bool) {
		t.Helper()
		deadline := time.Now().Add(10 * time.Second)
		for !cond() {
			if time.Now().After(deadline) {
				t.Fatalf("timed out waiting for %s", what)
			}
			time.Sleep(10 * time.Millisecond)
		}
	}

	eventually("asleep", func() bool {
		phase, canSleep, lease := status()
		return phase == "asleep" && canSleep && lease == "holder"
	})
	if act.LeaseHolder() == "" {
		t.Error("asleep without holding the lease")
	}
	parts := state.Parts()
	if s := act.State(); !s.AllObserved(parts, actuator.Stopped) {
		t.Errorf("parts not stopped while asleep: %+v", s.Parts)
	}

	res, err := client.Get("http://" + listen + "/api/patient")
	if err != nil {
		t.Fatal(err)
	}
	res.Body.Close()
	if res.StatusCode != http.StatusServiceUnavailable || res.Header.Get("Retry-After") == "" {
		t.Errorf("request while asleep = %d, Retry-After %q", res.StatusCode, res.Header.Get("Retry-After"))
	}

	eventually("a forwarded request", func() bool {
		res, err := client.Get("http://" + listen + "/api/patient")
		if err != nil {
			return false
		}
		defer res.Body.Close()
		body, _ := io.ReadAll(res.Body)
		return res.StatusCode == http.StatusOK && string(body) == "api /api/patient"
	})
	if s := act.State(); !s.AllObserved(parts, actuator.Ready) {
		t.Errorf("parts not ready once awake: %+v", s.Parts)
	}
}
