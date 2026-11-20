// Shared by every bundle in seedling/, as identical copies that
// scripts/check-seedling-bundles.mjs keeps in step.

// Gates are declared in the order Seedling runs them when several are due at
// once.

// spec: SDDEF#readiness-check
let readiness_check = configure.call(app.job("readiness-check"))
    .description("Readiness check")
    .arg(["checkReadiness"])
    .deadline(60);

let readiness = app.gate("readiness")
    .key([database_url.value(), crypto_key.value()])
    .check(readiness_check, #{ interval: 300 });

// spec: SDUPG#checking-the-migrations
let migrations_check = configure.call(app.job("migrations-check"))
    .description("Pending migrations check")
    .arg(["just-migrate", "list", "--pending", "--check"])
    .deadline(120);

// spec: SDUPG#the-upgrade
let upgrade = app.gate("upgrade")
    .key(version.value())
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
supervisor.after([readiness, upgrade]);
for name in parts {
    supervisor.after(app.deployment(name));
}

// spec: SDDEF#ingress
let https_hosts = [];
for origin in origins {
    if origin != () && origin.scheme == "https" { https_hosts.push(origin.host); }
}
app.gate("certificates")
    .key(https_hosts)
    .run(|rt| { rt.warm_certs(app).ready(); });
