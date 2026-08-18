---
id: VACC_CERT
---

# Vaccination Certificate

Vaccination certificates with configurable fields and feature flags.

## Birth Certificate Number

- [ ] Vaccination certificate displays the patient's birth certificate number when it has been recorded in patient details
- [ ] Birth certificate number appears in the patient details section of the certificate
- [ ] Field displays as empty/not shown if the birth certificate number has not been recorded for the patient
- [ ] Display of the field is controlled by the 'Display birth certificate number' feature flag

## Feature Flag: Display Birth Certificate Number

- [ ] Global-level feature flag available under the 'Vaccinations' settings category
- [ ] Flag titled 'Display birth certificate number'
- [ ] Flag is disabled by default
- [ ] When disabled, the birth certificate number field is not shown on the vaccination certificate
- [ ] When enabled, the birth certificate number field is shown on the vaccination certificate

## Settings Category Rename

- [ ] Settings category 'Upcoming vaccinations' is renamed to 'Vaccinations'
- [ ] All settings previously under 'Upcoming vaccinations' remain functional under the new category name
- [ ] Category contains settings related to vaccinations, including thresholds and age limits
