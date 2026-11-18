// Package pages holds the responses the supervisor gives itself rather than
// forwarding: waking, upgrading and unavailable.
package pages

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"slices"
	"strconv"
	"strings"
	"time"
)

// Response is one of the supervisor's own responses.
type Response struct {
	// Name identifies the response in an API error body.
	Name string
	// Message explains the response in an API error body and in plain text.
	Message string
	// RetryAfter is sent as the Retry-After header when not zero.
	RetryAfter time.Duration
	page       []byte
}

// The supervisor's own responses.
var (
	// spec: SLPWK#waking
	Waking = Response{
		Name:       "ServerWaking",
		Message:    "The server is starting up. Try again shortly.",
		RetryAfter: 10 * time.Second,
	}

	// spec: SUPV#upgrades
	Upgrading = Response{
		Name:       "ServerUpgrading",
		Message:    "The server is being upgraded. Try again shortly.",
		RetryAfter: 30 * time.Second,
	}

	// Unavailable answers a request whose part could not be reached. It has
	// no Retry-After, so a client reads it as a failure, not a waking server.
	Unavailable = Response{
		Name:    "ServerUnavailable",
		Message: "The server cannot be reached right now.",
	}
)

// Pages are the responses with Tamanu's pages for a browser, from the web
// app's resources/errors.
type Pages struct {
	Waking, Upgrading Response
	unavailable       map[int]Response
}

// errorsDir is where the web app keeps its error pages, as it serves them.
const errorsDir = "/resources/errors/"

// Load reads Tamanu's pages from the web app's directory: waking.html for
// waking, 526.html for upgrading, and each status's own page for unavailable.
// A response whose page is missing answers a browser in plain text.
//
// spec: SUPV#front-door
func Load(webRoot string) *Pages {
	read := func(resp Response, name string) Response {
		if webRoot == "" {
			return resp
		}
		page, err := os.ReadFile(filepath.Join(webRoot, filepath.FromSlash(errorsDir), name))
		if err != nil {
			return resp
		}
		return resp.WithPage(withBase(page))
	}
	p := &Pages{
		Waking:      read(Waking, "waking.html"),
		Upgrading:   read(Upgrading, "526.html"),
		unavailable: map[int]Response{},
	}
	for _, status := range []int{http.StatusBadGateway, http.StatusServiceUnavailable, http.StatusGatewayTimeout} {
		p.unavailable[status] = read(Unavailable, fmt.Sprintf("%d.html", status))
	}
	return p
}

// Unavailable is the response for a part that could not be reached, with
// status, and whether there is one for it.
func (p *Pages) Unavailable(status int) (Response, bool) {
	resp, ok := p.unavailable[status]
	return resp, ok
}

// withBase points page's relative addresses, such as its images, at the
// errors directory, since it is served at whatever path was asked for.
func withBase(page []byte) []byte {
	i := bytes.Index(bytes.ToLower(page), []byte("<head>"))
	if i < 0 {
		return page
	}
	i += len("<head>")
	return slices.Concat(page[:i], []byte(`<base href="`+errorsDir+`">`), page[i:])
}

// WithPage returns the response with page as its browser form.
func (resp Response) WithPage(page []byte) Response {
	resp.page = page
	return resp
}

// Write sends the response with status: a page for a browser opening one,
// JSON for any other API request, and plain text otherwise.
func (resp Response) Write(w http.ResponseWriter, r *http.Request, status int) {
	h := w.Header()
	h.Set("Cache-Control", "no-store")
	if resp.RetryAfter > 0 {
		h.Set("Retry-After", strconv.Itoa(int(resp.RetryAfter/time.Second)))
	}

	var body []byte
	switch {
	case IsBrowser(r) && resp.page != nil:
		h.Set("Content-Type", "text/html; charset=utf-8")
		body = resp.page
	case IsAPIPath(r.URL.Path):
		h.Set("Content-Type", "application/json")
		body, _ = json.Marshal(map[string]any{
			"error": map[string]any{"name": resp.Name, "message": resp.Message, "status": status},
		})
	default:
		h.Set("Content-Type", "text/plain; charset=utf-8")
		body = []byte(resp.Message + "\n")
	}
	h.Set("Content-Length", strconv.Itoa(len(body)))
	w.WriteHeader(status)
	if r.Method != http.MethodHead {
		_, _ = w.Write(body)
	}
}

// IsAPIPath reports whether path is one of the api's. Keep in step with the
// @api matcher in caddy/supervisor.caddyfile.
func IsAPIPath(path string) bool {
	return path == "/api" || path == "/v1" ||
		strings.HasPrefix(path, "/api/") || strings.HasPrefix(path, "/v1/")
}

// IsBrowser reports whether r is a browser asking for a page.
func IsBrowser(r *http.Request) bool {
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		return false
	}
	for _, accept := range r.Header.Values("Accept") {
		if strings.Contains(accept, "text/html") {
			return true
		}
	}
	return false
}
