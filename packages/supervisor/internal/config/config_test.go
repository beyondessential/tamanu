package config

import (
	"errors"
	"slices"
	"strings"
	"testing"
	"time"
)

// env builds an environment for role with the required upstreams, then
// applies extra as name, value pairs.
func env(role string, extra ...string) map[string]string {
	e := map[string]string{
		VarRole:         role,
		VarAPIUpstreams: "api:4000",
		VarWebUpstreams: "web:80",
	}
	for i := 0; i+1 < len(extra); i += 2 {
		e[extra[i]] = extra[i+1]
	}
	return e
}

func facilityEnv(extra ...string) map[string]string { return env("facility", extra...) }

func centralEnv(extra ...string) map[string]string { return env("central", extra...) }

func TestDefaults(t *testing.T) {
	c, err := FromEnv(facilityEnv())
	if err != nil {
		t.Fatal(err)
	}
	if c.Role != Facility {
		t.Errorf("role = %q", c.Role)
	}
	if c.Listen != ":8080" || c.StatusListen != "127.0.0.1:8081" || c.PortalListen != "" {
		t.Errorf("listen addresses = %q, %q, %q", c.Listen, c.StatusListen, c.PortalListen)
	}
	if c.IdleTime != 30*time.Minute {
		t.Errorf("facility idle time = %v", c.IdleTime)
	}
	if c.HasActuator() || c.HasPortal() {
		t.Errorf("unexpected actuator or portal: %+v", c)
	}

	c, err = FromEnv(centralEnv())
	if err != nil {
		t.Fatal(err)
	}
	if c.IdleTime != 15*time.Minute {
		t.Errorf("central idle time = %v", c.IdleTime)
	}
}

func TestFullCentral(t *testing.T) {
	c, err := FromEnv(centralEnv(
		VarListen, "0.0.0.0:9000",
		VarPortalListen, ":9001",
		VarStatusListen, "127.0.0.1:9002",
		VarAPIUpstreams, " api-1:4000 , api-2:4000,10.0.0.3:4000 ",
		VarPortalUpstreams, "portal:80",
		VarActuatorURL, "http://actuator:7000/base",
		VarIdleTime, "45m",
		VarAPIToken, "secret",
		VarDataDir, "/var/lib/supervisor",
		VarTrustedProxies, "10.0.0.0/8, fd00::/8",
	))
	if err != nil {
		t.Fatal(err)
	}
	want := []string{"api-1:4000", "api-2:4000", "10.0.0.3:4000"}
	if !slices.Equal(c.APIUpstreams, want) {
		t.Errorf("api upstreams = %q, want %q", c.APIUpstreams, want)
	}
	if !c.HasPortal() || !slices.Equal(c.PortalUpstreams, []string{"portal:80"}) {
		t.Errorf("portal = %q %q", c.PortalListen, c.PortalUpstreams)
	}
	if c.ActuatorURL.String() != "http://actuator:7000/base" {
		t.Errorf("actuator = %v", c.ActuatorURL)
	}
	if c.IdleTime != 45*time.Minute || c.APIToken != "secret" || c.DataDir != "/var/lib/supervisor" {
		t.Errorf("unexpected %+v", c)
	}
	if !slices.Equal(c.TrustedProxies, []string{"10.0.0.0/8", "fd00::/8"}) {
		t.Errorf("trusted proxies = %q", c.TrustedProxies)
	}
}

func TestBlankCountsAsUnset(t *testing.T) {
	c, err := FromEnv(facilityEnv(VarListen, "  ", VarIdleTime, ""))
	if err != nil {
		t.Fatal(err)
	}
	if c.Listen != DefaultListen || c.IdleTime != DefaultFacilityIdleTime {
		t.Errorf("blank values not treated as unset: %+v", c)
	}
}

func TestErrors(t *testing.T) {
	tests := []struct {
		name    string
		env     map[string]string
		wantVar string
		wantMsg string
	}{
		{"missing role", map[string]string{VarAPIUpstreams: "a:1", VarWebUpstreams: "w:1"}, VarRole, "is required"},
		{"unknown role", facilityEnv(VarRole, "satellite"), VarRole, `not "satellite"`},
		{"missing api upstreams", map[string]string{VarRole: "central", VarWebUpstreams: "w:1"}, VarAPIUpstreams, "is required"},
		{"missing web upstreams", map[string]string{VarRole: "central", VarAPIUpstreams: "a:1"}, VarWebUpstreams, "is required"},
		{"upstream without port", facilityEnv(VarAPIUpstreams, "api"), VarAPIUpstreams, `"api" is not one`},
		{"upstream without host", facilityEnv(VarAPIUpstreams, ":4000"), VarAPIUpstreams, `":4000" is not one`},
		{"empty upstream in list", facilityEnv(VarWebUpstreams, "web:80,,web2:80"), VarWebUpstreams, `"" is not one`},
		{"upstream with bad port", facilityEnv(VarWebUpstreams, "web:http"), VarWebUpstreams, "is not one"},
		{"listen not an address", facilityEnv(VarListen, "8080"), VarListen, "must be an address"},
		{"listen port out of range", facilityEnv(VarListen, ":70000"), VarListen, "invalid port"},
		{"portal on facility", facilityEnv(VarPortalListen, ":8082", VarPortalUpstreams, "p:80"), VarPortalListen, "only for a central"},
		{"portal upstreams on facility", facilityEnv(VarPortalUpstreams, "p:80"), VarPortalUpstreams, "only for a central"},
		{"portal listen without upstreams", centralEnv(VarPortalListen, ":8082"), VarPortalUpstreams, "is required when " + VarPortalListen},
		{"portal upstreams without listen", centralEnv(VarPortalUpstreams, "p:80"), VarPortalListen, "is required when " + VarPortalUpstreams},
		{"colliding listen", facilityEnv(VarStatusListen, "127.0.0.1:8080"), VarStatusListen, "collides with " + VarListen},
		{"actuator not a url", facilityEnv(VarActuatorURL, "actuator:7000", VarAPIToken, "t", VarDataDir, "/d"), VarActuatorURL, "http or https"},
		{"actuator without host", facilityEnv(VarActuatorURL, "http://", VarAPIToken, "t", VarDataDir, "/d"), VarActuatorURL, "must include a host"},
		{"actuator without token", facilityEnv(VarActuatorURL, "http://a:7000", VarDataDir, "/d"), VarAPIToken, "is required when " + VarActuatorURL},
		{"actuator without data dir", facilityEnv(VarActuatorURL, "http://a:7000", VarAPIToken, "t"), VarDataDir, "is required when " + VarActuatorURL},
		{"idle time not a duration", facilityEnv(VarIdleTime, "30"), VarIdleTime, "must be a duration"},
		{"idle time zero", facilityEnv(VarIdleTime, "0s"), VarIdleTime, "longer than zero"},
		{"trusted proxy not a cidr", facilityEnv(VarTrustedProxies, "10.0.0.1"), VarTrustedProxies, `"10.0.0.1" is not one`},
		{"unknown variable", facilityEnv(Prefix+"IDLE_TIMEOUT", "5m"), Prefix + "IDLE_TIMEOUT", "not a variable the supervisor reads"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := FromEnv(tt.env)
			if err == nil {
				t.Fatal("expected an error")
			}
			var found bool
			for _, e := range unjoin(err) {
				var ve *VariableError
				if errors.As(e, &ve) && ve.Name == tt.wantVar && strings.Contains(ve.Problem, tt.wantMsg) {
					found = true
				}
			}
			if !found {
				t.Errorf("error %q does not name %s with %q", err, tt.wantVar, tt.wantMsg)
			}
			if !strings.Contains(err.Error(), tt.wantVar) {
				t.Errorf("error message %q does not name %s", err, tt.wantVar)
			}
		})
	}
}

func TestReportsEveryProblem(t *testing.T) {
	_, err := FromEnv(map[string]string{VarIdleTime: "soon"})
	got := unjoin(err)
	names := make([]string, 0, len(got))
	for _, e := range got {
		var ve *VariableError
		if errors.As(e, &ve) {
			names = append(names, ve.Name)
		}
	}
	for _, want := range []string{VarRole, VarAPIUpstreams, VarWebUpstreams, VarIdleTime} {
		if !slices.Contains(names, want) {
			t.Errorf("errors %q do not include %s", names, want)
		}
	}
}

func TestEnviron(t *testing.T) {
	env := Environ([]string{"A=1", "B=x=y", "C=", "malformed"})
	if env["A"] != "1" || env["B"] != "x=y" || env["C"] != "" || len(env) != 3 {
		t.Errorf("Environ = %v", env)
	}
}

func unjoin(err error) []error {
	if joined, ok := err.(interface{ Unwrap() []error }); ok {
		return joined.Unwrap()
	}
	return []error{err}
}
