package persist

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/state"
)

func TestRoundTrip(t *testing.T) {
	dir := filepath.Join(t.TempDir(), "nested", "data")
	s, err := Open(dir)
	if err != nil {
		t.Fatal(err)
	}
	if _, found, err := s.Load(); found || err != nil {
		t.Fatalf("empty store: found=%v err=%v", found, err)
	}

	at := time.Date(2026, 11, 17, 1, 2, 3, 0, time.UTC)
	want := Record{
		Release:     "2.70.0",
		Phase:       state.GoingToSleep,
		Step:        "held",
		LastFailure: &state.Failure{At: at, Message: "final sync did not complete"},
		UpdatedAt:   at,
	}
	if err := s.Save(want); err != nil {
		t.Fatal(err)
	}
	got, found, err := s.Load()
	if err != nil || !found {
		t.Fatalf("found=%v err=%v", found, err)
	}
	if got.Release != want.Release || got.Phase != want.Phase || got.Step != want.Step ||
		got.LastFailure.Message != want.LastFailure.Message || !got.UpdatedAt.Equal(at) {
		t.Errorf("got %+v, want %+v", got, want)
	}

	want.Phase, want.Step = state.Asleep, ""
	if err := s.Save(want); err != nil {
		t.Fatal(err)
	}
	if got, _, _ := s.Load(); got.Phase != state.Asleep {
		t.Errorf("overwrite lost: %+v", got)
	}

	entries, _ := os.ReadDir(dir)
	if len(entries) != 1 || entries[0].Name() != FileName {
		t.Errorf("data directory holds %v", entries)
	}
}

func TestCorruptFile(t *testing.T) {
	s, _ := Open(t.TempDir())
	if err := os.WriteFile(s.Path(), []byte("{not json"), 0o600); err != nil {
		t.Fatal(err)
	}
	if _, found, err := s.Load(); err == nil || found {
		t.Errorf("corrupt file: found=%v err=%v", found, err)
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
