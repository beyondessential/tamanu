// Package pages holds the responses the supervisor gives itself rather than
// forwarding: waking, upgrading and unavailable.
package pages

import (
	"embed"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"
)

//go:embed html
var files embed.FS

func mustRead(name string) []byte {
	b, err := files.ReadFile("html/" + name)
	if err != nil {
		panic(err)
	}
	return b
}

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
		page:       mustRead("waking.html"),
	}

	// spec: SUPV#upgrades
	Upgrading = Response{
		Name:       "ServerUpgrading",
		Message:    "The server is being upgraded. Try again shortly.",
		RetryAfter: 30 * time.Second,
		page:       mustRead("upgrading.html"),
	}

	// Unavailable answers a request whose part could not be reached. It has
	// no Retry-After, so a client reads it as a failure, not a waking server.
	Unavailable = Response{
		Name:    "ServerUnavailable",
		Message: "The server cannot be reached right now.",
		page:    mustRead("unavailable.html"),
	}
)

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
	case IsBrowser(r):
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

// IsAPIPath reports whether path is one of the api's.
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
