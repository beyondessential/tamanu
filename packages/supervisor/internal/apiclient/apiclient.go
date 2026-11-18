// Package apiclient is the supervisor's client for its server's supervisor
// routes, under /api/supervisor.
//
// spec: SUPV#talking-to-the-server
package apiclient

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"time"
)

// Client calls the api's supervisor routes.
type Client struct {
	upstreams []string
	token     string
	// HTTP makes the requests.
	HTTP *http.Client
	// CallTimeout bounds each call but the final sync.
	CallTimeout time.Duration
	// FinalSyncTimeout bounds the final sync, which runs a whole sync.
	FinalSyncTimeout time.Duration
}

// New returns a client for the api instances at upstreams (host:port),
// authenticating with token.
func New(upstreams []string, token string) *Client {
	return &Client{
		upstreams:        upstreams,
		token:            token,
		HTTP:             &http.Client{Transport: transport()},
		CallTimeout:      30 * time.Second,
		FinalSyncTimeout: 15 * time.Minute,
	}
}

// transport bounds each connection attempt on its own, so an instance that
// drops connections leaves time in the call to try the next. It never goes
// through a proxy from the environment: the api is reached directly, as the
// supervisor routes to it, and the credential stays inside the server.
func transport() *http.Transport {
	t := http.DefaultTransport.(*http.Transport).Clone()
	t.Proxy = nil
	t.DialContext = (&net.Dialer{Timeout: 5 * time.Second, KeepAlive: 30 * time.Second}).DialContext
	return t
}

// TaskHoldResult is the api's answer to a hold on scheduled tasks.
type TaskHoldResult struct {
	// Busy is true when the server is busy, in which case no hold was set.
	Busy         bool     `json:"busy"`
	RunningTasks []string `json:"runningTasks,omitempty"`
	FHIRJobs     int      `json:"fhirJobs,omitempty"`
}

// FinalSyncResult is the api's answer to a final sync.
type FinalSyncResult struct {
	Completed bool   `json:"completed"`
	Reason    string `json:"reason,omitempty"`
}

// HoldTasks holds scheduled tasks, unless the server is busy.
//
// spec: SLPWK#going-to-sleep
func (c *Client) HoldTasks(ctx context.Context) (TaskHoldResult, error) {
	var res TaskHoldResult
	err := c.call(ctx, http.MethodPost, "tasks/hold", c.CallTimeout, &res)
	return res, err
}

// ReleaseTasks releases the hold on scheduled tasks. Releasing when there is none does nothing.
func (c *Client) ReleaseTasks(ctx context.Context) error {
	return c.call(ctx, http.MethodDelete, "tasks/hold", c.CallTimeout, nil)
}

// Version is the release the server runs.
func (c *Client) Version(ctx context.Context) (string, error) {
	var res struct {
		Version string `json:"version"`
	}
	if err := c.call(ctx, http.MethodGet, "status", c.CallTimeout, &res); err != nil {
		return "", err
	}
	if res.Version == "" {
		return "", errors.New("api: status gave no version")
	}
	return res.Version, nil
}

// FinalSync asks a facility server to sync with central once more.
func (c *Client) FinalSync(ctx context.Context) (FinalSyncResult, error) {
	var res FinalSyncResult
	err := c.call(ctx, http.MethodPost, "final-sync", c.FinalSyncTimeout, &res)
	return res, err
}

// call makes a request to the first api instance that answers, giving each
// instance timeout to do so. An instance that cannot be reached, does not
// answer in time or fails with a server error is passed over, which is safe
// because every supervisor route can be repeated; any other error status
// fails the call.
func (c *Client) call(ctx context.Context, method, route string, timeout time.Duration, out any) error {
	if len(c.upstreams) == 0 {
		return errors.New("api: no api addresses configured")
	}
	var errs []error
	for _, upstream := range c.upstreams {
		attempt, cancel := context.WithTimeout(ctx, timeout)
		err := c.callOne(attempt, upstream, method, route, out)
		cancel()
		var unreachable *unreachableError
		if !errors.As(err, &unreachable) || ctx.Err() != nil {
			return err
		}
		errs = append(errs, err)
	}
	return errors.Join(errs...)
}

type unreachableError struct{ err error }

func (e *unreachableError) Error() string { return e.err.Error() }
func (e *unreachableError) Unwrap() error { return e.err }

func (c *Client) callOne(ctx context.Context, upstream, method, route string, out any) error {
	url := "http://" + upstream + "/api/supervisor/" + route
	req, err := http.NewRequestWithContext(ctx, method, url, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+c.token)
	req.Header.Set("Accept", "application/json")

	res, err := c.HTTP.Do(req)
	if err != nil {
		return &unreachableError{fmt.Errorf("api: %s %s: %w", method, route, err)}
	}
	defer res.Body.Close()
	// The body of an error stays out of the error, which the status reports:
	// the server logs the error itself. An instance failing on its own side
	// is passed over like one that cannot be reached.
	if res.StatusCode >= 500 {
		return &unreachableError{fmt.Errorf("api: %s %s answered %s", method, route, res.Status)}
	}
	if res.StatusCode < 200 || res.StatusCode > 299 {
		return fmt.Errorf("api: %s %s answered %s", method, route, res.Status)
	}
	body, _ := io.ReadAll(io.LimitReader(res.Body, 1<<20))
	if out == nil || len(body) == 0 {
		return nil
	}
	if err := json.Unmarshal(body, out); err != nil {
		return fmt.Errorf("api: reading %s %s: %w", method, route, err)
	}
	return nil
}
