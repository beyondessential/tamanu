import { Locator, Page, expect } from '@playwright/test';
import { Patient } from '@tamanu/database';
import { constructFacilityUrl } from '@utils/navigation';
import { routes } from '@config/routes';
import { BasePatientPage } from '../BasePatientPage';
import { PatientVaccinePane } from './panes/PatientVaccinePane';
import { CarePlanModal } from './modals/CarePlanModal';
import { LabRequestPane } from '../LabRequestPage/panes/LabRequestPane';
import { ProcedurePane } from '../ProcedurePage/Panes/ProcedurePane';
import { format } from 'date-fns';
import { NotesPane } from '../NotesPage/panes/notesPane';
import { PrepareDischargeModal } from './modals/PrepareDischargeModal';
import { CreateEncounterModal } from './modals/CreateEncounterModal';
import { EmergencyTriageModal } from './modals/EmergencyTriageModal';
import { PatientDetailsTabPage } from './panes/PatientDetailsTabPage';
import { AllPatientsPage } from '../AllPatientsPage';
import { EncounterMedicationPane } from '../MedicationsPage/panes/EncounterMedicationPane';
import { EncounterHistoryPane } from './panes/EncounterHistoryPane';
import { ChangeEncounterDetailsMenu } from './ChangeEncounterDetailsMenu';
import { AddDiagnosisModal } from './modals/AddDiagnosisModal';
import { DocumentsPane } from './panes/DocumentsPane';
import { TasksPane } from '../TaskPage/panes/TasksPane';
import { ChartsPane } from '../ChartsPage/panes/ChartsPane';
import { ReferralPane } from './panes/ReferralPane';
import { FormPane } from './panes/FormPane';
import { DeathModal } from './modals/DeathModal';

export class PatientDetailsPage extends BasePatientPage {
  readonly prepareDischargeButton: Locator;
  readonly vaccineTab: Locator;
  readonly procedureTab: Locator;
  readonly healthIdText: Locator;
  patientVaccinePane?: PatientVaccinePane;
  patientProcedurePane?: ProcedurePane;
  carePlanModal?: CarePlanModal;
  prepareDischargeModal?: PrepareDischargeModal;
  createEncounterModal?: CreateEncounterModal;
  emergencyTriageModal?: EmergencyTriageModal;
  notesPane?: NotesPane;
  patientDetailsTabPage?: PatientDetailsTabPage;
  encounterMedicationPane?: EncounterMedicationPane;
  documentsPane?: DocumentsPane;
  tasksPane?: TasksPane;
  chartsPane?: ChartsPane;
  referralPane?: ReferralPane;
  formPane?: FormPane;
  arrowDownIconMenuButton: Locator;

  private _encounterHistoryPane?: EncounterHistoryPane;
  private _changeEncounterDetailsMenu?: ChangeEncounterDetailsMenu;
  private _addDiagnosisModal?: AddDiagnosisModal;
  readonly encounterMedicationTab: Locator;
  readonly initiateNewOngoingConditionAddButton: Locator;
  readonly ongoingConditionNameField: Locator;
  readonly ongoingConditionNameWrapper: Locator;
  readonly ongoingConditionDateRecordedField: Locator;
  readonly ongoingConditionClinicianField: Locator;
  readonly savedOnGoingConditionName: Locator;
  readonly ongoingConditionNotes: Locator;
  readonly savedOnGoingConditionDate: Locator;
  readonly savedOnGoingConditionClinician: Locator;
  readonly savedOnGoingConditionNote: Locator;
  readonly submitNewOngoingConditionAddButton: Locator;
  readonly initiateNewAllergyAddButton: Locator;
  readonly allergyNameField: Locator;
  readonly savedAllergyName: Locator;
  readonly savedAllergyNote: Locator;
  readonly savedAllergyDate: Locator;
  readonly submitNewAllergyAddButton: Locator;
  readonly initiateNewFamilyHistoryAddButton: Locator;
  readonly familyHistoryDiagnosisField: Locator;
  readonly familyHistoryDateRecordedField: Locator;
  readonly familyHistoryRelationshipField: Locator;
  readonly familyHistoryClinicianField: Locator;
  readonly familyHistoryNotes: Locator;
  readonly submitNewFamilyHistoryAddButton: Locator;
  readonly savedFamilyHistoryDateRecorded: Locator;
  readonly savedFamilyHistoryRelationship: Locator;
  readonly savedFamilyClinician: Locator;
  readonly savedFamilyHistoryNote: Locator;
  readonly initiateNewOtherPatientIssuesAddButton: Locator;
  readonly defaultNewIssue: Locator;
  readonly savedIssueType: Locator;
  readonly savedOtherPatientIssueNote: Locator;
  readonly savedOtherPatientIssueDate: Locator;
  readonly otherPatientIssueNote: Locator;
  readonly submitNewOtherPatientIssuesAddButton: Locator;
  readonly initiateNewCarePlanAddButton: Locator;
  readonly dropdownMenuItem: Locator;
  readonly firstListItem: Locator;
  readonly patientNHN: Locator;
  readonly firstCarePlanListItem: Locator;
  readonly warningModalTitle: Locator;
  readonly warningModalContent: Locator;
  readonly warningModalDismissButton: Locator;
  readonly warningModalOkayButton: Locator;
  readonly resolvedCheckbox: Locator;
  readonly resolvedClinician: Locator;
  readonly resolvedNote: Locator;
  readonly savedFamilyHistoryName: Locator;
  readonly submitEditsButton: Locator;
  readonly labsTab: Locator;
  readonly notesTab: Locator;
  readonly vitalsTab: Locator;
  readonly imagingTab: Locator;
  readonly documentsTab: Locator;
  readonly tasksTab: Locator;
  readonly chartsTab: Locator;
  readonly referralsTab: Locator;
  readonly formsTab: Locator;
  readonly encountersList: Locator;
  readonly departmentLabel: Locator;
  readonly admitOrCheckinButton: Locator;
  readonly patientDetailsTab: Locator;
  readonly dietLabel: Locator;
  readonly locationLabel: Locator;
  readonly addDiagnosisButton: Locator;
  readonly diagnosisContainer: Locator;
  readonly diagnosisCategory: Locator;
  readonly diagnosisName: Locator;
  readonly recordDeathLink: Locator;
  readonly revertDeathLink: Locator;
  labRequestPane?: LabRequestPane;
  private _deathModal?: DeathModal;
  constructor(page: Page) {
    super(page);
    this.prepareDischargeButton = this.page.getByTestId('mainbuttoncomponent-06gp');
    this.vaccineTab = this.page.getByTestId('tab-vaccines');
    this.procedureTab = this.page.getByTestId('styledtab-ccs8-procedures');
    this.healthIdText = this.page.getByTestId('healthidtext-fqvn');
    this.initiateNewOngoingConditionAddButton = this.page
      .getByTestId('listssection-1frw')
      .locator('div')
      .filter({ hasText: 'Ongoing conditionsAdd' })
      .getByTestId('addbutton-b0ln');
    this.ongoingConditionNameField = this.page
      .getByTestId('field-j30y-input')
      .getByRole('textbox', { name: 'Search...' });
    this.ongoingConditionDateRecordedField = this.page
      .getByTestId('field-2775-input')
      .getByRole('textbox');
    this.ongoingConditionClinicianField = this.page.getByTestId('field-9miu-input');
    this.ongoingConditionNotes = this.page.getByTestId('field-e52k-input');
    this.savedOnGoingConditionName = this.page
      .getByTestId('collapse-0a33')
      .getByTestId('field-j30y-input')
      .getByRole('textbox');
    this.savedOnGoingConditionDate = this.page
      .getByTestId('collapse-0a33')
      .getByTestId('field-2775-input')
      .getByRole('textbox');
    this.savedOnGoingConditionClinician = this.page
      .getByTestId('collapse-0a33')
      .getByTestId('field-9miu-input')
      .getByRole('textbox');
    this.savedOnGoingConditionNote = this.page
      .getByTestId('collapse-0a33')
      .getByTestId('field-e52k-input');
    this.ongoingConditionNameWrapper = this.page.getByTestId(
      'field-j30y-input-outerlabelfieldwrapper',
    );
    this.submitNewOngoingConditionAddButton = this.page
      .getByTestId('formsubmitcancelrow-2r80-confirmButton')
      .first();
    this.initiateNewAllergyAddButton = this.page
      .getByTestId('listssection-1frw')
      .locator('div')
      .filter({ hasText: 'AllergiesAdd' })
      .getByTestId('addbutton-b0ln');
    this.allergyNameField = this.page
      .getByTestId('field-hwfk-input')
      .getByRole('textbox', { name: 'Search...' });
    this.savedAllergyName = this.page
      .getByTestId('collapse-0a33')
      .getByTestId('field-hwfk-input')
      .getByRole('textbox');
    this.savedAllergyDate = this.page
      .getByTestId('collapse-0a33')
      .getByTestId('field-gmf8-input')
      .getByRole('textbox');
    this.savedAllergyNote = this.page.getByTestId('collapse-0a33').getByTestId('field-dayn-input');
    this.submitNewAllergyAddButton = this.page
      .getByTestId('formsubmitcancelrow-nx2z-confirmButton')
      .first();
    this.initiateNewFamilyHistoryAddButton = this.page
      .getByTestId('listssection-1frw')
      .locator('div')
      .filter({ hasText: 'Family historyAdd' })
      .getByTestId('addbutton-b0ln');
    this.familyHistoryDiagnosisField = this.page
      .getByTestId('field-3b4u-input')
      .getByRole('textbox', { name: 'Search...' });
    this.familyHistoryDateRecordedField = this.page
      .getByTestId('field-wrp3-input')
      .getByRole('textbox');
    this.familyHistoryRelationshipField = this.page.getByTestId('field-t0k5-input');
    this.familyHistoryClinicianField = this.page.getByTestId('field-kbwi-input');
    this.familyHistoryNotes = this.page.getByTestId('field-mgiu-input');
    this.submitNewFamilyHistoryAddButton = this.page
      .getByTestId('formsubmitcancelrow-rz1i-confirmButton')
      .first();

    this.savedFamilyHistoryDateRecorded = this.page
      .getByTestId('collapse-0a33')
      .getByTestId('field-wrp3-input')
      .getByRole('textbox');
    this.savedFamilyHistoryRelationship = this.page
      .getByTestId('collapse-0a33')
      .getByTestId('field-t0k5-input');
    this.savedFamilyClinician = this.page
      .getByTestId('collapse-0a33')
      .getByTestId('field-kbwi-input')
      .getByRole('textbox');
    this.savedFamilyHistoryNote = this.page
      .getByTestId('collapse-0a33')
      .getByTestId('field-mgiu-input');
    this.initiateNewOtherPatientIssuesAddButton = this.page
      .getByTestId('listssection-1frw')
      .locator('div')
      .filter({ hasText: 'Other patient issuesAdd' })
      .getByTestId('addbutton-b0ln');
    this.defaultNewIssue = this.page.getByTestId('formgrid-vv7x').getByText('Issue');
    this.savedIssueType = this.page.getByTestId('collapse-0a33').getByText('Type*Issue');
    this.otherPatientIssueNote = this.page.getByTestId('field-nj3s-input');
    this.savedOtherPatientIssueDate = this.page
      .getByTestId('collapse-0a33')
      .getByTestId('field-urg2-input')
      .getByRole('textbox');
    this.savedOtherPatientIssueNote = this.page
      .getByTestId('collapse-0a33')
      .getByTestId('field-nj3s-input');
    this.submitNewOtherPatientIssuesAddButton = this.page
      .getByTestId('formsubmitcancelrow-x2a0-confirmButton')
      .first();
    this.initiateNewCarePlanAddButton = this.page
      .getByTestId('listssection-1frw')
      .locator('div')
      .filter({ hasText: 'Care plansAdd' })
      .getByTestId('addbutton-b0ln');
    this.dropdownMenuItem = this.page.getByTestId('typography-qxy3');
    this.firstListItem = this.page.getByTestId('listitem-adip-0');
    this.patientNHN = this.page.getByTestId('healthidtext-fqvn');
    this.firstCarePlanListItem = this.page.getByTestId('listitem-fx300');
    this.warningModalTitle = this.page.getByTestId('modaltitle-ojhf');
    this.warningModalContent = this.page.getByTestId('modalcontent-bk4w');
    this.warningModalDismissButton = this.page.getByTestId('button-ui1m');
    this.warningModalOkayButton = this.page.getByTestId('button-3i9s');
    this.resolvedCheckbox = this.page
      .getByTestId('collapse-0a33')
      .getByTestId('field-c7nr-controlcheck')
      .first();
    this.resolvedClinician = this.page
      .getByRole('combobox')
      .filter({ hasText: 'Clinician confirming' })
      .getByPlaceholder('Search...');
    this.resolvedNote = this.page.getByTestId('field-4g2s-input').first();
    this.savedFamilyHistoryName = this.page
      .getByTestId('collapse-0a33')
      .getByTestId('field-3b4u-input')
      .getByRole('textbox');
    this.submitEditsButton = this.page
      .getByTestId('collapse-0a33')
      .getByTestId('formsubmitcancelrow-rz1i-confirmButton')
      .first();
    this.labsTab = this.page.getByTestId('styledtab-ccs8-labs');
    this.notesTab = this.page.getByTestId('styledtab-ccs8-notes');
    this.vitalsTab = this.page.getByTestId('styledtab-ccs8-vitals');
    this.imagingTab = this.page.getByTestId('styledtab-ccs8-imaging');
    this.documentsTab = this.page.getByTestId('tab-documents');
    this.tasksTab = this.page.getByTestId('styledtab-ccs8-tasks');
    this.chartsTab = this.page.getByTestId('styledtab-ccs8-charts');
    this.referralsTab = this.page.getByTestId('tab-referrals');
    this.formsTab = this.page.getByTestId('tab-programs');
    this.encounterMedicationTab = this.page.getByTestId('styledtab-ccs8-medication');
    this.encountersList=this.page.getByTestId('styledtablebody-a0jz').locator('tr');
    this.departmentLabel=this.page.getByTestId('cardlabel-0v8z').filter({ hasText: 'Department' }).locator('..').getByTestId('cardvalue-1v8z');
    this.dietLabel=this.page.getByTestId('cardlabel-0v8z').filter({ hasText: 'Diet' }).locator('..').getByTestId('cardvalue-1v8z');
    this.locationLabel=this.page.getByTestId('cardlabel-0v8z').filter({ hasText: 'Location' }).locator('..').getByTestId('cardvalue-1v8z');
    this.admitOrCheckinButton=this.page.getByTestId('component-enxe').filter({ hasText: 'Admit or check-in' });
    this.patientDetailsTab=this.page.getByTestId('tab-details');
    this.arrowDownIconMenuButton=this.page.getByTestId('menubutton-dc8o');
    this.addDiagnosisButton=this.page.getByTestId('adddiagnosisbutton-2ij9');
    this.diagnosisContainer=this.page.getByTestId('diagnosislistcontainer-dqkk');
    this.diagnosisCategory=this.page.getByTestId('category-vwwx');
    this.diagnosisName=this.page.getByTestId('diagnosisname-vvn4');
    this.recordDeathLink=this.page.getByTestId('typographylink-6nzn').filter({ hasText: 'Record death' });
    this.revertDeathLink=this.page.getByTestId('typographylink-6nzn').filter({ hasText: 'Revert death record' });
  }

  async navigateToVaccineTab(): Promise<PatientVaccinePane> {
    await this.vaccineTab.click();
    if (!this.patientVaccinePane) {
      this.patientVaccinePane = new PatientVaccinePane(this.page);
    }
    return this.patientVaccinePane;
  }

  async navigateToProcedureTab(): Promise<ProcedurePane> {
    await this.encountersList.first().waitFor({ state: 'visible' });
    await this.encountersList.first().filter({ hasText: 'Hospital admission' }).click();
    await this.procedureTab.click();
    if (!this.patientProcedurePane) {
      this.patientProcedurePane = new ProcedurePane(this.page);
    }
    return this.patientProcedurePane;
  }

  async navigateToLabsTab(): Promise<LabRequestPane> {
    // Navigate to the top encounter
    await this.encountersList.first().waitFor({ state: 'visible' });
    await this.encountersList.first().filter({ hasText: 'Hospital admission' }).click();
    await this.labsTab.click();
    if (!this.labRequestPane) {
      this.labRequestPane = new LabRequestPane(this.page);
    }
    return this.labRequestPane;
  }
  async navigateToNotesTab(): Promise<NotesPane> {
    // Navigate to the top encounter
    await this.encountersList.first().waitFor({ state: 'visible' });
    await this.encountersList.first().filter({ hasText: 'Hospital admission' }).click();
    await this.notesTab.click();
    if (!this.notesPane) {
      this.notesPane = new NotesPane(this.page);
    }
    return this.notesPane;
  }

  async navigateToVitalsTab(): Promise<void> {
    await this.vitalsTab.click();
  }

  async navigateToDocumentsTab(): Promise<DocumentsPane> {
    await this.documentsTab.click();
    if (!this.documentsPane) {
      this.documentsPane = new DocumentsPane(this.page);
    }
    return this.documentsPane;
  }

  async waitForEncounterToBeReady(): Promise<void> {
    // Wait for URL to contain encounter ID
    await this.page.waitForURL(/\/encounter\/[^/]+/, { timeout: 10000 });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async navigateToTasksTab(): Promise<TasksPane> {
    await this.tasksTab.click();
    if (!this.tasksPane) {
      this.tasksPane = new TasksPane(this.page);
    }
    return this.tasksPane;
  }

  async navigateToChartsTab(): Promise<ChartsPane> {
    await this.chartsTab.click();
    if (!this.chartsPane) {
      this.chartsPane = new ChartsPane(this.page);
    }
    return this.chartsPane;
  }

  async navigateToReferralsTab(): Promise<ReferralPane> {
    await this.referralsTab.click();
    if (!this.referralPane) {
      this.referralPane = new ReferralPane(this.page);
    }
    return this.referralPane;
  }

  async navigateToFormsTab(): Promise<FormPane> {
    await this.formsTab.click();
    if (!this.formPane) {
      this.formPane = new FormPane(this.page);
    }
    return this.formPane;
  }

  async navigateToImagingRequestTab(): Promise<void> {
    await this.encountersList.first().waitFor({ state: 'visible' });
    await this.encountersList.first().click();
    await this.imagingTab.click();
  }

  async navigateToPatientDetailsTab(): Promise<PatientDetailsTabPage> {
    await this.patientDetailsTab.click();
    if (!this.patientDetailsTabPage) {
      this.patientDetailsTabPage = new PatientDetailsTabPage(this.page);
    }
    return this.patientDetailsTabPage;
  }

  async navigateToAllPatientsPage(): Promise<AllPatientsPage> {
    await this.page.goto(constructFacilityUrl(`${routes.patients.all}`));
    return new AllPatientsPage(this.page);
  }

  async navigateToMedicationTab(): Promise<EncounterMedicationPane> {
    await this.encountersList.first().waitFor({ state: 'visible' });
    await this.encountersList.first().click();
    await this.encounterMedicationTab.click();
    if (!this.encounterMedicationPane) {
      this.encounterMedicationPane = new EncounterMedicationPane(this.page);
    }
    await this.encounterMedicationPane.waitForPaneToLoad();
    return this.encounterMedicationPane;
  }

  async goToPatient(patient: Patient) {
    await this.page.goto(constructFacilityUrl(`/patients/all/${patient.id}`));
  }

  async addNewOngoingConditionWithJustRequiredFields(conditionName: string) {
    await this.initiateNewOngoingConditionAddButton.click();
    await this.ongoingConditionNameField.fill(conditionName);
    await this.page.getByRole('menuitem', { name: conditionName, exact: true }).click();
    await this.clickAddButtonToConfirm(this.submitNewOngoingConditionAddButton);
  }

  async addNewOngoingConditionWithAllFields(
    conditionName: string,
    dateRecorded: string,
    clinicianName: string,
    notes: string,
  ) {
    await this.initiateNewOngoingConditionAddButton.click();
    await this.ongoingConditionNameField.fill(conditionName);
    await this.page.getByRole('menuitem', { name: conditionName, exact: true }).click();
    await this.ongoingConditionDateRecordedField.fill(dateRecorded);
    await this.ongoingConditionClinicianField.click();
    await this.page.getByRole('menuitem', { name: clinicianName, exact: true }).click();
    await this.ongoingConditionNotes.fill(notes);
    await this.clickAddButtonToConfirm(this.submitNewOngoingConditionAddButton);
  }

  async addNewAllergyWithJustRequiredFields(allergyName: string) {
    await this.initiateNewAllergyAddButton.click();
    await this.allergyNameField.fill(allergyName);
    await this.page.getByRole('menuitem', { name: allergyName, exact: true }).click();
    await this.clickAddButtonToConfirm(this.submitNewAllergyAddButton);
  }

  async searchNewAllergyNotInDropdown(allergyName: string) {
    await this.initiateNewAllergyAddButton.click();
    await this.allergyNameField.fill(allergyName);
  }

  async addNewAllergyNotInDropdown(allergyName: string) {
    await this.page.getByRole('menuitem', { name: allergyName }).click();
    await this.dropdownMenuItem.waitFor({ state: 'hidden' });
    await expect(this.allergyNameField).toHaveValue(allergyName);
    await this.clickAddButtonToConfirm(this.submitNewAllergyAddButton);
  }

  async addNewFamilyHistoryWithJustRequiredFields(familyHistoryCondition: string) {
    await this.initiateNewFamilyHistoryAddButton.click();
    await this.familyHistoryDiagnosisField.fill(familyHistoryCondition);
    await this.page.getByRole('menuitem', { name: familyHistoryCondition, exact: true }).click();
    await this.clickAddButtonToConfirm(this.submitNewFamilyHistoryAddButton);
  }

  async addNewFamilyHistoryWithAllFields(
    familyHistoryCondition: string,
    dateRecorded: string,
    relationship: string,
    clinicianName: string,
    notes: string,
  ) {
    await this.initiateNewFamilyHistoryAddButton.click();
    await this.familyHistoryDiagnosisField.fill(familyHistoryCondition);
    await this.page.getByRole('menuitem', { name: familyHistoryCondition, exact: true }).click();
    await this.familyHistoryDateRecordedField.fill(dateRecorded);
    await this.familyHistoryRelationshipField.fill(relationship);
    await this.familyHistoryClinicianField.click();
    await this.page.getByRole('menuitem', { name: clinicianName, exact: true }).click();
    await this.familyHistoryNotes.fill(notes);
    await this.clickAddButtonToConfirm(this.submitNewFamilyHistoryAddButton);
  }

  async addNewOtherPatientIssueNote(otherPatientIssueNote: string) {
    await this.otherPatientIssueNote.fill(otherPatientIssueNote);
    await this.clickAddButtonToConfirm(this.submitNewOtherPatientIssuesAddButton);
  }

  async addNewOtherPatientIssueWarning(otherPatientIssueWarning: string) {
    await this.initiateNewOtherPatientIssuesAddButton.click();
    await this.defaultNewIssue.click();
    await this.page.getByText('Warning').click();
    await this.otherPatientIssueNote.fill(otherPatientIssueWarning);
    await this.clickAddButtonToConfirm(this.submitNewOtherPatientIssuesAddButton);
  }

  async addNewCarePlan() {
    await this.initiateNewCarePlanAddButton.click();
    if (!this.carePlanModal) {
      this.carePlanModal = new CarePlanModal(this.page);
    }
    return this.carePlanModal;
  }

  async navigateToCarePlan(carePlanName: string): Promise<CarePlanModal> {
    await this.completedCarePlan(carePlanName).click();
    if (!this.carePlanModal) {
      this.carePlanModal = new CarePlanModal(this.page);
    }
    return this.carePlanModal;
  }

  /**
   * Helper method to check that entire patient details page has loaded before any other actions happen
   */
  async confirmPatientDetailsPageHasLoaded() {
    await expect(this.vaccineTab).toBeVisible();
  }

  /**
   * Helper method for clicking add button with waitForLoadStates on either side to avoid flakiness
   */
  async clickAddButtonToConfirm(buttonLocator: Locator) {
    await this.page.waitForLoadState('networkidle');
    await buttonLocator.click();
    await this.page.waitForLoadState('networkidle');
  }

  generateNewAllergy(nhn: string) {
    return `Unique ${nhn} allergy`;
  }

  completedCarePlan(carePlanName: string) {
    return this.firstCarePlanListItem.filter({ hasText: carePlanName });
  }

  async resolveOngoingCondition(clinicianName: string, note: string) {
    await this.resolvedCheckbox.check();
    await this.resolvedClinician.click();
    await this.page.getByRole('menuitem', { name: clinicianName }).click();
    await this.resolvedNote.fill(note);
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  /**
   * Gets current browser date in the YYYY-MM-DD format in the browser timezone
   */
  getCurrentBrowserDateISOFormat() {
    return format(new Date(), 'yyyy-MM-dd');
  }

  // Helper methods for handling multiple buttons with the same test ID
  getSubmitEditsButton() {
    // Generic method - should be used with specific context
    return this.page
      .getByTestId('collapse-0a33')
      .getByTestId('formsubmitcancelrow-rz1i-confirmButton')
      .first();
  }

  getOngoingConditionEditSubmitButton() {
    return this.page
      .getByTestId('collapse-0a33')
      .getByTestId('formgrid-lqds')
      .getByRole('button', { name: 'Save' });
  }

  getAllergyEditSubmitButton() {
    return this.page
      .getByTestId('collapse-0a33')
      .getByTestId('formsubmitcancelrow-nx2z-confirmButton')
      .first();
  }

  getFamilyHistoryEditSubmitButton() {
    return this.page
      .getByTestId('collapse-0a33')
      .getByTestId('formsubmitcancelrow-rz1i-confirmButton')
      .first();
  }

  getOtherPatientIssuesEditSubmitButton() {
    return this.page
      .getByTestId('collapse-0a33')
      .getByTestId('formsubmitcancelrow-x2a0-confirmButton')
      .first();
  }

  getPrepareDischargeModal(): PrepareDischargeModal {
    if (!this.prepareDischargeModal) {
      this.prepareDischargeModal = new PrepareDischargeModal(this.page);
    }
    return this.prepareDischargeModal;
  }

  getCreateEncounterModal(): CreateEncounterModal {
    if (!this.createEncounterModal) {
      this.createEncounterModal = new CreateEncounterModal(this.page);
    }
    return this.createEncounterModal;
  }

  getEmergencyTriageModal(): EmergencyTriageModal {
    if (!this.emergencyTriageModal) {
      this.emergencyTriageModal = new EmergencyTriageModal(this.page);
    }
    return this.emergencyTriageModal;
  }

  getAddDiagnosisModal(): AddDiagnosisModal {
    if (!this._addDiagnosisModal) {
      this._addDiagnosisModal = new AddDiagnosisModal(this.page);
    }
    return this._addDiagnosisModal;
  }

  get encounterHistoryPane(): EncounterHistoryPane {
    if (!this._encounterHistoryPane) {
      this._encounterHistoryPane = new EncounterHistoryPane(this.page);
    }
    return this._encounterHistoryPane;
  }

  get changeEncounterDetailsMenu(): ChangeEncounterDetailsMenu {
    if (!this._changeEncounterDetailsMenu) {
      this._changeEncounterDetailsMenu = new ChangeEncounterDetailsMenu(this.page);
    }
    return this._changeEncounterDetailsMenu;
  }

  async admitToHospital(): Promise<Record<string, string>> {
    await this.admitOrCheckinButton.click();
    const createEncounterModal = this.getCreateEncounterModal();
    await createEncounterModal.waitForModalToLoad();
    await createEncounterModal.hospitalAdmissionButton.click();
    const hospitalAdmissionModal = createEncounterModal.getHospitalAdmissionModal();
    await hospitalAdmissionModal.waitForModalToLoad();
    const formValues = await hospitalAdmissionModal.fillHospitalAdmissionForm();
    await hospitalAdmissionModal.confirmButton.click();
    return formValues;
  }

  async clickRecordDeath(): Promise<void> {
    await this.recordDeathLink.waitFor({ state: 'visible' });
    await this.recordDeathLink.click();
  }

  getDeathModal(): DeathModal {
    if (!this._deathModal) {
      this._deathModal = new DeathModal(this.page);
    }
    return this._deathModal;
  }

  async waitForRevertDeathLink(): Promise<void> {
    await this.revertDeathLink.waitFor({ state: 'visible'});
  }
}
