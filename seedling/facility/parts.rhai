let configure_server = |c| {
    c.image(image.call("facility"))
        .env("TZ", timezone.value())
        .env("DATABASE_URL", database_url.value())
        .env("CRYPTO_KEY", crypto_key.value())
        .env("AUTH_SECRET", auth_secret.value())
        .env("AUTH_REFRESH_TOKEN_SECRET", refresh_secret.value())
        .env("PROXY_TRUSTED", TRUSTED_PROXIES)
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
    .description("Sync")
    .scale(1)
    .on_update(OnUpdate.Replace)
    .arg(["startSync"])
    .tcp(3000, sync_http.port(3004));

configure_server.call(app.deployment("tasks"))
    .description("Tasks")
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
