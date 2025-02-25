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
  generateImportData,
} from './helpers';

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
    await createLabRequest({
      models,
      departmentId: department.id,
      userId: user.id,
      encounterId: encounter.id,
      referenceDataId: referenceData.id,
      patientId: patient.id,
      labTestTypeId: labTestType.id,
    }),
    await createProgramRegistry({
      models,
      userId: user.id,
      patientId: patient.id,
      programRegistryId: programRegistry.id,
    }),
    await createSurveyResponse({ models, encounterId: encounter.id, surveyId: survey.id }),
    await createDbReport({ models, userId: user.id }),
    await createAdministeredVaccine({
      models,
      scheduledVaccineId: scheduledVaccine.id,
      encounterId: encounter.id,
    }),
    await createInvoice({
      models,
      encounterId: encounter.id,
      userId: user.id,
      referenceDataId: referenceData.id,
      productId: invoiceProduct.id,
    }),
    await createImagingRequest({
      models,
      userId: user.id,
      encounterId: encounter.id,
      locationGroupId: locationGroup.id,
    }),
    await createRepeatingAppointment({
      models,
      locationGroupId: locationGroup.id,
      patientId: patient.id,
      clinicianId: user.id,
    }),
    await createTask({
      models,
      encounterId: encounter.id,
      userId: user.id,
      referenceDataId: referenceData.id,
    }),
    await createPatientCommunication({ models, patientId: patient.id }),
  ]);
};
