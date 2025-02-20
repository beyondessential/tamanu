import {
  IMAGING_REQUEST_STATUS_TYPES,
  IMAGING_TYPES,
  NOTE_RECORD_TYPES,
  REPEAT_FREQUENCY,
  REPORT_DB_SCHEMAS,
  REPORT_STATUSES,
} from '@tamanu/constants';
import { type Models } from '@tamanu/database';

// TODO: maybe this should come here?
const { fake } = require('@tamanu/shared/test-helpers/fake');

export const createReferenceData = async ({ ReferenceData, ReferenceDataRelation }) => {
  const referenceData = await ReferenceData.create(fake(ReferenceData));
  await ReferenceDataRelation.create(fake(ReferenceDataRelation));
  return { referenceData };
};

export const createFacilityData = async ({
  LocationGroup,
  Location,
  Facility,
  Department,
}: Models): Promise<{ locationGroup; location; facility; department }> => {
  const facility = await Facility.create(fake(Facility));
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
  const department = await Department.create(
    fake(Department, {
      facilityId: facility.id,
    }),
  );

  return { facility, department, locationGroup, location };
};

export const createSurveyData = async (
  { Survey, SurveyScreenComponent, SurveyResponse }: Models,
  encounterId: string,
) => {
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
      encounterId,
    }),
  );
};

export const createDbReportData = async (
  { ReportDefinition, ReportDefinitionVersion }: Models,
  userId: string,
) => {
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
      userId,
    }),
  );
};

export const createVaccineData = async (
  { ScheduledVaccine, AdministeredVaccine }: Models,
  referenceDataId: string,
  encounterId: string,
) => {
  const scheduledVaccine = await ScheduledVaccine.create(
    fake(ScheduledVaccine, {
      vaccineId: referenceDataId,
    }),
  );

  await AdministeredVaccine.create(
    fake(AdministeredVaccine, {
      scheduledVaccineId: scheduledVaccine.id,
      encounterId,
    }),
  );
};

export const createImagingRequestData = async (
  { ImagingRequest, ImagingResult }: Models,
  userId: string,
  encounterId: string,
  locationGroupId: string,
) => {
  const imagingRequest = await ImagingRequest.create(
    fake(ImagingRequest, {
      requestedById: userId,
      encounterId,
      locationGroupId,
      status: IMAGING_REQUEST_STATUS_TYPES.COMPLETED,
      priority: 'routine',
      requestedDate: '2022-03-04 15:30:00',
      imagingType: IMAGING_TYPES.X_RAY,
    }),
  );

  await ImagingResult.create(
    fake(ImagingResult, {
      imagingRequestId: imagingRequest.id,
      completedById: userId,
      description: 'This is a test result',
      completedAt: '2022-03-04 15:30:00',
    }),
  );
};

export const createProgramData = async (
  {
    ProgramDataElement,
    Program,
    ProgramRegistry,
    ProgramRegistryCondition,
    ProgramRegistryClinicalStatus,
    PatientProgramRegistration,
    PatientProgramRegistrationCondition,
  }: Models,
  userId: string,
  patientId: string,
) => {
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
      clinicianId: userId,
      patientId,
      programRegistryId: programRegistry.id,
    }),
  );
  await PatientProgramRegistrationCondition.create(
    fake(PatientProgramRegistrationCondition, {
      patientId,
      programRegistryId: programRegistry.id,
    }),
  );
};

export const createAppointmentData = async (
  { AppointmentSchedule, Appointment }: Models,
  locationGroupId: string,
  patientId: string,
  clinicianId: string,
) => {
  const appointmentSchedule = await AppointmentSchedule.create(
    fake(AppointmentSchedule, {
      frequency: REPEAT_FREQUENCY.WEEKLY,
      locationGroupId,
    }),
  );
  await Appointment.create(
    fake(Appointment, {
      patientId,
      clinicianId,
      locationGroupId,
      scheduleId: appointmentSchedule.id,
    }),
  );
};

export const createInvoiceData = async (
  {
    Invoice,
    InvoiceDiscount,
    InvoiceInsurer,
    InvoicePayment,
    InvoiceProduct,
    InvoiceInsurerPayment,
    InvoicePatientPayment,
    InvoiceItemDiscount,
    InvoiceItem,
  }: Models,
  encounterId: string,
  userId: string,
  referenceDataId: string,
) => {
  const invoiceProduct = await InvoiceProduct.create(
    fake(InvoiceProduct, {
      id: referenceDataId,
    }),
  );

  const invoice = await Invoice.create(
    fake(Invoice, {
      encounterId,
    }),
  );
  await InvoiceDiscount.create(
    fake(InvoiceDiscount, {
      invoiceId: invoice.id,
      appliedByUserId: userId,
    }),
  );
  await InvoiceInsurer.create(
    fake(InvoiceInsurer, {
      invoiceId: invoice.id,
      insurerId: referenceDataId,
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
      insurerId: referenceDataId,
    }),
  );
  await InvoicePatientPayment.create(
    fake(InvoicePatientPayment, {
      invoicePaymentId: invoicePayment.id,
      methodId: referenceDataId,
    }),
  );
  const invoiceItem = await InvoiceItem.create(
    fake(InvoiceItem, {
      invoiceId: invoice.id,
      productId: invoiceProduct.id,
      orderedByUserId: userId,
    }),
  );

  await InvoiceItemDiscount.create(
    fake(InvoiceItemDiscount, {
      invoiceItemId: invoiceItem.id,
    }),
  );
};

export const createLabRequestData = async (
  { LabRequest, LabRequestLog, LabTestType, LabTest, CertificateNotification }: Models,
  departmentId: string,
  userId: string,
  encounterId: string,
  referenceDataId: string,
  patientId: string,
) => {
  const labTestType = await LabTestType.create(
    fake(LabTestType, {
      labTestCategoryId: referenceDataId,
    }),
  );

  const labRequest = await LabRequest.create(
    fake(LabRequest, {
      departmentId,
      collectedById: userId,
      encounter: encounterId,
    }),
  );
  await LabRequestLog.create(
    fake(LabRequestLog, {
      status: 'reception_pending',
      labRequestId: labRequest.id,
    }),
  );
  const labTest = await LabTest.create(
    fake(LabTest, {
      labRequestId: labRequest.id,
      categoryId: referenceDataId,
      labTestMethodId: referenceDataId,
      labTestTypeId: labTestType.id,
    }),
  );
  await CertificateNotification.create(
    fake(CertificateNotification, {
      patientId,
      labTestId: labTest.id,
      labRequestId: labRequest.id,
    }),
  );
};

export const createEncounterData = async (
  { Encounter, EncounterHistory, Note, Discharge, EncounterDiagnosis }: Models,
  patientId: string,
  departmentId: string,
  locationId: string,
  userId: string,
  referenceDataId: string,
) => {
  const encounter = await Encounter.create(
    fake(Encounter, {
      patientId,
      departmentId,
      locationId,
      examinerId: userId,
      startDate: '2023-12-21T04:59:51.851Z',
    }),
  );
  await EncounterHistory.create(
    fake(EncounterHistory, {
      examinerId: userId,
      encounterId: encounter.id,
      departmentId,
      locationId,
    }),
  );
  await EncounterDiagnosis.create(
    fake(EncounterDiagnosis, {
      diagnosisId: referenceDataId,
      encounterId: encounter.id,
    }),
  );
  await Note.create(
    fake(Note, {
      recordType: NOTE_RECORD_TYPES.ENCOUNTER,
      recordId: encounter.id,
      authorId: userId,
    }),
  );
  await Discharge.create(
    fake(Discharge, {
      encounterId: encounter.id,
      dischargerId: userId,
    }),
  );
  return { encounter };
};

export const createPatientData = async (
  {
    Patient,
    PatientBirthData,
    PatientAllergy,
    PatientAdditionalData,
    PatientDeathData,
    PatientCommunication,
  }: Models,
  facilityId: string,
  userId: string,
) => {
  const patient = await Patient.create(fake(Patient));
  await PatientBirthData.create(
    fake(PatientBirthData, {
      patientId: patient.id,
      facilityId,
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
      clinicianId: userId,
    }),
  );

  await PatientCommunication.create(
    fake(PatientCommunication, {
      patientId: patient.id,
    }),
  );

  return { patient };
};

export const createTaskingData = async (
  { Task, TaskDesignation, TaskTemplate, TaskTemplateDesignation, UserDesignation }: Models,
  encounterId: string,
  userId: string,
  referenceDataId: string,
) => {
  const task = await Task.create(
    fake(Task, {
      encounterId,
      requestedByUserId: userId,
      completedByUserId: userId,
      notCompletedByUserId: userId,
      notCompletedReasonId: referenceDataId,
      todoByUserId: userId,
      deletedByUserId: userId,
      deletedReasonId: referenceDataId,
    }),
  );
  await TaskDesignation.create(
    fake(TaskDesignation, {
      taskId: task.id,
      designationId: referenceDataId,
    }),
  );
  const taskTemplate = await TaskTemplate.create(fake(TaskTemplate, { referenceDataId }));
  await TaskTemplateDesignation.create(
    fake(TaskTemplateDesignation, {
      taskTemplateId: taskTemplate.id,
      designationId: referenceDataId,
    }),
  );
  await UserDesignation.create(
    fake(UserDesignation, {
      userId,
      designationId: referenceDataId,
    }),
  );
};

export const createUserData = async ({ User, UserPreference }: Models) => {
  const user = await User.create(fake(User));
  await UserPreference.create(
    fake(UserPreference, {
      userId: user.id,
    }),
  );
  return { user };
};

export const generateAllDataTypes = async (models: Models) => {
  // Reference/Setup data
  const { referenceData } = await createReferenceData(models);
  const { facility, department, locationGroup, location } = await createFacilityData(models);
  const { user } = await createUserData(models);

  // Clinical data
  const { patient } = await createPatientData(models, facility.id, user.id);
  const { encounter } = await createEncounterData(
    models,
    patient.id,
    department.id,
    location.id,
    user.id,
    referenceData.id,
  );

  await Promise.all([
    await createLabRequestData(
      models,
      department.id,
      user.id,
      encounter.id,
      referenceData.id,
      patient.id,
    ),
    await createProgramData(models, user.id, patient.id),
    await createSurveyData(models, encounter.id),
    await createDbReportData(models, user.id),
    await createVaccineData(models, referenceData.id, encounter.id),
    await createInvoiceData(models, encounter.id, user.id, referenceData.id),
    await createImagingRequestData(models, user.id, encounter.id, locationGroup.id),
    await createAppointmentData(models, locationGroup.id, patient.id, user.id),
    await createTaskingData(models, encounter.id, user.id, referenceData.id),
  ]);
};
