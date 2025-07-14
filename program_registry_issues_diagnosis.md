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

**Root Cause**: Users are incorrectly being required to have `write` ReferenceData permissions when recording/updating patient condition categories. This is a bug - the API endpoints for updating patient conditions only require PatientProgramRegistrationCondition permissions.

**Location**: Unknown - requires investigation

**Analysis**:
- The actual API endpoints that handle patient condition updates only require:
  - `write` PatientProgramRegistrationCondition
  - `read` PatientProgramRegistrationCondition  
  - `create` PatientProgramRegistrationCondition (for new conditions)
  - `read` ProgramRegistry (for the specific registry)
- **No `write` ReferenceData permissions are required** in the backend API
- The issue is likely in frontend permission checking or middleware incorrectly treating condition categories as reference data

**Evidence**:
```javascript
// patientProgramRegistrationConditions.js - UPDATE condition category
req.checkPermission('read', 'PatientProgramRegistrationCondition');
req.checkPermission('write', 'PatientProgramRegistrationCondition');
// NO ReferenceData permissions required

// patientProgramRegistration.js - UPDATE registration with conditions  
req.checkPermission('write', 'PatientProgramRegistration');
if (conditions.length > 0) {
  req.checkPermission('create', 'PatientProgramRegistrationCondition');
}
// NO ReferenceData permissions required
```

**This is a bug** - users should not need `write` ReferenceData permissions to record condition categories for patients.

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

### Fix 3: Investigate ReferenceData Permission Bug

**Status**: **REQUIRES FURTHER INVESTIGATION** - Root cause not found in codebase

**Action**: The development team needs to perform runtime debugging to identify where the incorrect `write` ReferenceData permission check is occurring.

**Investigation Steps**:
1. **Enable permission debugging**: Add logging to trace all permission checks during the condition category update workflow
2. **Check middleware/interceptors**: Look for any API middleware or request interceptors that might be adding permission checks
3. **Review role configurations**: Check if user roles are configured to require bundled permissions that include ReferenceData
4. **Frontend debugging**: Use browser dev tools to monitor all API requests and responses during condition updates
5. **Backend debugging**: Add logging to the backend permission checking middleware to trace which permissions are being checked

**Evidence of Bug**:
- Backend API endpoints (`patient/programRegistration/condition/{id}` and `patient/programRegistration/{id}`) only require:
  - `read` PatientProgramRegistrationCondition
  - `write` PatientProgramRegistrationCondition 
  - `create` PatientProgramRegistrationCondition (for new conditions)
- Frontend components don't have explicit ReferenceData permission checks
- No middleware or permission logic found in codebase that would require ReferenceData permissions

**Expected Behavior**: Users should only need:
- `write` PatientProgramRegistrationCondition (to update existing conditions)
- `create` PatientProgramRegistrationCondition (to add new conditions)
- `read` ProgramRegistry (for the specific registry)
- `read` PatientProgramRegistrationCondition (to view conditions)

**Recommendation**: Until the root cause is found, document the current workaround (users need `write` ReferenceData permissions) and prioritize finding the bug in the next sprint.

## Testing Recommendations

1. **Test `[object Object]` Fix**: Create multiple conditions of the same type with "Resolved" and "Disproven" categories and verify they display correctly
2. **Test "Recorded in error" Protection**: Mark a condition as "Recorded in error" and verify it cannot be edited
3. **Test Permissions Bug**: 
   - Create a user with only PatientProgramRegistrationCondition permissions (no ReferenceData write permissions)
   - Verify they can successfully record and update patient condition categories
   - If they can't, investigate where the incorrect permission check is happening

## Priority

- **High**: Fix 1 (`[object Object]` display) - User experience issue ✅ **FIXED**
- **High**: Fix 2 (Recorded in error reversibility) - Data integrity issue ✅ **FIXED**
- **Medium**: Fix 3 (Permission bug investigation) - Incorrectly requiring extra permissions ⚠️ **REQUIRES INVESTIGATION**

## Additional Notes

The codebase shows good separation of concerns with dedicated components for condition category management (`ProgramRegistryConditionCategoryField.jsx`) and proper permission checking. The issues are primarily in the modal implementation consistency and data processing for display.