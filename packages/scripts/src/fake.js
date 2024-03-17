const {
  REPORT_STATUSES,
  NOTE_RECORD_TYPES,
  REPORT_DB_SCHEMAS
} = require('@tamanu/constants');
const { fake } = require('@tamanu/shared/test-helpers/fake');
const { initDatabase } = require('@tamanu/shared/services/database');
const config = require('config');

// generate fake data enough to test recent migrations
async function generateData(models) {
  const {
    Department,
    Encounter,
    Facility,
    Location,
    EncounterHistory,
    Patient,
    User,
    Note,
    PatientBirthData,
    SurveyScreenComponent,
    ReferenceDataRelation,
    ReportDefinition,
    ReportDefinitionVersion,
    LabRequestLog,
    LabRequest,
    UserPreference,
    ProgramDataElement,
    Program,
    ProgramRegistry,
    ProgramRegistryCondition,
    ProgramRegistryClinicalStatus,
    PatientProgramRegistration,
    PatientProgramRegistrationCondition,
  } = models;

  const examiner = await User.create(fake(User));
  const patient = await Patient.create(fake(Patient));
  const facility = await Facility.create(fake(Facility));
  const department = await Department.create(
    fake(Department, {
      facilityId: facility.id,
    }),
  );
  const location = await Location.create(
    fake(Location, {
      facilityId: facility.id,
    }),
  );
  const encounter = await Encounter.create(
    fake(Encounter, {
      patientId: patient.id,
      departmentId: department.id,
      locationId: location.id,
      examinerId: examiner.id,
      startDate: '2023-12-21T04:59:51.851Z',
    }),
  );
  await EncounterHistory.create(
    fake(EncounterHistory, {
      examinerId: examiner.id,
      encounterId: encounter.id,
      departmentId: department.id,
      locationId: location.id,
    }),
  );
  await Note.create(
    fake(Note, {
      recordType: NOTE_RECORD_TYPES.ENCOUNTER,
      recordId: encounter.id,
      authorId: examiner.id,
    }),
  );
  await PatientBirthData.create(
    fake(PatientBirthData, {
      patientId: patient.id,
      facilityId: facility.id,
    }),
  );
  await SurveyScreenComponent.create(
    fake(SurveyScreenComponent, {
      option: '{"foo":"bar"}',
      config: '{"source": "ReferenceData", "where": {"type": "facility"}}',
    }),
  );
  const reportDefinition = await ReportDefinition.create(
    fake(ReportDefinition, {
      dbSchema: REPORT_DB_SCHEMAS.REPORTING,
    }),
  );
  await ReportDefinitionVersion.create(
    fake(ReportDefinitionVersion, {
      status: REPORT_STATUSES.DRAFT,
      queryOptions: `{"parameters": [], "defaultDateRange": "allTime"}`,
      reportDefinitionId: reportDefinition.id,
      userId: examiner.id,
    }),
  );
  const labRequest = await LabRequest.create(
    fake(LabRequest, {
      departmentId: department.id,
      collectedById: examiner.id,
      encounter: encounter.id,
    }),
  );
  await LabRequestLog.create(
    fake(LabRequestLog, {
      status: 'reception_pending',
      labRequestId: labRequest.id,
    }),
  );
  await UserPreference.create(
    fake(UserPreference, {
      userId: examiner.id,
    }),
  );
  await ProgramDataElement.create(
    fake(ProgramDataElement),
  );
  const program = await Program.create(fake(Program));
  const programRegistry = await ProgramRegistry.create(
    fake(ProgramRegistry, {
      programId: program.id,
    }),
  );
  await ProgramRegistryCondition.create(
    fake(ProgramRegistryCondition, {
      programRegistryId: programRegistry.id,
    }),
  );
  await ProgramRegistryClinicalStatus.create(
    fake(ProgramRegistryClinicalStatus, {
      programRegistryId: programRegistry.id,
    }),
  );
  await PatientProgramRegistration.create(
    fake(PatientProgramRegistration, {
      clinicianId: examiner.id,
      patientId: patient.id,
      programRegistryId: programRegistry.id,
    }),
  );
  await PatientProgramRegistrationCondition.create(
    fake(PatientProgramRegistrationCondition, {
      patientId: patient.id,
      programRegistryId: programRegistry.id,
    }),
  );
  await ReferenceDataRelation.create(fake(ReferenceDataRelation));
}

async function generateFake() {
  const store = await initDatabase({ testMode: false, ...config.db });
  if (config.db.migrateOnStartup) await store.sequelize.migrate('up');
  await generateData(store.sequelize.models);
  await store.sequelize.close();
}

generateFake();
