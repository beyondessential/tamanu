// Tamanu facility server.
// spec: SDDEF, SDUPG

app.description(`
Tamanu facility server: serves a facility's staff, and syncs with its central server.
`);
app.canopy_type("tamanu-facility");

let origins = [canonical];
