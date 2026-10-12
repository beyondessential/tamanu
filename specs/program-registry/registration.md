---
id: PRREG
---

# Program registration

Registering a patient to a program registry, and the related conditions recorded at registration.

## Related conditions

- [ ] Each related condition recorded at registration has a category
- [ ] The category field is required on any related condition row that has a condition selected
- [ ] Each condition can be selected once per registration

## Mandatory related condition

- [ ] A program registry can be configured to require a related condition, using `mandatoryConditionEnabled` on the Registry sheet of the program import
- [ ] `mandatoryConditionEnabled` defaults to false when the Registry sheet omits it
- [ ] The setting is included when the program is exported
- [ ] When the registry requires a related condition, registering a patient needs at least one related condition with a category, on desktop and mobile
- [ ] On desktop, the first related condition field is marked required
- [ ] On mobile, the related conditions field is marked required
- [ ] Submitting without a related condition shows a required message on the related condition field and the registration is not saved
- [ ] On desktop, the registration cannot be confirmed until the selected registry's configuration has loaded
- [ ] The requirement is checked when a patient is registered
