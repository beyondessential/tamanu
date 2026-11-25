// Tamanu central server.
// spec: SDDEF, SDUPG

app.description("Tamanu central server");
app.canopy_type("tamanu-central");

let portal_url = app.param("patient-portal-url")
    .kind("url-origin")
    .required(false)
    .description("Patient portal URL; setting it enables the patient portal");
let portal = if portal_url.is_set() { portal_url.parsed() } else { () };

let origins = [canonical, portal];
