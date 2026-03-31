import { Locator, Page, expect } from '@playwright/test';
import { fillMuiDateField } from '@utils/testHelper';
import { CarePlanModal } from '../modals/CarePlanModal';

/**
 * Encapsulates the "lists section" sidebar on the patient details page —
 * ongoing conditions, allergies, family history, other patient issues, and care plans.
 */
export class PatientSidebarListsSection {
  readonly page: Page;

  readonly initiateNewOngoingConditionAddButton: Locator;
  readonly ongoingConditionNameField: Locator;
  readonly ongoingConditionDateRecordedField: Locator;
  readonly ongoingConditionClinicianField: Locator;
  readonly ongoingConditionNotes: Locator;
  readonly ongoingConditionNameWrapper: Locator;
  readonly savedOnGoingConditionName: Locator;
  readonly savedOnGoingConditionDate: Locator;
  readonly savedOnGoingConditionClinician: Locator;
  readonly savedOnGoingConditionNote: Locator;
  readonly submitNewOngoingConditionAddButton: Locator;

  readonly initiateNewAllergyAddButton: Locator;
  readonly allergyNameField: Locator;
  readonly savedAllergyName: Locator;
  readonly savedAllergyDate: Locator;
  readonly savedAllergyNote: Locator;
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
  readonly savedFamilyHistoryName: Locator;

  readonly initiateNewOtherPatientIssuesAddButton: Locator;
  readonly defaultNewIssue: Locator;
  readonly savedIssueType: Locator;
  readonly otherPatientIssueNote: Locator;
  readonly savedOtherPatientIssueDate: Locator;
  readonly savedOtherPatientIssueNote: Locator;
  readonly submitNewOtherPatientIssuesAddButton: Locator;

  readonly initiateNewCarePlanAddButton: Locator;
  readonly dropdownMenuItem: Locator;
  readonly firstListItem: Locator;
  readonly firstCarePlanListItem: Locator;

  readonly warningModalTitle: Locator;
  readonly warningModalContent: Locator;
  readonly warningModalDismissButton: Locator;
  readonly warningModalOkayButton: Locator;

  readonly resolvedCheckbox: Locator;
  readonly resolvedClinician: Locator;
  readonly resolvedNote: Locator;
  readonly submitEditsButton: Locator;

  private carePlanModal?: CarePlanModal;

  constructor(page: Page) {
    this.page = page;

    const listsSection = page.getByTestId('listssection-1frw');
    const collapsedSection = page.getByTestId('collapse-0a33');

    this.initiateNewOngoingConditionAddButton = listsSection
      .locator('div')
      .filter({ hasText: 'Ongoing conditionsAdd' })
      .getByTestId('addbutton-b0ln');
    this.ongoingConditionNameField = page
      .getByTestId('field-j30y-input')
      .getByRole('textbox', { name: 'Search...' });
    this.ongoingConditionDateRecordedField = page.getByTestId('field-2775').locator('input');
    this.ongoingConditionClinicianField = page.getByTestId('field-9miu-input');
    this.ongoingConditionNotes = page.getByTestId('field-e52k-input');
    this.ongoingConditionNameWrapper = page.getByTestId('field-j30y-input-outerlabelfieldwrapper');
    this.savedOnGoingConditionName = collapsedSection
      .getByTestId('field-j30y-input')
      .getByRole('textbox');
    this.savedOnGoingConditionDate = collapsedSection.getByTestId('field-2775').locator('input');
    this.savedOnGoingConditionClinician = collapsedSection
      .getByTestId('field-9miu-input')
      .getByRole('textbox');
    this.savedOnGoingConditionNote = collapsedSection.getByTestId('field-e52k-input');
    this.submitNewOngoingConditionAddButton = page
      .getByTestId('formsubmitcancelrow-2r80-confirmButton')
      .first();

    this.initiateNewAllergyAddButton = listsSection
      .locator('div')
      .filter({ hasText: 'AllergiesAdd' })
      .getByTestId('addbutton-b0ln');
    this.allergyNameField = page
      .getByTestId('field-hwfk-input')
      .getByRole('textbox', { name: 'Search...' });
    this.savedAllergyName = collapsedSection.getByTestId('field-hwfk-input').getByRole('textbox');
    this.savedAllergyDate = collapsedSection.getByTestId('field-gmf8').locator('input');
    this.savedAllergyNote = collapsedSection.getByTestId('field-dayn-input');
    this.submitNewAllergyAddButton = page
      .getByTestId('formsubmitcancelrow-nx2z-confirmButton')
      .first();

    this.initiateNewFamilyHistoryAddButton = listsSection
      .locator('div')
      .filter({ hasText: 'Family historyAdd' })
      .getByTestId('addbutton-b0ln');
    this.familyHistoryDiagnosisField = page
      .getByTestId('field-3b4u-input')
      .getByRole('textbox', { name: 'Search...' });
    this.familyHistoryDateRecordedField = page.getByTestId('field-wrp3').locator('input');
    this.familyHistoryRelationshipField = page.getByTestId('field-t0k5-input');
    this.familyHistoryClinicianField = page.getByTestId('field-kbwi-input');
    this.familyHistoryNotes = page.getByTestId('field-mgiu-input');
    this.submitNewFamilyHistoryAddButton = page
      .getByTestId('formsubmitcancelrow-rz1i-confirmButton')
      .first();
    this.savedFamilyHistoryDateRecorded = collapsedSection
      .getByTestId('field-wrp3')
      .locator('input');
    this.savedFamilyHistoryRelationship = collapsedSection.getByTestId('field-t0k5-input');
    this.savedFamilyClinician = collapsedSection
      .getByTestId('field-kbwi-input')
      .getByRole('textbox');
    this.savedFamilyHistoryNote = collapsedSection.getByTestId('field-mgiu-input');
    this.savedFamilyHistoryName = collapsedSection
      .getByTestId('field-3b4u-input')
      .getByRole('textbox');

    this.initiateNewOtherPatientIssuesAddButton = listsSection
      .locator('div')
      .filter({ hasText: 'Other patient issuesAdd' })
      .getByTestId('addbutton-b0ln');
    this.defaultNewIssue = page.getByTestId('formgrid-vv7x').getByText('Issue');
    this.savedIssueType = collapsedSection.getByText('Type*Issue');
    this.otherPatientIssueNote = page.getByTestId('field-nj3s-input');
    this.savedOtherPatientIssueDate = collapsedSection.getByTestId('field-urg2').locator('input');
    this.savedOtherPatientIssueNote = collapsedSection.getByTestId('field-nj3s-input');
    this.submitNewOtherPatientIssuesAddButton = page
      .getByTestId('formsubmitcancelrow-x2a0-confirmButton')
      .first();

    this.initiateNewCarePlanAddButton = listsSection
      .locator('div')
      .filter({ hasText: 'Care plansAdd' })
      .getByTestId('addbutton-b0ln');
    this.dropdownMenuItem = page.getByTestId('typography-qxy3');
    this.firstListItem = page.getByTestId('listitem-adip-0');
    this.firstCarePlanListItem = page.getByTestId('listitem-fx300');

    this.warningModalTitle = page.getByTestId('modaltitle-ojhf');
    this.warningModalContent = page.getByTestId('modalcontent-bk4w');
    this.warningModalDismissButton = page.getByTestId('button-ui1m');
    this.warningModalOkayButton = page.getByTestId('button-3i9s');

    this.resolvedCheckbox = collapsedSection.getByTestId('field-c7nr-controlcheck').first();
    this.resolvedClinician = page
      .getByRole('combobox')
      .filter({ hasText: 'Clinician confirming' })
      .getByPlaceholder('Search...');
    this.resolvedNote = page.getByTestId('field-4g2s-input').first();
    this.submitEditsButton = collapsedSection
      .getByTestId('formsubmitcancelrow-rz1i-confirmButton')
      .first();
  }

  private async clickAddButtonToConfirm(buttonLocator: Locator) {
    await this.page.waitForLoadState('networkidle');
    await buttonLocator.click();
    await this.page.waitForLoadState('networkidle');
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
    await fillMuiDateField(this.ongoingConditionDateRecordedField, dateRecorded);
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
    await this.page
      .getByRole('menuitem', { name: familyHistoryCondition, exact: true })
      .click();
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
    await this.page
      .getByRole('menuitem', { name: familyHistoryCondition, exact: true })
      .click();
    await fillMuiDateField(this.familyHistoryDateRecordedField, dateRecorded);
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

  async addNewCarePlan(): Promise<CarePlanModal> {
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

  completedCarePlan(carePlanName: string) {
    return this.firstCarePlanListItem.filter({ hasText: carePlanName });
  }

  generateNewAllergy(nhn: string) {
    return `Unique ${nhn} allergy`;
  }

  async resolveOngoingCondition(clinicianName: string, note: string) {
    await this.resolvedCheckbox.check();
    await this.resolvedClinician.click();
    await this.page.getByRole('menuitem', { name: clinicianName }).click();
    await this.resolvedNote.fill(note);
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  getSubmitEditsButton() {
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
