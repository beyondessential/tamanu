import { Locator, Page, expect } from '@playwright/test';
import { Patient } from '@tamanu/database';
import { constructFacilityUrl } from '@utils/navigation';
import { BasePatientPage } from '../BasePatientPage';
import { PatientVaccinePane } from './panes/PatientVaccinePane';
import { CarePlanModal } from './modals/CarePlanModal';
import { LabRequestPane } from '../LabRequestPage/panes/LabRequestPane';

export class PatientDetailsPage extends BasePatientPage {
  readonly vaccineTab: Locator;
  readonly healthIdText: Locator;
  patientVaccinePane?: PatientVaccinePane;
  carePlanModal?: CarePlanModal;
  readonly initiateNewOngoingConditionAddButton: Locator;
  readonly ongoingConditionNameField: Locator;
  readonly ongoingConditionDateRecordedField: Locator;
  readonly ongoingConditionClinicianField: Locator;
  readonly savedOnGoingConditionName: Locator;
  readonly ongoingConditionNotes: Locator;
  readonly savedOnGoingConditionDate: Locator;
  readonly savedOnGoingConditionClinician: Locator;
  readonly savedOnGoingConditionNote: Locator;
  readonly onGoingConditionForm: Locator;
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
  readonly encountersList: Locator;
  readonly departmentLabel: Locator;
  labRequestPane?: LabRequestPane;
  constructor(page: Page) {
    super(page);

    this.vaccineTab = this.page.getByTestId('tab-vaccines');
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
    this.onGoingConditionForm = this.page.getByTestId('listssection-1frw');
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
    this.encountersList=this.page.getByTestId('styledtablebody-a0jz').locator('tr');
    this.departmentLabel=this.page.getByTestId('cardlabel-0v8z').filter({ hasText: 'Department' }).locator('..').getByTestId('cardvalue-1v8z');
  }

  async navigateToVaccineTab(): Promise<PatientVaccinePane> {
    await this.vaccineTab.click();
    if (!this.patientVaccinePane) {
      this.patientVaccinePane = new PatientVaccinePane(this.page);
    }
    return this.patientVaccinePane;
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

  async goToPatient(patient: Patient) {
    await this.page.goto(constructFacilityUrl(`/#/patients/all/${patient.id}`));
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
async getCurrentBrowserDateISOFormat() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
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
}
