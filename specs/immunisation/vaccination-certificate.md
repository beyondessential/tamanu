---
id: VACC_CERT
---

# Vaccination certificate

Applies to the patient details shown on a vaccination certificate, and the setting controlling whether the birth certificate number is among them.

## Feature flag: display birth certificate number

- Global-level feature flag available under the 'Vaccinations' settings category
- Flag titled 'Display birth certificate number'
- Flag is disabled by default
- When disabled, the birth certificate number field is not shown on the vaccination certificate
- When enabled, the birth certificate number field is shown on the vaccination certificate

## Display birth certificate number enabled behaviour

- Vaccination certificate displays the patient's birth certificate number when it has been recorded in patient details
- Birth certificate number appears in the patient details section of the certificate
- The field is empty if the birth certificate number has not been recorded for the patient
- Display of the field is controlled by the 'Display birth certificate number' feature flag
