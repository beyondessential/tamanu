# Configuration guides

For system administrators and project managers setting up a Tamanu deployment. Each module has three
guides, covering its reference data, settings and permissions.

Guides assume a basic understanding of Tamanu and digital systems. They do not assume clinical or
developer knowledge.

## Modules

Each module has a folder here and a number. Modules are ordered to follow the way a deployment is set
up and used, starting with deployment and users and moving through the clinical workflow, rather than
alphabetically.

A module's configuration is documented in three guides, numbered within the module: **reference data**,
**settings**, and **permissions**. So Medications is module 15, and its settings guide is 15.2.

Modules without a guide yet are listed so the shape of the documentation is visible and it is clear
what is still to be written.

| # | Module | Guides |
| --- | --- | --- |
| 1 | [Deploying Tamanu](01-deploying-tamanu/) | Not written yet |
| 2 | [Users](02-users/) | Not written yet |
| 3 | [Patients](03-patients/) | Not written yet |
| 4 | [Clinician Dashboard](04-clinician-dashboard/) | Not written yet |
| 5 | [Scheduling](05-scheduling/) | Not written yet |
| 6 | [Programs](06-programs/) | Not written yet |
| 7 | [Immunisations](07-immunisations/) | Not written yet |
| 8 | [Encounters](08-encounters/) | Not written yet |
| 9 | [Diagnoses](09-diagnoses/) | Not written yet |
| 10 | [Vitals](10-vitals/) | Not written yet |
| 11 | [Charts](11-charts/) | Not written yet |
| 12 | [Notes](12-notes/) | Not written yet |
| 13 | [Forms](13-forms/) | Not written yet |
| 14 | [Tasks](14-tasks/) | Not written yet |
| 15 | [Medications](15-medications/) | 15.1 [Reference data](15-medications/1-reference-data.md) &middot; 15.2 [Settings](15-medications/2-settings.md) &middot; 15.3 [Permissions](15-medications/3-permissions.md) |
| 16 | [Dispensing](16-dispensing/) | Not written yet |
| 17 | [Procedures](17-procedures/) | Not written yet |
| 18 | [Labs](18-labs/) | Not written yet |
| 19 | [Imaging](19-imaging/) | Not written yet |
| 20 | [Referrals](20-referrals/) | Not written yet |
| 21 | [Documents](21-documents/) | Not written yet |
| 22 | [Invoicing](22-invoicing/) | Not written yet |
| 23 | [Reports](23-reports/) | Not written yet |
| 24 | [Integrations](24-integrations/) | Not written yet |

Each number is part of its folder or file name, as in `15-medications/2-settings.md`, so the file tree
shows the order.

## About these guides

Guides are authored from the Tamanu codebase, so the reference data columns, settings and permissions
they describe match what the software does. The format they follow is defined in
`.agents/docs/config-guide-format.md`.

Features that are unavailable in older deployments carry a note stating the version they are supported
from. Check your deployment's version before relying on them.

## Adding a guide

Guides are written by the `draft-config-guide` skill, which reads the module's reference data, settings
and permissions out of the codebase and drafts the guide against the format above. Where a module is
not yet listed, add its folder and README at the point in the order where it belongs, and renumber the
modules after it. Renumbering a module means renaming its folder, updating its row in the table above
and the `# n. Module` heading in its README, and updating every link to it.
