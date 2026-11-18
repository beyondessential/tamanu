package actuator

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/state"
)

// TokenHeader carries the lease token on requests that need the lease.
const TokenHeader = "Tamanu-Lease-Token"

// LeaseInfo is the lease as the actuator reports it.
type LeaseInfo struct {
	Holder    string    `json:"holder"`
	Token     int64     `json:"token,omitempty"`
	ExpiresAt time.Time `json:"expiresAt"`
}

// LeaseRequest is the body that takes or renews the lease.
type LeaseRequest struct {
	Holder     string  `json:"holder"`
	TTLSeconds float64 `json:"ttlSeconds"`
}

// Report is one supervisor's report on its activity, and on the phase the
// holder announces or the announcement another follows.
type Report struct {
	LastActivity  time.Time `json:"lastActivity"`
	InFlight      int       `json:"inFlight"`
	WakeRequested bool      `json:"wakeRequested"`
	// Phase and Announcement are the holder's announcement, in its report
	// alone.
	Phase        state.Phase  `json:"phase,omitempty"`
	Announcement Announcement `json:"announcement,omitzero"`
	// Follows is the announcement the supervisor follows.
	Follows    Announcement `json:"follows,omitzero"`
	TTLSeconds float64      `json:"ttlSeconds,omitempty"`
	ExpiresAt  time.Time    `json:"expiresAt,omitzero"`
}

// Announcement identifies one of the holder's phase announcements by the
// lease token it holds and its own count of announcements under that token.
// A later token is newer, as is a later sequence under the same token.
type Announcement struct {
	Token    int64 `json:"token"`
	Sequence int64 `json:"sequence"`
}

// After reports whether a is newer than b.
func (a Announcement) After(b Announcement) bool {
	if a.Token != b.Token {
		return a.Token > b.Token
	}
	return a.Sequence > b.Sequence
}

// IsZero reports whether a is no announcement.
func (a Announcement) IsZero() bool { return a == Announcement{} }

func (a Announcement) String() string { return fmt.Sprintf("%d/%d", a.Token, a.Sequence) }

// ErrConflict is the actuator's answer to a request it refused for the
// lease: one to take it while another holds it, or one carrying a token that
// is not the current one.
type ErrConflict struct {
	Method, Path string
	// Lease is the lease as the actuator reported it, when it did.
	Lease LeaseInfo
}

func (e *ErrConflict) Error() string {
	if e.Lease.Holder != "" {
		return fmt.Sprintf("actuator: %s /v1/%s refused: the lease is held by %s until %s",
			e.Method, e.Path, e.Lease.Holder, e.Lease.ExpiresAt.Format(time.RFC3339))
	}
	return fmt.Sprintf("actuator: %s /v1/%s refused: this supervisor does not hold the lease", e.Method, e.Path)
}

// IsConflict reports whether err is the actuator refusing a request for the
// lease.
func IsConflict(err error) bool {
	var conflict *ErrConflict
	return errors.As(err, &conflict)
}

// Token is the lease token the client sends, or zero.
func (c *Client) Token() int64 { return c.token.Load() }

// TakeLease takes the lease for holder, for ttl. It answers an *ErrConflict
// while another holder has it.
//
// spec: SLPWK#actuator-contract
func (c *Client) TakeLease(ctx context.Context, holder string, ttl time.Duration) (LeaseInfo, error) {
	var lease LeaseInfo
	err := c.do(ctx, http.MethodPost, "lease", LeaseRequest{holder, seconds(ttl)}, &lease, http.StatusOK)
	if err == nil {
		c.token.Store(lease.Token)
	}
	return lease, err
}

// RenewLease extends the lease the client holds by ttl.
func (c *Client) RenewLease(ctx context.Context, holder string, ttl time.Duration) (LeaseInfo, error) {
	var lease LeaseInfo
	err := c.do(ctx, http.MethodPut, "lease", LeaseRequest{holder, seconds(ttl)}, &lease, http.StatusOK)
	return lease, err
}

// ReleaseLease gives up the lease the client holds, and forgets its token.
func (c *Client) ReleaseLease(ctx context.Context) error {
	err := c.do(ctx, http.MethodDelete, "lease", nil, nil, http.StatusNoContent, http.StatusOK)
	c.token.Store(0)
	return err
}

// Report sends instance's report, which the actuator keeps for ttl.
func (c *Client) Report(ctx context.Context, instance string, r Report, ttl time.Duration) error {
	r.TTLSeconds = seconds(ttl)
	r.ExpiresAt = time.Time{}
	return c.do(ctx, http.MethodPut, "reports/"+instance, r, nil, http.StatusNoContent, http.StatusOK)
}

func seconds(d time.Duration) float64 { return d.Seconds() }
