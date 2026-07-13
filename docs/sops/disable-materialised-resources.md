# SOP: Disable materialised FHIR resources (dev-OTS)

Stop specific FHIR resource types being materialised — for example to shed load
from a resource an integration does not need, or to turn off materialisation a
deployment is not using. This is a **central config/settings change** that
changes integration behaviour, so it is **[dev-OTS]**.

Read `../ruled-out-actions.md` first. Turning materialisation off for a resource
an integration *does* rely on will silently break that integration.

## What controls materialisation

Three layers, all on central:

- `integrations.fhir.enabled` — the FHIR HTTP routes (config;
  `packages/central-server/config/default.json5`).
- `integrations.fhir.worker.enabled` — the materialisation worker (same config).
- `fhir.worker.resourceMaterialisationEnabled.<Resource>` — the per-resource
  toggle (setting; confirmed in
  `packages/settings/src/schema/definitions/fhir.ts`; older on-call notes
  shorthand this as `resourceMaterialisationEnabled.<Resource>`).

## Turn a resource off

Set the resource's flag to `false`. The per-resource map looks like:

```json5
"resourceMaterialisationEnabled": {
  "Patient": true,
  "Encounter": false,
  "Immunization": false,
  "MediciReport": false,
  "Organization": false,
  "Practitioner": false,
  "ServiceRequest": false,
  "Specimen": false
}
```

`ServiceRequest` is the lab/imaging resource — do **not** disable it on a
deployment running SENAITE or RIS/PACS.

## Apply and reverse

- After changing config, restart so it takes effect
  (`bestool tamanu start` / `../sops/restart-services.md`). **[dev-OTS]**
- Reversing is setting the flag back to `true` and restarting. Track what you
  changed.

For enabling FHIR when it should be on (the `fhir_config` check firing), see
`../runbooks/fhir-queue-backlog.md`.
