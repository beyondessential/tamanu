## patient_facilities

Tracks which patients are of interest to which facilities.

This is used to refine sync data: only patient data related to these patients is synced to a
facility (plus general data, and some exceptions apply like vaccine data under some conditions).

In Tamanu, this can be set manually on the facility server (via the "mark for sync" button), or
centrally (via some labs / vaccine programs, or via bulk-imports).

_("Joe Patient attends X Clinic" is clinical info; even though an entry in patient facilities
doesn't necessarily imply this, it often does.)_

## facility_id

Reference to the `facility`.

## patient_id

Reference to the `patient`.

