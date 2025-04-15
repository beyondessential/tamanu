import { Locator, Page, expect } from '@playwright/test';
import { BasePatientPage } from '../BasePatientPage';
import { PatientVaccinePane } from './panes/PatientVaccinePane';
import { CarePlanModal } from './modals/CarePlanModal';
//TODO: refactor to not use xpath once custom locators are added
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
  readonly otherPatientIssueDropdown: Locator;
  readonly otherPatientIssueWarningNote: Locator;
  readonly submitNewOtherPatientIssuesWarningAddButton: Locator;
  readonly initiateNewCarePlanAddButton: Locator;

  
  constructor(page: Page) {
    super(page);

    this.vaccineTab = this.page.getByTestId('tab-vaccines');
    this.initiateNewOngoingConditionAddButton = this.page.locator('div').filter({ hasText: /^Ongoing conditionsAdd$/ }).getByRole('button');
    this.ongoingConditionNameField = this.page.locator('input[name="conditionId"]');
    //TODO: refactor to not use xpath once custom locators are added
    this.submitNewOngoingConditionAddButton = this.page.getByRole('list').filter({ hasText: 'Condition name*Date' }).getByRole('button').nth(2);
    this.initiateNewAllergyAddButton = this.page.locator('div').filter({ hasText: /^AllergiesAdd$/ }).getByRole('button');
    this.allergyNameField = this.page.locator('input[name="allergyId"]');
    //TODO: refactor to not use xpath once custom locators are added
    this.submitNewAllergyAddButton = this.page.getByRole('list').filter({ hasText: 'Allergy name*ReactionDate' }).getByRole('button').nth(2);
    this.initiateNewFamilyHistoryAddButton = this.page.locator('div').filter({ hasText: /^Family historyAdd$/ }).getByRole('button');
    this.familyHistoryDiagnosisField = this.page.locator('input[name="diagnosisId"]');
    //TODO: refactor to not use xpath once custom locators are added
    this.submitNewFamilyHistoryAddButton = this.page.getByRole('list').filter({ hasText: 'Diagnosis*Date recorded*' }).getByRole('button').nth(2);
    this.initiateNewOtherPatientIssuesAddButton = this.page.locator('div').filter({ hasText: /^Other patient issuesAdd$/ }).getByRole('button');
    //TODO: refactor to not use xpath once custom locators are added, could also use a more fine grained locator if not possible
    this.defaultNewIssue = this.page.locator('div').filter({ hasText: /^Issue$/ }).nth(2);
    this.otherPatientIssueNote = this.page.getByRole('list').filter({ hasText: 'Type*IssueNotesDate recorded*' }).locator('textarea[name="note"]');
    //TODO: refactor to not use xpath once custom locators are added
    this.submitNewOtherPatientIssuesAddButton = this.page.getByRole('list').filter({ hasText: 'Type*IssueNotesNew issue' }).getByRole('button').nth(1);
    //TODO: refactor to not use xpath once custom locators are added
    this.otherPatientIssueDropdown = this.page.locator('div').filter({ hasText: /^Issue$/ }).nth(2);
   this.otherPatientIssueWarningNote = this.page.getByRole('list').filter({ hasText: 'Type*option [object Object],' }).locator('textarea[name="note"]');
   //TODO: refactor to not use xpath once custom locators are added
   this.submitNewOtherPatientIssuesWarningAddButton = this.page.getByRole('list').filter({ hasText: 'Type*WarningNotesTest' }).getByRole('button').nth(1);
   this.initiateNewCarePlanAddButton = this.page.locator('div').filter({ hasText: /^Care plansAdd$/ }).getByRole('button');
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
    await this.otherPatientIssueDropdown.click();
    await this.page.getByText('Warning').click();
    await this.otherPatientIssueWarningNote.fill(otherPatientIssueWarning);
    await this.clickAddButtonToConfirm(this.submitNewOtherPatientIssuesWarningAddButton);
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

  async confirmCorrectNHN(nhn: string) {
    await expect(this.page.getByText(`National Health Number${nhn}`)).toBeVisible();
  }

  confirmSexAndDOB(sex: string, dob: string) {
    return this.page.getByText(`Sex${sex}DOB${dob}`);
  }

  generateNewAllergy(nhn: string) {
    return `Unique ${nhn} allergy`;
  }

  completedNoteForNewIssue(note: string) {
    return this.page.getByRole('listitem').filter({ hasText: note });
  }

  completedCarePlan(carePlanName: string) {
    return this.page.getByRole('list').filter({ hasText: carePlanName});
  }
}
