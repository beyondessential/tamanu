// Tamanu facility server.
// spec: SDDEF, SDUPG
//
// Gates are declared in the order Seedling runs them when several are due at
// once.

app.description(`
Tamanu facility server: serves a facility's staff, and syncs with its central server.
`);
app.canopy_type("tamanu-facility");

// ── Shared helpers ────────────────────────────────────────────────────────────

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

// The minor of a release tag, such as "2.71" for "v2.71.3", or () for a tag
// that names no release.
let minor_of = |release| {
    let bare = if release.starts_with("v") { release.sub_string(1) } else { release };
    let parts = bare.split(".");
    if parts.len() != 3 { return (); }
    for part in parts {
        if part.len() == 0 { return (); }
        for c in part.chars() {
            if c < '0' || c > '9' { return (); }
        }
    }
    `${parts[0]}.${parts[1]}`
};

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

// ── Parameters ────────────────────────────────────────────────────────────────

let version = app.param("version")
    .required(true)
    .description("Tamanu build to run, by its image tag")
    .validate(|v, all| {
        if published == () || v == published.tag { return; }
        let wanted = minor_of.call(published.release);
        let given = minor_of.call(v);
        if given == () || given != wanted {
            throw `this definition runs releases of ${wanted}; use the definition for the release you want`;
        }
    });
if published != () {
    version.default_value(published.tag);
}

let database_url = app.param("database-url")
    .kind("password")
    .required(true)
    .description("PostgreSQL connection URL, including the password of the server's role")
    .validate(|v, all| {
        if !v.starts_with("postgres://") && !v.starts_with("postgresql://") {
            throw "must be a postgres:// or postgresql:// URL";
        }
    });

let hex_secret = |v| {
    if v.len() != 64 { throw "must be 64 hexadecimal digits"; }
    for c in v.chars() {
        if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')) {
            throw "must be 64 hexadecimal digits";
        }
    }
};

let crypto_key = app.param("crypto-key")
    .kind("random")
    .secret(true)
    .required(true)
    .description("Key the server encrypts its stored secrets with; generate one for a new server, or enter an existing deployment's")
    .validate(|v, all| hex_secret.call(v));

let auth_secret = app.param("auth-secret")
    .kind("random")
    .secret(true)
    .required(true)
    .description("Signing secret for login tokens");

let refresh_secret = app.param("auth-refresh-secret")
    .kind("random")
    .secret(true)
    .required(true)
    .description("Signing secret for refresh tokens");

let canonical_url = app.param("canonical-url")
    .required(true)
    .description("URL the server is reached at, such as https://facility.example.org")
    .validate(|v, all| { parse_origin.call(v); });

let timezone = app.param("timezone")
    .required(false)
    .default_value("UTC")
    .description("Primary timezone, as an IANA name such as Pacific/Auckland; must match the central server's");

// A parameter can be unset while the definition is first registered, so nothing
// below throws on an unset one.
let canonical = if canonical_url.is_set() { parse_origin.call(canonical_url.value()) } else { () };

// ── Images ────────────────────────────────────────────────────────────────────

let image = |name| `ghcr.io/beyondessential/tamanu-${name}:${version.value()}`;

// ── Front door ────────────────────────────────────────────────────────────────

// spec: SDDEF#what-a-definition-runs
// Both lists are placeholders until the addresses that Seedling's proxy and
// service mounts connect from are known.
const SEEDLING_PROXIES = "uniquelocal";
const SUPERVISOR_PROXIES = "uniquelocal";

let public_svc = app.service("public").exported().http(80);
if canonical != () {
    let ingress = public_svc.ingress(canonical.host, canonical.port);
    if canonical.scheme == "https" {
        ingress.tls(Terminate.Https, Output.Http1).redirect();
    }
}

// The supervisor reaches each part at `localmount`, on a port of its own. The
// API reaches the sync part the same way.
let api_http = app.service("api-http");
let frontend_http = app.service("frontend-http");
let sync_http = app.service("sync-http");

let supervisor_state = app.volume("supervisor-state")
    .description("The supervisor's durable state");

let supervisor = app.deployment("supervisor")
    .description("Front door: routes requests to the parts, and answers while they are upgrading")
    .image(image.call("supervisor"))
    .scale(1)
    .env("SUPERVISOR_LISTEN", ":8080")
    .env("SUPERVISOR_STATE_DIR", "/state")
    .env("SUPERVISOR_API_URL", "http://localmount:3001")
    .env("SUPERVISOR_WEB_URL", "http://localmount:3002")
    .env("SUPERVISOR_SYNC_URL", "http://localmount:3004")
    .env("PROXY_TRUSTED", SEEDLING_PROXIES)
    .env("DATABASE_URL", database_url.value())
    .env("CRYPTO_KEY", crypto_key.value())
    .mount("/state", supervisor_state)
    .mount(api_http.port(3001))
    .mount(frontend_http.port(3002))
    .mount(sync_http.port(3004))
    .http(8080, public_svc.route("/"));

// ── Parts ─────────────────────────────────────────────────────────────────────

let configure_server = |c| {
    c.image(image.call("facility"))
        .env("TZ", timezone.value())
        .env("DATABASE_URL", database_url.value())
        .env("CRYPTO_KEY", crypto_key.value())
        .env("AUTH_SECRET", auth_secret.value())
        .env("AUTH_REFRESH_TOKEN_SECRET", refresh_secret.value())
        .env("PROXY_TRUSTED", SUPERVISOR_PROXIES)
        .env("PORT", "3000")
        .env("DISK_PATH", "/")
        .env("LOG_CONSOLE_LEVEL", "http")
        .env("MIGRATE_ON_STARTUP", "false")
        .env("SYNC_API_URL", "http://localmount:3004");
    if canonical_url.is_set() {
        c.env("CANONICAL_HOST_NAME", canonical_url.value());
    }
    c
};

let api_max_replicas = if AVAILABLE_THREADS / 2 < 1 { 1 } else { AVAILABLE_THREADS / 2 };

configure_server.call(app.deployment("api"))
    .description("API")
    .scale(1..=api_max_replicas)
    .arg(["startApi"])
    .mount(sync_http.port(3004))
    .tcp(3000, api_http.port(3001));

configure_server.call(app.deployment("sync"))
    .description("Sync with the central server")
    .scale(1)
    .on_update(OnUpdate.Replace)
    .arg(["startSync"])
    .tcp(3000, sync_http.port(3004));

configure_server.call(app.deployment("tasks"))
    .description("Background tasks")
    .on_update(OnUpdate.Replace)
    .arg(["startTasks"]);

configure_server.call(app.deployment("fhir"))
    .description("FHIR worker")
    .on_update(OnUpdate.Replace)
    .arg(["startFhirWorker"]);

app.deployment("frontend")
    .description("Web app")
    .image(image.call("frontend"))
    .scale(1)
    .tcp(3000, frontend_http.port(3002));

let parts = ["api", "sync", "tasks", "fhir", "frontend"];

// ── Gates ─────────────────────────────────────────────────────────────────────

// spec: SDDEF#readiness-check
let readiness_check = configure_server.call(app.job("readiness-check"))
    .description("Check the database URL connects and the crypto key decrypts the stored secrets")
    .arg(["checkReadiness"])
    .deadline(60);

let readiness = app.gate("readiness")
    .key([database_url.value(), crypto_key.value()])
    .check(readiness_check, #{ interval: 300 });

// spec: SDUPG#the-upgrade
// The images are pulled before the supervisor is told, so a failed pull leaves
// it serving the running release.
let announce = app.gate("announce")
    .key(version.value())
    .after(readiness)
    .run(|rt, last| {
        rt.warm_images(app).ready();
        // A new server has no supervisor to tell yet.
        if type_of(last) != "()" {
            rt.exec(supervisor, ["tamanu-supervisor", "upgrade-started"]).ensure_success();
        }
    });

// spec: SDUPG#checking-the-migrations
let migrations_check = configure_server.call(app.job("migrations-check"))
    .description("Check the database has no migrations pending for this release")
    .arg(["just-migrate", "list", "--pending", "--check"])
    .deadline(120);

let upgrade = app.gate("upgrade")
    .key(version.value())
    .after(announce)
    .exclusive(app.select(#{ types: [ResourceType.Deployment], names: parts }))
    .check(migrations_check)
    .run(|rt| {
        rt.start(configure_server.call(app.job())
            .description("Run this release's migrations and upgrade steps")
            .arg(["upgrade"])
        ).terminated_eventually().ensure_success();
    });

for name in parts {
    app.deployment(name).after([readiness, upgrade]);
}
supervisor.after([readiness, upgrade]);
for name in parts {
    supervisor.after(app.deployment(name));
}

// spec: SDDEF#ingress
let https_hosts = [];
if canonical != () && canonical.scheme == "https" { https_hosts.push(canonical.host); }
app.gate("certificates")
    .key(https_hosts)
    .run(|rt| { rt.warm_certs(app).ready(); });

// ── Shells ────────────────────────────────────────────────────────────────────

app.on_shell("node", |_rt, shell, _param| {
    shell.attach(configure_server.call(app.job()).arg(["shell"]));
}, #{ description: "Tamanu shell in the facility server image" });
