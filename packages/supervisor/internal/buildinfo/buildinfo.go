// Package buildinfo holds the Tamanu release the supervisor was built for. It
// is not named "release", which the repository's ignore file excludes.
package buildinfo

import "strings"

// Version is the release, set at build time with
//
//	go build -ldflags "-X github.com/beyondessential/tamanu/packages/supervisor/internal/buildinfo.Version=2.70.0"
//
// It is "dev" in a build without it.
var Version = Dev

// Dev is the version of a build that was not given one.
const Dev = "dev"

// Line is the release line of version: its major and minor version, as
// "2.70" for "v2.70.3". A version without two dot-separated parts is its own
// line.
//
// spec: SUPV#compatibility
func Line(version string) string {
	version = strings.TrimPrefix(strings.TrimSpace(version), "v")
	parts := strings.SplitN(version, ".", 3)
	if len(parts) < 2 {
		return version
	}
	return parts[0] + "." + parts[1]
}

// SameLine reports whether two versions are of the same release line.
func SameLine(a, b string) bool { return Line(a) == Line(b) }
