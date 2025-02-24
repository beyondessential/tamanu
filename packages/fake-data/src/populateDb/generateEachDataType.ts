import { type Models } from '@tamanu/database';
import { generateImportData } from './generateImportData';
import {
  createAdministeredVaccineData,
  createAppointmentData,
  createDbReportData,
  createEncounterData,
  createImagingRequestData,
  createInvoiceData,
  createLabRequestData,
  createPatientData,
  createProgramRegistryData,
  createSurveyResponseData,
  createTaskingData,
} from './index';

export const generateEachDataType = async (models: Models): Promise<void> => {
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
  } = await generateImportData(models);

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
