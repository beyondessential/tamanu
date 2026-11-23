let configure = |c| {
    c.image(image.call("central"))
        .env("TZ", timezone.value())
        .env("DATABASE_URL", database_url.value())
        .env("CRYPTO_KEY", crypto_key.value())
        .env("AUTH_SECRET", auth_secret.value())
        .env("AUTH_REFRESH_TOKEN_SECRET", refresh_secret.value())
        .env("PROXY_TRUSTED", TRUSTED_PROXIES)
        .env("PORT", "3000")
        .env("DISK_PATH", "/")
        .env("LOG_CONSOLE_LEVEL", "http")
        .env("MIGRATE_ON_STARTUP", "false");
    if database_socket != () {
        c.mount(database_socket, database_socket_volume);
    }
    if canonical_url.is_set() {
        c.env("CANONICAL_HOST_NAME", canonical_url.value());
    }
    if portal_url.is_set() {
        c.env("PATIENT_PORTAL_URL", portal_url.value());
    }
    c
};

let api_max_replicas = if AVAILABLE_THREADS / 2 < 1 { 1 } else { AVAILABLE_THREADS / 2 };

configure.call(app.deployment("api"))
    .scale(1..=api_max_replicas)
    .arg(["startApi"])
    .http(3000, public_svc.route("/api"))
    .http(3000, public_svc.route("/v1"));

configure.call(app.deployment("tasks"))
    .on_update(OnUpdate.Replace)
    .arg(["startTasks"]);

configure.call(app.deployment("fhir-refresh"))
    .on_update(OnUpdate.Replace)
    .arg(["startFhirWorker", "--topics=fhir.refresh.allFromUpstream,fhir.refresh.entireResource,fhir.refresh.fromUpstream"]);

configure.call(app.deployment("fhir-resolve"))
    .on_update(OnUpdate.Replace)
    .arg(["startFhirWorker", "--topics=fhir.resolver"]);

app.deployment("frontend")
    .image(frontend_image.call("frontend"))
    .scale(1)
    .http(3000, public_svc.route("/"));

let parts = ["api", "tasks", "fhir-refresh", "fhir-resolve"];
let frontends = ["frontend"];

// The portal's API paths reach the API through the portal's own hostname.
if portal != () {
    app.deployment("api").http(3000, portal_svc.route("/api"));
    app.deployment("patient-portal")
        .image(frontend_image.call("patient-portal"))
        .scale(1)
        .http(3000, portal_svc.route("/"));
    frontends.push("patient-portal");
}
