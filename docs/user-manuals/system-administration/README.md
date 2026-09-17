# System Administration

Configuration guides for system administrators and project managers setting up a Tamanu deployment.
Each guide covers a module's reference data, settings and permissions.

Guides assume a basic understanding of Tamanu and digital systems. They do not assume clinical or
developer knowledge.

## Modules

Each module has a folder here. Modules without a guide yet are listed so the shape of the
documentation is visible and it is clear what is still to be written.

| Module | Guides |
| --- | --- |
| [Appointments](appointments/) | Not written yet |
| [Dispensing](dispensing/) | Not written yet |
| [Encounters](encounters/) | Not written yet |
| [FHIR](fhir/) | Not written yet |
| [Imaging](imaging/) | Not written yet |
| [Integrations](integrations/) | Not written yet |
| [Invoicing](invoicing/) | Not written yet |
| [Labs](labs/) | Not written yet |
| [Medications](medications/) | [Configuration guide](medications/configuration-guide.md) |
| [Patients](patients/) | Not written yet |
| [Permissions](permissions/) | Not written yet |
| [Program registry](program-registry/) | Not written yet |
| [Programs and surveys](programs/) | Not written yet |
| [Reference data](reference-data/) | Not written yet |
| [Referrals](referrals/) | Not written yet |
| [Reports](reports/) | Not written yet |
| [Sync](sync/) | Not written yet |
| [Tasking](tasking/) | Not written yet |
| [Users](users/) | Not written yet |
| [Vaccines](vaccines/) | Not written yet |
| [Vitals](vitals/) | Not written yet |

## About these guides

Guides are authored from the Tamanu codebase, so the reference data columns, settings and permissions
they describe match what the software does. The format they follow is defined in
`.agents/docs/config-guide-format.md`, and the principles behind them in
`llm/project-rules/write-config-guides.md`.

Features that are unavailable in older deployments carry a note stating the version they are supported
from. Check your deployment's version before relying on them.

## Adding a guide

Guides are written by the `draft-config-guide` skill, which reads the module's reference data, settings
and permissions out of the codebase and drafts the guide against the format above. Add a new module
folder and README alongside the others where a module is not yet listed.
