// Package actuator is the supervisor's client for the actuator contract,
// described in actuator/v1.openapi.yaml.
//
// spec: SLPWK#actuator-contract
package actuator

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"slices"
	"strconv"
	"strings"
	"sync/atomic"
	"time"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/state"
)

// Desired is whether a part should be running.
type Desired string

// The desired states.
const (
	Up   Desired = "up"
	Down Desired = "down"
)

// Observed is what a part is doing.
type Observed string

// The observed states.
const (
	Starting Observed = "starting"
	Ready    Observed = "ready"
	Stopping Observed = "stopping"
	Stopped  Observed = "stopped"
	Failed   Observed = "failed"
)

// PartState is one part's desired and observed state.
type PartState struct {
	Desired  Desired  `json:"desired"`
	Observed Observed `json:"observed"`
}

// State is what the actuator reports.
type State struct {
	ControlsParts bool                     `json:"controlsParts"`
	Upgrading     bool                     `json:"upgrading"`
	Parts         map[state.Part]PartState `json:"parts"`
	// Lease is the lease's holder, or nil when nobody holds it.
	Lease *LeaseInfo `json:"lease,omitempty"`
	// Reports are the supervisors' reports that have not expired, by
	// instance.
	Reports map[string]Report `json:"reports,omitempty"`
}

// DesiredState is the body that sets parts' desired states.
type DesiredState struct {
	Parts map[state.Part]Desired `json:"parts"`
}

// Client talks to an actuator.
type Client struct {
	base       *url.URL
	credential string
	// HTTP makes the requests. Each request is bounded by RequestTimeout.
	HTTP *http.Client
	// RequestTimeout bounds each request.
	RequestTimeout time.Duration
	// PollInterval is how often Await asks for the state.
	PollInterval time.Duration

	token atomic.Int64
}

// NewClient returns a client for the actuator at base, authenticating with
// credential, the one the supervisor also uses with the api.
//
// spec: SLPWK#actuator-contract
func NewClient(base *url.URL, credential string) *Client {
	return &Client{
		base:           base,
		credential:     credential,
		HTTP:           &http.Client{},
		RequestTimeout: 10 * time.Second,
		PollInterval:   time.Second,
	}
}

// State gets the actuator's state.
func (c *Client) State(ctx context.Context) (State, error) {
	var s State
	err := c.do(ctx, http.MethodGet, "state", nil, &s, http.StatusOK)
	return s, err
}

// Set sets the desired state of the parts named, leaving the others. It needs
// the lease.
func (c *Client) Set(ctx context.Context, parts map[state.Part]Desired) (State, error) {
	var s State
	err := c.do(ctx, http.MethodPut, "state", DesiredState{Parts: parts}, &s, http.StatusAccepted, http.StatusOK)
	return s, err
}

// Await polls the actuator until every part named is observed as want, a part
// fails, or timeout passes. seen, if not nil, is given each state read, so the
// caller can act on parts as they arrive. A request that fails while waiting
// is tried again at the next poll.
func (c *Client) Await(ctx context.Context, parts []state.Part, want Observed, timeout time.Duration, seen func(State)) error {
	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()
	ticker := time.NewTicker(c.PollInterval)
	defer ticker.Stop()

	var last State
	var lastErr error
	for {
		s, err := c.State(ctx)
		if err == nil {
			last, lastErr = s, nil
			if seen != nil {
				seen(s)
			}
			waiting, failed := pending(s, parts, want)
			if len(failed) > 0 {
				return fmt.Errorf("%s failed", strings.Join(failed, ", "))
			}
			if len(waiting) == 0 {
				return nil
			}
		} else if ctx.Err() == nil {
			// A request cut short by the wait ending says nothing new.
			lastErr = err
		}

		select {
		case <-ctx.Done():
			if lastErr != nil {
				return fmt.Errorf("waiting for %s to be %s: %w", partList(parts), want, lastErr)
			}
			waiting, _ := pending(last, parts, want)
			return fmt.Errorf("timed out waiting for %s to be %s", strings.Join(waiting, ", "), want)
		case <-ticker.C:
		}
	}
}

// pending lists the parts not yet observed as want, as "part (observed)", and
// those that have failed.
func pending(s State, parts []state.Part, want Observed) (waiting, failed []string) {
	for _, p := range parts {
		ps, ok := s.Parts[p]
		switch {
		case !ok:
			waiting = append(waiting, fmt.Sprintf("%s (not reported)", p))
		case ps.Observed == want:
		case ps.Observed == Failed:
			failed = append(failed, string(p))
		default:
			waiting = append(waiting, fmt.Sprintf("%s (%s)", p, ps.Observed))
		}
	}
	return waiting, failed
}

func partList(parts []state.Part) string {
	names := make([]string, len(parts))
	for i, p := range parts {
		names[i] = string(p)
	}
	return strings.Join(names, ", ")
}

// do makes a request to path under /v1, encoding body as JSON, and decoding
// the answer into out unless out is nil. An answer of
// 409 Conflict is an *ErrConflict; any other status not in ok is an error.
func (c *Client) do(ctx context.Context, method, path string, body, out any, ok ...int) error {
	status, b, err := c.request(ctx, method, path, body)
	if err != nil {
		return err
	}
	if status == http.StatusConflict {
		conflict := &ErrConflict{Method: method, Path: path}
		_ = json.Unmarshal(b, &conflict.Lease)
		return conflict
	}
	if !slices.Contains(ok, status) {
		// The body stays out of the error, which the status reports.
		return fmt.Errorf("actuator: %s /v1/%s answered %d", method, path, status)
	}
	if out == nil {
		return nil
	}
	if err := json.Unmarshal(b, out); err != nil {
		return fmt.Errorf("actuator: reading %s /v1/%s: %w", method, path, err)
	}
	return nil
}

func (c *Client) request(ctx context.Context, method, path string, body any) (int, []byte, error) {
	ctx, cancel := context.WithTimeout(ctx, c.RequestTimeout)
	defer cancel()

	var reader io.Reader
	if body != nil {
		encoded, err := json.Marshal(body)
		if err != nil {
			return 0, nil, err
		}
		reader = bytes.NewReader(encoded)
	}
	req, err := http.NewRequestWithContext(ctx, method, c.base.JoinPath("v1", path).String(), reader)
	if err != nil {
		return 0, nil, err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.credential)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if token := c.token.Load(); token > 0 {
		req.Header.Set(TokenHeader, strconv.FormatInt(token, 10))
	}
	res, err := c.HTTP.Do(req)
	if err != nil {
		return 0, nil, fmt.Errorf("actuator: %w", err)
	}
	defer res.Body.Close()
	b, _ := io.ReadAll(io.LimitReader(res.Body, 1<<20))
	return res.StatusCode, b, nil
}

// AllObserved reports whether every part named is observed as want.
func (s State) AllObserved(parts []state.Part, want Observed) bool {
	waiting, failed := pending(s, parts, want)
	return len(waiting) == 0 && len(failed) == 0
}

// AllDesired reports whether every part named desires want.
func (s State) AllDesired(parts []state.Part, want Desired) bool {
	return !slices.ContainsFunc(parts, func(p state.Part) bool { return s.Parts[p].Desired != want })
}
