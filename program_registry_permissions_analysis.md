# Program Registry Condition Category Permissions Analysis

## Question
When adding a condition to a program registry and setting its category, does the user need `write` permissions to `ReferenceData`?

## Answer
**NO** - Users do not need `write` permissions to `ReferenceData` when adding conditions to a program registry and setting their categories.

## Analysis

### 1. ProgramRegistryConditionCategory is NOT traditional ReferenceData

Looking at `/workspace/packages/constants/src/importable.ts`:

```typescript
// Reference data stored IN the "reference_data" table
export const REFERENCE_TYPES = {
  ALLERGY: 'allergy',
  APPOINTMENT_TYPE: 'appointmentType',
  // ... other types
};
export const REFERENCE_TYPE_VALUES = Object.values(REFERENCE_TYPES);

// Reference data stored in its own table (not in 'reference_data' table)
export const PROGRAM_REGISTRY_REFERENCE_TYPES = {
  PROGRAM_REGISTRY_CLINICAL_STATUS: 'programRegistryClinicalStatus',
  PROGRAM_REGISTRY_CONDITION_CATEGORY: 'programRegistryConditionCategory',
  PROGRAM_REGISTRY_CONDITION: 'programRegistryCondition',
};
```

**Key Point**: `PROGRAM_REGISTRY_CONDITION_CATEGORY` is stored in its own table and is NOT part of the standard `REFERENCE_TYPE_VALUES` that require `ReferenceData` permissions.

### 2. Permission Check Logic

In `/workspace/packages/central-server/app/admin/referenceDataImporter/referenceDataImporter.js`:

```javascript
if (REFERENCE_TYPE_VALUES.includes(dataType)) {
  checkPermission('create', 'ReferenceData');
  checkPermission('write', 'ReferenceData');
  continue;
}
```

Since `programRegistryConditionCategory` is NOT in `REFERENCE_TYPE_VALUES`, it does not trigger the `ReferenceData` permission check.

### 3. Actual Permission Requirements

When adding conditions to a program registry, the actual permission checks are:

**From `/workspace/packages/facility-server/app/routes/apiv1/patient/patientProgramRegistration/patientProgramRegistration.js`:**

```javascript
// For creating new conditions
if (conditions.length > 0) {
  req.checkPermission('create', 'PatientProgramRegistrationCondition');
}

// For updating existing conditions  
if (conditions.length > 0) {
  req.checkPermission('create', 'PatientProgramRegistrationCondition');
}
```

**Required permissions:**
- `create` permission on `PatientProgramRegistrationCondition`
- `write` permission on `PatientProgramRegistration` (for updates)
- `read` permission on `ProgramRegistry` (for the specific program registry)

### 4. Category Access

Program registry condition categories are fetched via:

```javascript
// From /workspace/packages/facility-server/app/routes/apiv1/programRegistry.js
programRegistry.get(
  '/:id/conditionCategories',
  simpleGetList('ProgramRegistryConditionCategory', 'programRegistryId', {
    additionalFilters: {
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    },
  }),
);
```

No additional permission checks are required beyond basic program registry access.

### 5. Model Structure

`ProgramRegistryConditionCategory` is a separate model with its own table structure:

```typescript
// From /workspace/packages/database/src/models/ProgramRegistryConditionCategory.ts
export class ProgramRegistryConditionCategory extends Model {
  declare id: string;
  declare code: string;
  declare name: string;
  declare visibilityStatus: string;
  declare programRegistryId: string;
  // ...
}
```

## Conclusion

The user only needs:
1. `create` permission on `PatientProgramRegistrationCondition` to add conditions
2. `read` permission on the specific `ProgramRegistry` 
3. `write` permission on `PatientProgramRegistration` for updates

**No `write` permission to `ReferenceData` is required** because `ProgramRegistryConditionCategory` is not stored in the reference_data table and is not part of the standard reference data types that require those permissions.