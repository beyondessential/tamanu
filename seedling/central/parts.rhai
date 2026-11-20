let configure_server = |c| {
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
    if canonical_url.is_set() {
        c.env("CANONICAL_HOST_NAME", canonical_url.value());
    }
    if portal_url.is_set() {
        c.env("PATIENT_PORTAL_URL", portal_url.value());
    }
    c
};

let api_max_replicas = if AVAILABLE_THREADS / 2 < 1 { 1 } else { AVAILABLE_THREADS / 2 };

configure_server.call(app.deployment("api"))
    .description("API")
    .scale(1..=api_max_replicas)
    .arg(["startApi"])
    .tcp(3000, api_http.port(3001));

configure_server.call(app.deployment("tasks"))
    .description("Background tasks")
    .on_update(OnUpdate.Replace)
    .arg(["startTasks"]);

configure_server.call(app.deployment("fhir-refresh"))
    .description("FHIR materialisation worker")
    .on_update(OnUpdate.Replace)
    .arg(["startFhirWorker", "--topics=fhir.refresh.allFromUpstream,fhir.refresh.entireResource,fhir.refresh.fromUpstream"]);

configure_server.call(app.deployment("fhir-resolve"))
    .description("FHIR reference resolver")
    .on_update(OnUpdate.Replace)
    .arg(["startFhirWorker", "--topics=fhir.resolver"]);

app.deployment("frontend")
    .description("Web app")
    .image(image.call("frontend"))
    .scale(1)
    .tcp(3000, frontend_http.port(3002));

let parts = ["api", "tasks", "fhir-refresh", "fhir-resolve", "frontend"];

if portal != () {
    app.deployment("patient-portal")
        .description("Patient portal")
        .image(image.call("patient-portal"))
        .scale(1)
        .tcp(3000, portal_http.port(3003));
    parts.push("patient-portal");
}
