---
id: SYND
---

# Syndromic surveillance

Syndromic surveillance tracks which symptoms a practitioner observes a patient presenting, independent of formal diagnosis, so a deployment can watch for patterns across its patient population. A practitioner records the symptoms that apply during an encounter, or records that none apply, and can revise that record up to discharge.

## Syndromic surveillance symptoms reference data

The symptoms a practitioner can select from are reference data, configurable per deployment through the standard reference data import.

Every deployment has one system-required symptom with id `syndromicsurveillancesymptoms-noSyndrome`, representing that the patient was assessed and no symptom applies. This item cannot be removed by a deployment's reference data import. Its name is editable per deployment and defaults to "No syndrome".

Presenting the list of symptoms to a practitioner:

- The "no syndrome" item always appears first, separated from the other symptoms by a divider.
- Every other symptom appears below the divider, in alphabetical order by name.

The alphabetical ordering is produced by the server, not the client: the endpoint that lists syndromic surveillance symptoms returns them already in this order (the "no syndrome" item first, the rest alphabetically after it), so any client rendering the list does not need to sort it.

## Recording syndromic surveillance for an encounter

A practitioner records syndromic surveillance from the encounter's diagnosis pane, or from the discharge form when discharging the encounter. Both surfaces read and write the same record for the encounter, so recording it during discharge is equivalent to recording it beforehand from the diagnosis pane.

Recording syndromic surveillance means selecting either the "no syndrome" symptom or one or more other symptoms — never both at once. Selecting "no syndrome" clears any other selected symptoms, and selecting a symptom clears "no syndrome". A request to record both is rejected.

The encounter's syndromic surveillance record can be revised at any time up to and including discharge. Revising it replaces which symptoms are recorded as ticked; it does not affect whether the encounter has a record at all — once syndromic surveillance has been recorded for an encounter, it stays recorded even if every symptom is later unticked and replaced with a different selection.

## Permissions

Recording or editing syndromic surveillance requires one of two permissions, depending on whether the encounter already has a record:

- Creating a first record for an encounter requires the create permission.
- Editing an already-recorded entry requires the write permission.

Either permission alone, or the read permission on its own, is enough to view what has been recorded. A user with only the read permission cannot open the recording form to make changes.

When syndromic surveillance is submitted as part of discharging an encounter, it is covered by the permission to discharge that encounter, rather than requiring the create or write syndromic surveillance permission directly.
