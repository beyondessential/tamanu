# Manual Testing Notes - TAMOC-388: Location Hierarchy Sorting

## Issue Summary
Drop-down lists for Municipality and Village fields (and other location hierarchy fields) in Patient Details were not appearing alphabetically sorted.

## Fix Summary
The suggester service was skipping alphabetical sorting when fetching location hierarchy children. This has been fixed by ensuring the default alphabetical order is applied to all reference data suggester results, including hierarchy children.

## Prerequisites

### Environment Setup
1. Ensure you have a Tamanu server instance running with the fix deployed
2. Verify the `features.patientDetailsLocationHierarchy` setting is enabled
3. Ensure your database has location hierarchy reference data configured with:
   - Division
   - Subdivision  
   - Settlement
   - Village

### Test Data Requirements
To properly test this fix, you'll need reference data with:
- **At least 5-10 items at each hierarchy level** to clearly observe alphabetical ordering
- **Items with names starting with different letters** (e.g., "Alpha Village", "Beta Village", "Charlie Village", etc.)
- **Proper hierarchy relationships** (divisions contain subdivisions, subdivisions contain settlements, settlements contain villages)

## Test Scenarios

### Test 1: Verify Top-Level Location Hierarchy Field Sorting

**Steps:**
1. Navigate to the Patients page
2. Click "New Patient" or "Register Patient"
3. Scroll to the Location section in Patient Details
4. Click on the first location hierarchy field (typically "Division")
5. Open the dropdown list

**Expected Result:**
- The dropdown list should display all available divisions in alphabetical order (A-Z)
- Case should not affect ordering (e.g., "alpha" should appear before "Beta")

**Pass Criteria:**
- ✅ Items are sorted alphabetically
- ✅ No apparent ordering by ID, creation date, or other criteria

---

### Test 2: Verify Second-Level Location Hierarchy Field Sorting

**Steps:**
1. From Test 1, select any Division from the dropdown
2. Observe that the next field (typically "Sub division" or "Municipality") becomes enabled
3. Click on the second location hierarchy field
4. Open the dropdown list

**Expected Result:**
- The dropdown should show only subdivisions/municipalities that belong to the selected division
- These items should be sorted alphabetically (A-Z)

**Pass Criteria:**
- ✅ Only relevant children for the selected parent are shown
- ✅ Children are sorted alphabetically
- ✅ No items from other divisions appear in the list

---

### Test 3: Verify Third-Level Location Hierarchy Field Sorting

**Steps:**
1. From Test 2, select any Subdivision from the dropdown
2. Observe that the next field (typically "Settlement") becomes enabled
3. Click on the third location hierarchy field
4. Open the dropdown list

**Expected Result:**
- The dropdown should show only settlements that belong to the selected subdivision
- These items should be sorted alphabetically (A-Z)

**Pass Criteria:**
- ✅ Only relevant children for the selected parent are shown
- ✅ Children are sorted alphabetically

---

### Test 4: Verify Fourth-Level (Village) Location Hierarchy Field Sorting

**Steps:**
1. From Test 3, select any Settlement from the dropdown
2. Observe that the next field ("Village") becomes enabled
3. Click on the Village field
4. Open the dropdown list

**Expected Result:**
- The dropdown should show only villages that belong to the selected settlement
- These items should be sorted alphabetically (A-Z)

**Pass Criteria:**
- ✅ Only relevant children for the selected parent are shown
- ✅ Villages are sorted alphabetically
- ✅ This addresses the specific issue mentioned in the bug report

---

### Test 5: Verify Sorting with Search/Filter

**Steps:**
1. Navigate to any location hierarchy field
2. Type a partial search term (e.g., "Mun" to search for municipalities)
3. Observe the filtered results

**Expected Result:**
- Filtered results should still appear in alphabetical order
- Items matching the search should prioritize matches at the start of the name, but within those groups, maintain alphabetical order

**Pass Criteria:**
- ✅ Search results are alphabetically ordered
- ✅ Search functionality still works as expected

---

### Test 6: Verify Sorting Persists After Parent Change

**Steps:**
1. Select a Division
2. Select a Subdivision
3. Note the alphabetical order of Settlements
4. Change the Division to a different one
5. Select a different Subdivision
6. Check the Settlements dropdown again

**Expected Result:**
- After changing the parent, the new child list should also be alphabetically sorted
- Field values should clear appropriately when parent changes

**Pass Criteria:**
- ✅ Alphabetical sorting is maintained after parent changes
- ✅ No caching issues causing incorrect sort order

---

### Test 7: Verify Sorting in Edit Patient Mode

**Steps:**
1. Navigate to an existing patient record
2. Click "Edit" on the patient details
3. Clear one of the location hierarchy fields
4. Re-open the dropdown for that field

**Expected Result:**
- Dropdown should show alphabetically sorted options
- Pre-filled values should remain until explicitly changed

**Pass Criteria:**
- ✅ Sorting works correctly in edit mode
- ✅ No difference in behavior between create and edit modes

---

### Test 8: Verify Translated Location Names Sort Correctly (If Applicable)

**Steps:**
1. If your instance uses translations, switch to a different language
2. Navigate to Patient Details location hierarchy fields
3. Open each dropdown and verify sorting

**Expected Result:**
- Location names should be displayed in the selected language
- Sorting should be based on the translated names (not the original/English names)

**Pass Criteria:**
- ✅ Translated names appear correctly
- ✅ Sorting is alphabetical based on the displayed (translated) text

---

### Test 9: Verify Large Data Sets Sort Correctly

**Steps:**
1. Test with a location hierarchy level that has 50+ items (if available)
2. Open the dropdown and scroll through the list
3. Verify the entire list maintains alphabetical order

**Expected Result:**
- Even with pagination or lazy loading, the full list should be alphabetically ordered
- No items should appear out of order at the beginning, middle, or end of the list

**Pass Criteria:**
- ✅ Large lists maintain alphabetical order throughout
- ✅ Performance remains acceptable with large lists

---

## Edge Cases to Test

### Edge Case 1: Special Characters and Numbers
- Test locations with names containing:
  - Numbers (e.g., "1st Division", "23rd Village")
  - Special characters (e.g., "St. Mary's Village", "Baie-Comeau")
  - Accented characters (e.g., "Côte d'Ivoire", "São Paulo")

**Expected:** These should sort logically (numbers before letters, special characters handled consistently)

### Edge Case 2: Mixed Case Names
- Test locations with various capitalizations:
  - All caps: "VILLAGE ONE"
  - Title case: "Village Two"
  - Lower case: "village three"

**Expected:** Case-insensitive alphabetical sorting

### Edge Case 3: Empty or Missing Hierarchy Levels
- Test with a location hierarchy that skips a level (e.g., Settlement directly under Division)

**Expected:** Fields should still populate correctly and maintain alphabetical sorting at each level

### Edge Case 4: Single Item in Dropdown
- Test a parent that has only one child

**Expected:** Single item should display correctly (no errors from sorting a single-item list)

## Regression Testing

### Other Reference Data Suggesters
Since this fix affects the reference data suggester service used by many dropdowns, verify that other reference data dropdowns still work correctly:

1. **Diagnoses** (ICD-10 codes)
2. **Medications** 
3. **Lab Test Types**
4. **Procedures**
5. **Allergen** lists

**Expected:** All other suggesters should continue to work as before, with alphabetical sorting maintained

---

## Known Limitations

- **Medication Sets**: The fix explicitly excludes medication sets from default ordering, as they have custom sorting requirements. This behavior is intentional.
- **Note Types**: Note types have custom ordering (Treatment Plan prioritized first), which is maintained by the fix.

---

## Test Sign-Off

| Test Scenario | Pass/Fail | Tester | Date | Notes |
|--------------|-----------|---------|------|-------|
| Test 1: Top-Level Sorting | | | | |
| Test 2: Second-Level Sorting | | | | |
| Test 3: Third-Level Sorting | | | | |
| Test 4: Village Sorting | | | | |
| Test 5: Search Filter Sorting | | | | |
| Test 6: Parent Change Persistence | | | | |
| Test 7: Edit Mode Sorting | | | | |
| Test 8: Translated Names | | | | |
| Test 9: Large Data Sets | | | | |
| Edge Cases | | | | |
| Regression Tests | | | | |

---

## Troubleshooting

### If sorting is not working:

1. **Clear browser cache** and reload the page
2. **Verify the fix is deployed** by checking the commit hash
3. **Check feature flag**: Ensure `features.patientDetailsLocationHierarchy` is enabled
4. **Verify reference data**: Ensure location hierarchy data exists in the database
5. **Check browser console** for any JavaScript errors
6. **Check server logs** for any API errors

### If some locations are missing:

- Verify the `visibilityStatus` of reference data items (should be 'current')
- Check that location relationships are properly configured in the database
- Verify the `type` field matches expected reference types (e.g., 'village', 'settlement')

---

## Additional Notes

- This fix applies to **all reference data types** that use hierarchy relationships, not just location data
- The alphabetical sorting respects **translations**, so items will sort based on the displayed translated text
- Search results will still prioritize matches at the beginning of names, but within those groups, maintain alphabetical order
