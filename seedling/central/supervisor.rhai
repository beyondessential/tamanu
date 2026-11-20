// spec: SDDEF#what-a-definition-runs
// Seedling's proxy and every pod connect from the host's IPv6 unique local
// prefix, and a service mount translates only the destination, so the parts
// see the supervisor's own address. Both hops are trusted by one range.
const TRUSTED_PROXIES = "uniquelocal";

let declare_ingress = |svc, origin| {
    let ingress = svc.ingress(origin.host, origin.port);
    if origin.scheme == "https" {
        ingress.tls(Terminate.Https, Output.Http1).redirect();
    }
};

let public_svc = app.service("public").exported().http(80);
if canonical != () { declare_ingress.call(public_svc, canonical); }

let portal_public_svc = if portal != () {
    let svc = app.service("portal-public").exported().http(80);
    declare_ingress.call(svc, portal);
    svc
} else { () };

// The supervisor reaches each part at `localmount`, on a port of its own.
let api_http = app.service("api-http");
let frontend_http = app.service("frontend-http");
let portal_http = app.service("portal-http");

let supervisor_state = app.volume("supervisor-state")
    .description("The supervisor's durable state");

let supervisor = app.deployment("supervisor")
    .description("Routes requests to the parts, and answers while they are upgrading")
    .image(image.call("supervisor"))
    .scale(1)
    .env("SUPERVISOR_LISTEN", ":8080")
    .env("SUPERVISOR_STATE_DIR", "/state")
    .env("SUPERVISOR_API_URL", "http://localmount:3001")
    .env("SUPERVISOR_WEB_URL", "http://localmount:3002")
    .env("PROXY_TRUSTED", TRUSTED_PROXIES)
    .env("DATABASE_URL", database_url.value())
    .env("CRYPTO_KEY", crypto_key.value())
    .mount("/state", supervisor_state)
    .mount(api_http.port(3001))
    .mount(frontend_http.port(3002))
    .http(8080, public_svc.route("/"));
if portal != () {
    supervisor
        .env("SUPERVISOR_PORTAL_URL", "http://localmount:3003")
        .mount(portal_http.port(3003))
        .http(8080, portal_public_svc.route("/"));
}
