import { QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

const baseIndex = new TableIndex({
  columnNames: ['markedForUpload'],
});

const BaseColumns = [
  {
    name: 'id',
    type: 'varchar',
    isPrimary: true,
    isNullable: false,
  },
  {
    name: 'createdAt',
    type: 'datetime',
    default: "datetime('now')",
    isNullable: false,
  },
  {
    name: 'updatedAt',
    type: 'datetime',
    default: "datetime('now')",
    isNullable: false,
  },
  {
    name: 'markedForUpload',
    type: 'boolean',
    default: true,
    isNullable: false,
  },
  {
    name: 'uploadedAt',
    type: 'datetime',
  },
];

const ReferenceDataTable = new Table({
  name: 'reference_data',
  columns: [
    ...BaseColumns,
    {
      name: 'name',
      type: 'varchar',
      isNullable: false,
    },
    {
      name: 'code',
      type: 'varchar',
      isNullable: false,
    },
    {
      name: 'type',
      type: 'varchar',
      isNullable: false,
    },
    {
      name: 'visibilityStatus',
      type: 'varchar',
      default: 'current',
      isNullable: false,
    },
  ],
});

const DiagnosisTable = new Table({
  name: 'diagnosis',
  columns: [
    ...BaseColumns,
    {
      name: 'isPrimary',
      type: 'boolean',
    },
    {
      name: 'date',
      type: 'datetime',
      isNullable: false,
    },
    {
      name: 'certainty',
      type: 'varchar',
    },
    {
      name: 'diagnosisId',
      type: 'varchar',
    },
    {
      name: 'encounterId',
      type: 'varchar',
    },
  ],
});

const MedicationTable = new Table({
  name: 'medication',
  columns: [
    ...BaseColumns,
    {
      name: 'date',
      type: 'datetime',
      isNullable: false,
    },
    {
      name: 'endDate',
      type: 'datetime',
    },
    {
      name: 'prescription',
      type: 'varchar',
    },
    {
      name: 'note',
      type: 'varchar',
    },
    {
      name: 'indication',
      type: 'varchar',
    },
    {
      name: 'route',
      type: 'varchar',
    },
    {
      name: 'quantity',
      type: 'integer',
      isNullable: false,
    },
    {
      name: 'qtyMorning',
      type: 'integer',
    },
    {
      name: 'qtyLunch',
      type: 'integer',
    },
    {
      name: 'qtyEvening',
      type: 'integer',
    },
    {
      name: 'qtyNight',
      type: 'integer',
    },
    {
      name: 'medicationId',
      type: 'varchar',
    },
    {
      name: 'encounterId',
      type: 'varchar',
    },
  ],
});

const ProgramTable = new Table({
  name: 'program',
  columns: [
    ...BaseColumns,
    {
      name: 'name',
      type: 'varchar',
    },
  ],
});

const SurveyTable = new Table({
  name: '',
  columns: [
    ...BaseColumns,
    {
      name: 'surveyType',
      type: 'varchar',
      default: 'programs',
    },
    {
      name: 'name',
      type: 'varchar',
    },
    {
      name: 'isSensitive',
      type: 'boolean',
      isNullable: false,
      default: false,
    },
    {
      name: 'programId',
      type: 'varchar',
    },
  ],
});

const ProgramDataElementTable = new Table({
  name: 'program_data_element',
  columns: [
    ...BaseColumns,
    {
      name: 'code',
      type: 'varchar',
    },
    {
      name: 'name',
      type: 'varchar',
      default: '',
    },
    {
      name: 'defaultText',
      type: 'varchar',
      default: '',
    },
    {
      name: 'defaultOptions',
      type: 'varchar',
    },
    {
      name: 'type',
      type: 'text',
      isNullable: false,
    },
  ],
});

const SurveyResponseAnswerTable = new Table({
  name: 'survey_response_answer',
  columns: [
    ...BaseColumns,
    {
      name: 'name',
      type: 'varchar',
    },
    {
      name: 'body',
      type: 'varchar',
    },
    {
      name: 'responseId',
      type: 'varchar',
    },
    {
      name: 'dataElementId',
      type: 'varchar',
    },
  ],
});

const PatientAdditionalDataTable = new Table({
  name: 'patient_additional_data',
  columns: [
    ...BaseColumns,
    {
      name: 'placeOfBirth',
      type: 'varchar',
    },
    {
      name: 'title',
      type: 'varchar',
    },
    {
      name: 'bloodType',
      type: 'varchar',
    },
    {
      name: 'primaryContactNumber',
      type: 'varchar',
    },
    {
      name: 'secondaryContactNumber',
      type: 'varchar',
    },
    {
      name: 'maritalStatus',
      type: 'varchar',
    },
    {
      name: 'cityTown',
      type: 'varchar',
    },
    {
      name: 'streetVillage',
      type: 'varchar',
    },
    {
      name: 'educationalLevel',
      type: 'varchar',
    },
    {
      name: 'socialMedia',
      type: 'varchar',
    },
    {
      name: 'birthCertificate',
      type: 'varchar',
    },
    {
      name: 'drivingLicense',
      type: 'varchar',
    },
    {
      name: 'passport',
      type: 'varchar',
    },
    {
      name: 'emergencyContactName',
      type: 'varchar',
    },
    {
      name: 'emergencyContactNumber',
      type: 'varchar',
    },
    {
      name: 'religionId',
      type: 'varchar',
    },
    {
      name: 'patientBillingTypeId',
      type: 'varchar',
    },
    {
      name: 'countryOfBirthId',
      type: 'varchar',
    },
    {
      name: 'markedForSync',
      type: 'boolean',
      isNullable: false,
      default: false,
    },
    {
      name: 'patientId',
      type: 'varchar',
    },
    {
      name: 'nationalityId',
      type: 'varchar',
    },
    {
      name: 'countryId',
      type: 'varchar',
    },
    {
      name: 'divisionId',
      type: 'varchar',
    },
    {
      name: 'subdivisionId',
      type: 'varchar',
    },
    {
      name: 'medicalAreaId',
      type: 'varchar',
    },
    {
      name: 'nursingZoneId',
      type: 'varchar',
    },
    {
      name: 'settlementId',
      type: 'varchar',
    },
    {
      name: 'ethnicityId',
      type: 'varchar',
    },
    {
      name: 'occupationId',
      type: 'varchar',
    },
  ],
});

const SurveyResponseTable = new Table({
  name: 'survey_response',
  columns: [
    ...BaseColumns,
    {
      name: 'startTime',
      type: 'datetime',
    },
    {
      name: 'endTime',
      type: 'datetime',
    },
    {
      name: 'result',
      type: 'integer',
      default: '',
    },
    {
      name: 'resultText',
      type: 'varchar',
      default: '',
    },
    {
      name: 'surveyId',
      type: 'varchar',
    },
    {
      name: 'encounterId',
      type: 'varchar',
    },
  ],
});

const ReferralTable = new Table({
  name: 'referral',
  columns: [
    ...BaseColumns,
    {
      name: 'referredFacility',
      type: 'varchar',
    },
    {
      name: 'initiatingEncounterId',
      type: 'varchar',
    },
    {
      name: 'completingEncounterId',
      type: 'varchar',
    },
    {
      name: 'surveyResponseId',
      type: 'varchar',
    },
  ],
});

const DepartmentTable = new Table({
  name: 'department',
  columns: [
    ...BaseColumns,
    {
      name: 'code',
      type: 'varchar',
      isNullable: false,
      default: '',
    },
    {
      name: 'name',
      type: 'varchar',
      isNullable: false,
      default: '',
    },
    {
      name: 'visibilityStatus',
      type: 'varchar',
      isNullable: false,
      default: 'current',
    },
    {
      name: 'facilityId',
      type: 'varchar',
    },
  ],
});

const FacilityTable = new Table({
  name: 'facility',
  columns: [
    ...BaseColumns,
    {
      name: 'code',
      type: 'varchar',
    },
    {
      name: 'name',
      type: 'varchar',
    },
    {
      name: 'contactNumber',
      type: 'varchar',
    },
    {
      name: 'email',
      type: 'varchar',
    },
    {
      name: 'streetAddress',
      type: 'varchar',
    },
    {
      name: 'cityTown',
      type: 'varchar',
    },
    {
      name: 'division',
      type: 'varchar',
    },
    {
      name: 'type',
      type: 'varchar',
    },
    {
      name: 'visibilityStatus',
      type: 'varchar',
      isNullable: false,
      default: 'current',
    },
  ],
});

const LocationTable = new Table({
  name: 'location',
  columns: [
    ...BaseColumns,
    {
      name: 'code',
      type: 'varchar',
      isNullable: false,
      default: '',
    },
    {
      name: 'name',
      type: 'varchar',
      isNullable: false,
      default: '',
    },
    {
      name: 'visibilityStatus',
      type: 'varchar',
      isNullable: false,
      default: 'current',
    },
    {
      name: 'facilityId',
      type: 'varchar',
    },
  ],
});

const ScheduledVaccineTable = new Table({
  name: '',
  columns: [
    ...BaseColumns,
    {
      name: 'index',
      type: 'integer',
    },
    {
      name: 'label',
      type: 'varchar',
    },
    {
      name: 'schedule',
      type: 'varchar',
    },
    {
      name: 'weeksFromBirthDue',
      type: 'integer',
    },
    {
      name: 'weeksFromLastVaccinationDue',
      type: 'integer',
    },
    {
      name: 'category',
      type: 'varchar',
    },
    {
      name: 'visibilityStatus',
      type: 'varchar',
      isNullable: false,
      default: '',
    },
    {
      name: 'vaccineId',
      type: 'varchar',
    },
  ],
});

const AdministeredVaccineTable = new Table({
  name: 'administered_vaccine',
  columns: [
    ...BaseColumns,
    {
      name: 'batch',
      type: 'varchar',
    },
    {
      name: 'status',
      type: 'varchar',
      isNullable: false,
    },
    {
      name: 'reason',
      type: 'varchar',
    },
    {
      name: 'injectionSite',
      type: 'varchar',
    },
    {
      name: 'consent',
      type: 'boolean',
      default: true,
    },
    {
      name: 'date',
      type: 'datetime',
      isNullable: false,
    },
    {
      name: 'givenBy',
      type: 'varchar',
    },
    {
      name: 'encounterId',
      type: 'varchar',
    },
    {
      name: 'scheduledVaccineId',
      type: 'varchar',
    },
    {
      name: 'recorderId',
      type: 'varchar',
    },
    {
      name: 'locationId',
      type: 'varchar',
    },
    {
      name: 'departmentId',
      type: 'varchar',
    },
  ],
});

const LabTestTypeTable = new Table({
  name: 'labTestType',
  columns: [
    ...BaseColumns,
    {
      name: 'code',
      type: 'varchar',
      isNullable: false,
    },
    {
      name: 'name',
      type: 'varchar',
      isNullable: false,
      default: '',
    },
    {
      name: 'unit',
      type: 'varchar',
      isNullable: false,
      default: '',
    },
    {
      name: 'maleMin',
      type: 'integer',
    },
    {
      name: 'maleMax',
      type: 'integer',
    },
    {
      name: 'femaleMin',
      type: 'integer',
    },
    {
      name: 'femaleMax',
      type: 'integer',
    },
    {
      name: 'rangeText',
      type: 'varchar',
    },
    {
      name: 'resultType',
      type: 'varchar',
      isNullable: false,
      default: 'Number',
    },
    {
      name: 'options',
      type: 'varchar',
    },
    {
      name: 'visibilityStatus',
      type: 'varchar',
      isNullable: false,
      default: 'current',
    },
    {
      name: 'labTestCategoryId',
      type: 'varchar',
    },
  ],
});

const LabTestTable = new Table({
  name: 'labTest',
  columns: [
    ...BaseColumns,
    {
      name: 'sampleTime',
      type: 'datetime',
      isNullable: false,
      default: 'CURRENT_TIMESTAMP',
    },
    {
      name: 'status',
      type: 'varchar',
      isNullable: false,
      default: 'reception_pending',
    },
    {
      name: 'result',
      type: 'varchar',
      isNullable: false,
      default: '',
    },
    {
      name: 'labRequestId',
      type: 'varchar',
    },
    {
      name: 'categoryId',
      type: 'varchar',
    },
    {
      name: 'labTestTypeId',
      type: 'varchar',
    },
  ],
});

const LabRequestTable = new Table({
  name: 'labRequest',
  columns: [
    ...BaseColumns,
    {
      name: 'sampleTime',
      type: 'varchar',
      isNullable: false,
      default: "strftime('%Y-%m-%d %H:%M:%S', CURRENT_TIMESTAMP)",
    },
    {
      name: 'requestedDate',
      type: 'varchar',
      isNullable: false,
      default: "strftime('%Y-%m-%d %H:%M:%S', CURRENT_TIMESTAMP)",
    },
    {
      name: 'urgent',
      type: 'boolean',
      default: false,
    },
    {
      name: 'specimenAttached',
      type: 'boolean',
      default: false,
    },
    {
      name: 'status',
      type: 'varchar',
      default: 'reception_pending',
    },
    {
      name: 'senaiteId',
      type: 'varchar',
    },
    {
      name: 'sampleId',
      type: 'varchar',
    },
    {
      name: 'displayId',
      type: 'varchar',
      isNullable: false,
    },
    {
      name: 'note',
      type: 'varchar',
    },
    {
      name: 'encounterId',
      type: 'varchar',
    },
    {
      name: 'requestedById',
      type: 'varchar',
    },
    {
      name: 'labTestCategoryId',
      type: 'varchar',
    },
    {
      name: 'labTestPriorityId',
      type: 'varchar',
    },
  ],
});

const UserTable = new Table({
  name: 'user',
  columns: [
    ...BaseColumns,
    {
      name: 'email',
      type: 'varchar',
      isNullable: false,
      isUnique: true,
    },
    {
      name: 'localPassword',
      type: 'varchar',
    },
    {
      name: 'displayName',
      type: 'varchar',
      isNullable: false,
    },
    {
      name: 'role',
      type: 'varchar',
      isNullable: false,
    },
  ],
});

const VitalsTable = new Table({
  name: 'vitals',
  columns: [
    ...BaseColumns,
    {
      name: 'dateRecorded',
      type: 'datetime',
      isNullable: false,
    },
    {
      name: 'weight',
      type: 'integer',
    },
    {
      name: 'height',
      type: 'integer',
    },
    {
      name: 'sbp',
      type: 'integer',
    },
    {
      name: 'dbp',
      type: 'integer',
    },
    {
      name: 'heartRate',
      type: 'integer',
    },
    {
      name: 'respiratoryRate',
      type: 'integer',
    },
    {
      name: 'temperature',
      type: 'integer',
    },
    {
      name: 'spO2',
      type: 'integer',
    },
    {
      name: 'avpu',
      type: 'varchar',
    },
    {
      name: 'gcs',
      type: 'integer',
    },
    {
      name: 'hemoglobin',
      type: 'integer',
    },
    {
      name: 'fastingBloodGlucose',
      type: 'integer',
    },
    {
      name: 'urinePh',
      type: 'integer',
    },
    {
      name: 'urineLeukocytes',
      type: 'varchar',
    },
    {
      name: 'urineNitrites',
      type: 'varchar',
    },
    {
      name: 'urobilinogen',
      type: 'integer',
    },
    {
      name: 'urineProtein',
      type: 'varchar',
    },
    {
      name: 'bloodInUrine',
      type: 'varchar',
    },
    {
      name: 'urineSpecificGravity',
      type: 'integer',
    },
    {
      name: 'urineKetone',
      type: 'varchar',
    },
    {
      name: 'urineBilirubin',
      type: 'varchar',
    },
    {
      name: 'urineGlucose',
      type: 'integer',
    },
    {
      name: 'encounterId',
      type: 'varchar',
    },
  ],
});

const EncounterTable = new Table({
  name: 'encounter',
  columns: [
    ...BaseColumns,
    {
      name: 'encounterType',
      type: 'varchar',
      isNullable: false,
    },
    {
      name: 'startDate',
      type: 'datetime',
      isNullable: false,
    },
    {
      name: 'endDate',
      type: 'datetime',
    },
    {
      name: 'reasonForEncounter',
      type: 'varchar',
      default: '',
    },
    {
      name: 'medication',
      type: 'varchar',
    },
    {
      name: 'deviceId',
      type: 'varchar',
    },
    {
      name: 'patientBillingTypeId',
      type: 'varchar',
    },
    {
      name: 'patientId',
      type: 'varchar',
    },
    {
      name: 'examinerId',
      type: 'varchar',
    },
    {
      name: 'departmentId',
      type: 'varchar',
    },
    {
      name: 'locationId',
      type: 'varchar',
    },
  ],
});

const PatientIssueTable = new Table({
  name: 'patient_issue',
  columns: [
    ...BaseColumns,
    {
      name: 'note',
      type: 'varchar',
    },
    {
      name: 'recordedDate',
      type: 'datetime',
      isNullable: false,
    },
    {
      name: 'type',
      type: 'text',
      isNullable: false,
    },
    {
      name: 'patientId',
      type: 'varchar',
    },
  ],
});

const PatientSecondaryIdTable = new Table({
  name: 'patient_secondary_id',
  columns: [
    ...BaseColumns,
    {
      name: 'value',
      type: 'varchar',
      isNullable: false,
    },
    {
      name: 'visibilityStatus',
      type: 'varchar',
      isNullable: false,
    },
    {
      name: 'typeId',
      type: 'varchar',
    },
    {
      name: 'patientId',
      type: 'varchar',
    },
  ],
});

const PatientTable = new Table({
  name: 'patient',
  columns: [
    ...BaseColumns,
    {
      name: 'displayId',
      type: 'varchar',
      isNullable: false,
    },
    {
      name: 'title',
      type: 'varchar',
    },
    {
      name: 'firstName',
      type: 'varchar',
    },
    {
      name: 'middleName',
      type: 'varchar',
    },
    {
      name: 'lastName',
      type: 'varchar',
    },
    {
      name: 'culturalName',
      type: 'varchar',
    },
    {
      name: 'dateOfBirth',
      type: 'datetime',
    },
    {
      name: 'email',
      type: 'varchar',
    },
    {
      name: 'sex',
      type: 'varchar',
      isNullable: false,
    },
    {
      name: 'villageId',
      type: 'varchar',
    },
    {
      name: 'markedForSync',
      type: 'boolean',
      isNullable: false,
      default: false,
    },
  ],
});

const SurveyScreenComponentTable = new Table({
  name: 'survey_screen_component',
  columns: [
    ...BaseColumns,
    {
      name: 'screenIndex',
      type: 'integer',
    },
    {
      name: 'componentIndex',
      type: 'integer',
    },
    {
      name: 'text',
      type: 'varchar',
    },
    {
      name: 'visibilityCriteria',
      type: 'varchar',
    },
    {
      name: 'validationCriteria',
      type: 'varchar',
    },
    {
      name: 'detail',
      type: 'varchar',
    },
    {
      name: 'config',
      type: 'varchar',
    },
    {
      name: 'options',
      type: 'text',
    },
    {
      name: 'calculation',
      type: 'varchar',
    },
    {
      name: 'surveyId',
      type: 'varchar',
    },
    {
      name: 'dataElementId',
      type: 'varchar',
    },
  ],
});

const AttachmentTable = new Table({
  name: 'attachment',
  columns: [
    ...BaseColumns,
    {
      name: 'size',
      type: 'integer',
    },
    {
      name: 'type',
      type: 'varchar',
      isNullable: false,
    },
    {
      name: 'data',
      type: 'blob',
    },
    {
      name: 'filePath',
      type: 'varchar',
      isNullable: false,
    },
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

export const INDEX_DEFINITIONS = [
  {
    tableName: 'user',
    tableIndex: new TableIndex({
      columnNames: ['email'],
    }),
  },
  {
    tableName: 'encounter',
    tableIndex: new TableIndex({
      columnNames: ['patientId'],
    }),
  },
  {
    tableName: 'patient',
    tableIndex: new TableIndex({
      columnNames: ['villageId'],
    }),
  },
];

export const FK_DEFINITIONS = [
  {
    tableName: 'diagnosis',
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
  },
  {
    tableName: 'medication',
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
  },
  {
    tableName: 'survey',
    foreignKeys: [
      new TableForeignKey({
        columnNames: ['programId'],
        referencedTableName: 'program',
        referencedColumnNames: ['id'],
      }),
    ],
  },
  {
    tableName: 'survey_response_answer',
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
  },
  {
    tableName: 'patient_additional_data',
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
  },
  {
    tableName: 'survey_response',
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
  },
  {
    tableName: 'referral',
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
  },
  {
    tableName: 'department',
    foreignKeys: [
      new TableForeignKey({
        columnNames: ['facilityId'],
        referencedTableName: 'facility',
        referencedColumnNames: ['id'],
      }),
    ],
  },
  {
    tableName: 'location',
    foreignKeys: [
      new TableForeignKey({
        columnNames: ['facilityId'],
        referencedTableName: 'facility',
        referencedColumnNames: ['id'],
      }),
    ],
  },
  {
    tableName: 'scheduled_vaccine',
    foreignKeys: [
      new TableForeignKey({
        columnNames: ['vaccineId'],
        referencedTableName: 'reference_data',
        referencedColumnNames: ['id'],
      }),
    ],
  },
  {
    tableName: 'administered_vaccine',
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
  },
  {
    tableName: 'labTestType',
    foreignKeys: [
      new TableForeignKey({
        columnNames: ['labTestCategoryId'],
        referencedTableName: 'reference_data',
        referencedColumnNames: ['id'],
      }),
    ],
  },
  {
    tableName: 'labTest',
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
  },
  {
    tableName: 'labRequest',
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
  },
  {
    tableName: 'vitals',
    foreignKeys: [
      new TableForeignKey({
        columnNames: ['encounterId'],
        referencedTableName: 'encounter',
        referencedColumnNames: ['id'],
      }),
    ],
  },
  {
    tableName: 'encounter',
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
  },
  {
    tableName: 'patient_issue',
    foreignKeys: [
      new TableForeignKey({
        columnNames: ['patientId'],
        referencedTableName: 'patient',
        referencedColumnNames: ['id'],
      }),
    ],
  },
  {
    tableName: 'patient_secondary_id',
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
  },
  {
    tableName: 'patient',
    foreignKeys: [
      new TableForeignKey({
        columnNames: ['villageId'],
        referencedTableName: 'reference_data',
        referencedColumnNames: ['id'],
      }),
    ],
  },
  {
    tableName: 'survey_screen_component',
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
  },
];

export const createTableWithBaseIndex = async (
  queryRunner: QueryRunner,
  table: Table,
): Promise<void> => {
  await queryRunner.createTable(table);
  await queryRunner.createIndex(table.name, baseIndex);
};
