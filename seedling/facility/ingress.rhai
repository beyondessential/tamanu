// spec: SDDEF#ingress
// Seedling's proxy connects to the parts from the host's IPv6 unique local
// prefix.
const TRUSTED_PROXIES = "fc00::/7";

let public_svc = app.service("public").exported().http(80);
if canonical != () {
    let ingress = public_svc.ingress(canonical.host, canonical.port);
    if canonical.scheme == "https" {
        ingress.tls(Terminate.Https, Output.Http1).redirect();
    }
}
