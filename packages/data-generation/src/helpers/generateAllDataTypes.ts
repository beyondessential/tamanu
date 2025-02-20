import type { Models, Sequelize } from '@tamanu/database';
import {
  createAppointmentData,
  createDbReportData,
  createEncounterData,
  createFacilityData,
  createImagingRequestData,
  createInvoiceData,
  createLabRequestData,
  createPatientData,
  createProgramData,
  createReferenceData,
  createSurveyData,
  createTaskingData,
  createUserData,
  createVaccineData,
} from './generateDataGroups';

export async function generateAllDataTypes(models: Models) {
  const { referenceData } = await createReferenceData(models);
  const { facility, department, locationGroup, location } = await createFacilityData(models);
  const { user } = await createUserData(models);
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
}
