// Package config reads and checks the supervisor's configuration, which comes
// entirely from environment variables prefixed with TAMANU_SUPERVISOR_.
//
// spec: SUPV#configuration
package config

import (
	"errors"
	"fmt"
	"maps"
	"net"
	"net/netip"
	"net/url"
	"os"
	"slices"
	"strconv"
	"strings"
	"time"
)

// Prefix starts the name of every variable the supervisor reads.
const Prefix = "TAMANU_SUPERVISOR_"

// The variables the supervisor reads, by full name.
const (
	VarRole            = Prefix + "ROLE"
	VarListen          = Prefix + "LISTEN"
	VarPortalListen    = Prefix + "PORTAL_LISTEN"
	VarStatusListen    = Prefix + "STATUS_LISTEN"
	VarAPIUpstreams    = Prefix + "API_UPSTREAMS"
	VarWebUpstreams    = Prefix + "WEB_UPSTREAMS"
	VarPortalUpstreams = Prefix + "PORTAL_UPSTREAMS"
	VarActuatorURL     = Prefix + "ACTUATOR_URL"
	VarIdleTime        = Prefix + "IDLE_TIME"
	VarAPIToken        = Prefix + "API_TOKEN"
	VarDataDir         = Prefix + "DATA_DIR"
	VarTrustedProxies  = Prefix + "TRUSTED_PROXIES"
)

var knownVars = []string{
	VarRole, VarListen, VarPortalListen, VarStatusListen,
	VarAPIUpstreams, VarWebUpstreams, VarPortalUpstreams,
	VarActuatorURL, VarIdleTime, VarAPIToken, VarDataDir, VarTrustedProxies,
}

// Role is the kind of Tamanu server the supervisor stands in front of.
type Role string

// The roles a supervisor can take.
const (
	Central  Role = "central"
	Facility Role = "facility"
)

// Defaults for optional variables.
const (
	DefaultListen           = ":8080"
	DefaultStatusListen     = "127.0.0.1:8081"
	DefaultFacilityIdleTime = 30 * time.Minute
	DefaultCentralIdleTime  = 15 * time.Minute
)

// Config is the supervisor's checked configuration.
type Config struct {
	Role Role

	// Listen is the address the server's traffic arrives on.
	Listen string
	// PortalListen is the address the patient portal's traffic arrives on.
	// Empty when the server has no patient portal.
	PortalListen string
	// StatusListen is the address of the read-only status server.
	StatusListen string

	// APIUpstreams, WebUpstreams and PortalUpstreams are the host:port
	// addresses of each instance of the server's parts.
	APIUpstreams    []string
	WebUpstreams    []string
	PortalUpstreams []string

	// ActuatorURL is the base URL of the platform's actuator, or nil when the
	// platform provides none, in which case the server never sleeps.
	ActuatorURL *url.URL
	// IdleTime is how long the server goes without activity before sleeping.
	IdleTime time.Duration
	// APIToken is the credential the supervisor presents to the api's
	// supervisor routes. Required with an actuator.
	APIToken string
	// DataDir is where the supervisor keeps its state. Required with an
	// actuator.
	DataDir string

	// TrustedProxies are the CIDR ranges of the platform's proxies, whose
	// forwarded client addresses are believed for rate limiting and passed on
	// to the parts.
	TrustedProxies []string
}

// HasPortal reports whether the supervisor serves a patient portal.
func (c Config) HasPortal() bool { return c.PortalListen != "" }

// HasActuator reports whether the platform provides an actuator.
func (c Config) HasActuator() bool { return c.ActuatorURL != nil }

// Environ turns a list of KEY=value strings, as from os.Environ, into a map.
func Environ(environ []string) map[string]string {
	env := make(map[string]string, len(environ))
	for _, kv := range environ {
		if k, v, ok := strings.Cut(kv, "="); ok {
			env[k] = v
		}
	}
	return env
}

// FromProcess reads the configuration from the process environment.
func FromProcess() (Config, error) {
	return FromEnv(Environ(os.Environ()))
}

// FromEnv reads the configuration from env. A variable set to an empty or
// blank value counts as unset. Every problem found is reported, each naming
// its variable.
func FromEnv(env map[string]string) (Config, error) {
	r := reader{env: env}
	var c Config

	for _, name := range slices.Sorted(maps.Keys(env)) {
		if strings.HasPrefix(name, Prefix) && !slices.Contains(knownVars, name) {
			r.fail(name, "is not a variable the supervisor reads")
		}
	}

	switch role := r.get(VarRole); role {
	case "":
		r.fail(VarRole, "is required, as %q or %q", Central, Facility)
	case string(Central), string(Facility):
		c.Role = Role(role)
	default:
		r.fail(VarRole, "must be %q or %q, not %q", Central, Facility, role)
	}

	c.Listen = r.listen(VarListen, DefaultListen)
	c.PortalListen = r.listen(VarPortalListen, "")
	c.StatusListen = r.listen(VarStatusListen, DefaultStatusListen)

	c.APIUpstreams = r.upstreams(VarAPIUpstreams, true)
	c.WebUpstreams = r.upstreams(VarWebUpstreams, true)
	c.PortalUpstreams = r.upstreams(VarPortalUpstreams, false)

	if c.Role == Facility {
		if r.isSet(VarPortalListen) {
			r.fail(VarPortalListen, "is only for a central server")
		}
		if r.isSet(VarPortalUpstreams) {
			r.fail(VarPortalUpstreams, "is only for a central server")
		}
	}
	if c.Role == Central {
		if r.isSet(VarPortalListen) && !r.isSet(VarPortalUpstreams) {
			r.fail(VarPortalUpstreams, "is required when %s is set", VarPortalListen)
		}
		if r.isSet(VarPortalUpstreams) && !r.isSet(VarPortalListen) {
			r.fail(VarPortalListen, "is required when %s is set", VarPortalUpstreams)
		}
	}

	r.distinct(map[string]string{
		VarListen:       c.Listen,
		VarPortalListen: c.PortalListen,
		VarStatusListen: c.StatusListen,
	})

	if raw := r.get(VarActuatorURL); raw != "" {
		u, err := url.Parse(raw)
		switch {
		case err != nil:
			r.fail(VarActuatorURL, "is not a URL: %v", err)
		case u.Scheme != "http" && u.Scheme != "https":
			r.fail(VarActuatorURL, "must be an http or https URL")
		case u.Host == "":
			r.fail(VarActuatorURL, "must include a host")
		default:
			c.ActuatorURL = u
		}
		if !r.isSet(VarAPIToken) {
			r.fail(VarAPIToken, "is required when %s is set", VarActuatorURL)
		}
		if !r.isSet(VarDataDir) {
			r.fail(VarDataDir, "is required when %s is set", VarActuatorURL)
		}
	}
	c.APIToken = r.get(VarAPIToken)
	c.DataDir = r.get(VarDataDir)

	c.IdleTime = DefaultFacilityIdleTime
	if c.Role == Central {
		c.IdleTime = DefaultCentralIdleTime
	}
	if raw := r.get(VarIdleTime); raw != "" {
		d, err := time.ParseDuration(raw)
		switch {
		case err != nil:
			r.fail(VarIdleTime, "must be a duration such as 30m or 1h, not %q", raw)
		case d <= 0:
			r.fail(VarIdleTime, "must be longer than zero")
		default:
			c.IdleTime = d
		}
	}

	c.TrustedProxies = r.cidrs(VarTrustedProxies)

	if err := errors.Join(r.errs...); err != nil {
		return Config{}, err
	}
	return c, nil
}

// VariableError is a problem with one environment variable.
type VariableError struct {
	Name    string
	Problem string
}

func (e *VariableError) Error() string { return e.Name + " " + e.Problem }

type reader struct {
	env  map[string]string
	errs []error
}

func (r *reader) get(name string) string { return strings.TrimSpace(r.env[name]) }

func (r *reader) isSet(name string) bool { return r.get(name) != "" }

func (r *reader) fail(name, format string, args ...any) {
	r.errs = append(r.errs, &VariableError{Name: name, Problem: fmt.Sprintf(format, args...)})
}

func (r *reader) listen(name, fallback string) string {
	raw := r.get(name)
	if raw == "" {
		return fallback
	}
	host, port, err := net.SplitHostPort(raw)
	if err != nil {
		r.fail(name, "must be an address such as :8080 or 127.0.0.1:8080, not %q", raw)
		return ""
	}
	if !validPort(port) {
		r.fail(name, "has an invalid port in %q", raw)
		return ""
	}
	return net.JoinHostPort(host, port)
}

func (r *reader) upstreams(name string, required bool) []string {
	raw := r.get(name)
	if raw == "" {
		if required {
			r.fail(name, "is required, as a comma-separated list of host:port addresses")
		}
		return nil
	}
	var addrs []string
	for item := range strings.SplitSeq(raw, ",") {
		item = strings.TrimSpace(item)
		host, port, err := net.SplitHostPort(item)
		if item == "" || err != nil || host == "" || !validPort(port) {
			r.fail(name, "must be a comma-separated list of host:port addresses, and %q is not one", item)
			return nil
		}
		addrs = append(addrs, net.JoinHostPort(host, port))
	}
	return addrs
}

func (r *reader) cidrs(name string) []string {
	raw := r.get(name)
	if raw == "" {
		return nil
	}
	var ranges []string
	for item := range strings.SplitSeq(raw, ",") {
		item = strings.TrimSpace(item)
		prefix, err := netip.ParsePrefix(item)
		if err != nil {
			r.fail(name, "must be a comma-separated list of CIDR ranges, and %q is not one", item)
			return nil
		}
		ranges = append(ranges, prefix.String())
	}
	return ranges
}

// distinct reports listen addresses that would collide: the same port on the
// same host, or on a host and every host.
func (r *reader) distinct(addrs map[string]string) {
	type bound struct{ name, host, port string }
	var taken []bound
	for _, name := range slices.Sorted(maps.Keys(addrs)) {
		if addrs[name] == "" {
			continue
		}
		host, port, _ := net.SplitHostPort(addrs[name])
		for _, other := range taken {
			if port == other.port && (host == other.host || allHosts(host) || allHosts(other.host)) {
				r.fail(name, "collides with %s", other.name)
			}
		}
		taken = append(taken, bound{name, host, port})
	}
}

func allHosts(host string) bool { return host == "" || host == "0.0.0.0" || host == "::" }

func validPort(port string) bool {
	n, err := strconv.Atoi(port)
	return err == nil && n > 0 && n <= 65535
}
