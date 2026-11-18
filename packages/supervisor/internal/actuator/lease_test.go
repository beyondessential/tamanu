package actuator_test

import (
	"context"
	"errors"
	"math"
	"testing"
	"time"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/actuator"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/state"
)

var down = map[state.Part]actuator.Desired{state.Tasks: actuator.Down}

// spec: SLPWK#actuator-contract
func TestLease(t *testing.T) {
	f, c := setupWithoutLease(t)
	ctx := context.Background()

	if _, err := c.Set(ctx, down); !actuator.IsConflict(err) {
		t.Errorf("set without the lease: %v", err)
	}

	lease, err := c.TakeLease(ctx, "first", time.Minute)
	if err != nil || lease.Token == 0 || c.Token() != lease.Token || f.LeaseHolder() != "first" {
		t.Fatalf("take = %+v, %v", lease, err)
	}
	if _, err := c.Set(ctx, down); err != nil {
		t.Errorf("set with the lease: %v", err)
	}
	renewed, err := c.RenewLease(ctx, "first", time.Minute)
	if err != nil || renewed.Token != lease.Token || !renewed.ExpiresAt.After(lease.ExpiresAt.Add(-time.Second)) {
		t.Errorf("renew = %+v, %v", renewed, err)
	}
	if s, _ := c.State(ctx); s.Lease == nil || s.Lease.Holder != "first" || s.Lease.Token != 0 {
		t.Errorf("state reports the lease as %+v", s.Lease)
	}

	if err := c.ReleaseLease(ctx); err != nil || f.LeaseHolder() != "" || c.Token() != 0 {
		t.Errorf("release: %v, holder %q", err, f.LeaseHolder())
	}
	if _, err := c.Set(ctx, down); !actuator.IsConflict(err) {
		t.Errorf("set after release: %v", err)
	}
}

func TestLeaseHeldByAnother(t *testing.T) {
	f, c := setupWithoutLease(t)
	ctx := context.Background()
	f.TakeLeaseAs("other", time.Minute)

	_, err := c.TakeLease(ctx, "second", time.Minute)
	var conflict *actuator.ErrConflict
	if !actuator.IsConflict(err) {
		t.Fatalf("take while held: %v", err)
	}
	if ok := errors.As(err, &conflict); !ok || conflict.Lease.Holder != "other" {
		t.Errorf("conflict = %+v", conflict)
	}

	f.ExpireLease()
	if _, err := c.TakeLease(ctx, "second", time.Minute); err != nil || f.LeaseHolder() != "second" {
		t.Errorf("take after expiry: %v, holder %q", err, f.LeaseHolder())
	}
}

// spec: SLPWK#actuator-contract
func TestStaleTokenRefused(t *testing.T) {
	f, c := setup(t)
	ctx := context.Background()
	old := c.Token()

	f.ExpireLease()
	if _, err := c.Set(ctx, down); err != nil {
		t.Errorf("an expired lease nobody took refused its own token: %v", err)
	}
	f.TakeLeaseAs("newer", time.Minute)
	if _, err := c.Set(ctx, down); !actuator.IsConflict(err) {
		t.Errorf("set with token %d after another took the lease: %v", old, err)
	}
	if _, err := c.RenewLease(ctx, "test", time.Minute); !actuator.IsConflict(err) {
		t.Errorf("renew after another took the lease: %v", err)
	}
}

func TestAnnouncementOrder(t *testing.T) {
	for _, tt := range []struct {
		a, b actuator.Announcement
		want bool
	}{
		{actuator.Announcement{Token: 2, Sequence: 1}, actuator.Announcement{Token: 1, Sequence: 9}, true},
		{actuator.Announcement{Token: 1, Sequence: 9}, actuator.Announcement{Token: 2, Sequence: 1}, false},
		{actuator.Announcement{Token: 1, Sequence: 3}, actuator.Announcement{Token: 1, Sequence: 2}, true},
		{actuator.Announcement{Token: 1, Sequence: 2}, actuator.Announcement{Token: 1, Sequence: 2}, false},
		{actuator.Announcement{Token: 1, Sequence: 1}, actuator.Announcement{}, true},
	} {
		if got := tt.a.After(tt.b); got != tt.want {
			t.Errorf("%s after %s = %v", tt.a, tt.b, got)
		}
	}
}

func TestReports(t *testing.T) {
	f, c := setupWithoutLease(t)
	ctx := context.Background()
	at := time.Now().UTC().Truncate(time.Second)

	large := actuator.Announcement{Token: math.MaxInt64 - 1, Sequence: 7}
	report := actuator.Report{LastActivity: at, InFlight: 2, WakeRequested: true, Phase: state.Asleep, Announcement: large, Follows: large}
	if err := c.Report(ctx, "instance-a", report, 30*time.Millisecond); err != nil {
		t.Fatal(err)
	}
	got, ok := f.Reports()["instance-a"]
	if !ok || got.InFlight != 2 || !got.WakeRequested || !got.LastActivity.Equal(at) ||
		got.Phase != state.Asleep || got.Announcement != large || got.Follows != large {
		t.Errorf("reports = %+v", f.Reports())
	}
	if s, _ := c.State(ctx); len(s.Reports) != 1 {
		t.Errorf("state reports %+v", s.Reports)
	}

	time.Sleep(50 * time.Millisecond)
	if reports := f.Reports(); len(reports) != 0 {
		t.Errorf("an expired report still counts: %+v", reports)
	}
}
