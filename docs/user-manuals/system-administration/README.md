# System Administration

Configuration guides for system administrators and project managers setting up a Tamanu deployment.
Each guide covers a module's reference data, settings and permissions.

Guides assume a basic understanding of Tamanu and digital systems. They do not assume clinical or
developer knowledge.

## Modules

Each module has a folder here and a number. A module's guides are numbered within it, so the
Medications configuration guide is 9.1. Modules without a guide yet are listed so the shape of the
documentation is visible and it is clear what is still to be written.

| # | Module | Guides |
| --- | --- | --- |
| 1 | [Appointments](appointments/) | Not written yet |
| 2 | [Dispensing](dispensing/) | Not written yet |
| 3 | [Encounters](encounters/) | Not written yet |
| 4 | [FHIR](fhir/) | Not written yet |
| 5 | [Imaging](imaging/) | Not written yet |
| 6 | [Integrations](integrations/) | Not written yet |
| 7 | [Invoicing](invoicing/) | Not written yet |
| 8 | [Labs](labs/) | Not written yet |
| 9 | [Medications](medications/) | 9.1 [Configuration guide](medications/configuration-guide.md) |
| 10 | [Patients](patients/) | Not written yet |
| 11 | [Permissions](permissions/) | Not written yet |
| 12 | [Program registry](program-registry/) | Not written yet |
| 13 | [Programs and surveys](programs/) | Not written yet |
| 14 | [Reference data](reference-data/) | Not written yet |
| 15 | [Referrals](referrals/) | Not written yet |
| 16 | [Reports](reports/) | Not written yet |
| 17 | [Sync](sync/) | Not written yet |
| 18 | [Tasking](tasking/) | Not written yet |
| 19 | [Users](users/) | Not written yet |
| 20 | [Vaccines](vaccines/) | Not written yet |
| 21 | [Vitals](vitals/) | Not written yet |

Numbers are for reference and ordering only. They are not part of folder or file names, so a guide can
be renumbered without breaking any link.

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
folder and README alongside the others where a module is not yet listed, and give it the next number.
