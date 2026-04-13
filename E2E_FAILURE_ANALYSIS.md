# E2E Test Failure Analysis - PR #9520

## Summary

The E2E tests are failing across multiple shards with two distinct patterns of failures:

1. **Patient Care Plan Tests (Shard 3/4)**: 14 tests failing with timeout errors
2. **Vaccine Tests (Shard 4/4)**: 15 tests failing with assertion errors

---

## Issue 1: Care Plan Modal Timeout Failures (Shard 3/4)

### Affected Tests
All tests in `tests/patients/patientSideBar.spec.ts` related to:
- Adding ongoing conditions
- Adding/editing allergies
- Adding/editing family history
- Adding/editing/deleting care plans

### Root Cause
**Timeout waiting for care plan dropdown element**

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByTestId('field-uc7w-input').getByRole('textbox', { name: 'Search...' })
```

**Location**: `packages/e2e-tests/pages/patients/PatientDetailsPage/modals/CarePlanModal.ts:71`

```typescript
async fillOutCarePlan(carePlanName: string, carePlanDetails: string) {
  await this.carePlanDropdown.fill(carePlanName);  // <-- TIMING OUT HERE
  await this.page.getByRole('menuitem', { name: carePlanName }).click();
  // ...
}
```

### Analysis
The test is unable to find the dropdown element with test ID `field-uc7w-input` containing a textbox with accessible name "Search...". This suggests:

1. **Element not rendering**: The dropdown may not be appearing in the DOM
2. **Timing issue**: The modal may not be fully loaded before the test attempts to interact
3. **Test data issue**: Required reference data (conditions, care plans, etc.) may not be seeded
4. **UI change**: The component structure may have changed (test ID or role changed)

### Suggested Fixes

#### Fix 1: Add explicit wait for modal to be ready
```typescript
async fillOutCarePlan(carePlanName: string, carePlanDetails: string) {
  // Wait for the dropdown to be visible and enabled
  await this.carePlanDropdown.waitFor({ state: 'visible', timeout: 10000 });
  await this.carePlanDropdown.fill(carePlanName);
  await this.page.getByRole('menuitem', { name: carePlanName }).click();
  await this.carePlanClinicianDropdown.fill('Initial Admin');
  await this.page.getByRole('menuitem', { name: 'Initial Admin' }).click();
  await this.mainCarePlanFieldDetails.fill(carePlanDetails);
  await this.getAddCarePlanButton().click();
  await this.page.waitForLoadState('networkidle');
}
```

#### Fix 2: Verify test data seeding
Check that the following reference data is properly seeded:
- ICD10 codes for conditions
- Allergy reference data
- Family history reference data
- Care plan templates
- Clinician data (especially "Initial Admin" user)

#### Fix 3: Add debugging to identify the issue
```typescript
async fillOutCarePlan(carePlanName: string, carePlanDetails: string) {
  // Debug: Check if modal is visible
  const modalVisible = await this.page.locator('[role="dialog"]').isVisible();
  console.log('Modal visible:', modalVisible);
  
  // Debug: Check if dropdown exists
  const dropdownExists = await this.carePlanDropdown.count();
  console.log('Dropdown count:', dropdownExists);
  
  // Wait with better error message
  await this.carePlanDropdown.waitFor({ 
    state: 'visible', 
    timeout: 10000 
  }).catch(err => {
    throw new Error(`Care plan dropdown not found. Modal visible: ${modalVisible}, Dropdown count: ${dropdownExists}`);
  });
  
  await this.carePlanDropdown.fill(carePlanName);
  // ... rest of the method
}
```

---

## Issue 2: Vaccine Record Count Assertion Failures (Shard 4/4)

### Affected Tests
Multiple vaccine tests failing with the same pattern:
- Adding vaccines (routine, catchup, campaign, other)
- Recording vaccines with different statuses
- Recording vaccines given elsewhere
- Scheduled vaccine tests

### Root Cause
**Vaccine not being saved/counted correctly**

```
Error: expect(received).toBe(expected) // Object.is equality
Expected: 1
Received: 0
```

**Location**: `packages/e2e-tests/utils/vaccineTestHelpers.ts:83`

```typescript
await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.waitForModalToClose();

expect(await patientDetailsPage.patientVaccinePane?.getRecordedVaccineCount()).toBe(count);
// Expected count to be 1, but got 0
```

### Analysis
The vaccine is being recorded through the modal, but when the test checks the recorded vaccine count, it finds 0 instead of the expected count. This suggests:

1. **Save operation failing silently**: The vaccine record may not be persisting to the database
2. **Timing issue**: The UI may not have updated before the assertion runs
3. **Query issue**: The count query may not be finding the newly created record
4. **Transaction rollback**: Database transaction may be rolling back
5. **Modal not actually closing**: The `waitForModalToClose()` may be returning before the save completes

### Suggested Fixes

#### Fix 1: Add explicit wait for vaccine to appear in the list
```typescript
export async function addVaccineAndAssert(
  patientDetailsPage: PatientDetailsPage,
  count: number,
  // ... other params
) {
  // ... existing code to fill and submit form ...
  
  await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.waitForModalToClose();
  
  // Wait for the vaccine count to update
  await patientDetailsPage.page.waitForFunction(
    async (expectedCount) => {
      const actualCount = await patientDetailsPage.patientVaccinePane?.getRecordedVaccineCount();
      return actualCount === expectedCount;
    },
    count,
    { timeout: 5000 }
  ).catch(() => {
    // If timeout, continue with assertion to get proper error message
  });
  
  expect(await patientDetailsPage.patientVaccinePane?.getRecordedVaccineCount()).toBe(count);
  
  // ... rest of the function
}
```

#### Fix 2: Add network idle wait after modal closes
```typescript
await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.waitForModalToClose();

// Wait for any pending network requests to complete
await patientDetailsPage.page.waitForLoadState('networkidle', { timeout: 5000 });

expect(await patientDetailsPage.patientVaccinePane?.getRecordedVaccineCount()).toBe(count);
```

#### Fix 3: Verify the save operation completed successfully
```typescript
// In the RecordVaccineModal class, after clicking save:
async submitVaccine() {
  const responsePromise = this.page.waitForResponse(
    response => response.url().includes('/api/administeredVaccine') && response.status() === 200,
    { timeout: 10000 }
  );
  
  await this.getSaveButton().click();
  
  // Wait for the API response
  const response = await responsePromise;
  const responseData = await response.json();
  
  if (!responseData || !responseData.id) {
    throw new Error('Vaccine save failed - no ID returned');
  }
  
  await this.waitForModalToClose();
}
```

#### Fix 4: Check scheduled vaccine data seeding
Ensure that scheduled vaccine configuration is properly seeded:
- Vaccine schedules
- Vaccine categories (Routine, Catchup, Campaign, Other)
- Vaccine reference data
- Age-based scheduling rules

---

## Recommended Action Plan

### Immediate Actions (Priority 1)

1. **Add explicit waits** in `CarePlanModal.fillOutCarePlan()` method
2. **Add network idle waits** after vaccine modal closes
3. **Verify test data seeding** - check that all reference data is present

### Investigation Actions (Priority 2)

4. **Run tests locally** to reproduce the issue and get more detailed logs
5. **Add debug logging** to identify exactly where the failures occur
6. **Check for recent UI changes** that might have affected test selectors

### Long-term Improvements (Priority 3)

7. **Increase test timeouts** for flaky tests (currently 30s)
8. **Add retry logic** for network-dependent assertions
9. **Improve test data fixtures** to ensure consistency
10. **Add API response validation** in test helpers

---

## Test Files to Modify

1. `packages/e2e-tests/pages/patients/PatientDetailsPage/modals/CarePlanModal.ts`
   - Add waits in `fillOutCarePlan()` method
   
2. `packages/e2e-tests/utils/vaccineTestHelpers.ts`
   - Add waits in `addVaccineAndAssert()` function
   
3. `packages/e2e-tests/pages/patients/PatientDetailsPage/modals/RecordVaccineModal.ts`
   - Add response validation in submit method

---

## Notes

- Both failure patterns suggest **timing/synchronization issues** rather than functional bugs
- The tests are **flaky** (23 flaky tests in shard 4/4) which reinforces timing hypothesis
- The dummy commit in this PR should not affect test behavior
- These failures may be **pre-existing** and not related to this PR's changes

---

## Next Steps

1. Remove the dummy commit that was added to create this PR
2. Implement the suggested fixes for timing issues
3. Re-run the E2E tests to verify fixes
4. If issues persist, add more detailed logging to identify root cause
