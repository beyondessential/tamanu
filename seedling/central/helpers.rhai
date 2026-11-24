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

// spec: SDDEF#canonical-urls
// A single trailing slash is accepted as the root path, since a URL copied from
// a browser carries one.
let parse_origin = |url| {
    let scheme = if url.starts_with("https://") {
        "https"
    } else if url.starts_with("http://") {
        "http"
    } else {
        throw `must use http or https, not "${url}"`;
    };
    let authority = url.sub_string(scheme.len() + 3);
    if authority.ends_with("/") { authority = authority.sub_string(0, authority.len() - 1); }
    if authority.contains("/") { throw `must not carry a path: "${url}"`; }
    if authority.contains("?") { throw `must not carry a query: "${url}"`; }
    if authority.contains("#") { throw `must not carry a fragment: "${url}"`; }
    if authority.contains("@") { throw `must not carry credentials: "${url}"`; }
    if authority.len() == 0 { throw `must name a hostname: "${url}"`; }

    let default_port = if scheme == "https" { 443 } else { 80 };
    let colon = authority.index_of(":");
    if colon < 0 {
        return #{ scheme: scheme, host: authority, port: default_port };
    }
    let host = authority.sub_string(0, colon);
    let port = parse_int(authority.sub_string(colon + 1));
    if port < 1 || port > 65535 { throw `must name a port from 1 to 65535: "${url}"`; }
    #{ scheme: scheme, host: host, port: port }
};

let hex_secret = |v| {
    if v.len() != 64 { throw "must be 64 hexadecimal digits"; }
    try { std::decode_hex(v); } catch { throw "must be 64 hexadecimal digits"; }
};

// spec: SDDEF#database
// The socket directory a PostgreSQL URL names as its host, such as
// "/var/run/postgresql" in "postgresql://tamanu@/tamanu?host=/var/run/postgresql",
// or () for a URL that connects over TCP.
let socket_dir = |url| {
    let query_start = url.index_of("?");
    if query_start < 0 { return (); }
    for pair in url.sub_string(query_start + 1).split("&") {
        if pair.starts_with("host=/") { return pair.sub_string(5); }
    }
    ()
};
