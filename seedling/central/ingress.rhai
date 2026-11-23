// spec: SDDEF#ingress
// Seedling's proxy connects to the parts from the host's IPv6 unique local
// prefix.
const TRUSTED_PROXIES = "fc00::/7";

let declare_ingress = |svc, origin| {
    let ingress = svc.ingress(origin.host, origin.port);
    if origin.scheme == "https" {
        ingress.tls(Terminate.Https, Output.Http1).redirect();
    }
};

let public_svc = app.service("public").exported().http(80);
if canonical != () { declare_ingress.call(public_svc, canonical); }

let portal_svc = if portal != () {
    let svc = app.service("portal").exported().http(80);
    declare_ingress.call(svc, portal);
    svc
} else {
    ()
};
