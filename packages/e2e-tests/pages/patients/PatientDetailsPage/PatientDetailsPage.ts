import { Locator, Page, expect } from '@playwright/test';
import { BasePatientPage } from '../BasePatientPage';
import { PatientVaccinePane } from './panes/PatientVaccinePane';
import { CarePlanModal } from './modals/CarePlanModal';
export class PatientDetailsPage extends BasePatientPage {
  readonly vaccineTab: Locator;
  patientVaccinePane?: PatientVaccinePane;
  carePlanModal?: CarePlanModal;
  readonly initiateNewOngoingConditionAddButton: Locator;
  readonly ongoingConditionNameField: Locator;
  readonly submitNewOngoingConditionAddButton: Locator;
  readonly initiateNewAllergyAddButton: Locator;
  readonly allergyNameField: Locator;
  readonly submitNewAllergyAddButton: Locator;
  readonly initiateNewFamilyHistoryAddButton: Locator;
  readonly familyHistoryDiagnosisField: Locator;
  readonly submitNewFamilyHistoryAddButton: Locator;
  readonly initiateNewOtherPatientIssuesAddButton: Locator;
  readonly defaultNewIssue: Locator;
  readonly otherPatientIssueNote: Locator;
  readonly submitNewOtherPatientIssuesAddButton: Locator;
  readonly initiateNewCarePlanAddButton: Locator;
  readonly dropdownMenuItem: Locator;
  readonly firstListItem: Locator;
  readonly patientWarningHeader: Locator;
  readonly patientWarningModalContent: Locator;
  readonly patientNHN: Locator;
  readonly firstCarePlanListItem: Locator;
  constructor(page: Page) {
    super(page);

    this.vaccineTab = this.page.getByTestId('styledtab-yhha-vaccines');
    this.initiateNewOngoingConditionAddButton = this.page.getByTestId('listssection-1frw').locator('div').filter({ hasText: 'Ongoing conditionsAdd' }).getByTestId('addbutton-b0ln');
    this.ongoingConditionNameField = this.page.getByTestId('field-j30y-input').getByRole('textbox', { name: 'Search...' });
    this.submitNewOngoingConditionAddButton = this.page.getByTestId('formgrid-lqds').getByTestId('formsubmitbutton-ygc6');
    this.initiateNewAllergyAddButton = this.page.getByTestId('listssection-1frw').locator('div').filter({ hasText: 'AllergiesAdd' }).getByTestId('addbutton-b0ln');
    this.allergyNameField = this.page.getByTestId('field-hwfk-input').getByRole('textbox', { name: 'Search...' });
    this.submitNewAllergyAddButton = this.page.getByTestId('formgrid-p12d').getByTestId('formsubmitbutton-ygc6');
    this.initiateNewFamilyHistoryAddButton = this.page.getByTestId('listssection-1frw').locator('div').filter({ hasText: 'Family historyAdd' }).getByTestId('addbutton-b0ln');
    this.familyHistoryDiagnosisField = this.page.getByTestId('field-3b4u-input').getByRole('textbox', { name: 'Search...' });
    this.submitNewFamilyHistoryAddButton = this.page.getByTestId('formgrid-kjns').getByTestId('formsubmitbutton-ygc6');
    this.initiateNewOtherPatientIssuesAddButton = this.page.getByTestId('listssection-1frw').locator('div').filter({ hasText: 'Other patient issuesAdd' }).getByTestId('addbutton-b0ln');
    this.defaultNewIssue = this.page.getByTestId('formgrid-vv7x').getByText('Issue');
    this.otherPatientIssueNote = this.page.getByTestId('field-nj3s-input');
    this.submitNewOtherPatientIssuesAddButton = this.page.getByTestId('formgrid-vv7x').getByTestId('formsubmitbutton-ygc6');
    this.initiateNewCarePlanAddButton = this.page.getByTestId('listssection-1frw').locator('div').filter({ hasText: 'Care plansAdd' }).getByTestId('addbutton-b0ln');
    this.dropdownMenuItem = this.page.getByTestId('typography-qxy3');
    this.firstListItem = this.page.getByTestId('listitem-adip-0');
    this.patientWarningHeader = this.page.getByTestId('verticalcenteredtext-ni4s');
    this.patientWarningModalContent = this.page.getByTestId('modalcontent-bk4w');
    this.patientNHN = this.page.getByTestId('healthidtext-fqvn');
    this.firstCarePlanListItem = this.page.getByTestId('listitem-fx300');
  }

  async navigateToVaccineTab(): Promise<PatientVaccinePane> {
    await this.vaccineTab.click();
    if (!this.patientVaccinePane) {
      this.patientVaccinePane = new PatientVaccinePane(this.page);
    }
    return this.patientVaccinePane;
  }

  async addNewOngoingConditionWithJustRequiredFields(conditionName: string) {
    await this.initiateNewOngoingConditionAddButton.click();
    await this.ongoingConditionNameField.fill(conditionName);
    await this.page.getByRole('menuitem', { name: conditionName, exact: true }).click();
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
    await this.clickAddButtonToConfirm(this.submitNewAllergyAddButton);
  }

  async addNewFamilyHistoryWithJustRequiredFields(familyHistoryCondition: string) {
    await this.initiateNewFamilyHistoryAddButton.click();
    await this.familyHistoryDiagnosisField.fill(familyHistoryCondition);
    await this.page.getByRole('menuitem', { name: familyHistoryCondition, exact: true }).click();
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

  async navigateToCarePlan(carePlanName: string): Promise<CarePlanModal>  {
    await this.completedCarePlan(carePlanName).click();
    if (!this.carePlanModal) {
      this.carePlanModal = new CarePlanModal(this.page);
    }
    return this.carePlanModal;
  }

  //this is a helper method to check that the entire patient details page has loaded
  async checkPatientDetailsPageHasLoaded() {
    await expect(this.vaccineTab).toBeVisible();
  }

  //the waitForLoadStates on either side are to avoid flakiness that can occur here
  async clickAddButtonToConfirm(buttonLocator: Locator) {
    await this.page.waitForLoadState('networkidle');
    await buttonLocator.click();
    await this.page.waitForLoadState('networkidle');
  }

  generateNewAllergy(nhn: string) {
    return `Unique ${nhn} allergy`;
  }

  completedCarePlan(carePlanName: string) {
    return this.firstCarePlanListItem.filter({ hasText: carePlanName});
  }

}
