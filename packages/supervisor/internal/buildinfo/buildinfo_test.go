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

func TestSameLine(t *testing.T) {
	for _, tt := range []struct {
		a, b string
		want bool
	}{
		{"2.70.0", "2.70.5", true},
		{"v2.70.1", "2.70.0", true},
		{"2.70.0", "2.71.0", false},
		{"2.70.0", "3.70.0", false},
	} {
		if got := SameLine(tt.a, tt.b); got != tt.want {
			t.Errorf("SameLine(%q, %q) = %v", tt.a, tt.b, got)
		}
	}
}
