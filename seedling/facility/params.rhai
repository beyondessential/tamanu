// Shared by every bundle in seedling/, as identical copies that
// scripts/check-seedling-bundles.mjs keeps in step.

let version = app.param("version")
    .required(true)
    .description("Tamanu image tag, such as v2.71.3; changing it upgrades the server, with downtime")
    .validate(|v, all| {
        if published == () { return; }
        let wanted = release_of.call(published.tag);
        if same_minor.call(release_of.call(v), wanted) { return; }
        throw `this definition runs releases of ${wanted[0]}.${wanted[1]}; use the definition for the release you want`;
    });
if published != () {
    version.default_value(published.tag);
}

// A validator runs whenever its parameter is set, so this one also refuses a
// version change that would leave the frontend version behind.
let frontend_version = app.param("frontend-version")
    .required(false)
    .description("Image tag for the frontends in place of the version, no older than it and in its minor; changing it has no downtime")
    .validate(|v, all| {
        if published == () { return; }
        let server = if "version" in all { all.version } else { published.tag };
        let base = release_of.call(server);
        // The version's own validator refuses a version outside the minor.
        if !same_minor.call(base, release_of.call(published.tag)) { return; }
        let given = release_of.call(v);
        if !same_minor.call(given, base) || given[2] < base[2] {
            throw `must be a release of ${base[0]}.${base[1]} no older than the version, ${server}; raise it or unset it`;
        }
    });

let database_url = app.param("database-url")
    .kind("password")
    .required(true)
    .description("PostgreSQL URL; a socket URL (?host=/dir) also needs the database-socket volume mapped")
    .validate(|v, all| {
        if !v.starts_with("postgres://") && !v.starts_with("postgresql://") {
            throw "must be a postgres:// or postgresql:// URL";
        }
    });

// Seedling faults an app whose external volume is unmapped, so the socket's
// volume is declared only when the URL connects through a socket.
let database_socket = if database_url.is_set() { socket_dir.call(database_url.value()) } else { () };
let database_socket_volume = if database_socket != () {
    app.external_volume("database-socket").description("PostgreSQL socket directory")
} else {
    ()
};

let crypto_key = app.param("crypto-key")
    .kind("random")
    .secret(true)
    .required(true)
    .description("Encrypts stored secrets; must be the key they were stored with")
    .validate(|v, all| hex_secret.call(v));

let auth_secret = app.param("auth-secret")
    .kind("random")
    .secret(true)
    .required(true)
    .description("Signs login tokens; changing it logs everyone out");

let refresh_secret = app.param("auth-refresh-secret")
    .kind("random")
    .secret(true)
    .required(true)
    .description("Signs refresh tokens; changing it logs everyone out when their login next expires");

let canonical_url = app.param("canonical-url")
    .required(true)
    .description("URL the server is reached at; sets its ingress, with TLS for https")
    .validate(|v, all| { parse_origin.call(v); });

let timezone = app.param("timezone")
    .required(false)
    .default_value("UTC")
    .description("IANA timezone; changing it doesn't convert stored datetimes, and a facility's must match its central server's");

// A parameter can be unset while the definition is first registered, so nothing
// below throws on an unset one.
let canonical = if canonical_url.is_set() { parse_origin.call(canonical_url.value()) } else { () };

let image = |name| `ghcr.io/beyondessential/tamanu-${name}:${version.value()}`;
let frontend_image = |name| {
    let tag = if frontend_version.is_set() { frontend_version.value() } else { version.value() };
    `ghcr.io/beyondessential/tamanu-${name}:${tag}`
};
