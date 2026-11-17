package persist

import (
	"strings"
	"testing"
	"time"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/state"
)

func TestRoundTrip(t *testing.T) {
	at := time.Date(2026, 11, 17, 1, 2, 3, 0, time.UTC)
	want := Record{
		Release:     "2.70.0",
		Phase:       state.GoingToSleep,
		Step:        "held",
		LastFailure: &state.Failure{At: at, Message: "final sync did not complete"},
		UpdatedAt:   at,
	}
	doc, err := Encode(want)
	if err != nil {
		t.Fatal(err)
	}
	got, usable, err := Decode(doc)
	if err != nil || !usable {
		t.Fatalf("usable %v, %v", usable, err)
	}
	if got.Release != want.Release || got.Phase != want.Phase || got.Step != want.Step ||
		got.LastFailure.Message != want.LastFailure.Message || !got.UpdatedAt.Equal(at) || got.Format != Format {
		t.Errorf("got %+v, want %+v", got, want)
	}
}

func TestEncodeSetsTheFormat(t *testing.T) {
	b, err := Encode(Record{Release: "2.70.0", Phase: state.Asleep})
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(b), `"format": 1`) {
		t.Errorf("document %s has no format", b)
	}
}

// spec: SUPV#compatibility
func TestDecodeIsTolerant(t *testing.T) {
	tests := []struct {
		name       string
		doc        string
		wantUsable bool
		wantPhase  state.Phase
	}{
		{"current", `{"format":1,"release":"2.70.0","phase":"asleep"}`, true, state.Asleep},
		{"no format", `{"release":"2.69.0","phase":"going-to-sleep","step":"held"}`, true, state.GoingToSleep},
		{"unknown fields", `{"format":1,"phase":"awake","lease":{"holder":"x"},"extra":[1,2]}`, true, state.Awake},
		{"missing fields", `{"phase":"waking"}`, true, state.Waking},
		{"later format", `{"format":2,"phase":"asleep"}`, false, ""},
		{"unknown phase", `{"format":1,"phase":"hibernating"}`, false, ""},
		{"no phase", `{"format":1}`, false, ""},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rec, usable, err := Decode([]byte(tt.doc))
			if err != nil {
				t.Fatal(err)
			}
			if usable != tt.wantUsable || rec.Phase != tt.wantPhase {
				t.Errorf("usable %v, phase %q", usable, rec.Phase)
			}
		})
	}
	if _, _, err := Decode([]byte("{not json")); err == nil {
		t.Error("no error for a document that is not JSON")
	}
}
