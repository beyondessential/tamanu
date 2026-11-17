// Package persist reads and writes the supervisor's state file.
//
// spec: SUPV#resilience
package persist

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/state"
)

// FileName is the name of the state file in the data directory.
const FileName = "supervisor-state.json"

// Record is what the supervisor keeps.
type Record struct {
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

// Store reads and writes the record in a directory.
type Store struct {
	dir string
}

// Open returns the store in dir, creating the directory if needed.
func Open(dir string) (*Store, error) {
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return nil, fmt.Errorf("creating the data directory: %w", err)
	}
	return &Store{dir: dir}, nil
}

// Path is the state file's path.
func (s *Store) Path() string { return filepath.Join(s.dir, FileName) }

// Load reads the record. found is false when none has been written.
func (s *Store) Load() (rec Record, found bool, err error) {
	b, err := os.ReadFile(s.Path())
	if errors.Is(err, fs.ErrNotExist) {
		return Record{}, false, nil
	}
	if err != nil {
		return Record{}, false, err
	}
	if err := json.Unmarshal(b, &rec); err != nil {
		return Record{}, false, fmt.Errorf("reading %s: %w", s.Path(), err)
	}
	return rec, true, nil
}

// Save writes the record atomically: a reader, or a supervisor starting after
// a crash, finds either the old record or the new one, never a mix.
func (s *Store) Save(rec Record) error {
	b, err := json.MarshalIndent(rec, "", "  ")
	if err != nil {
		return err
	}
	tmp, err := os.CreateTemp(s.dir, FileName+".*.tmp")
	if err != nil {
		return err
	}
	defer os.Remove(tmp.Name())

	if _, err := tmp.Write(append(b, '\n')); err != nil {
		tmp.Close()
		return err
	}
	if err := tmp.Sync(); err != nil {
		tmp.Close()
		return err
	}
	if err := tmp.Close(); err != nil {
		return err
	}
	if err := os.Rename(tmp.Name(), s.Path()); err != nil {
		return err
	}
	return s.syncDir()
}

// syncDir makes the rename durable. Windows cannot open a directory to sync
// it, and makes renames durable itself.
func (s *Store) syncDir() error {
	if runtime.GOOS == "windows" {
		return nil
	}
	dir, err := os.Open(s.dir)
	if err != nil {
		return err
	}
	defer dir.Close()
	return dir.Sync()
}
