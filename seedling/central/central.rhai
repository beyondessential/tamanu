// Tamanu central server.
// spec: SDDEF, SDUPG

app.description("Tamanu central server");
app.canopy_type("tamanu-central");

let portal_url = app.param("patient-portal-url")
    .required(false)
    .description("Patient portal URL")
    .validate(|v, all| { parse_origin.call(v); });
let portal = if portal_url.is_set() { parse_origin.call(portal_url.value()) } else { () };

let origins = [canonical, portal];
