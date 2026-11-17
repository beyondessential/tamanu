package routes_test

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/caddyserver/caddy/v2"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/actuator"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/actuator/fake"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/apiclient/fakeapi"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/config"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/routes"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/state"
)

// TestSmokeSleepAndWake runs the generated configuration in Caddy with a fake
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

	actuatorURL, _ := url.Parse(actSrv.URL)
	c := config.Config{
		Role:         config.Central,
		Listen:       freeAddr(t),
		StatusListen: freeAddr(t),
		APIUpstreams: []string{hostPort(api)},
		WebRoot:      frontRoot(t, "web", false),
		ActuatorURL:  actuatorURL,
		IdleTime:     200 * time.Millisecond,
		APIToken:     "set below",
		DataDir:      t.TempDir(),
	}
	raw, err := routes.Build(c)
	if err != nil {
		t.Fatal(err)
	}
	// The generated configuration reads the token from the environment; give
	// it the fake api's directly instead.
	var cfg map[string]any
	_ = json.Unmarshal(raw, &cfg)
	cfg["apps"].(map[string]any)["tamanu"].(map[string]any)["api_token"] = fakeapi.Token
	raw, _ = json.Marshal(cfg)
	if err := caddy.Load(raw, true); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = caddy.Stop() })

	client := &http.Client{Timeout: 10 * time.Second}
	status := func() (phase string, canSleep bool) {
		res, err := client.Get("http://" + c.StatusListen + "/status")
		if err != nil {
			t.Fatal(err)
		}
		defer res.Body.Close()
		var s struct {
			State    state.Phase `json:"state"`
			CanSleep bool        `json:"canSleep"`
		}
		_ = json.NewDecoder(res.Body).Decode(&s)
		return string(s.State), s.CanSleep
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
		phase, canSleep := status()
		return phase == "asleep" && canSleep
	})
	parts := state.Parts()
	if s := act.State(); !s.AllObserved(parts, actuator.Stopped) {
		t.Errorf("parts not stopped while asleep: %+v", s.Parts)
	}

	res, err := client.Get("http://" + c.Listen + "/api/patient")
	if err != nil {
		t.Fatal(err)
	}
	res.Body.Close()
	if res.StatusCode != http.StatusServiceUnavailable || res.Header.Get("Retry-After") == "" {
		t.Errorf("request while asleep = %d, Retry-After %q", res.StatusCode, res.Header.Get("Retry-After"))
	}

	eventually("a forwarded request", func() bool {
		res, err := client.Get("http://" + c.Listen + "/api/patient")
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
