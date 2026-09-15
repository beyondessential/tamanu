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
