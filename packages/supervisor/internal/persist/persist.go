// Package persist encodes the supervisor's saved state, which the actuator
// keeps.
//
// spec: SUPV#resilience
// spec: SUPV#compatibility
package persist

import (
	"encoding/json"
	"time"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/state"
)

// Format is the version of the saved state's document. A change a supervisor
// of the release line before could not read takes a new format, and Decode
// keeps reading the old one.
const Format = 1

// Record is what the supervisor keeps.
type Record struct {
	// Format is the document's format version.
	Format int `json:"format"`
	// Release is the release of the supervisor that wrote the record.
	Release string `json:"release"`
	// Phase is the phase the server was in.
	Phase state.Phase `json:"phase"`
	// Step is the last step of a sleep that completed.
	Step string `json:"step,omitempty"`
	// LastFailure is the failure of the last sleep or wake, if any.
	LastFailure *state.Failure `json:"lastFailure,omitempty"`
	// UpdatedAt is when the record was written.
	UpdatedAt time.Time `json:"updatedAt"`
}

// Encode writes rec as a document of the current format.
func Encode(rec Record) ([]byte, error) {
	rec.Format = Format
	return json.MarshalIndent(rec, "", "  ")
}

// Decode reads a document, ignoring fields it does not know and defaulting
// those it lacks. usable is false for a document it cannot act on, of a later
// format or naming an unknown phase, which is as good as no saved state.
func Decode(b []byte) (rec Record, usable bool, err error) {
	if err := json.Unmarshal(b, &rec); err != nil {
		return Record{}, false, err
	}
	switch rec.Phase {
	case state.Awake, state.GoingToSleep, state.Asleep, state.Waking:
	default:
		return Record{}, false, nil
	}
	if rec.Format > Format {
		return Record{}, false, nil
	}
	return rec, true, nil
}
