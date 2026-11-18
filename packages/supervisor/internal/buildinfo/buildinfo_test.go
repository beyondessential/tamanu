package buildinfo

import "testing"

func TestLine(t *testing.T) {
	for version, want := range map[string]string{
		"2.70.0":      "2.70",
		"v2.70.3":     "2.70",
		" 2.69.12 ":   "2.69",
		"2.70.0-rc.1": "2.70",
		"2.70":        "2.70",
		"dev":         "dev",
		"":            "",
		"10.1.2.3":    "10.1",
	} {
		if got := Line(version); got != want {
			t.Errorf("Line(%q) = %q, want %q", version, got, want)
		}
	}
}
