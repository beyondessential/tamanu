// Shared by every bundle in seedling/, as identical copies that
// scripts/check-seedling-bundles.mjs keeps in step.

// spec: SDPUB#published-version
// Publishing adds the build's image tag and the Tamanu version it carries to the
// metadata table of seedling.toml. A definition run from the repository has
// neither.
let published = app.metadata();
let published = if published.tag != () {
    #{ tag: published.tag, release: std::parse_version_semver(published.version) }
} else {
    ()
};

// spec: SDUPG#version-parameter
// The release a tag names, or () for a tag that names none. The published tag
// is read as the release it carries, since a build that is not a release is in
// that release's minor.
let release_of = |tag| {
    if published != () && tag == published.tag { return published.release; }
    try { return std::parse_version_semver(tag); } catch { return (); }
};

// Comparing a version with () throws, so a missing release is found by its type.
let same_minor = |a, b| type_of(a) != "()" && a.major() == b.major() && a.minor() == b.minor();

let hex_secret = |v| {
    if v.len() != 64 { throw "must be 64 hexadecimal digits"; }
    try { std::decode_hex(v); } catch { throw "must be 64 hexadecimal digits"; }
};

// spec: SDDEF#database
// The socket directory a parsed PostgreSQL URL names as its host, such as
// "/var/run/postgresql" in "postgresql://tamanu@/tamanu?host=/var/run/postgresql",
// or () for a URL that connects over TCP.
let socket_dir = |url| {
    if !("query" in url) { return (); }
    for pair in url.query.split("&") {
        if pair.starts_with("host=/") { return pair.sub_string(5); }
    }
    ()
};
