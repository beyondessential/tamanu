// spec: SDDEF#what-a-definition-runs
// Seedling's proxy and every pod connect from the host's IPv6 unique local
// prefix, and a service mount translates only the destination, so the parts
// see the supervisor's own address. Both hops are trusted by one range, as a
// CIDR the supervisor and Express both read.
const TRUSTED_PROXIES = "fc00::/7";

let public_svc = app.service("public").exported().http(80);
if canonical != () {
    let ingress = public_svc.ingress(canonical.host, canonical.port);
    if canonical.scheme == "https" {
        ingress.tls(Terminate.Https, Output.Http1).redirect();
    }
}

// The supervisor reaches the API at `localmount`, and the API reaches the sync
// part the same way.
let api_http = app.service("api-http");
let sync_http = app.service("sync-http");

// spec: SUPV#configuration
let supervisor = app.deployment("supervisor")
    .description("Supervisor")
    .image(image.call("frontend"))
    .scale(1)
    .arg(["supervisor"])
    .env("TAMANU_SUPERVISOR_ROLE", "facility")
    .env("TAMANU_SUPERVISOR_API_UPSTREAMS", "localmount:3001")
    .env("TAMANU_SUPERVISOR_TRUSTED_PROXIES", TRUSTED_PROXIES)
    .mount(api_http.port(3001))
    .http(8080, public_svc.route("/"));
