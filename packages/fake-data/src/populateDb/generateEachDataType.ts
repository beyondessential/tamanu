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
    await createLabRequest({
      models,
      limit,
      departmentId: department.id,
      userId: user.id,
      encounterId: encounter.id,
      referenceDataId: referenceData.id,
      patientId: patient.id,
      labTestTypeId: labTestType.id,
    }),
    await createProgramRegistry({
      models,
      limit,
      userId: user.id,
      patientId: patient.id,
      programRegistryId: programRegistry.id,
    }),
    await createSurveyResponse({ models, limit, encounterId: encounter.id, surveyId: survey.id }),
    await createDbReport({ models, limit, userId: user.id }),
    await createAdministeredVaccine({
      models,
      limit,
      scheduledVaccineId: scheduledVaccine.id,
      encounterId: encounter.id,
    }),
    await createInvoice({
      models,
      limit,
      encounterId: encounter.id,
      userId: user.id,
      referenceDataId: referenceData.id,
      productId: invoiceProduct.id,
    }),
    await createImagingRequest({
      models,
      limit,
      userId: user.id,
      encounterId: encounter.id,
      locationGroupId: locationGroup.id,
      areaIds: [referenceData.id],
    }),
    await createRepeatingAppointment({
      models,
      limit,
      locationGroupId: locationGroup.id,
      patientId: patient.id,
      clinicianId: user.id,
    }),
    await createTask({
      models,
      limit,
      encounterId: encounter.id,
      userId: user.id,
      referenceDataId: referenceData.id,
    }),
    await createPatientCommunication({ models, limit, patientId: patient.id }),
    await createMedication({
      models,
      limit,
      encounterId: encounter.id,
      patientId: patient.id,
      referenceDataId: referenceData.id,
    }),
    await createAccessLog({
      models,
      limit,
      userId: user.id,
      patientId: patient.id,
      facilityId: facility.id,
    }),
    await createProcedure({ models, limit, encounterId: encounter.id }),
    await createAppointment({
      models,
      limit,
      encounterId: encounter.id,
      locationGroupId: locationGroup.id,
      patientId: patient.id,
      clinicianId: user.id,
    }),
  ]);
};
