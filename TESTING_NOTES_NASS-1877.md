# Testing Notes: NASS-1877 - Search Results Not Reset After Clearing Filters

## Overview
This bug fix addresses an issue where search results in the lab request modal do not reset to show all available tests after clearing search filters. The fix ensures that when users clear search terms (by clicking the X button or deleting text), the interface displays all available panels and tests.

## Test Environment Setup
- Navigate to an encounter in a patient page
- Ensure the facility has multiple lab test panels and individual tests configured
- Ensure test data includes panels with various categories (e.g., "Other", "Comprehensive Metabolic Panel", etc.)

## Test Scenarios

### Scenario 1: Panel Search - Clear via X Button

**Steps:**
1. Go to an encounter in patient page
2. Click "New lab request" button
3. Click "Next" to proceed to panel selection
4. In the "Select the test panel or panels" search field, type a search term (e.g., "other")
5. Verify that search results are filtered (should show only matching panels like "Others")
6. Click the X button to clear the search

**Expected Result:**
- Search field should be empty
- All available panels should be displayed (not just the filtered results)
- The panel list should return to its default state showing all options

**Previously (Bug):**
- Search field would clear but filtered results would remain visible
- User would need to navigate back and return to see all panels

---

### Scenario 2: Panel Search - Clear via Backspace/Delete

**Steps:**
1. Go to an encounter in patient page
2. Click "New lab request" button
3. Click "Next" to proceed to panel selection
4. In the search field, type a search term (e.g., "metabolic")
5. Verify search results are filtered
6. Use backspace/delete to manually clear all characters from the search field

**Expected Result:**
- As characters are deleted, the search results should update dynamically
- When the search field is completely empty, all panels should be displayed
- The list should show all available options in their default order

---

### Scenario 3: Individual Test Search - Clear via X Button

**Steps:**
1. Go to an encounter in patient page
2. Click "New lab request" button
3. Click "Next" to proceed to panel selection
4. Look for the individual tests search field (if separate from panels)
5. Type a search term to filter individual tests
6. Verify filtered results
7. Click the X button to clear the search

**Expected Result:**
- Search field should be empty
- All individual tests should be displayed
- The test list should return to showing all available options

---

### Scenario 4: Multiple Sequential Searches

**Steps:**
1. Navigate to lab request panel selection
2. Search for "other" - verify filtered results
3. Clear the search (via X button) - verify all panels shown
4. Search for "metabolic" - verify filtered results
5. Clear the search (via backspace) - verify all panels shown
6. Search for "comprehensive" - verify filtered results
7. Clear the search (via X button) - verify all panels shown

**Expected Result:**
- Each search should properly filter results
- Each clear action should properly reset to show all panels
- No residual filtering from previous searches

---

### Scenario 5: Empty Search Edge Case

**Steps:**
1. Navigate to lab request panel selection
2. Without typing anything, click in the search field
3. Immediately click the X button (if visible)
4. Verify the panel list state

**Expected Result:**
- All panels should be visible
- No errors should occur
- Interface should remain functional

---

### Scenario 6: Partial Search Clear

**Steps:**
1. Navigate to lab request panel selection
2. Type "comprehensive" in the search field
3. Verify filtered results (e.g., "Comprehensive Metabolic Panel")
4. Delete only part of the search term (e.g., delete "hensive" leaving "compre")
5. Verify results update based on partial term

**Expected Result:**
- Results should update dynamically as characters are deleted
- Filtering should work correctly with partial search terms
- When fully cleared, all results should be shown

---

## Edge Cases to Test

### Different Categories
- Test with panels from different categories (Other, Standard, Custom, etc.)
- Verify all categories appear when search is cleared

### Large Datasets
- If facility has many panels (50+), verify performance is acceptable
- Ensure all panels load when search is cleared

### Special Characters
- Search using special characters (e.g., "(", ")", "/")
- Clear the search and verify proper reset

### Case Sensitivity
- Test searches with different cases (uppercase, lowercase, mixed)
- Verify clearing works regardless of case used

---

## Regression Testing

Ensure the following still work correctly:

1. **Normal Search Functionality**
   - Searching for valid terms properly filters results
   - Search is case-insensitive
   - Partial matches work correctly

2. **Panel Selection**
   - Selecting panels from search results works
   - Selecting panels after clearing search works
   - Multiple panel selection works correctly

3. **Navigation**
   - Back button still works correctly
   - Next button functionality unchanged
   - Cancel button works as expected

4. **Selected Panels Display**
   - Selected panels appear in the "Selected panels" section
   - Selected panels persist when searching/clearing
   - Selected panels can be removed

---

## Browser Compatibility

Test the fix across:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

## Pass/Fail Criteria

**PASS:** 
- Clearing search (via X button or manual deletion) immediately shows all available panels/tests
- No need to navigate away and return to see full list
- Search functionality continues to work normally after clearing

**FAIL:**
- Filtered results remain after clearing search
- All panels not visible after search is cleared
- Errors occur when clearing search
- Search functionality breaks after clearing

---

## Notes for QA

1. This bug affected both main and release 2.19 branches
2. The issue occurs for both panel searches and individual test searches
3. Pay special attention to the state management of the search filter
4. Test with realistic data volumes that match production environments
5. Verify the fix doesn't impact performance of search functionality

---

## Related Areas

While testing, also observe:
- Overall lab request workflow performance
- Any console errors during search/clear operations
- Memory usage during repeated search/clear cycles
- Accessibility of search clear button (keyboard navigation, screen readers)
