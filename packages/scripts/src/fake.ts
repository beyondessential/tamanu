import {
  IMAGING_REQUEST_STATUS_TYPES,
  IMAGING_TYPES,
  NOTE_RECORD_TYPES,
  REPEAT_FREQUENCY,
  REPORT_DB_SCHEMAS,
  REPORT_STATUSES,
} from '@tamanu/constants';
import type { Models, Sequelize } from '@tamanu/database';

const { fake } = require('@tamanu/shared/test-helpers/fake');

async function generateData(models: Models) {
  const {
    Appointment,
    AppointmentSchedule,
    Department,
    Discharge,
    Encounter,
    Facility,
    Location,
    LocationGroup,
    EncounterHistory,
    Patient,
    User,
    Note,
    PatientBirthData,
    Survey,
    SurveyScreenComponent,
    ReferenceData,
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
    PatientAllergy,
    PatientCommunication,
    PatientAdditionalData,
    PatientDeathData,
    CertificateNotification,
    LabTest,
    LabTestType,
    ScheduledVaccine,
    AdministeredVaccine,
    EncounterDiagnosis,
    Invoice,
    InvoiceDiscount,
    InvoiceInsurer,
    InvoicePayment,
    InvoiceInsurerPayment,
    InvoicePatientPayment,
    InvoiceItem,
    InvoiceItemDiscount,
    InvoiceProduct,
    SurveyResponse,
    ImagingRequest,
    ImagingResult,
    Task,
    TaskDesignation,
    TaskTemplate,
    TaskTemplateDesignation,
    UserDesignation,
  } = models;

  const examiner = await User.create(fake(User));
  const patient = await Patient.create(fake(Patient));
  const facility = await Facility.create(fake(Facility));
  const department = await Department.create(
    fake(Department, {
      facilityId: facility.id,
    }),
  );
  const locationGroup = await LocationGroup.create(
    fake(LocationGroup, {
      facilityId: facility.id,
    }),
  );
  const location = await Location.create(
    fake(Location, {
      facilityId: facility.id,
      locationGroupId: locationGroup.id,
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
  await Discharge.create(
    fake(Discharge, {
      encounterId: encounter.id,
      dischargerId: examiner.id,
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
  const survey = await Survey.create(fake(Survey));
  await SurveyScreenComponent.create(
    fake(SurveyScreenComponent, {
      surveyId: survey.id,
      option: '{"foo":"bar"}',
      config: '{"source": "ReferenceData", "where": {"type": "facility"}}',
    }),
  );
  await SurveyResponse.create(
    fake(SurveyResponse, {
      surveyId: survey.id,
      encounterId: encounter.id,
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
  await ProgramDataElement.create(fake(ProgramDataElement));
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

  await PatientAllergy.create(
    fake(PatientAllergy, {
      patientId: patient.id,
    }),
  );

  await PatientAdditionalData.create(
    fake(PatientAdditionalData, {
      patientId: patient.id,
    }),
  );

  await PatientDeathData.create(
    fake(PatientDeathData, {
      patientId: patient.id,
      clinicianId: examiner.id,
    }),
  );

  const referenceData = await ReferenceData.create(fake(ReferenceData));
  await ReferenceDataRelation.create(fake(ReferenceDataRelation));
  await PatientCommunication.create(
    fake(PatientCommunication, {
      patientId: patient.id,
    }),
  );

  const labTestType = await LabTestType.create(
    fake(LabTestType, {
      labTestCategoryId: referenceData.id,
    }),
  );
  const labTest = await LabTest.create(
    fake(LabTest, {
      labRequestId: labRequest.id,
      categoryId: referenceData.id,
      labTestMethodId: referenceData.id,
      labTestTypeId: labTestType.id,
    }),
  );
  await CertificateNotification.create(
    fake(CertificateNotification, {
      patientId: patient.id,
      labTestId: labTest.id,
      labRequestId: labRequest.id,
    }),
  );

  const scheduledVaccine = await models.ScheduledVaccine.create(
    fake(ScheduledVaccine, {
      vaccineId: referenceData.id,
    }),
  );
  await models.AdministeredVaccine.create(
    fake(AdministeredVaccine, {
      scheduledVaccineId: scheduledVaccine.id,
      encounterId: encounter.id,
    }),
  );

  await EncounterDiagnosis.create(
    fake(EncounterDiagnosis, {
      diagnosisId: referenceData.id,
      encounterId: encounter.id,
    }),
  );
  const invoice = await Invoice.create(
    fake(Invoice, {
      encounterId: encounter.id,
    }),
  );
  await InvoiceDiscount.create(
    fake(InvoiceDiscount, {
      invoiceId: invoice.id,
      appliedByUserId: examiner.id,
    }),
  );
  await InvoiceInsurer.create(
    fake(InvoiceInsurer, {
      invoiceId: invoice.id,
      insurerId: referenceData.id,
    }),
  );
  const invoicePayment = await InvoicePayment.create(
    fake(InvoicePayment, {
      invoiceId: invoice.id,
    }),
  );
  await InvoiceInsurerPayment.create(
    fake(InvoiceInsurerPayment, {
      invoicePaymentId: invoicePayment.id,
      insurerId: referenceData.id,
    }),
  );
  await InvoicePatientPayment.create(
    fake(InvoicePatientPayment, {
      invoicePaymentId: invoicePayment.id,
      methodId: referenceData.id,
    }),
  );
  const invoiceProduct = await InvoiceProduct.create(
    fake(InvoiceProduct, {
      id: referenceData.id,
    }),
  );
  const invoiceItem = await InvoiceItem.create(
    fake(InvoiceItem, {
      invoiceId: invoice.id,
      productId: invoiceProduct.id,
      orderedByUserId: examiner.id,
    }),
  );

  await InvoiceItemDiscount.create(
    fake(InvoiceItemDiscount, {
      invoiceItemId: invoiceItem.id,
    }),
  );

  const imagingRequest = await ImagingRequest.create(
    fake(ImagingRequest, {
      requestedById: examiner.id,
      encounterId: encounter.id,
      locationGroupId: locationGroup.id,
      status: IMAGING_REQUEST_STATUS_TYPES.COMPLETED,
      priority: 'routine',
      requestedDate: '2022-03-04 15:30:00',
      imagingType: IMAGING_TYPES.X_RAY,
    }),
  );

  await ImagingResult.create(
    fake(ImagingResult, {
      imagingRequestId: imagingRequest.id,
      completedById: examiner.id,
      description: 'This is a test result',
      completedAt: '2022-03-04 15:30:00',
    }),
  );

  const appointmentSchedule = await AppointmentSchedule.create(
    fake(AppointmentSchedule, {
      frequency: REPEAT_FREQUENCY.WEEKLY,
      locationGroupId: locationGroup.id,
    }),
  );
  await Appointment.create(
    fake(Appointment, {
      patientId: patient.id,
      clinicianId: examiner.id,
      locationGroupId: locationGroup.id,
      scheduleId: appointmentSchedule.id,
    }),
  );

  const task = await Task.create(
    fake(Task, {
      encounterId: encounter.id,
      requestedByUserId: examiner.id,
      completedByUserId: examiner.id,
      notCompletedByUserId: examiner.id,
      notCompletedReasonId: referenceData.id,
      todoByUserId: examiner.id,
      deletedByUserId: examiner.id,
      deletedReasonId: referenceData.id,
    }),
  );
  await TaskDesignation.create(
    fake(TaskDesignation, {
      taskId: task.id,
      designationId: referenceData.id,
    }),
  );
  const taskTemplate = await TaskTemplate.create(
    fake(TaskTemplate, { referenceDataId: referenceData.id }),
  );
  await TaskTemplateDesignation.create(
    fake(TaskTemplateDesignation, {
      taskTemplateId: taskTemplate.id,
      designationId: referenceData.id,
    }),
  );
  await UserDesignation.create(
    fake(UserDesignation, {
      userId: examiner.id,
      designationId: referenceData.id,
    }),
  );
}

/** Generate fake data to exercise the whole database */
export async function generateFake(sequelize: Sequelize, rounds: number = 1) {
  console.log('Fill database with fake data', rounds, 'rounds');

  // eslint-disable-next-line no-unused-vars
  for (const _ in Array(rounds).fill(0)) {
    await generateData(sequelize.models);
    process.stdout.write('.');
  }

  console.log();
  await sequelize.close();
}

/** Run this file as a program. You should set the env var NODE_CONFIG_DIR to the appropriate place. */
export async function main() {
  const { program } = await import('commander');
  const { default: config } = await import('config');
  const { initDatabase } = require('@tamanu/database/services/database');

  const opts = program
    .option('--rounds <number>', 'How much data to fill database with', '100')
    .option('--database <string>', 'Override the database name to connect to')
    .parse()
    .opts();

  const rounds = Math.max(1, parseInt(opts.rounds));

  const db = await initDatabase({
    ...(config as any).db,
    name: opts.database ?? (config as any).db.name,
  });

  try {
    console.time('done');
    await generateFake(db.sequelize, rounds);
    console.timeEnd('done');
  } finally {
    await db.sequelize.close();
  }
}
