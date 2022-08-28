import { Table, TableColumn, TableIndex, TableForeignKey } from 'typeorm';

const BaseColumns = [
  new TableColumn({
    name: 'id',
    type: 'varchar',
    isPrimary: true,
    isNullable: false,
  }),
  new TableColumn({
    name: 'createdAt',
    type: 'datetime',
    default: "datetime('now')",
    isNullable: false,
  }),
  new TableColumn({
    name: 'updatedAt',
    type: 'datetime',
    default: "datetime('now')",
    isNullable: false,
  }),
  new TableColumn({
    name: 'markedForUpload',
    type: 'boolean',
    default: 1,
    isNullable: false,
  }),
  new TableColumn({
    name: 'uploadedAt',
    type: 'datetime',
  }),
];

const ReferenceDataTable = new Table({
  name: 'reference_data',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'name',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'code',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'type',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'visibilityStatus',
      type: 'varchar',
      default: "'current'",
      isNullable: false,
    }),
  ],
});

const DiagnosisTable = new Table({
  name: 'diagnosis',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'isPrimary',
      type: 'boolean',
    }),
    new TableColumn({
      name: 'date',
      type: 'datetime',
      isNullable: false,
    }),
    new TableColumn({
      name: 'certainty',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'diagnosisId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'encounterId',
      type: 'varchar',
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
});

const MedicationTable = new Table({
  name: 'medication',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'date',
      type: 'datetime',
      isNullable: false,
    }),
    new TableColumn({
      name: 'endDate',
      type: 'datetime',
    }),
    new TableColumn({
      name: 'prescription',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'note',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'indication',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'route',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'quantity',
      type: 'integer',
      isNullable: false,
    }),
    new TableColumn({
      name: 'qtyMorning',
      type: 'integer',
    }),
    new TableColumn({
      name: 'qtyLunch',
      type: 'integer',
    }),
    new TableColumn({
      name: 'qtyEvening',
      type: 'integer',
    }),
    new TableColumn({
      name: 'qtyNight',
      type: 'integer',
    }),
    new TableColumn({
      name: 'medicationId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'encounterId',
      type: 'varchar',
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
});

const ProgramTable = new Table({
  name: 'program',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'name',
      type: 'varchar',
    }),
  ],
});

const SurveyTable = new Table({
  name: 'survey',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'surveyType',
      type: 'varchar',
      default: "'programs'",
    }),
    new TableColumn({
      name: 'name',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'isSensitive',
      type: 'boolean',
      isNullable: false,
      default: 0,
    }),
    new TableColumn({
      name: 'programId',
      type: 'varchar',
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['programId'],
      referencedTableName: 'program',
      referencedColumnNames: ['id'],
    }),
  ],
});

const ProgramDataElementTable = new Table({
  name: 'program_data_element',
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
      name: 'defaultText',
      type: 'varchar',
      default: "''",
    }),
    new TableColumn({
      name: 'defaultOptions',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'type',
      type: 'text',
      isNullable: false,
    }),
  ],
});

const SurveyResponseAnswerTable = new Table({
  name: 'survey_response_answer',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'name',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'body',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'responseId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'dataElementId',
      type: 'varchar',
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
});

const PatientAdditionalDataTable = new Table({
  name: 'patient_additional_data',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'placeOfBirth',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'title',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'bloodType',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'primaryContactNumber',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'secondaryContactNumber',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'maritalStatus',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'cityTown',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'streetVillage',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'educationalLevel',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'socialMedia',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'birthCertificate',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'drivingLicense',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'passport',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'emergencyContactName',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'emergencyContactNumber',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'religionId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'patientBillingTypeId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'countryOfBirthId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'markedForSync',
      type: 'boolean',
      isNullable: false,
      default: 0,
    }),
    new TableColumn({
      name: 'patientId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'nationalityId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'countryId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'divisionId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'subdivisionId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'medicalAreaId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'nursingZoneId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'settlementId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'ethnicityId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'occupationId',
      type: 'varchar',
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
});

const SurveyResponseTable = new Table({
  name: 'survey_response',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'startTime',
      type: 'datetime',
    }),
    new TableColumn({
      name: 'endTime',
      type: 'datetime',
    }),
    new TableColumn({
      name: 'result',
      type: 'integer',
      default: "''",
    }),
    new TableColumn({
      name: 'resultText',
      type: 'varchar',
      default: "''",
    }),
    new TableColumn({
      name: 'surveyId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'encounterId',
      type: 'varchar',
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
});

const ReferralTable = new Table({
  name: 'referral',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'referredFacility',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'initiatingEncounterId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'completingEncounterId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'surveyResponseId',
      type: 'varchar',
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
      referencedTableName: 'survey',
      referencedColumnNames: ['id'],
    }),
  ],
});

const DepartmentTable = new Table({
  name: 'department',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'code',
      type: 'varchar',
      isNullable: false,
      default: "''",
    }),
    new TableColumn({
      name: 'name',
      type: 'varchar',
      isNullable: false,
      default: "''",
    }),
    new TableColumn({
      name: 'visibilityStatus',
      type: 'varchar',
      isNullable: false,
      default: "'current'",
    }),
    new TableColumn({
      name: 'facilityId',
      type: 'varchar',
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['facilityId'],
      referencedTableName: 'facility',
      referencedColumnNames: ['id'],
    }),
  ],
});

const FacilityTable = new Table({
  name: 'facility',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'code',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'name',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'contactNumber',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'email',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'streetAddress',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'cityTown',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'division',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'type',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'visibilityStatus',
      type: 'varchar',
      isNullable: false,
      default: "'current'",
    }),
  ],
});

const LocationTable = new Table({
  name: 'location',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'code',
      type: 'varchar',
      isNullable: false,
      default: "''",
    }),
    new TableColumn({
      name: 'name',
      type: 'varchar',
      isNullable: false,
      default: "''",
    }),
    new TableColumn({
      name: 'visibilityStatus',
      type: 'varchar',
      isNullable: false,
      default: "'current'",
    }),
    new TableColumn({
      name: 'facilityId',
      type: 'varchar',
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['facilityId'],
      referencedTableName: 'facility',
      referencedColumnNames: ['id'],
    }),
  ],
});

const ScheduledVaccineTable = new Table({
  name: 'scheduled_vaccine',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'index',
      type: 'integer',
    }),
    new TableColumn({
      name: 'label',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'schedule',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'weeksFromBirthDue',
      type: 'integer',
    }),
    new TableColumn({
      name: 'weeksFromLastVaccinationDue',
      type: 'integer',
    }),
    new TableColumn({
      name: 'category',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'visibilityStatus',
      type: 'varchar',
      isNullable: false,
      default: "''",
    }),
    new TableColumn({
      name: 'vaccineId',
      type: 'varchar',
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['vaccineId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
  ],
});

const AdministeredVaccineTable = new Table({
  name: 'administered_vaccine',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'batch',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'status',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'reason',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'injectionSite',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'consent',
      type: 'boolean',
      default: 1,
    }),
    new TableColumn({
      name: 'date',
      type: 'datetime',
      isNullable: false,
    }),
    new TableColumn({
      name: 'givenBy',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'encounterId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'scheduledVaccineId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'recorderId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'locationId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'departmentId',
      type: 'varchar',
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
});

const LabTestTypeTable = new Table({
  name: 'labTestType',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'code',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'name',
      type: 'varchar',
      isNullable: false,
      default: "''",
    }),
    new TableColumn({
      name: 'unit',
      type: 'varchar',
      isNullable: false,
      default: "''",
    }),
    new TableColumn({
      name: 'maleMin',
      type: 'integer',
    }),
    new TableColumn({
      name: 'maleMax',
      type: 'integer',
    }),
    new TableColumn({
      name: 'femaleMin',
      type: 'integer',
    }),
    new TableColumn({
      name: 'femaleMax',
      type: 'integer',
    }),
    new TableColumn({
      name: 'rangeText',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'resultType',
      type: 'varchar',
      isNullable: false,
      default: "'Number'",
    }),
    new TableColumn({
      name: 'options',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'visibilityStatus',
      type: 'varchar',
      isNullable: false,
      default: "'current'",
    }),
    new TableColumn({
      name: 'labTestCategoryId',
      type: 'varchar',
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['labTestCategoryId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
  ],
});

const LabTestTable = new Table({
  name: 'labTest',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'sampleTime',
      type: 'datetime',
      isNullable: false,
      default: 'CURRENT_TIMESTAMP',
    }),
    new TableColumn({
      name: 'status',
      type: 'varchar',
      isNullable: false,
      default: "'reception_pending'",
    }),
    new TableColumn({
      name: 'result',
      type: 'varchar',
      isNullable: false,
      default: "''",
    }),
    new TableColumn({
      name: 'labRequestId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'categoryId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'labTestTypeId',
      type: 'varchar',
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
});

const LabRequestTable = new Table({
  name: 'labRequest',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'sampleTime',
      type: 'varchar',
      isNullable: false,
      default: "strftime('%Y-%m-%d %H:%M:%S', CURRENT_TIMESTAMP)",
    }),
    new TableColumn({
      name: 'requestedDate',
      type: 'varchar',
      isNullable: false,
      default: "strftime('%Y-%m-%d %H:%M:%S', CURRENT_TIMESTAMP)",
    }),
    new TableColumn({
      name: 'urgent',
      type: 'boolean',
      default: 0,
    }),
    new TableColumn({
      name: 'specimenAttached',
      type: 'boolean',
      default: 0,
    }),
    new TableColumn({
      name: 'status',
      type: 'varchar',
      default: "'reception_pending'",
    }),
    new TableColumn({
      name: 'senaiteId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'sampleId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'displayId',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'note',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'encounterId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'requestedById',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'labTestCategoryId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'labTestPriorityId',
      type: 'varchar',
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
});

const UserTable = new Table({
  name: 'user',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'email',
      type: 'varchar',
      isNullable: false,
      isUnique: true,
    }),
    new TableColumn({
      name: 'localPassword',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'displayName',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'role',
      type: 'varchar',
      isNullable: false,
    }),
  ],
  indices: [
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
      isNullable: false,
    }),
    new TableColumn({
      name: 'weight',
      type: 'integer',
    }),
    new TableColumn({
      name: 'height',
      type: 'integer',
    }),
    new TableColumn({
      name: 'sbp',
      type: 'integer',
    }),
    new TableColumn({
      name: 'dbp',
      type: 'integer',
    }),
    new TableColumn({
      name: 'heartRate',
      type: 'integer',
    }),
    new TableColumn({
      name: 'respiratoryRate',
      type: 'integer',
    }),
    new TableColumn({
      name: 'temperature',
      type: 'integer',
    }),
    new TableColumn({
      name: 'spO2',
      type: 'integer',
    }),
    new TableColumn({
      name: 'avpu',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'gcs',
      type: 'integer',
    }),
    new TableColumn({
      name: 'hemoglobin',
      type: 'integer',
    }),
    new TableColumn({
      name: 'fastingBloodGlucose',
      type: 'integer',
    }),
    new TableColumn({
      name: 'urinePh',
      type: 'integer',
    }),
    new TableColumn({
      name: 'urineLeukocytes',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'urineNitrites',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'urobilinogen',
      type: 'integer',
    }),
    new TableColumn({
      name: 'urineProtein',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'bloodInUrine',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'urineSpecificGravity',
      type: 'integer',
    }),
    new TableColumn({
      name: 'urineKetone',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'urineBilirubin',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'urineGlucose',
      type: 'integer',
    }),
    new TableColumn({
      name: 'encounterId',
      type: 'varchar',
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['encounterId'],
      referencedTableName: 'encounter',
      referencedColumnNames: ['id'],
    }),
  ],
});

const EncounterTable = new Table({
  name: 'encounter',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'encounterType',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'startDate',
      type: 'datetime',
      isNullable: false,
    }),
    new TableColumn({
      name: 'endDate',
      type: 'datetime',
    }),
    new TableColumn({
      name: 'reasonForEncounter',
      type: 'varchar',
      default: "''",
    }),
    new TableColumn({
      name: 'medication',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'deviceId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'patientBillingTypeId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'patientId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'examinerId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'departmentId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'locationId',
      type: 'varchar',
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
    }),
    new TableColumn({
      name: 'recordedDate',
      type: 'datetime',
      isNullable: false,
    }),
    new TableColumn({
      name: 'type',
      type: 'text',
      isNullable: false,
    }),
    new TableColumn({
      name: 'patientId',
      type: 'varchar',
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['patientId'],
      referencedTableName: 'patient',
      referencedColumnNames: ['id'],
    }),
  ],
});

const PatientSecondaryIdTable = new Table({
  name: 'patient_secondary_id',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'value',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'visibilityStatus',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'typeId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'patientId',
      type: 'varchar',
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
});

const PatientTable = new Table({
  name: 'patient',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'displayId',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'title',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'firstName',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'middleName',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'lastName',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'culturalName',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'dateOfBirth',
      type: 'datetime',
    }),
    new TableColumn({
      name: 'email',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'sex',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'villageId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'markedForSync',
      type: 'boolean',
      isNullable: false,
      default: 0,
    }),
  ],
  indices: [
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
    }),
    new TableColumn({
      name: 'componentIndex',
      type: 'integer',
    }),
    new TableColumn({
      name: 'text',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'visibilityCriteria',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'validationCriteria',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'detail',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'config',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'options',
      type: 'text',
    }),
    new TableColumn({
      name: 'calculation',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'surveyId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'dataElementId',
      type: 'varchar',
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
});

const AttachmentTable = new Table({
  name: 'attachment',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'size',
      type: 'integer',
    }),
    new TableColumn({
      name: 'type',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'data',
      type: 'blob',
    }),
    new TableColumn({
      name: 'filePath',
      type: 'varchar',
      isNullable: false,
    }),
  ],
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
