// Shared by every bundle in seedling/, as identical copies that
// scripts/check-seedling-bundles.mjs keeps in step.

let version = app.param("version")
    .required(true)
    .description("Tamanu image tag")
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
    .description("PostgreSQL URL, including the password")
    .validate(|v, all| {
        if !v.starts_with("postgres://") && !v.starts_with("postgresql://") {
            throw "must be a postgres:// or postgresql:// URL";
        }
    });

let crypto_key = app.param("crypto-key")
    .kind("random")
    .secret(true)
    .required(true)
    .description("Crypto key")
    .validate(|v, all| hex_secret.call(v));

let auth_secret = app.param("auth-secret")
    .kind("random")
    .secret(true)
    .required(true)
    .description("Auth secret");

let refresh_secret = app.param("auth-refresh-secret")
    .kind("random")
    .secret(true)
    .required(true)
    .description("Refresh token secret");

let canonical_url = app.param("canonical-url")
    .required(true)
    .description("Canonical URL")
    .validate(|v, all| { parse_origin.call(v); });

let timezone = app.param("timezone")
    .required(false)
    .default_value("UTC")
    .description("Primary timezone");

// A parameter can be unset while the definition is first registered, so nothing
// below throws on an unset one.
let canonical = if canonical_url.is_set() { parse_origin.call(canonical_url.value()) } else { () };

let image = |name| `ghcr.io/beyondessential/tamanu-${name}:${version.value()}`;
