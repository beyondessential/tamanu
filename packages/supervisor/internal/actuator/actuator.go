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
	"strings"
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
}

// DesiredState is the body that sets parts' desired states.
type DesiredState struct {
	Parts map[state.Part]Desired `json:"parts"`
}

// Client talks to an actuator.
type Client struct {
	base *url.URL
	// HTTP makes the requests. Each request is bounded by RequestTimeout.
	HTTP *http.Client
	// RequestTimeout bounds each request.
	RequestTimeout time.Duration
	// PollInterval is how often Await asks for the state.
	PollInterval time.Duration
}

// NewClient returns a client for the actuator at base.
func NewClient(base *url.URL) *Client {
	return &Client{
		base:           base,
		HTTP:           &http.Client{},
		RequestTimeout: 10 * time.Second,
		PollInterval:   time.Second,
	}
}

// State gets the actuator's state.
func (c *Client) State(ctx context.Context) (State, error) {
	var s State
	err := c.do(ctx, http.MethodGet, nil, http.StatusOK, &s)
	return s, err
}

// Set sets the desired state of the parts named, leaving the others.
func (c *Client) Set(ctx context.Context, parts map[state.Part]Desired) (State, error) {
	var s State
	err := c.do(ctx, http.MethodPut, DesiredState{Parts: parts}, http.StatusAccepted, &s)
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

func (c *Client) do(ctx context.Context, method string, body any, wantStatus int, out any) error {
	ctx, cancel := context.WithTimeout(ctx, c.RequestTimeout)
	defer cancel()

	var reader io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return err
		}
		reader = bytes.NewReader(b)
	}
	u := c.base.JoinPath("v1", "state")
	req, err := http.NewRequestWithContext(ctx, method, u.String(), reader)
	if err != nil {
		return err
	}
	req.Header.Set("Accept", "application/json")
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	res, err := c.HTTP.Do(req)
	if err != nil {
		return fmt.Errorf("actuator: %w", err)
	}
	defer res.Body.Close()
	b, _ := io.ReadAll(io.LimitReader(res.Body, 1<<20))
	if res.StatusCode != wantStatus && !(wantStatus == http.StatusAccepted && res.StatusCode == http.StatusOK) {
		return fmt.Errorf("actuator: %s %s answered %s: %s", method, u.Path, res.Status, strings.TrimSpace(string(b)))
	}
	if err := json.Unmarshal(b, out); err != nil {
		return fmt.Errorf("actuator: reading %s %s: %w", method, u.Path, err)
	}
	return nil
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
