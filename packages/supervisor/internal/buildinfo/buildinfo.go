// Package buildinfo holds the Tamanu release the supervisor was built for.
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

// IsDev reports whether the build was not given a release.
func IsDev() bool { return Version == Dev }

// Same reports whether two release versions name the same release, ignoring
// a leading "v".
func Same(a, b string) bool {
	return strings.TrimPrefix(strings.TrimSpace(a), "v") == strings.TrimPrefix(strings.TrimSpace(b), "v")
}
