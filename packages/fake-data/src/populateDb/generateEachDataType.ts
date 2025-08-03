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
  createProcedure,
  createAppointment,
} from './helpers/index.js';

export const generateEachDataType = async (models: Models): Promise<void> => {
  const { default: pLimit } = await import('p-limit');
  const limit = pLimit(10);

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
    limit,
    facilityId: facility.id,
    userId: user.id,
  });
  const { encounter } = await createEncounter({
    models,
    limit,
    patientId: patient.id,
    departmentId: department.id,
    locationId: location.id,
    userId: user.id,
    referenceDataId: referenceData.id,
  });

  await Promise.all([
    createLabRequest({
      models,
      limit,
      departmentId: department.id,
      userId: user.id,
      encounterId: encounter.id,
      referenceDataId: referenceData.id,
      patientId: patient.id,
      labTestTypeId: labTestType.id,
    }),
    createProgramRegistry({
      models,
      limit,
      userId: user.id,
      patientId: patient.id,
      programRegistryId: programRegistry.id,
    }),
    createSurveyResponse({ models, limit, encounterId: encounter.id, surveyId: survey.id }),
    createDbReport({ models, limit, userId: user.id }),
    createAdministeredVaccine({
      models,
      limit,
      scheduledVaccineId: scheduledVaccine.id,
      encounterId: encounter.id,
    }),
    createInvoice({
      models,
      limit,
      encounterId: encounter.id,
      userId: user.id,
      referenceDataId: referenceData.id,
      productId: invoiceProduct.id,
    }),
    createImagingRequest({
      models,
      limit,
      userId: user.id,
      encounterId: encounter.id,
      locationGroupId: locationGroup.id,
      areaIds: [referenceData.id],
    }),
    createRepeatingAppointment({
      models,
      limit,
      locationGroupId: locationGroup.id,
      patientId: patient.id,
      clinicianId: user.id,
    }),
    createTask({
      models,
      limit,
      encounterId: encounter.id,
      userId: user.id,
      referenceDataId: referenceData.id,
    }),
    createPatientCommunication({ models, limit, patientId: patient.id }),
    createMedication({
      models,
      limit,
      encounterId: encounter.id,
      patientId: patient.id,
      referenceDataId: referenceData.id,
    }),
    createAccessLog({
      models,
      limit,
      userId: user.id,
      patientId: patient.id,
      facilityId: facility.id,
    }),
    createProcedure({ models, limit, encounterId: encounter.id }),
    createAppointment({
      models,
      limit,
      encounterId: encounter.id,
      locationGroupId: locationGroup.id,
      patientId: patient.id,
      clinicianId: user.id,
    }),
  ]);
};
