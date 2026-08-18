# Test Cases: Birth Certificate Number on Vaccine Certificate

## Feature Flag Disabled (Default State)

- [ ] With feature flag disabled, birth certificate number field does not appear on vaccination certificate
- [ ] Vaccination certificate renders without errors when birth certificate number is not displayed
- [ ] All other patient details display correctly when feature flag is disabled

## Feature Flag Enabled

- [ ] Feature flag can be enabled in Vaccinations settings
- [ ] With feature flag enabled, birth certificate number field appears on vaccination certificate
- [ ] Birth certificate field appears in the patient details section of the certificate

## Birth Certificate Number Display

- [ ] Birth certificate number displays correctly when recorded in patient additional data (verifies spec: VACC_CERT)
- [ ] Field displays as empty/blank when birth certificate has not been recorded for the patient (verifies spec: VACC_CERT)
- [ ] Birth certificate number from patient additional data is correctly mapped to vaccine certificate
- [ ] Certificate renders without errors when birth certificate field is empty

## Settings Category Rename

- [ ] Settings category displays as "Vaccinations" instead of "Upcoming vaccinations" (verifies spec: VACC_CERT)
- [ ] All existing settings under Vaccinations category remain functional (age limit, thresholds)
- [ ] Feature flag setting appears under Vaccinations category with correct name and description

## Certificate Generation

- [ ] Vaccination certificate generates successfully via UI modal when feature flag is enabled
- [ ] Vaccination certificate generates successfully via backend script when feature flag is enabled
- [ ] PDF structure is valid and opens correctly in PDF viewers
- [ ] Certificate is printable without layout issues

## Multi-Language Support

- [ ] Birth certificate field label translates correctly in supported languages
- [ ] PDF renders correctly with translated labels

## Edge Cases

- [ ] Certificate renders correctly when patient record exists but has no additional data record
- [ ] Certificate renders correctly with special characters or unusual formatting in birth certificate number
- [ ] Feature flag toggle (enable/disable) immediately affects newly generated certificates
- [ ] Toggling feature flag does not affect previously generated certificates
