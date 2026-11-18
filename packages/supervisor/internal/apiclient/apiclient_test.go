package apiclient_test

import (
	"context"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/apiclient"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/apiclient/fakeapi"
)

// liveAddr starts a fake api and returns its address.
func liveAddr(t *testing.T) string {
	t.Helper()
	srv := httptest.NewServer(fakeapi.New("2.70.0"))
	t.Cleanup(srv.Close)
	return strings.TrimPrefix(srv.URL, "http://")
}

func deadAddr(t *testing.T) string {
	t.Helper()
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	addr := ln.Addr().String()
	ln.Close()
	return addr
}

// silentAddr starts a server that takes requests and never answers them.
func silentAddr(t *testing.T) string {
	t.Helper()
	done := make(chan struct{})
	srv := httptest.NewServer(http.HandlerFunc(func(http.ResponseWriter, *http.Request) { <-done }))
	t.Cleanup(func() { close(done); srv.Close() })
	return strings.TrimPrefix(srv.URL, "http://")
}

// failingAddr starts a server that answers every request with a server error.
func failingAddr(t *testing.T) string {
	t.Helper()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	t.Cleanup(srv.Close)
	return strings.TrimPrefix(srv.URL, "http://")
}

// spec: SUPV#talking-to-the-server
func TestWrongTokenFailsWithoutLeakingIt(t *testing.T) {
	c := apiclient.New([]string{liveAddr(t)}, "not-the-token")
	_, err := c.Version(context.Background())
	if err == nil || !strings.Contains(err.Error(), "401") {
		t.Errorf("err = %v", err)
	}
	if strings.Contains(err.Error(), "not-the-token") {
		t.Error("the error carries the token")
	}
}

func TestInstances(t *testing.T) {
	for _, tt := range []struct {
		name      string
		instances func(t *testing.T) []string
		answers   bool
	}{
		{"passes over an unreachable instance", func(t *testing.T) []string { return []string{deadAddr(t), liveAddr(t)} }, true},
		{"no reachable instance", func(t *testing.T) []string { return []string{deadAddr(t), deadAddr(t)} }, false},
		{"passes over an instance that never answers", func(t *testing.T) []string { return []string{silentAddr(t), liveAddr(t)} }, true},
		{"passes over an instance that fails", func(t *testing.T) []string { return []string{failingAddr(t), liveAddr(t)} }, true},
	} {
		t.Run(tt.name, func(t *testing.T) {
			c := apiclient.New(tt.instances(t), fakeapi.Token)
			c.CallTimeout = 200 * time.Millisecond
			v, err := c.Version(context.Background())
			if tt.answers && (err != nil || v != "2.70.0") {
				t.Errorf("version = %q, %v", v, err)
			}
			if !tt.answers && err == nil {
				t.Errorf("version = %q, without an error", v)
			}
		})
	}
}
