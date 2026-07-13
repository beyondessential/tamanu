# Reference: glossary

Terms that come up across the support pack.

## Integrations

- **RIS/PACS** — Radiology Information System / Picture Archiving and
  Communication System. An integrated medical imaging solution: the RIS manages
  patient imaging data (scheduling, billing, reports) and PACS stores and serves
  the digital images. Tamanu sends imaging requests out to a RIS/PACS provider
  (Aspen uses one) and reads results back. Any country imaging integration is
  broadly similar.

- **SENAITE** — an open-source Laboratory Information Management System (LIMS)
  integrated with Tamanu for lab requests. The integration is **pull-based**: lab
  requests created in Tamanu sync to central, are materialised into FHIR, and
  SENAITE periodically polls Tamanu's FHIR API for them, processes the tests, and
  posts results back. Tamanu then updates the lab request status and attaches
  results. See `runbooks/senaite-integration-delay.md`.

## FHIR

- **FHIR** — Fast Healthcare Interoperability Resources, the HL7 standard Tamanu
  exposes to integrations. Tamanu's own records are converted into FHIR resources
  (Patient, Encounter, ServiceRequest, Specimen, etc.).

- **FHIR materialisation** — the process of building (and keeping up to date) a
  FHIR resource row from its upstream Tamanu record. A lab request or imaging
  request materialises into a `fhir.service_requests` row, linked back by
  `upstream_id`. Materialisation is done by the **FHIR worker**; a materialised
  row also needs to be **resolved** (its references to other resources filled in
  with FHIR identifiers) before it is fully usable. Controlled by the config keys
  `integrations.fhir.enabled` (HTTP routes) and `integrations.fhir.worker.enabled`
  (worker), plus the per-resource setting
  `fhir.worker.resourceMaterialisationEnabled.ServiceRequest`.

- **ServiceRequest** — the FHIR resource that represents a lab or imaging request.
  It is what SENAITE and RIS/PACS actually read from Tamanu.

## Fleet / ops

- **Canopy** — the fleet-management system. Holds servers, groups, versions,
  health checks, backups and incidents, and per-deployment free-text notes.
  Read-only from the support MCP. See `../deployment-context.md`.

- **bestool** — the operator CLI on Tamanu hosts. See
  `bestool-commands.md`.

- **Central / facility** — Tamanu's topology: facility servers (and mobile
  devices) sync up to a central server. Integrations like SENAITE and RIS/PACS
  talk to central.
