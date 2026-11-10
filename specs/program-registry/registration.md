---
id: PRREG
---

# Program registration

Registering a patient to a program registry, and the related conditions recorded at registration.

## Related conditions

- [ ] A related condition row with a condition selected requires a category
- [ ] Each condition can be selected once per registration

## Mandatory related condition

- [ ] `mandatoryConditionEnabled` on the program import's Registry sheet makes a related condition required; it defaults to false and is included in the export
- [ ] `mandatoryConditionEnabled` can be changed on the admin panel's Edit program registry metadata screen
- [ ] When required, registration on desktop and mobile is blocked until at least one related condition has a category, with a required message on the field
- [ ] The related condition field is marked required (the first row on desktop)
- [ ] On desktop, Confirm is disabled until the selected registry's configuration has loaded
