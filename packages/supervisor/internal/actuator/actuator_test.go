package actuator_test

import (
	"context"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/actuator"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/actuator/fake"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/state"
)

// setup returns a fake actuator and a client of it, not holding its lease.
func setup(t *testing.T) (*fake.Actuator, *actuator.Client) {
	t.Helper()
	f := fake.New()
	srv := httptest.NewServer(f)
	t.Cleanup(srv.Close)
	u, _ := url.Parse(srv.URL)
	c := actuator.NewClient(u, fake.Credential)
	c.PollInterval = time.Millisecond
	return f, c
}

// spec: SLPWK#actuator-contract
func TestAwait(t *testing.T) {
	for _, tt := range []struct {
		name    string
		setup   func(*fake.Actuator)
		part    state.Part
		timeout time.Duration
		cancel  bool
		wantErr string
	}{
		{name: "stopped after a while", setup: func(f *fake.Actuator) { f.SetDelay(20 * time.Millisecond) }, part: state.API, timeout: time.Second},
		{name: "times out", setup: func(f *fake.Actuator) { f.Stall(state.Database, true) }, part: state.Database, timeout: 30 * time.Millisecond, wantErr: "database (stopping)"},
		{name: "failed", setup: func(f *fake.Actuator) { f.Fail(state.API, true) }, part: state.API, timeout: time.Second, wantErr: "api failed"},
		{name: "cancelled", setup: func(f *fake.Actuator) { f.Stall(state.Sync, true) }, part: state.Sync, timeout: time.Minute, cancel: true, wantErr: "sync (stopping)"},
	} {
		t.Run(tt.name, func(t *testing.T) {
			f, c := setup(t)
			ctx, cancel := context.WithCancel(context.Background())
			defer cancel()
			if _, err := c.TakeLease(ctx, "test", time.Minute); err != nil {
				t.Fatal(err)
			}
			tt.setup(f)
			if _, err := c.Set(ctx, map[state.Part]actuator.Desired{tt.part: actuator.Down}); err != nil {
				t.Fatal(err)
			}
			if tt.cancel {
				time.AfterFunc(10*time.Millisecond, cancel)
			}

			seen := 0
			err := c.Await(ctx, []state.Part{tt.part}, actuator.Stopped, tt.timeout, func(actuator.State) { seen++ })
			if tt.wantErr == "" && err != nil {
				t.Errorf("err = %v", err)
			}
			if tt.wantErr != "" && (err == nil || !strings.Contains(err.Error(), tt.wantErr)) {
				t.Errorf("err = %v, want it to mention %q", err, tt.wantErr)
			}
			if seen == 0 {
				t.Error("seen never called")
			}
		})
	}
}

// spec: SLPWK#actuator-contract
func TestWrongCredentialIsRefused(t *testing.T) {
	srv := httptest.NewServer(fake.New())
	t.Cleanup(srv.Close)
	u, _ := url.Parse(srv.URL)
	_, err := actuator.NewClient(u, "not-the-credential").State(context.Background())
	if err == nil || !strings.Contains(err.Error(), "401") {
		t.Fatalf("err = %v, want a 401", err)
	}
	if strings.Contains(err.Error(), "not-the-credential") {
		t.Errorf("the error carries the credential: %v", err)
	}
}
