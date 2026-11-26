// Gates are declared in the order Seedling runs them when several are due at
// once.

// spec: SDDEF#readiness-check
let readiness_check = configure.call(app.job("readiness-check"))
    .arg(["checkReadiness"])
    .deadline("1m");

let readiness = app.gate("readiness")
    .key([stored.call(database_url), stored.call(crypto_key)])
    .check(readiness_check, #{ interval: "5m" });

// spec: SDUPG#checking-the-migrations
let migrations_check = configure.call(app.job("migrations-check"))
    .arg(["just-migrate", "list", "--pending", "--check"])
    .deadline("2m");

// spec: SDUPG#the-upgrade
let upgrade = app.gate("upgrade")
    .key(stored.call(version))
    .after(readiness)
    .exclusive(app.select(#{ types: [ResourceType.Deployment], names: parts }))
    .check(migrations_check)
    .run(|rt| {
        rt.start(configure.call(app.job())
            .description("Upgrade")
            .arg(["upgrade"])
        ).terminated_eventually().ensure_success();
    });

for name in parts {
    app.deployment(name).after([readiness, upgrade]);
}
// The frontends keep serving the previous release until the upgrade succeeds.
for name in frontends {
    app.deployment(name).after(upgrade);
}

// spec: SDDEF#ingress
let https_hosts = [];
for origin in origins {
    if origin != () && origin.scheme == "https" { https_hosts.push(origin.host); }
}
app.gate("certificates")
    .key(https_hosts)
    .run(|rt| { rt.warm_certs(app).ready(); });
