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
| 1 | [Deploying Tamanu](deploying-tamanu/) | Not written yet |
| 2 | [Users](users/) | Not written yet |
| 3 | [Patients](patients/) | Not written yet |
| 4 | [Clinician Dashboard](clinician-dashboard/) | Not written yet |
| 5 | [Scheduling](scheduling/) | Not written yet |
| 6 | [Programs](programs/) | Not written yet |
| 7 | [Immunisations](immunisations/) | Not written yet |
| 8 | [Encounters](encounters/) | Not written yet |
| 9 | [Diagnoses](diagnoses/) | Not written yet |
| 10 | [Vitals](vitals/) | Not written yet |
| 11 | [Charts](charts/) | Not written yet |
| 12 | [Notes](notes/) | Not written yet |
| 13 | [Forms](forms/) | Not written yet |
| 14 | [Tasks](tasks/) | Not written yet |
| 15 | [Medications](medications/) | 15.1 [Reference data](medications/reference-data.md) &middot; 15.2 [Settings](medications/settings.md) &middot; 15.3 [Permissions](medications/permissions.md) |
| 16 | [Dispensing](dispensing/) | Not written yet |
| 17 | [Procedures](procedures/) | Not written yet |
| 18 | [Labs](labs/) | Not written yet |
| 19 | [Imaging](imaging/) | Not written yet |
| 20 | [Referrals](referrals/) | Not written yet |
| 21 | [Documents](documents/) | Not written yet |
| 22 | [Invoicing](invoicing/) | Not written yet |
| 23 | [Reports](reports/) | Not written yet |
| 24 | [Integrations](integrations/) | Not written yet |

Numbers are for reference and ordering only. They are not part of folder or file names, so a guide can
be renumbered without breaking any link.

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
modules after it. Renumbering means editing the rows in the table above and the `# n. Module` heading
in each affected module README. Nothing on disk is renamed, because the numbers are not part of folder
or file names.
