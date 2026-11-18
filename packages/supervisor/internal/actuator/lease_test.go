package actuator_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/actuator"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/actuator/fake"
	"github.com/beyondessential/tamanu/packages/supervisor/internal/state"
)

// spec: SLPWK#actuator-contract
func TestLease(t *testing.T) {
	ctx := context.Background()
	take := func(t *testing.T, _ *fake.Actuator, c *actuator.Client) {
		if _, err := c.TakeLease(ctx, "test", time.Minute); err != nil {
			t.Fatal(err)
		}
	}
	for _, tt := range []struct {
		name  string
		setup func(*testing.T, *fake.Actuator, *actuator.Client)
		// What the client can do, in turn: set desired states, renew the
		// lease, take it; and who holds it after.
		setOK, renewOK, takeOK bool
		holder                 string
	}{
		{name: "nobody holds it", setup: func(*testing.T, *fake.Actuator, *actuator.Client) {}, takeOK: true, holder: "test"},
		{name: "held", setup: take, setOK: true, renewOK: true, takeOK: true, holder: "test"},
		{
			name: "released",
			setup: func(t *testing.T, f *fake.Actuator, c *actuator.Client) {
				take(t, f, c)
				if err := c.ReleaseLease(ctx); err != nil || f.LeaseHolder() != "" || c.Token() != 0 {
					t.Fatalf("release: %v, holder %q, token %d", err, f.LeaseHolder(), c.Token())
				}
			},
			takeOK: true, holder: "test",
		},
		{
			name:   "held by another",
			setup:  func(_ *testing.T, f *fake.Actuator, _ *actuator.Client) { f.TakeLeaseAs("other", time.Minute) },
			holder: "other",
		},
		{
			name: "expired, and nobody took it since",
			setup: func(t *testing.T, f *fake.Actuator, c *actuator.Client) {
				take(t, f, c)
				f.ExpireLease()
			},
			setOK: true, renewOK: true, takeOK: true, holder: "test",
		},
		{
			name: "another's expired",
			setup: func(_ *testing.T, f *fake.Actuator, _ *actuator.Client) {
				f.TakeLeaseAs("other", time.Minute)
				f.ExpireLease()
			},
			takeOK: true, holder: "test",
		},
		{
			name: "taken by another since",
			setup: func(t *testing.T, f *fake.Actuator, c *actuator.Client) {
				take(t, f, c)
				f.TakeLeaseAs("newer", time.Minute)
			},
			holder: "newer",
		},
	} {
		t.Run(tt.name, func(t *testing.T) {
			f, c := setup(t)
			tt.setup(t, f, c)

			check := func(what string, ok bool, err error) {
				t.Helper()
				if ok && err != nil {
					t.Errorf("%s: %v", what, err)
				}
				if !ok && !actuator.IsConflict(err) {
					t.Errorf("%s: %v, want a conflict", what, err)
				}
			}
			_, err := c.Set(ctx, map[state.Part]actuator.Desired{state.Tasks: actuator.Down})
			check("set", tt.setOK, err)
			_, err = c.RenewLease(ctx, "test", time.Minute)
			check("renew", tt.renewOK, err)
			lease, err := c.TakeLease(ctx, "test", time.Minute)
			check("take", tt.takeOK, err)
			if tt.takeOK && (lease.Token == 0 || c.Token() != lease.Token) {
				t.Errorf("took %+v, the client carries token %d", lease, c.Token())
			}
			var conflict *actuator.ErrConflict
			if errors.As(err, &conflict) && conflict.Lease.Holder != tt.holder {
				t.Errorf("conflict names %q as the holder", conflict.Lease.Holder)
			}

			if f.LeaseHolder() != tt.holder {
				t.Errorf("holder %q, want %q", f.LeaseHolder(), tt.holder)
			}
			if s, err := c.State(ctx); err != nil || s.Lease == nil || s.Lease.Holder != tt.holder || s.Lease.Token != 0 {
				t.Errorf("the state reports the lease as %+v, %v", s.Lease, err)
			}
		})
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
