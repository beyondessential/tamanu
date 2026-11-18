package fake

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/actuator"
)

// lease is the fake's lease. Called with the actuator's lock held.
type lease struct {
	holder  string
	token   int64
	expires time.Time
}

func (l lease) heldAt(now time.Time) bool { return l.holder != "" && l.expires.After(now) }

// current reports whether r carries the token of the lease as it stands. A
// lease that has expired keeps its token until another takes it.
func (l lease) current(r *http.Request) bool {
	token, err := strconv.ParseInt(r.Header.Get(actuator.TokenHeader), 10, 64)
	return err == nil && l.holder != "" && token == l.token
}

// LeaseHolder is who holds the lease, or "" when nobody does.
func (a *Actuator) LeaseHolder() string {
	a.mu.Lock()
	defer a.mu.Unlock()
	if !a.lease.heldAt(time.Now()) {
		return ""
	}
	return a.lease.holder
}

// TakeLeaseAs takes the lease for holder for ttl, as another supervisor would.
func (a *Actuator) TakeLeaseAs(holder string, ttl time.Duration) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.lease = lease{holder: holder, token: a.lease.token + 1, expires: time.Now().Add(ttl)}
}

// ExpireLease makes the lease expire now, keeping its token.
func (a *Actuator) ExpireLease() {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.lease.expires = time.Now()
}

// Reports are the reports that have not expired, by instance.
func (a *Actuator) Reports() map[string]actuator.Report {
	return a.State().Reports
}

// ReportPuts is how many reports instance has sent.
func (a *Actuator) ReportPuts(instance string) int {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.reportPuts[instance]
}

// PutReport keeps r for instance for ttl, as a supervisor reporting would.
func (a *Actuator) PutReport(instance string, r actuator.Report, ttl time.Duration) {
	a.mu.Lock()
	defer a.mu.Unlock()
	r.ExpiresAt = time.Now().Add(ttl)
	a.reports[instance] = r
}

func (a *Actuator) refuse(w http.ResponseWriter) {
	a.mu.Lock()
	info := actuator.LeaseInfo{}
	if a.lease.heldAt(time.Now()) {
		info = actuator.LeaseInfo{Holder: a.lease.holder, ExpiresAt: a.lease.expires}
	}
	a.mu.Unlock()
	writeJSON(w, http.StatusConflict, info)
}

func (a *Actuator) serveLease(w http.ResponseWriter, r *http.Request) {
	var req actuator.LeaseRequest
	if r.Method != http.MethodDelete {
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Holder == "" || req.TTLSeconds <= 0 {
			http.Error(w, "the body needs a holder and a ttlSeconds", http.StatusBadRequest)
			return
		}
	}
	ttl := time.Duration(req.TTLSeconds * float64(time.Second))

	a.mu.Lock()
	now := time.Now()
	switch r.Method {
	case http.MethodPost:
		if a.lease.heldAt(now) && a.lease.holder != req.Holder {
			a.mu.Unlock()
			a.refuse(w)
			return
		}
		if !a.lease.heldAt(now) || a.lease.holder != req.Holder {
			a.lease = lease{holder: req.Holder, token: a.lease.token + 1}
		}
		a.lease.expires = now.Add(ttl)
	case http.MethodPut:
		if !a.lease.current(r) || a.lease.holder != req.Holder {
			a.mu.Unlock()
			a.refuse(w)
			return
		}
		a.lease.expires = now.Add(ttl)
	case http.MethodDelete:
		if !a.lease.current(r) {
			a.mu.Unlock()
			a.refuse(w)
			return
		}
		a.lease.holder = ""
		a.lease.expires = now
		a.mu.Unlock()
		w.WriteHeader(http.StatusNoContent)
		return
	default:
		a.mu.Unlock()
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	info := actuator.LeaseInfo{Holder: a.lease.holder, Token: a.lease.token, ExpiresAt: a.lease.expires}
	a.mu.Unlock()
	writeJSON(w, http.StatusOK, info)
}

func (a *Actuator) serveReport(w http.ResponseWriter, r *http.Request) {
	instance := strings.TrimPrefix(r.URL.Path, "/v1/reports/")
	var report actuator.Report
	if err := json.NewDecoder(r.Body).Decode(&report); err != nil || instance == "" || report.TTLSeconds <= 0 {
		http.Error(w, "the body needs a ttlSeconds", http.StatusBadRequest)
		return
	}
	report.ExpiresAt = time.Now().Add(time.Duration(report.TTLSeconds * float64(time.Second)))
	report.TTLSeconds = 0
	a.mu.Lock()
	a.reports[instance] = report
	a.reportPuts[instance]++
	a.mu.Unlock()
	w.WriteHeader(http.StatusNoContent)
}
