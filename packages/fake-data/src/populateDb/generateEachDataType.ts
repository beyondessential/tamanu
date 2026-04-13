import { type Models } from '@tamanu/database';
import {
  createAdministeredVaccine,
  createRepeatingAppointment,
  createDbReport,
  createEncounter,
  createImagingRequest,
  createInvoice,
  createLabRequest,
  createPatient,
  createProgramRegistry,
  createSurveyResponse,
  createTask,
  createPatientCommunication,
  createMedication,
  createAccessLog,
  generateImportData,
} from './helpers/index.js';

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
  const { patient } = await createPatient({
    models,
    facilityId: facility.id,
    userId: user.id,
  });
  const { encounter } = await createEncounter({
    models,
    patientId: patient.id,
    departmentId: department.id,
    locationId: location.id,
    userId: user.id,
    referenceDataId: referenceData.id,
  });

  await Promise.all([
    createLabRequest({
      models,
      departmentId: department.id,
      userId: user.id,
      encounterId: encounter.id,
      referenceDataId: referenceData.id,
      patientId: patient.id,
      labTestTypeId: labTestType.id,
    }),
    createProgramRegistry({
      models,
      userId: user.id,
      patientId: patient.id,
      programRegistryId: programRegistry.id,
    }),
    createSurveyResponse({ models, encounterId: encounter.id, surveyId: survey.id }),
    createDbReport({ models, userId: user.id }),
    createAdministeredVaccine({
      models,
      scheduledVaccineId: scheduledVaccine.id,
      encounterId: encounter.id,
    }),
    createInvoice({
      models,
      encounterId: encounter.id,
      userId: user.id,
      referenceDataId: referenceData.id,
      productId: invoiceProduct.id,
    }),
    createImagingRequest({
      models,
      userId: user.id,
      encounterId: encounter.id,
      locationGroupId: locationGroup.id,
    }),
    createRepeatingAppointment({
      models,
      locationGroupId: locationGroup.id,
      patientId: patient.id,
      clinicianId: user.id,
    }),
    createTask({
      models,
      encounterId: encounter.id,
      userId: user.id,
      referenceDataId: referenceData.id,
    }),
    createPatientCommunication({ models, patientId: patient.id }),
    createMedication({
      models,
      encounterId: encounter.id,
      patientId: patient.id,
      referenceDataId: referenceData.id,
    }),
    createAccessLog({
      models,
      userId: user.id,
      patientId: patient.id,
      facilityId: facility.id,
    }),
  ]);
};
