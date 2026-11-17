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

func setup(t *testing.T) (*fake.Actuator, *actuator.Client) {
	t.Helper()
	f := fake.New()
	srv := httptest.NewServer(f)
	t.Cleanup(srv.Close)
	u, _ := url.Parse(srv.URL)
	c := actuator.NewClient(u)
	c.PollInterval = time.Millisecond
	return f, c
}

func TestStateAndSet(t *testing.T) {
	f, c := setup(t)
	ctx := context.Background()

	s, err := c.State(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if !s.ControlsParts || s.Upgrading || len(s.Parts) != 5 || s.Parts[state.API].Observed != actuator.Ready {
		t.Errorf("initial state = %+v", s)
	}

	s, err = c.Set(ctx, map[state.Part]actuator.Desired{state.Tasks: actuator.Down, state.FHIR: actuator.Down})
	if err != nil {
		t.Fatal(err)
	}
	if s.Parts[state.Tasks].Desired != actuator.Down || s.Parts[state.API].Desired != actuator.Up {
		t.Errorf("after set = %+v", s.Parts)
	}
	if got := f.Puts(); len(got) != 1 || len(got[0]) != 2 {
		t.Errorf("puts = %v", got)
	}
}

func TestAwaitWithDelay(t *testing.T) {
	f, c := setup(t)
	f.SetDelay(20 * time.Millisecond)
	ctx := context.Background()
	parts := []state.Part{state.Sync, state.API}

	s, err := c.Set(ctx, map[state.Part]actuator.Desired{state.Sync: actuator.Down, state.API: actuator.Down})
	if err != nil {
		t.Fatal(err)
	}
	if s.Parts[state.API].Observed != actuator.Stopping {
		t.Errorf("observed straight after set = %s", s.Parts[state.API].Observed)
	}
	var seen int
	if err := c.Await(ctx, parts, actuator.Stopped, time.Second, func(actuator.State) { seen++ }); err != nil {
		t.Fatal(err)
	}
	if seen == 0 {
		t.Error("seen never called")
	}
	if !f.State().AllObserved(parts, actuator.Stopped) {
		t.Errorf("not stopped: %+v", f.State().Parts)
	}
}

func TestAwaitTimesOut(t *testing.T) {
	f, c := setup(t)
	f.Stall(state.Database, true)
	ctx := context.Background()
	_, _ = c.Set(ctx, map[state.Part]actuator.Desired{state.Database: actuator.Down})
	err := c.Await(ctx, []state.Part{state.Database}, actuator.Stopped, 30*time.Millisecond, nil)
	if err == nil || !strings.Contains(err.Error(), "database (stopping)") {
		t.Errorf("err = %v", err)
	}
	f.Stall(state.Database, false)
	if err := c.Await(ctx, []state.Part{state.Database}, actuator.Stopped, time.Second, nil); err != nil {
		t.Errorf("after unstalling: %v", err)
	}
}

func TestAwaitFails(t *testing.T) {
	f, c := setup(t)
	f.Fail(state.API, true)
	ctx := context.Background()
	_, _ = c.Set(ctx, map[state.Part]actuator.Desired{state.API: actuator.Down})
	err := c.Await(ctx, []state.Part{state.API}, actuator.Stopped, time.Second, nil)
	if err == nil || !strings.Contains(err.Error(), "api failed") {
		t.Errorf("err = %v", err)
	}
}

func TestAwaitCancelled(t *testing.T) {
	f, c := setup(t)
	f.Stall(state.Sync, true)
	ctx, cancel := context.WithCancel(context.Background())
	_, _ = c.Set(ctx, map[state.Part]actuator.Desired{state.Sync: actuator.Down})
	go func() { time.Sleep(10 * time.Millisecond); cancel() }()
	if err := c.Await(ctx, []state.Part{state.Sync}, actuator.Stopped, time.Minute, nil); err == nil {
		t.Error("await outlived its context")
	}
}

func TestSetErrors(t *testing.T) {
	f, c := setup(t)
	ctx := context.Background()

	f.FailPuts(func(map[state.Part]actuator.Desired) bool { return true })
	if _, err := c.Set(ctx, map[state.Part]actuator.Desired{state.API: actuator.Down}); err == nil || !strings.Contains(err.Error(), "500") {
		t.Errorf("failed put: %v", err)
	}
	f.FailPuts(nil)

	f.SetControlsParts(false)
	if _, err := c.Set(ctx, map[state.Part]actuator.Desired{state.API: actuator.Down}); err == nil || !strings.Contains(err.Error(), "409") {
		t.Errorf("put to an actuator that does not control parts: %v", err)
	}
}

func TestUnreachable(t *testing.T) {
	u, _ := url.Parse("http://127.0.0.1:1")
	c := actuator.NewClient(u)
	if _, err := c.State(context.Background()); err == nil {
		t.Error("no error from an unreachable actuator")
	}
}
