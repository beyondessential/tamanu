import { QueryInterface } from 'sequelize';

// Default built-in field layouts organised by section.
// sort_order is the flat array index (0-based), mapping to a 2-column grid
// reading left-to-right, top-to-bottom.
const BUILT_IN_LAYOUTS = [
  // --- General information (patient table columns) ---
  { fieldKey: 'firstName', section: 'generalInformation', sortOrder: 0, fieldSource: 'patient' },
  { fieldKey: 'middleName', section: 'generalInformation', sortOrder: 1, fieldSource: 'patient' },
  { fieldKey: 'lastName', section: 'generalInformation', sortOrder: 2, fieldSource: 'patient' },
  { fieldKey: 'culturalName', section: 'generalInformation', sortOrder: 3, fieldSource: 'patient' },
  { fieldKey: 'dateOfBirth', section: 'generalInformation', sortOrder: 4, fieldSource: 'patient' },
  { fieldKey: 'sex', section: 'generalInformation', sortOrder: 5, fieldSource: 'patient' },
  { fieldKey: 'email', section: 'generalInformation', sortOrder: 6, fieldSource: 'patient' },
  { fieldKey: 'villageId', section: 'locationInformation', sortOrder: 8, fieldSource: 'patient' },

  // --- Contact information (patient additional data fields) ---
  { fieldKey: 'primaryContactNumber', section: 'contactInformation', sortOrder: 0, fieldSource: 'additionalData' },
  { fieldKey: 'secondaryContactNumber', section: 'contactInformation', sortOrder: 1, fieldSource: 'additionalData' },
  { fieldKey: 'emergencyContactName', section: 'contactInformation', sortOrder: 2, fieldSource: 'additionalData' },
  { fieldKey: 'emergencyContactNumber', section: 'contactInformation', sortOrder: 3, fieldSource: 'additionalData' },

  // --- Identification information (patient additional data fields) ---
  { fieldKey: 'displayId', section: 'identificationInformation', sortOrder: 0, fieldSource: 'additionalData' },
  { fieldKey: 'birthCertificate', section: 'identificationInformation', sortOrder: 1, fieldSource: 'additionalData' },
  { fieldKey: 'insurerId', section: 'identificationInformation', sortOrder: 2, fieldSource: 'additionalData' },
  { fieldKey: 'insurerPolicyNumber', section: 'identificationInformation', sortOrder: 3, fieldSource: 'additionalData' },
  { fieldKey: 'drivingLicense', section: 'identificationInformation', sortOrder: 4, fieldSource: 'additionalData' },
  { fieldKey: 'passport', section: 'identificationInformation', sortOrder: 5, fieldSource: 'additionalData' },

  // --- Personal information (patient additional data fields) ---
  { fieldKey: 'title', section: 'personalInformation', sortOrder: 0, fieldSource: 'additionalData' },
  { fieldKey: 'maritalStatus', section: 'personalInformation', sortOrder: 1, fieldSource: 'additionalData' },
  { fieldKey: 'bloodType', section: 'personalInformation', sortOrder: 2, fieldSource: 'additionalData' },
  { fieldKey: 'placeOfBirth', section: 'personalInformation', sortOrder: 3, fieldSource: 'additionalData' },
  { fieldKey: 'countryOfBirthId', section: 'personalInformation', sortOrder: 4, fieldSource: 'additionalData' },
  { fieldKey: 'nationalityId', section: 'personalInformation', sortOrder: 5, fieldSource: 'additionalData' },
  { fieldKey: 'ethnicityId', section: 'personalInformation', sortOrder: 6, fieldSource: 'additionalData' },
  { fieldKey: 'religionId', section: 'personalInformation', sortOrder: 7, fieldSource: 'additionalData' },
  { fieldKey: 'educationalLevel', section: 'personalInformation', sortOrder: 8, fieldSource: 'additionalData' },
  { fieldKey: 'occupationId', section: 'personalInformation', sortOrder: 9, fieldSource: 'additionalData' },
  { fieldKey: 'socialMedia', section: 'personalInformation', sortOrder: 10, fieldSource: 'additionalData' },
  { fieldKey: 'patientBillingTypeId', section: 'personalInformation', sortOrder: 11, fieldSource: 'additionalData' },

  // --- Location information (patient additional data fields) ---
  { fieldKey: 'streetVillage', section: 'locationInformation', sortOrder: 0, fieldSource: 'additionalData' },
  { fieldKey: 'cityTown', section: 'locationInformation', sortOrder: 1, fieldSource: 'additionalData' },
  { fieldKey: 'subdivisionId', section: 'locationInformation', sortOrder: 2, fieldSource: 'additionalData' },
  { fieldKey: 'divisionId', section: 'locationInformation', sortOrder: 3, fieldSource: 'additionalData' },
  { fieldKey: 'countryId', section: 'locationInformation', sortOrder: 4, fieldSource: 'additionalData' },
  { fieldKey: 'settlementId', section: 'locationInformation', sortOrder: 5, fieldSource: 'additionalData' },
  { fieldKey: 'medicalAreaId', section: 'locationInformation', sortOrder: 6, fieldSource: 'additionalData' },
  { fieldKey: 'nursingZoneId', section: 'locationInformation', sortOrder: 7, fieldSource: 'additionalData' },
];

export async function up(query: QueryInterface): Promise<void> {
  // Seed built-in field layouts
  const now = new Date();
  const rows = BUILT_IN_LAYOUTS.map(layout => ({
    id: `patient-field-layout-${layout.fieldKey}`,
    field_source: layout.fieldSource,
    field_key: layout.fieldKey,
    definition_id: null,
    section: layout.section,
    category_id: null,
    sort_order: layout.sortOrder,
    can_hide: layout.fieldSource !== 'patient',
    can_delete: false,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    updated_at_sync_tick: -999,
  }));

  await query.bulkInsert('patient_field_layouts', rows);

  // Seed layout entries for any existing custom patient field definitions,
  // grouped by their category with alphabetical sort order.
  await query.sequelize.query(`
    INSERT INTO patient_field_layouts (
      id, field_source, definition_id, category_id,
      sort_order, created_at, updated_at
    )
    SELECT
      'patient-field-layout-custom-' || pfd.id,
      'custom',
      pfd.id,
      pfd.category_id,
      ROW_NUMBER() OVER (PARTITION BY pfd.category_id ORDER BY pfd.name) - 1,
      NOW(),
      NOW()
    FROM patient_field_definitions pfd
    WHERE pfd.deleted_at IS NULL
      AND pfd.category_id IS NOT NULL;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: removes all seeded layout data
  await query.bulkDelete('patient_field_layouts', {});
}
