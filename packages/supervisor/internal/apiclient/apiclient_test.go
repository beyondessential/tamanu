package apiclient_test

import (
	"context"
	"net"
	"net/http"
	"net/http/httptest"
	"slices"
	"strings"
	"testing"
	"time"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/apiclient"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/apiclient/fakeapi"
)

func setup(t *testing.T, token string, extraUpstreams ...string) (*fakeapi.API, *apiclient.Client) {
	t.Helper()
	api := fakeapi.New("2.70.0")
	srv := httptest.NewServer(api)
	t.Cleanup(srv.Close)
	upstreams := append(extraUpstreams, strings.TrimPrefix(srv.URL, "http://"))
	return api, apiclient.New(upstreams, token)
}

func deadAddr(t *testing.T) string {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	addr := ln.Addr().String()
	ln.Close()
	return addr
}

func TestCalls(t *testing.T) {
	api, c := setup(t, fakeapi.Token)
	ctx := context.Background()

	if v, err := c.Version(ctx); err != nil || v != "2.70.0" {
		t.Errorf("version = %q, %v", v, err)
	}
	if res, err := c.HoldTasks(ctx); err != nil || res.Busy || !api.Held() {
		t.Errorf("hold = %+v, %v, held %v", res, err, api.Held())
	}
	if err := c.ReleaseTasks(ctx); err != nil || api.Held() {
		t.Errorf("release: %v, held %v", err, api.Held())
	}
	if res, err := c.FinalSync(ctx); err != nil || !res.Completed {
		t.Errorf("final sync = %+v, %v", res, err)
	}

	api.SetHold(apiclient.TaskHoldResult{Busy: true, RunningTasks: []string{"PatientEmailCommunicationProcessor"}, FHIRJobs: 3})
	res, err := c.HoldTasks(ctx)
	if err != nil || !res.Busy || res.FHIRJobs != 3 || !slices.Equal(res.RunningTasks, []string{"PatientEmailCommunicationProcessor"}) || api.Held() {
		t.Errorf("busy hold = %+v, %v", res, err)
	}

	api.SetFinalSync(apiclient.FinalSyncResult{Completed: false, Reason: "Sync was queued by the central server"})
	if res, err := c.FinalSync(ctx); err != nil || res.Completed || res.Reason == "" {
		t.Errorf("incomplete final sync = %+v, %v", res, err)
	}

	want := []string{"GET /status", "POST /tasks/hold", "DELETE /tasks/hold", "POST /final-sync", "POST /tasks/hold", "POST /final-sync"}
	if got := api.Calls(); !slices.Equal(got, want) {
		t.Errorf("calls = %q", got)
	}
}

func TestErrorStatusFails(t *testing.T) {
	api, c := setup(t, fakeapi.Token)
	api.Fail("POST /tasks/hold", http.StatusInternalServerError)
	_, err := c.HoldTasks(context.Background())
	if err == nil || !strings.Contains(err.Error(), "500") {
		t.Errorf("err = %v", err)
	}
}

func TestWrongTokenFailsWithoutLeakingIt(t *testing.T) {
	_, c := setup(t, "not-the-token")
	_, err := c.Version(context.Background())
	if err == nil || !strings.Contains(err.Error(), "401") {
		t.Errorf("err = %v", err)
	}
	if strings.Contains(err.Error(), "not-the-token") {
		t.Error("the error carries the token")
	}
}

func TestPassesOverUnreachableInstances(t *testing.T) {
	_, c := setup(t, fakeapi.Token, deadAddr(t))
	if v, err := c.Version(context.Background()); err != nil || v != "2.70.0" {
		t.Errorf("version = %q, %v", v, err)
	}
}

func TestNoReachableInstance(t *testing.T) {
	c := apiclient.New([]string{deadAddr(t), deadAddr(t)}, fakeapi.Token)
	if _, err := c.Version(context.Background()); err == nil {
		t.Error("no error")
	}
}

func TestFinalSyncTimeout(t *testing.T) {
	api, c := setup(t, fakeapi.Token)
	release := make(chan struct{})
	defer close(release)
	api.OnCall(func(call string) {
		if call == "POST /final-sync" {
			<-release
		}
	})
	c.FinalSyncTimeout = 20 * time.Millisecond
	if _, err := c.FinalSync(context.Background()); err == nil {
		t.Error("final sync outlived its timeout")
	}
}
