import { MigrationInterface, QueryRunner } from 'typeorm';

// Default built-in field layouts organised by section.
// sortOrder is the flat array index (0-based), mapping to a 2-column grid
// reading left-to-right, top-to-bottom.
const BUILT_IN_LAYOUTS = [
  // --- General information ---
  { fieldKey: 'firstName', section: 'generalInformation', sortOrder: 0, fieldSource: 'patient' },
  { fieldKey: 'middleName', section: 'generalInformation', sortOrder: 1, fieldSource: 'patient' },
  { fieldKey: 'lastName', section: 'generalInformation', sortOrder: 2, fieldSource: 'patient' },
  { fieldKey: 'culturalName', section: 'generalInformation', sortOrder: 3, fieldSource: 'patient' },
  { fieldKey: 'dateOfBirth', section: 'generalInformation', sortOrder: 4, fieldSource: 'patient' },
  { fieldKey: 'sex', section: 'generalInformation', sortOrder: 5, fieldSource: 'patient' },
  { fieldKey: 'email', section: 'generalInformation', sortOrder: 6, fieldSource: 'patient' },
  { fieldKey: 'villageId', section: 'locationInformation', sortOrder: 8, fieldSource: 'patient' },

  // --- Contact information ---
  { fieldKey: 'primaryContactNumber', section: 'contactInformation', sortOrder: 0, fieldSource: 'patient' },
  { fieldKey: 'secondaryContactNumber', section: 'contactInformation', sortOrder: 1, fieldSource: 'patient' },
  { fieldKey: 'emergencyContactName', section: 'contactInformation', sortOrder: 2, fieldSource: 'patient' },
  { fieldKey: 'emergencyContactNumber', section: 'contactInformation', sortOrder: 3, fieldSource: 'patient' },

  // --- Identification information ---
  { fieldKey: 'displayId', section: 'identificationInformation', sortOrder: 0, fieldSource: 'patient' },
  { fieldKey: 'birthCertificate', section: 'identificationInformation', sortOrder: 1, fieldSource: 'patient' },
  { fieldKey: 'insurerId', section: 'identificationInformation', sortOrder: 2, fieldSource: 'patient' },
  { fieldKey: 'insurerPolicyNumber', section: 'identificationInformation', sortOrder: 3, fieldSource: 'patient' },
  { fieldKey: 'drivingLicense', section: 'identificationInformation', sortOrder: 4, fieldSource: 'patient' },
  { fieldKey: 'passport', section: 'identificationInformation', sortOrder: 5, fieldSource: 'patient' },

  // --- Personal information ---
  { fieldKey: 'title', section: 'personalInformation', sortOrder: 0, fieldSource: 'patient' },
  { fieldKey: 'maritalStatus', section: 'personalInformation', sortOrder: 1, fieldSource: 'patient' },
  { fieldKey: 'bloodType', section: 'personalInformation', sortOrder: 2, fieldSource: 'patient' },
  { fieldKey: 'placeOfBirth', section: 'personalInformation', sortOrder: 3, fieldSource: 'patient' },
  { fieldKey: 'countryOfBirthId', section: 'personalInformation', sortOrder: 4, fieldSource: 'patient' },
  { fieldKey: 'nationalityId', section: 'personalInformation', sortOrder: 5, fieldSource: 'patient' },
  { fieldKey: 'ethnicityId', section: 'personalInformation', sortOrder: 6, fieldSource: 'patient' },
  { fieldKey: 'religionId', section: 'personalInformation', sortOrder: 7, fieldSource: 'patient' },
  { fieldKey: 'educationalLevel', section: 'personalInformation', sortOrder: 8, fieldSource: 'patient' },
  { fieldKey: 'occupationId', section: 'personalInformation', sortOrder: 9, fieldSource: 'patient' },
  { fieldKey: 'socialMedia', section: 'personalInformation', sortOrder: 10, fieldSource: 'patient' },
  { fieldKey: 'patientBillingTypeId', section: 'personalInformation', sortOrder: 11, fieldSource: 'patient' },

  // --- Location information ---
  { fieldKey: 'streetVillage', section: 'locationInformation', sortOrder: 0, fieldSource: 'patient' },
  { fieldKey: 'cityTown', section: 'locationInformation', sortOrder: 1, fieldSource: 'patient' },
  { fieldKey: 'subdivisionId', section: 'locationInformation', sortOrder: 2, fieldSource: 'patient' },
  { fieldKey: 'divisionId', section: 'locationInformation', sortOrder: 3, fieldSource: 'patient' },
  { fieldKey: 'countryId', section: 'locationInformation', sortOrder: 4, fieldSource: 'patient' },
  { fieldKey: 'settlementId', section: 'locationInformation', sortOrder: 5, fieldSource: 'patient' },
  { fieldKey: 'medicalAreaId', section: 'locationInformation', sortOrder: 6, fieldSource: 'patient' },
  { fieldKey: 'nursingZoneId', section: 'locationInformation', sortOrder: 7, fieldSource: 'patient' },
];

export class seedPatientFieldLayouts1774578792000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    for (const layout of BUILT_IN_LAYOUTS) {
      const id = `patient-field-layout-${layout.fieldKey}`;
      await queryRunner.query(
        `INSERT INTO patient_field_layouts
          (id, fieldSource, fieldKey, section, sortOrder, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [id, layout.fieldSource, layout.fieldKey, layout.section, layout.sortOrder],
      );
    }

    // Seed layout entries for existing custom patient field definitions,
    // grouped by category with alphabetical sort order within each category.
    await queryRunner.query(`
      INSERT INTO patient_field_layouts
        (id, fieldSource, definitionId, categoryId, sortOrder, createdAt, updatedAt)
      SELECT
        'patient-field-layout-custom-' || pfd.id,
        'custom',
        pfd.id,
        pfd.categoryId,
        (
          SELECT COUNT(*)
          FROM patient_field_definitions pfd2
          WHERE pfd2.categoryId = pfd.categoryId
            AND pfd2.deletedAt IS NULL
            AND pfd2.name < pfd.name
        ),
        datetime('now'),
        datetime('now')
      FROM patient_field_definitions pfd
      WHERE pfd.deletedAt IS NULL
        AND pfd.categoryId IS NOT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // DESTRUCTIVE: removes all seeded layout data
    await queryRunner.query(
      `DELETE FROM patient_field_layouts WHERE id LIKE 'patient-field-layout-%'`,
    );
  }
}
