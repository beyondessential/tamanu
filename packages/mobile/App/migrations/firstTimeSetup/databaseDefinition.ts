import { Table, TableColumn, TableIndex, TableForeignKey } from 'typeorm';

const baseIndex = new TableIndex({
  columnNames: ['markedForUpload'],
});

const BaseColumns = [
  new TableColumn({
    name: 'id',
    type: 'varchar',
    isPrimary: true,
  }),
  new TableColumn({
    name: 'createdAt',
    type: 'datetime',
    default: "datetime('now')",
  }),
  new TableColumn({
    name: 'updatedAt',
    type: 'datetime',
    default: "datetime('now')",
  }),
  new TableColumn({
    name: 'markedForUpload',
    type: 'boolean',
    default: 1,
  }),
  new TableColumn({
    name: 'uploadedAt',
    type: 'datetime',
    isNullable: true,
  }),
];

const ReferenceDataTable = new Table({
  name: 'reference_data',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'name',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'code',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'type',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'visibilityStatus',
      type: 'varchar',
      default: "'current'",
    }),
  ],
  indices: [baseIndex],
});

const DiagnosisTable = new Table({
  name: 'diagnosis',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'isPrimary',
      type: 'boolean',
      isNullable: true,
    }),
    new TableColumn({
      name: 'date',
      type: 'datetime',
    }),
    new TableColumn({
      name: 'certainty',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'diagnosisId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'encounterId',
      type: 'varchar',
      isNullable: true,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['diagnosisId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['encounterId'],
      referencedTableName: 'encounter',
      referencedColumnNames: ['id'],
    }),
  ],
  indices: [baseIndex],
});

const MedicationTable = new Table({
  name: 'medication',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'date',
      type: 'datetime',
    }),
    new TableColumn({
      name: 'endDate',
      type: 'datetime',
      isNullable: true,
    }),
    new TableColumn({
      name: 'prescription',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'note',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'indication',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'route',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'quantity',
      type: 'integer',
    }),
    new TableColumn({
      name: 'qtyMorning',
      type: 'integer',
      isNullable: true,
    }),
    new TableColumn({
      name: 'qtyLunch',
      type: 'integer',
      isNullable: true,
    }),
    new TableColumn({
      name: 'qtyEvening',
      type: 'integer',
      isNullable: true,
    }),
    new TableColumn({
      name: 'qtyNight',
      type: 'integer',
      isNullable: true,
    }),
    new TableColumn({
      name: 'medicationId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'encounterId',
      type: 'varchar',
      isNullable: true,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['medicationId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['encounterId'],
      referencedTableName: 'encounter',
      referencedColumnNames: ['id'],
    }),
  ],
  indices: [baseIndex],
});

const ProgramTable = new Table({
  name: 'program',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'name',
      type: 'varchar',
      isNullable: true,
    }),
  ],
  indices: [baseIndex],
});

const SurveyTable = new Table({
  name: 'survey',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'surveyType',
      type: 'varchar',
      default: "'programs'",
      isNullable: true,
    }),
    new TableColumn({
      name: 'name',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'isSensitive',
      type: 'boolean',
      default: 0,
    }),
    new TableColumn({
      name: 'programId',
      type: 'varchar',
      isNullable: true,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['programId'],
      referencedTableName: 'program',
      referencedColumnNames: ['id'],
    }),
  ],
  indices: [baseIndex],
});

const ProgramDataElementTable = new Table({
  name: 'program_data_element',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'code',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'name',
      type: 'varchar',
      default: "''",
      isNullable: true,
    }),
    new TableColumn({
      name: 'defaultText',
      type: 'varchar',
      default: "''",
      isNullable: true,
    }),
    new TableColumn({
      name: 'defaultOptions',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'type',
      type: 'text',
    }),
  ],
  indices: [baseIndex],
});

const SurveyResponseAnswerTable = new Table({
  name: 'survey_response_answer',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'name',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'body',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'responseId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'dataElementId',
      type: 'varchar',
      isNullable: true,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['responseId'],
      referencedTableName: 'survey_response',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['dataElementId'],
      referencedTableName: 'program_data_element',
      referencedColumnNames: ['id'],
    }),
  ],
  indices: [baseIndex],
});

const PatientAdditionalDataTable = new Table({
  name: 'patient_additional_data',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'placeOfBirth',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'title',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'bloodType',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'primaryContactNumber',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'secondaryContactNumber',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'maritalStatus',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'cityTown',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'streetVillage',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'educationalLevel',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'socialMedia',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'birthCertificate',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'drivingLicense',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'passport',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'emergencyContactName',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'emergencyContactNumber',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'religionId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'patientBillingTypeId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'countryOfBirthId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'markedForSync',
      type: 'boolean',
      default: 0,
    }),
    new TableColumn({
      name: 'patientId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'nationalityId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'countryId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'divisionId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'subdivisionId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'medicalAreaId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'nursingZoneId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'settlementId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'ethnicityId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'occupationId',
      type: 'varchar',
      isNullable: true,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['patientId'],
      referencedTableName: 'patient',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['nationalityId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['countryId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['divisionId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['subdivisionId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['medicalAreaId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['nursingZoneId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['settlementId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['ethnicityId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['occupationId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['religionId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['patientBillingTypeId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['countryOfBirthId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
  ],
  indices: [baseIndex],
});

const SurveyResponseTable = new Table({
  name: 'survey_response',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'startTime',
      type: 'datetime',
      isNullable: true,
    }),
    new TableColumn({
      name: 'endTime',
      type: 'datetime',
      isNullable: true,
    }),
    new TableColumn({
      name: 'result',
      type: 'integer',
      default: "''",
      isNullable: true,
    }),
    new TableColumn({
      name: 'resultText',
      type: 'varchar',
      default: "''",
      isNullable: true,
    }),
    new TableColumn({
      name: 'surveyId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'encounterId',
      type: 'varchar',
      isNullable: true,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['surveyId'],
      referencedTableName: 'survey',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['encounterId'],
      referencedTableName: 'encounter',
      referencedColumnNames: ['id'],
    }),
  ],
  indices: [baseIndex],
});

const ReferralTable = new Table({
  name: 'referral',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'referredFacility',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'initiatingEncounterId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'completingEncounterId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'surveyResponseId',
      type: 'varchar',
      isNullable: true,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['initiatingEncounterId'],
      referencedTableName: 'encounter',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['completingEncounterId'],
      referencedTableName: 'encounter',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['surveyResponseId'],
      referencedTableName: 'survey_response',
      referencedColumnNames: ['id'],
    }),
  ],
  indices: [baseIndex],
});

const DepartmentTable = new Table({
  name: 'department',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'code',
      type: 'varchar',
      default: "''",
    }),
    new TableColumn({
      name: 'name',
      type: 'varchar',
      default: "''",
    }),
    new TableColumn({
      name: 'visibilityStatus',
      type: 'varchar',
      default: "'current'",
    }),
    new TableColumn({
      name: 'facilityId',
      type: 'varchar',
      isNullable: true,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['facilityId'],
      referencedTableName: 'facility',
      referencedColumnNames: ['id'],
    }),
  ],
  indices: [baseIndex],
});

const FacilityTable = new Table({
  name: 'facility',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'code',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'name',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'contactNumber',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'email',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'streetAddress',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'cityTown',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'division',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'type',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'visibilityStatus',
      type: 'varchar',
      default: "'current'",
    }),
  ],
  indices: [baseIndex],
});

const LocationTable = new Table({
  name: 'location',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'code',
      type: 'varchar',
      default: "''",
    }),
    new TableColumn({
      name: 'name',
      type: 'varchar',
      default: "''",
    }),
    new TableColumn({
      name: 'visibilityStatus',
      type: 'varchar',
      default: "'current'",
    }),
    new TableColumn({
      name: 'facilityId',
      type: 'varchar',
      isNullable: true,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['facilityId'],
      referencedTableName: 'facility',
      referencedColumnNames: ['id'],
    }),
  ],
  indices: [baseIndex],
});

const ScheduledVaccineTable = new Table({
  name: 'scheduled_vaccine',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'index',
      type: 'integer',
      isNullable: true,
    }),
    new TableColumn({
      name: 'label',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'schedule',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'weeksFromBirthDue',
      type: 'integer',
      isNullable: true,
    }),
    new TableColumn({
      name: 'weeksFromLastVaccinationDue',
      type: 'integer',
      isNullable: true,
    }),
    new TableColumn({
      name: 'category',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'visibilityStatus',
      type: 'varchar',
      default: "''",
    }),
    new TableColumn({
      name: 'vaccineId',
      type: 'varchar',
      isNullable: true,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['vaccineId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
  ],
  indices: [baseIndex],
});

const AdministeredVaccineTable = new Table({
  name: 'administered_vaccine',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'batch',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'status',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'reason',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'injectionSite',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'consent',
      type: 'boolean',
      default: 1,
      isNullable: true,
    }),
    new TableColumn({
      name: 'date',
      type: 'datetime',
    }),
    new TableColumn({
      name: 'givenBy',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'encounterId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'scheduledVaccineId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'recorderId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'locationId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'departmentId',
      type: 'varchar',
      isNullable: true,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['encounterId'],
      referencedTableName: 'encounter',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['scheduledVaccineId'],
      referencedTableName: 'scheduled_vaccine',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['recorderId'],
      referencedTableName: 'user',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['locationId'],
      referencedTableName: 'location',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['departmentId'],
      referencedTableName: 'department',
      referencedColumnNames: ['id'],
    }),
  ],
  indices: [baseIndex],
});

const LabTestTypeTable = new Table({
  name: 'labTestType',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'code',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'name',
      type: 'varchar',
      default: "''",
    }),
    new TableColumn({
      name: 'unit',
      type: 'varchar',
      default: "''",
    }),
    new TableColumn({
      name: 'maleMin',
      type: 'integer',
      isNullable: true,
    }),
    new TableColumn({
      name: 'maleMax',
      type: 'integer',
      isNullable: true,
    }),
    new TableColumn({
      name: 'femaleMin',
      type: 'integer',
      isNullable: true,
    }),
    new TableColumn({
      name: 'femaleMax',
      type: 'integer',
      isNullable: true,
    }),
    new TableColumn({
      name: 'rangeText',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'resultType',
      type: 'varchar',
      default: "'Number'",
    }),
    new TableColumn({
      name: 'options',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'visibilityStatus',
      type: 'varchar',
      default: "'current'",
    }),
    new TableColumn({
      name: 'labTestCategoryId',
      type: 'varchar',
      isNullable: true,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['labTestCategoryId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
  ],
  indices: [baseIndex],
});

const LabTestTable = new Table({
  name: 'labTest',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'sampleTime',
      type: 'datetime',
      default: 'CURRENT_TIMESTAMP',
    }),
    new TableColumn({
      name: 'status',
      type: 'varchar',
      default: "'reception_pending'",
    }),
    new TableColumn({
      name: 'result',
      type: 'varchar',
      default: "''",
    }),
    new TableColumn({
      name: 'labRequestId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'categoryId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'labTestTypeId',
      type: 'varchar',
      isNullable: true,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['labRequestId'],
      referencedTableName: 'labRequest',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['categoryId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['labTestTypeId'],
      referencedTableName: 'labTestType',
      referencedColumnNames: ['id'],
    }),
  ],
  indices: [baseIndex],
});

const LabRequestTable = new Table({
  name: 'labRequest',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'sampleTime',
      type: 'varchar',
      default: "strftime('%Y-%m-%d %H:%M:%S', CURRENT_TIMESTAMP)",
    }),
    new TableColumn({
      name: 'requestedDate',
      type: 'varchar',
      default: "strftime('%Y-%m-%d %H:%M:%S', CURRENT_TIMESTAMP)",
    }),
    new TableColumn({
      name: 'urgent',
      type: 'boolean',
      default: 0,
      isNullable: true,
    }),
    new TableColumn({
      name: 'specimenAttached',
      type: 'boolean',
      default: 0,
      isNullable: true,
    }),
    new TableColumn({
      name: 'status',
      type: 'varchar',
      default: "'reception_pending'",
      isNullable: true,
    }),
    new TableColumn({
      name: 'senaiteId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'sampleId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'displayId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'note',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'encounterId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'requestedById',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'labTestCategoryId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'labTestPriorityId',
      type: 'varchar',
      isNullable: true,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['encounterId'],
      referencedTableName: 'encounter',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['requestedById'],
      referencedTableName: 'user',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['labTestCategoryId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['labTestPriorityId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
  ],
  indices: [baseIndex],
});

const UserTable = new Table({
  name: 'user',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'email',
      type: 'varchar',
      isUnique: true,
    }),
    new TableColumn({
      name: 'localPassword',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'displayName',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'role',
      type: 'varchar',
    }),
  ],
  indices: [
    baseIndex,
    new TableIndex({
      columnNames: ['email'],
    }),
  ],
});

const VitalsTable = new Table({
  name: 'vitals',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'dateRecorded',
      type: 'datetime',
    }),
    new TableColumn({
      name: 'weight',
      type: 'integer',
      isNullable: true,
    }),
    new TableColumn({
      name: 'height',
      type: 'integer',
      isNullable: true,
    }),
    new TableColumn({
      name: 'sbp',
      type: 'integer',
      isNullable: true,
    }),
    new TableColumn({
      name: 'dbp',
      type: 'integer',
      isNullable: true,
    }),
    new TableColumn({
      name: 'heartRate',
      type: 'integer',
      isNullable: true,
    }),
    new TableColumn({
      name: 'respiratoryRate',
      type: 'integer',
      isNullable: true,
    }),
    new TableColumn({
      name: 'temperature',
      type: 'integer',
      isNullable: true,
    }),
    new TableColumn({
      name: 'spO2',
      type: 'integer',
      isNullable: true,
    }),
    new TableColumn({
      name: 'avpu',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'gcs',
      type: 'integer',
      isNullable: true,
    }),
    new TableColumn({
      name: 'hemoglobin',
      type: 'integer',
      isNullable: true,
    }),
    new TableColumn({
      name: 'fastingBloodGlucose',
      type: 'integer',
      isNullable: true,
    }),
    new TableColumn({
      name: 'urinePh',
      type: 'integer',
      isNullable: true,
    }),
    new TableColumn({
      name: 'urineLeukocytes',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'urineNitrites',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'urobilinogen',
      type: 'integer',
      isNullable: true,
    }),
    new TableColumn({
      name: 'urineProtein',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'bloodInUrine',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'urineSpecificGravity',
      type: 'integer',
      isNullable: true,
    }),
    new TableColumn({
      name: 'urineKetone',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'urineBilirubin',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'urineGlucose',
      type: 'integer',
      isNullable: true,
    }),
    new TableColumn({
      name: 'encounterId',
      type: 'varchar',
      isNullable: true,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['encounterId'],
      referencedTableName: 'encounter',
      referencedColumnNames: ['id'],
    }),
  ],
  indices: [baseIndex],
});

const EncounterTable = new Table({
  name: 'encounter',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'encounterType',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'startDate',
      type: 'datetime',
    }),
    new TableColumn({
      name: 'endDate',
      type: 'datetime',
      isNullable: true,
    }),
    new TableColumn({
      name: 'reasonForEncounter',
      type: 'varchar',
      default: "''",
      isNullable: true,
    }),
    new TableColumn({
      name: 'medication',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'deviceId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'patientBillingTypeId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'patientId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'examinerId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'departmentId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'locationId',
      type: 'varchar',
      isNullable: true,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['patientId'],
      referencedTableName: 'patient',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['examinerId'],
      referencedTableName: 'user',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['departmentId'],
      referencedTableName: 'department',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['patientBillingTypeId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['locationId'],
      referencedTableName: 'location',
      referencedColumnNames: ['id'],
    }),
  ],
  indices: [
    baseIndex,
    new TableIndex({
      columnNames: ['patientId'],
    }),
  ],
});

const PatientIssueTable = new Table({
  name: 'patient_issue',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'note',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'recordedDate',
      type: 'datetime',
    }),
    new TableColumn({
      name: 'type',
      type: 'text',
    }),
    new TableColumn({
      name: 'patientId',
      type: 'varchar',
      isNullable: true,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['patientId'],
      referencedTableName: 'patient',
      referencedColumnNames: ['id'],
    }),
  ],
  indices: [baseIndex],
});

const PatientSecondaryIdTable = new Table({
  name: 'patient_secondary_id',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'value',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'visibilityStatus',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'typeId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'patientId',
      type: 'varchar',
      isNullable: true,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['typeId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['patientId'],
      referencedTableName: 'patient',
      referencedColumnNames: ['id'],
    }),
  ],
  indices: [baseIndex],
});

const PatientTable = new Table({
  name: 'patient',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'displayId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'title',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'firstName',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'middleName',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'lastName',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'culturalName',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'dateOfBirth',
      type: 'datetime',
      isNullable: true,
    }),
    new TableColumn({
      name: 'email',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'sex',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'villageId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'markedForSync',
      type: 'boolean',
      default: 0,
    }),
  ],
  indices: [
    baseIndex,
    new TableIndex({
      columnNames: ['villageId'],
    }),
  ],
});

const SurveyScreenComponentTable = new Table({
  name: 'survey_screen_component',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'screenIndex',
      type: 'integer',
      isNullable: true,
    }),
    new TableColumn({
      name: 'componentIndex',
      type: 'integer',
      isNullable: true,
    }),
    new TableColumn({
      name: 'text',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'visibilityCriteria',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'validationCriteria',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'detail',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'config',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'options',
      type: 'text',
      isNullable: true,
    }),
    new TableColumn({
      name: 'calculation',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'surveyId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'dataElementId',
      type: 'varchar',
      isNullable: true,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['surveyId'],
      referencedTableName: 'survey',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['dataElementId'],
      referencedTableName: 'program_data_element',
      referencedColumnNames: ['id'],
    }),
  ],
  indices: [baseIndex],
});

const AttachmentTable = new Table({
  name: 'attachment',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'size',
      type: 'integer',
      isNullable: true,
    }),
    new TableColumn({
      name: 'type',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'data',
      type: 'blob',
      isNullable: true,
    }),
    new TableColumn({
      name: 'filePath',
      type: 'varchar',
    }),
  ],
  indices: [baseIndex],
});

export const TABLE_DEFINITIONS = [
  ReferenceDataTable,
  DiagnosisTable,
  MedicationTable,
  ProgramTable,
  SurveyTable,
  ProgramDataElementTable,
  SurveyResponseAnswerTable,
  PatientAdditionalDataTable,
  SurveyResponseTable,
  ReferralTable,
  DepartmentTable,
  FacilityTable,
  LocationTable,
  ScheduledVaccineTable,
  AdministeredVaccineTable,
  LabTestTypeTable,
  LabTestTable,
  LabRequestTable,
  UserTable,
  VitalsTable,
  EncounterTable,
  PatientIssueTable,
  PatientSecondaryIdTable,
  PatientTable,
  SurveyScreenComponentTable,
  AttachmentTable,
];
