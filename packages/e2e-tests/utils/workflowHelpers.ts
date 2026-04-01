import { Patient } from '@tamanu/database';
import { PatientDetailsPage } from '../pages/patients/PatientDetailsPage/PatientDetailsPage';
import { LabRequestPane } from '../pages/patients/LabRequestPage/panes/LabRequestPane';
import { LabRequestModal } from '../pages/patients/LabRequestPage/modals/LabRequestModal';
import { NotesPane } from '../pages/patients/NotesPage/panes/notesPane';
import { ProcedurePane } from '../pages/patients/ProcedurePage/Panes/ProcedurePane';

// ---------------------------------------------------------------------------
// Navigation helpers
// ---------------------------------------------------------------------------

type EncounterTab = 'labs' | 'notes' | 'procedures' | 'medication' | 'imaging';
type PatientTab = 'vaccines' | 'vitals' | 'documents' | 'tasks' | 'charts' | 'referrals' | 'details';

/**
 * Navigate to a patient and open an encounter-scoped tab (requires an active encounter).
 */
export async function goToEncounterTab(
  patientDetailsPage: PatientDetailsPage,
  patient: Patient,
  tab: EncounterTab,
) {
  await patientDetailsPage.goToPatient(patient);
  const navigators: Record<EncounterTab, () => Promise<unknown>> = {
    labs: () => patientDetailsPage.navigateToLabsTab(),
    notes: () => patientDetailsPage.navigateToNotesTab(),
    procedures: () => patientDetailsPage.navigateToProcedureTab(),
    medication: () => patientDetailsPage.navigateToMedicationTab(),
    imaging: () => patientDetailsPage.navigateToImagingRequestTab(),
  };
  return navigators[tab]();
}

/**
 * Navigate to a patient and open a patient-level tab (no encounter needed).
 */
export async function goToPatientTab(
  patientDetailsPage: PatientDetailsPage,
  patient: Patient,
  tab: PatientTab,
) {
  await patientDetailsPage.goToPatient(patient);
  const navigators: Record<PatientTab, () => Promise<unknown>> = {
    vaccines: () => patientDetailsPage.navigateToVaccineTab(),
    vitals: () => patientDetailsPage.navigateToVitalsTab(),
    documents: () => patientDetailsPage.navigateToDocumentsTab(),
    tasks: () => patientDetailsPage.navigateToTasksTab(),
    charts: () => patientDetailsPage.navigateToChartsTab(),
    referrals: () => patientDetailsPage.navigateToReferralsTab(),
    details: () => patientDetailsPage.navigateToPatientDetailsTab(),
  };
  return navigators[tab]();
}

// ---------------------------------------------------------------------------
// Creation helpers
// ---------------------------------------------------------------------------

/**
 * Create a basic individual lab request via the UI and wait for the table to update.
 * Returns the array of selected test names.
 */
export async function createLabRequest(
  labRequestPane: LabRequestPane,
  labRequestModal: LabRequestModal,
  testsToSelect?: string[],
): Promise<string[]> {
  await labRequestPane.newLabRequestButton.click();
  const selected = await labRequestModal.individualModal.createBasicIndividualLabRequest(testsToSelect);
  await labRequestPane.waitForTableToLoad();
  await labRequestPane.sortTableByCategory();
  return selected;
}

/**
 * Create a basic note via the UI and wait for the notes pane to reload.
 * Returns the approximate ISO datetime string of when the note was created.
 */
export async function createNote(
  notesPane: NotesPane,
  noteType: string,
  content: string,
): Promise<string> {
  const newNoteModal = notesPane.getNewNoteModal();
  await notesPane.newNoteButton.click();
  const dateTime = await newNoteModal.createBasicNote(noteType, content);
  await notesPane.waitForNotesPaneToLoad();
  return dateTime;
}

/**
 * Create a procedure via the UI using all fields and wait for the table to reload.
 * Returns the procedure form data.
 */
export async function createProcedure(
  procedurePane: ProcedurePane,
  options: { requiredOnly?: boolean } = {},
) {
  await procedurePane.newProcedureButton.click();
  const modal = procedurePane.getNewProcedureModal();
  const data = options.requiredOnly
    ? await modal.fillRequiredFields()
    : await modal.fillAllFields();
  await modal.saveProcedureButton.click();
  await modal.waitForModalToClose();
  await procedurePane.waitForTableToLoad();
  return data;
}
