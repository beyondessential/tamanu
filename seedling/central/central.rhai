// Tamanu central server.
// spec: SDDEF, SDUPG

app.description(`
Tamanu central server: where all the data lives, and the core of the Tamanu system.
`);
app.canopy_type("tamanu-central");

let portal_url = app.param("patient-portal-url")
    .required(false)
    .description("URL the patient portal is reached at; setting it runs the patient portal")
    .validate(|v, all| { parse_origin.call(v); });
let portal = if portal_url.is_set() { parse_origin.call(portal_url.value()) } else { () };

let origins = [canonical, portal];
