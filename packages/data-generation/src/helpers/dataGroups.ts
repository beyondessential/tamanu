import {
  IMAGING_REQUEST_STATUS_TYPES,
  IMAGING_TYPES,
  NOTE_RECORD_TYPES,
  REPEAT_FREQUENCY,
  REPORT_DB_SCHEMAS,
  REPORT_STATUSES,
} from '@tamanu/constants';
import type {
  Models,
  Encounter,
  Patient,
  ReferenceData,
  Facility,
  Department,
  LocationGroup,
  Location,
  Survey,
  ScheduledVaccine,
  InvoiceProduct,
  LabTestType,
  User,
  ProgramRegistry,
} from '@tamanu/database';

// TODO: maybe this should come here?
const { fake } = require('@tamanu/shared/test-helpers/fake');

export const setupImportData = async ({
  ReferenceData,
  ReferenceDataRelation,
  Facility,
  LocationGroup,
  Location,
  Department,
  Survey,
  SurveyScreenComponent,
  ScheduledVaccine,
  ProgramDataElement,
  Program,
  ProgramRegistry,
  ProgramRegistryCondition,
  ProgramRegistryClinicalStatus,
  InvoiceProduct,
  LabTestType,
  User,
}: Models): Promise<{
  referenceData: ReferenceData;
  facility: Facility;
  department: Department;
  locationGroup: LocationGroup;
  location: Location;
  survey: Survey;
  scheduledVaccine: ScheduledVaccine;
  invoiceProduct: InvoiceProduct;
  labTestType: LabTestType;
  user: User;
  programRegistry: ProgramRegistry;
}> => {
  const referenceData = await ReferenceData.create(fake(ReferenceData));
  await ReferenceDataRelation.create(fake(ReferenceDataRelation));

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

  const survey = await Survey.create(fake(Survey));
  await SurveyScreenComponent.create(
    fake(SurveyScreenComponent, {
      surveyId: survey.id,
      option: '{"foo":"bar"}',
      config: '{"source": "ReferenceData", "where": {"type": "facility"}}',
    }),
  );

  const scheduledVaccine = await ScheduledVaccine.create(
    fake(ScheduledVaccine, {
      vaccineId: referenceData.id,
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

  const invoiceProduct = await InvoiceProduct.create(
    fake(InvoiceProduct, {
      id: referenceData.id,
    }),
  );

  const labTestType = await LabTestType.create(
    fake(LabTestType, {
      labTestCategoryId: referenceData.id,
    }),
  );

  const user = await User.create(fake(User));

  return {
    referenceData,
    facility,
    department,
    locationGroup,
    location,
    survey,
    scheduledVaccine,
    invoiceProduct,
    labTestType,
    user,
    programRegistry,
  };
};

interface CreateSurveyResponseDataParams {
  models: Models;
  encounterId: string;
  surveyId: string;
}
export const createSurveyResponseData = async ({
  models: { SurveyResponse },
  encounterId,
  surveyId,
}: CreateSurveyResponseDataParams): Promise<void> => {
  await SurveyResponse.create(
    fake(SurveyResponse, {
      surveyId,
      encounterId,
    }),
  );
};

interface CreateDbReportDataParams {
  models: Models;
  userId: string;
}
export const createDbReportData = async ({
  models: { ReportDefinition, ReportDefinitionVersion },
  userId,
}: CreateDbReportDataParams): Promise<void> => {
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

interface CreateAdministeredVaccineDataParams {
  models: Models;
  scheduledVaccineId: string;
  encounterId: string;
}
export const createAdministeredVaccineData = async ({
  models: { AdministeredVaccine },
  scheduledVaccineId,
  encounterId,
}: CreateAdministeredVaccineDataParams): Promise<void> => {
  await AdministeredVaccine.create(
    fake(AdministeredVaccine, {
      scheduledVaccineId,
      encounterId,
    }),
  );
};

interface CreateImagingRequestDataParams {
  models: Models;
  userId: string;
  encounterId: string;
  locationGroupId: string;
}
export const createImagingRequestData = async ({
  models: { ImagingRequest, ImagingResult },
  userId,
  encounterId,
  locationGroupId,
}: CreateImagingRequestDataParams): Promise<void> => {
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

interface CreateProgramRegistryDataParams {
  models: Models;
  userId: string;
  patientId: string;
  programRegistryId: string;
}
export const createProgramRegistryData = async ({
  models: { PatientProgramRegistration, PatientProgramRegistrationCondition },
  userId,
  patientId,
  programRegistryId,
}: CreateProgramRegistryDataParams): Promise<void> => {
  await PatientProgramRegistration.create(
    fake(PatientProgramRegistration, {
      clinicianId: userId,
      patientId,
      programRegistryId,
    }),
  );
  await PatientProgramRegistrationCondition.create(
    fake(PatientProgramRegistrationCondition, {
      patientId,
      programRegistryId,
    }),
  );
};

interface CreateAppointmentDataParams {
  models: Models;
  locationGroupId: string;
  patientId: string;
  clinicianId: string;
}
export const createAppointmentData = async ({
  models: { AppointmentSchedule, Appointment },
  locationGroupId,
  patientId,
  clinicianId,
}: CreateAppointmentDataParams): Promise<void> => {
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

interface CreateInvoiceDataParams {
  models: Models;
  encounterId: string;
  userId: string;
  referenceDataId: string;
  productId: string;
}
export const createInvoiceData = async ({
  models: {
    Invoice,
    InvoiceDiscount,
    InvoiceInsurer,
    InvoicePayment,
    InvoiceInsurerPayment,
    InvoicePatientPayment,
    InvoiceItemDiscount,
    InvoiceItem,
  },
  encounterId,
  userId,
  referenceDataId,
  productId,
}: CreateInvoiceDataParams): Promise<void> => {
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
      productId,
      orderedByUserId: userId,
    }),
  );

  await InvoiceItemDiscount.create(
    fake(InvoiceItemDiscount, {
      invoiceItemId: invoiceItem.id,
    }),
  );
};

interface CreateLabRequestDataParams {
  models: Models;
  departmentId: string;
  userId: string;
  encounterId: string;
  referenceDataId: string;
  patientId: string;
  labTestTypeId: string;
}
export const createLabRequestData = async ({
  models: { LabRequest, LabRequestLog, LabTest, CertificateNotification },
  departmentId,
  userId,
  encounterId,
  referenceDataId,
  patientId,
  labTestTypeId,
}: CreateLabRequestDataParams): Promise<void> => {
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
      labTestTypeId,
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

interface CreateEncounterDataParams {
  models: Models;
  patientId: string;
  departmentId: string;
  locationId: string;
  userId: string;
  referenceDataId: string;
}
export const createEncounterData = async ({
  models: { Encounter, EncounterHistory, Note, Discharge, EncounterDiagnosis },
  patientId,
  departmentId,
  locationId,
  userId,
  referenceDataId,
}: CreateEncounterDataParams): Promise<{ encounter: Encounter }> => {
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

interface CreatePatientDataParams {
  models: Models;
  facilityId: string;
  userId: string;
}
export const createPatientData = async ({
  models: {
    Patient,
    PatientBirthData,
    PatientAllergy,
    PatientAdditionalData,
    PatientDeathData,
    PatientCommunication,
  },
  facilityId,
  userId,
}: CreatePatientDataParams): Promise<{ patient: Patient }> => {
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

interface CreateTaskingDataParams {
  models: Models;
  encounterId: string;
  userId: string;
  referenceDataId: string;
}
export const createTaskingData = async ({
  models: { Task, TaskDesignation, TaskTemplate, TaskTemplateDesignation, UserDesignation },
  encounterId,
  userId,
  referenceDataId,
}: CreateTaskingDataParams): Promise<void> => {
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

export const generateAllDataTypes = async (models: Models): Promise<void> => {
  // Create one of each basic deployment/reference data to reference for clinical data
  const {
    referenceData,
    facility,
    department,
    locationGroup,
    location,
    survey,
    scheduledVaccine,
    invoiceProduct,
    labTestType,
    user,
    programRegistry,
  } = await setupImportData(models);

  // Clinical data
  const { patient } = await createPatientData({ models, facilityId: facility.id, userId: user.id });
  const { encounter } = await createEncounterData({
    models,
    patientId: patient.id,
    departmentId: department.id,
    locationId: location.id,
    userId: user.id,
    referenceDataId: referenceData.id,
  });

  await Promise.all([
    await createLabRequestData({
      models,
      departmentId: department.id,
      userId: user.id,
      encounterId: encounter.id,
      referenceDataId: referenceData.id,
      patientId: patient.id,
      labTestTypeId: labTestType.id,
    }),
    await createProgramRegistryData({
      models,
      userId: user.id,
      patientId: patient.id,
      programRegistryId: programRegistry.id,
    }),
    await createSurveyResponseData({ models, encounterId: encounter.id, surveyId: survey.id }),
    await createDbReportData({ models, userId: user.id }),
    await createAdministeredVaccineData({
      models,
      scheduledVaccineId: scheduledVaccine.id,
      encounterId: encounter.id,
    }),
    await createInvoiceData({
      models,
      encounterId: encounter.id,
      userId: user.id,
      referenceDataId: referenceData.id,
      productId: invoiceProduct.id,
    }),
    await createImagingRequestData({
      models,
      userId: user.id,
      encounterId: encounter.id,
      locationGroupId: locationGroup.id,
    }),
    await createAppointmentData({
      models,
      locationGroupId: locationGroup.id,
      patientId: patient.id,
      clinicianId: user.id,
    }),
    await createTaskingData({
      models,
      encounterId: encounter.id,
      userId: user.id,
      referenceDataId: referenceData.id,
    }),
  ]);
};
