# Program Registry Issues Diagnosis

## Issue Summary
Three issues have been identified in the program registry "Update program registry" modal:

1. **`[object Object]` Display Issue**: Category displays as `[object Object]` for "Resolved" and "Disproven" categories when multiple conditions of the same type exist
2. **Reversible "Recorded in error"**: Conditions marked as "Recorded in error" can be updated, when they should be immutable
3. **ReferenceData Write Permissions**: Users need `write` ReferenceData permissions instead of the usual `read` and `list` permissions

## Root Cause Analysis

### 1. `[object Object]` Display Issue

**Root Cause**: The issue occurs in `UpdateConditionFormModal.jsx` where the condition data structure is being passed to the FormTable, but the category field is not properly serialized for display.

**Location**: `packages/web/app/features/ProgramRegistry/UpdateConditionFormModal.jsx`

**Analysis**:
- The `UpdateConditionFormModal` receives a `condition` object with `programRegistryConditionCategory` field
- This field is passed directly to the FormTable, which expects string values for display
- When multiple conditions exist, the category object is not being converted to its display name

**Evidence**:
```javascript
// In UpdateConditionFormModal.jsx, line ~100-190
// The condition object is passed directly to FormTable
<StyledFormTable columns={columns} data={[condition]} />

// The programRegistryConditionCategory field should be displayed as a string
// but it's being passed as an object
```

**Fix Required**: The category field needs to be processed to extract the display name from the object before passing to FormTable.

### 2. Reversible "Recorded in error" Issue

**Root Cause**: The check for "recorded in error" status is working correctly in `RelatedConditionsForm.jsx`, but the `UpdateConditionFormModal.jsx` doesn't have the same protection.

**Location**: `packages/web/app/features/ProgramRegistry/UpdateConditionFormModal.jsx`

**Analysis**:
- In `RelatedConditionsForm.jsx` (lines 376-386), there's proper logic to disable editing for "recorded in error" conditions
- The `UpdateConditionFormModal.jsx` lacks this same protection
- The modal allows editing any condition regardless of its category status

**Evidence**:
```javascript
// In RelatedConditionsForm.jsx - CORRECT implementation
if (initialValue === 'recordedInError') {
  return (
    <ProgramRegistryConditionCategoryField
      name={fieldName}
      programRegistryId={programRegistryId}
      ariaLabelledby={ariaLabelledby}
      disabled
      disabledTooltipText={getTranslation(
        'programRegistry.recordedInError.tooltip',
        'Cannot edit entry that has been recorded in error',
      )}
    />
  );
}

// UpdateConditionFormModal.jsx - MISSING this protection
```

**Fix Required**: Add the same "recorded in error" check and disable editing in `UpdateConditionFormModal.jsx`.

### 3. ReferenceData Write Permissions Issue

**Root Cause**: The system requires `write` permissions for `ReferenceData` because program registry condition categories are stored in the `program_registry_condition_categories` table, but the permission system treats them as reference data.

**Location**: `packages/central-server/app/admin/referenceDataImporter/referenceDataImporter.js`

**Analysis**:
- Lines 24-25 in `referenceDataImporter.js` require both `create` and `write` permissions for ReferenceData
- Program registry condition categories are treated as reference data despite being in their own table
- This is by design, as indicated by the comment in `packages/constants/src/importable.ts` line 87: "Reference data stored in its own table but are not general importable types"

**Evidence**:
```javascript
// In referenceDataImporter.js lines 24-25
checkPermission('create', 'ReferenceData');
checkPermission('write', 'ReferenceData');
```

**This is actually correct behavior** - users need write permissions to modify reference data including condition categories.

## Recommended Fixes

### Fix 1: Resolve `[object Object]` Display Issue

**File**: `packages/web/app/features/ProgramRegistry/UpdateConditionFormModal.jsx`

**Solution**: Process the condition data before passing to FormTable to ensure category is displayed as a string:

```javascript
// Around line 192, modify the data preparation:
const processedCondition = {
  ...condition,
  programRegistryConditionCategory: condition.programRegistryConditionCategory?.name || condition.programRegistryConditionCategory
};

return (
  <>
    <StyledFormTable columns={columns} data={[processedCondition]} />
    {/* rest of the component */}
  </>
);
```

### Fix 2: Prevent "Recorded in error" Editing

**File**: `packages/web/app/features/ProgramRegistry/UpdateConditionFormModal.jsx`

**Solution**: Add the same protection logic as in `RelatedConditionsForm.jsx`:

```javascript
// Add this check in the category field accessor (around line 150):
const isRecordedInError = (categoryCode) => 
  categoryCode === PROGRAM_REGISTRY_CONDITION_CATEGORIES.RECORDED_IN_ERROR;

// In the category column accessor:
if (isRecordedInError(programRegistryConditionCategory?.code)) {
  return (
    <ProgramRegistryConditionCategoryField
      name="programRegistryConditionCategoryId"
      programRegistryId={programRegistryId}
      disabled
      disabledTooltipText={getTranslation(
        'programRegistry.recordedInError.tooltip',
        'Cannot edit entry that has been recorded in error',
      )}
    />
  );
}
```

### Fix 3: ReferenceData Permissions (Documentation)

**Action**: Document that `write` ReferenceData permissions are required for program registry condition category management.

**Rationale**: This is expected behavior since condition categories are managed as reference data. Users need write permissions to modify reference data, which includes creating and updating condition categories.

## Testing Recommendations

1. **Test `[object Object]` Fix**: Create multiple conditions of the same type with "Resolved" and "Disproven" categories and verify they display correctly
2. **Test "Recorded in error" Protection**: Mark a condition as "Recorded in error" and verify it cannot be edited
3. **Test Permissions**: Verify that users with only `read` and `list` ReferenceData permissions cannot create condition categories, while users with `write` permissions can

## Priority

- **High**: Fix 1 (`[object Object]` display) - User experience issue
- **High**: Fix 2 (Recorded in error reversibility) - Data integrity issue  
- **Low**: Fix 3 (Documentation) - Working as designed

## Additional Notes

The codebase shows good separation of concerns with dedicated components for condition category management (`ProgramRegistryConditionCategoryField.jsx`) and proper permission checking. The issues are primarily in the modal implementation consistency and data processing for display.