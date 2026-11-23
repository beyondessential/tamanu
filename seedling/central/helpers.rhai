// Shared by every bundle in seedling/, as identical copies that
// scripts/check-seedling-bundles.mjs keeps in step.

// spec: SDPUB#published-version
// Publishing writes `published-version` beside this script, with the build's
// image tag on its first line and the Tamanu version the build carries on its
// second. A definition run from the repository has no such file.
let published = try {
    let lines = app.file("published-version").text().split("\n");
    let tag = lines[0];
    let release = lines[1];
    tag.trim();
    release.trim();
    #{ tag: tag, release: release }
} catch {
    ()
};

// spec: SDUPG#version-parameter
// The numbers of a release, such as [2, 71, 3] for "v2.71.3", or () for a tag
// that names no release. The published tag is read as the release it carries,
// since a build that is not a release is in that release's minor.
let release_of = |tag| {
    if published != () && tag == published.tag { tag = published.release; }
    let bare = if tag.starts_with("v") { tag.sub_string(1) } else { tag };
    let parts = bare.split(".");
    if parts.len() != 3 { return (); }
    let numbers = [];
    for part in parts {
        if part.len() == 0 { return (); }
        for c in part.chars() {
            if c < '0' || c > '9' { return (); }
        }
        numbers.push(parse_int(part));
    }
    numbers
};

let same_minor = |a, b| a != () && b != () && a[0] == b[0] && a[1] == b[1];

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
    for c in v.chars() {
        if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')) {
            throw "must be 64 hexadecimal digits";
        }
    }
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
