import { Patient } from '@tamanu/database';
import type { PatientDetailsPage } from '@pages/patients/PatientDetailsPage';

/**
 * Navigate to a patient and open their latest encounter in one call.
 * Combines: goToPatient → encounterHistoryPane.waitForSectionToLoad → getLatestEncounter → click → waitForEncounterToBeReady.
 */
export async function goToPatientEncounter(
  patientDetailsPage: PatientDetailsPage,
  patient: Patient,
): Promise<void> {
  await patientDetailsPage.goToPatient(patient);
  await patientDetailsPage.encounterHistoryPane.waitForSectionToLoad();
  const latestEncounter = await patientDetailsPage.encounterHistoryPane.getLatestEncounter();
  await latestEncounter.click();
  await patientDetailsPage.waitForEncounterToBeReady();
}
