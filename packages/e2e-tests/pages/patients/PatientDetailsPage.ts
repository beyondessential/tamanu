import { Locator, Page, expect } from '@playwright/test';
import { Patient } from '@tamanu/database';
import { ids } from '@ids';
import { facilityUrl, routes } from '@helpers/navigation';
import { fillDate, fillDateTime, getBrowserDate } from '@helpers/dates';

/**
 * Main patient details page with encounter summary, sidebar forms, and tab navigation.
 * Modals and panes are lazily created when navigating to their tabs.
 */
export class PatientDetailsPage {
  // -- Core chrome --
  readonly healthIdText: Locator;
  readonly prepareDischargeButton: Locator;
  readonly admitOrCheckinButton: Locator;
  readonly arrowDownMenuButton: Locator;
  readonly threeDotMenuButton: Locator;
  readonly editEncounterMenuItem: Locator;
  readonly movePatientButton: Locator;

  // -- Tabs --
  readonly vaccineTab: Locator;
  readonly procedureTab: Locator;
  readonly labsTab: Locator;
  readonly notesTab: Locator;
  readonly vitalsTab: Locator;
  readonly imagingTab: Locator;
  readonly documentsTab: Locator;
  readonly tasksTab: Locator;
  readonly chartsTab: Locator;
  readonly referralsTab: Locator;
  readonly medicationTab: Locator;
  readonly detailsTab: Locator;

  // -- Encounter summary --
  readonly encounterRows: Locator;
  readonly departmentLabel: Locator;
  readonly locationLabel: Locator;
  readonly dietLabel: Locator;

  // -- Diagnosis --
  readonly addDiagnosisButton: Locator;
  readonly diagnosisContainer: Locator;
  readonly diagnosisCategory: Locator;
  readonly diagnosisName: Locator;

  // -- Sidebar: sections & lists --
  readonly listsSection: Locator;
  readonly collapseSection: Locator;

  // -- Sidebar: Ongoing conditions --
  readonly addOngoingConditionButton: Locator;
  readonly ongoingConditionNameField: Locator;
  readonly ongoingConditionDateField: Locator;
  readonly ongoingConditionClinicianField: Locator;
  readonly ongoingConditionNotesField: Locator;
  readonly ongoingConditionNameWrapper: Locator;
  readonly ongoingConditionSubmitButton: Locator;
  readonly savedOngoingName: Locator;
  readonly savedOngoingDate: Locator;
  readonly savedOngoingClinician: Locator;
  readonly savedOngoingNote: Locator;
  readonly resolvedCheckbox: Locator;
  readonly resolvedClinician: Locator;
  readonly resolvedNote: Locator;

  // -- Sidebar: Allergies --
  readonly addAllergyButton: Locator;
  readonly allergyNameField: Locator;
  readonly savedAllergyName: Locator;
  readonly savedAllergyDate: Locator;
  readonly savedAllergyNote: Locator;
  readonly allergySubmitButton: Locator;

  // -- Sidebar: Family history --
  readonly addFamilyHistoryButton: Locator;
  readonly familyHistoryDiagnosisField: Locator;
  readonly familyHistoryDateField: Locator;
  readonly familyHistoryRelationshipField: Locator;
  readonly familyHistoryClinicianField: Locator;
  readonly familyHistoryNotesField: Locator;
  readonly familyHistorySubmitButton: Locator;
  readonly savedFamilyHistoryName: Locator;
  readonly savedFamilyHistoryDate: Locator;
  readonly savedFamilyHistoryRelationship: Locator;
  readonly savedFamilyClinician: Locator;
  readonly savedFamilyHistoryNote: Locator;

  // -- Sidebar: Other patient issues --
  readonly addOtherIssuesButton: Locator;
  readonly defaultNewIssue: Locator;
  readonly otherIssueNoteField: Locator;
  readonly otherIssuesSubmitButton: Locator;
  readonly savedIssueType: Locator;
  readonly savedOtherIssueNote: Locator;
  readonly savedOtherIssueDate: Locator;

  // -- Sidebar: Care plans --
  readonly addCarePlanButton: Locator;
  readonly firstCarePlanItem: Locator;

  // -- Warning modal --
  readonly warningTitle: Locator;
  readonly warningContent: Locator;
  readonly warningDismissButton: Locator;
  readonly warningOkayButton: Locator;

  // -- Misc --
  readonly dropdownMenuItem: Locator;
  readonly firstListItem: Locator;

  constructor(readonly page: Page) {
    const p = ids.patientDetails;
    const c = ids.patientDetails;

    // Core chrome
    this.healthIdText = page.getByTestId(p.healthIdText);
    this.prepareDischargeButton = page.getByRole('button', { name: 'Prepare discharge', exact: true });
    this.admitOrCheckinButton = page.getByTestId(p.prepareDischargeButton).filter({ hasText: 'Admit or check-in' });
    this.arrowDownMenuButton = page.getByTestId(p.arrowDownMenu);
    this.threeDotMenuButton = page.getByTestId(p.threeDotMenu);
    this.editEncounterMenuItem = page.getByTestId(p.editEncounterItem);
    this.movePatientButton = page.getByRole('button', { name: 'Move patient' });

    // Tabs
    this.vaccineTab = page.getByTestId(p.vaccineTab);
    this.procedureTab = page.getByTestId(p.procedureTab);
    this.labsTab = page.getByTestId(p.labsTab);
    this.notesTab = page.getByTestId(p.notesTab);
    this.vitalsTab = page.getByTestId(p.vitalsTab);
    this.imagingTab = page.getByTestId(p.imagingTab);
    this.documentsTab = page.getByTestId(p.documentsTab);
    this.tasksTab = page.getByTestId(p.tasksTab);
    this.chartsTab = page.getByTestId(p.chartsTab);
    this.referralsTab = page.getByTestId(p.referralsTab);
    this.medicationTab = page.getByTestId(p.medicationTab);
    this.detailsTab = page.getByTestId(p.detailsTab);

    // Encounter summary
    this.encounterRows = page.getByTestId(ids.table.body).locator('tr');
    this.departmentLabel = page.getByTestId('cardlabel-0v8z').filter({ hasText: 'Department' }).locator('..').getByTestId('cardvalue-1v8z');
    this.locationLabel = page.getByTestId('cardlabel-0v8z').filter({ hasText: 'Location' }).locator('..').getByTestId('cardvalue-1v8z');
    this.dietLabel = page.getByTestId('cardlabel-0v8z').filter({ hasText: 'Diet' }).locator('..').getByTestId('cardvalue-1v8z');

    // Diagnosis
    this.addDiagnosisButton = page.getByTestId(p.addDiagnosisButton);
    this.diagnosisContainer = page.getByTestId(p.diagnosisList);
    this.diagnosisCategory = page.getByTestId(p.diagnosisCategory);
    this.diagnosisName = page.getByTestId(p.diagnosisName);

    // Sidebar sections
    this.listsSection = page.getByTestId(p.listsSection);
    this.collapseSection = page.getByTestId(p.collapseSection);

    // Ongoing conditions
    this.addOngoingConditionButton = this.listsSection.locator('div').filter({ hasText: 'Ongoing conditionsAdd' }).getByTestId(p.addButton);
    this.ongoingConditionNameField = page.getByTestId(p.ongoingConditionName).getByRole('textbox', { name: 'Search...' });
    this.ongoingConditionDateField = page.getByTestId(p.ongoingConditionDate).locator('input');
    this.ongoingConditionClinicianField = page.getByTestId(p.ongoingConditionClinician);
    this.ongoingConditionNotesField = page.getByTestId(p.ongoingConditionNotes);
    this.ongoingConditionNameWrapper = page.getByTestId(p.ongoingConditionNameWrapper);
    this.ongoingConditionSubmitButton = page.getByTestId(p.ongoingConditionSubmit).first();
    this.savedOngoingName = this.collapseSection.getByTestId(p.ongoingConditionName).getByRole('textbox');
    this.savedOngoingDate = this.collapseSection.getByTestId(p.ongoingConditionDate).locator('input');
    this.savedOngoingClinician = this.collapseSection.getByTestId(p.ongoingConditionClinician).getByRole('textbox');
    this.savedOngoingNote = this.collapseSection.getByTestId(p.ongoingConditionNotes);
    this.resolvedCheckbox = this.collapseSection.getByTestId(p.carePlanDeleteCheckbox).first();
    this.resolvedClinician = page.getByRole('combobox').filter({ hasText: 'Clinician confirming' }).getByPlaceholder('Search...');
    this.resolvedNote = page.getByTestId(p.carePlanDateRecordedField).first();

    // Allergies
    this.addAllergyButton = this.listsSection.locator('div').filter({ hasText: 'AllergiesAdd' }).getByTestId(p.addButton);
    this.allergyNameField = page.getByTestId(p.allergyName).getByRole('textbox', { name: 'Search...' });
    this.savedAllergyName = this.collapseSection.getByTestId(p.allergyName).getByRole('textbox');
    this.savedAllergyDate = this.collapseSection.getByTestId(p.allergyDate).locator('input');
    this.savedAllergyNote = this.collapseSection.getByTestId('field-dayn-input');
    this.allergySubmitButton = page.getByTestId(p.allergySubmit).first();

    // Family history
    this.addFamilyHistoryButton = this.listsSection.locator('div').filter({ hasText: 'Family historyAdd' }).getByTestId(p.addButton);
    this.familyHistoryDiagnosisField = page.getByTestId(p.familyHistoryDiagnosis).getByRole('textbox', { name: 'Search...' });
    this.familyHistoryDateField = page.getByTestId(p.familyHistoryDate).locator('input');
    this.familyHistoryRelationshipField = page.getByTestId(p.familyHistoryRelationship);
    this.familyHistoryClinicianField = page.getByTestId(p.familyHistoryClinician);
    this.familyHistoryNotesField = page.getByTestId(p.familyHistoryNotes);
    this.familyHistorySubmitButton = page.getByTestId(p.familyHistorySubmit).first();
    this.savedFamilyHistoryName = this.collapseSection.getByTestId(p.familyHistoryDiagnosis).getByRole('textbox');
    this.savedFamilyHistoryDate = this.collapseSection.getByTestId(p.familyHistoryDate).locator('input');
    this.savedFamilyHistoryRelationship = this.collapseSection.getByTestId(p.familyHistoryRelationship);
    this.savedFamilyClinician = this.collapseSection.getByTestId(p.familyHistoryClinician).getByRole('textbox');
    this.savedFamilyHistoryNote = this.collapseSection.getByTestId(p.familyHistoryNotes);

    // Other patient issues
    this.addOtherIssuesButton = this.listsSection.locator('div').filter({ hasText: 'Other patient issuesAdd' }).getByTestId(p.addButton);
    this.defaultNewIssue = page.getByTestId('formgrid-vv7x').getByText('Issue');
    this.otherIssueNoteField = page.getByTestId(p.otherIssuesNote);
    this.otherIssuesSubmitButton = page.getByTestId(p.otherIssuesSubmit).first();
    this.savedIssueType = this.collapseSection.getByText('Type*Issue');
    this.savedOtherIssueNote = this.collapseSection.getByTestId(p.otherIssuesNote);
    this.savedOtherIssueDate = this.collapseSection.getByTestId(p.otherIssuesDate).locator('input');

    // Care plans
    this.addCarePlanButton = this.listsSection.locator('div').filter({ hasText: 'Care plansAdd' }).getByTestId(p.addButton);
    this.firstCarePlanItem = page.getByTestId('listitem-fx300');

    // Warning modal
    this.warningTitle = page.getByTestId(p.warningTitle);
    this.warningContent = page.getByTestId(p.warningContent);
    this.warningDismissButton = page.getByTestId(p.warningCancel);
    this.warningOkayButton = page.getByTestId(p.warningProceed);

    // Misc
    this.dropdownMenuItem = page.getByTestId('typography-qxy3');
    this.firstListItem = page.getByTestId('listitem-adip-0');
  }

  // -- Navigation --

  async goToPatient(patient: Patient): Promise<void> {
    await this.page.goto(facilityUrl(`/patients/all/${patient.id}`));
  }

  async confirmPageLoaded(): Promise<void> {
    await expect(this.vaccineTab).toBeVisible();
  }

  async navigateToEncounter(encounterType = 'Hospital admission'): Promise<void> {
    await this.encounterRows.first().waitFor({ state: 'visible' });
    await this.encounterRows.first().filter({ hasText: encounterType }).click();
  }

  async navigateToLabsTab(): Promise<void> {
    await this.navigateToEncounter();
    await this.labsTab.click();
  }

  async navigateToNotesTab(): Promise<void> {
    await this.navigateToEncounter();
    await this.notesTab.click();
  }

  async navigateToVitalsTab(): Promise<void> {
    await this.vitalsTab.click();
  }

  async navigateToImagingTab(): Promise<void> {
    await this.encounterRows.first().waitFor({ state: 'visible' });
    await this.encounterRows.first().click();
    await this.imagingTab.click();
  }

  async navigateToDocumentsTab(): Promise<void> {
    await this.documentsTab.click();
  }

  async navigateToTasksTab(): Promise<void> {
    await this.tasksTab.click();
  }

  async navigateToChartsTab(): Promise<void> {
    await this.chartsTab.click();
  }

  async navigateToReferralsTab(): Promise<void> {
    await this.referralsTab.click();
  }

  async navigateToProcedureTab(): Promise<void> {
    await this.navigateToEncounter();
    await this.procedureTab.click();
  }

  async navigateToVaccineTab(): Promise<void> {
    await this.vaccineTab.click();
  }

  async navigateToMedicationTab(): Promise<void> {
    await this.navigateToEncounter();
    await this.medicationTab.click();
  }

  async navigateToDetailsTab(): Promise<void> {
    await this.detailsTab.click();
  }

  async navigateToAllPatients(): Promise<void> {
    await this.page.goto(facilityUrl(routes.patients.all));
  }

  async waitForEncounterReady(): Promise<void> {
    await this.page.waitForURL(/\/encounter\/[^/]+/, { timeout: 10000 });
  }

  // -- Hospital admission --

  async admitToHospital(): Promise<void> {
    await this.admitOrCheckinButton.click();
    await this.page.getByTestId(ids.createEncounter.typeButton).filter({ hasText: 'Hospital admission' }).click();
    const modal = this.page.getByTestId(ids.hospitalAdmission.container);
    await modal.waitFor({ state: 'visible' });
  }

  // -- Edit encounter --

  async openEditEncounterModal(): Promise<void> {
    await this.threeDotMenuButton.click();
    await this.editEncounterMenuItem.waitFor({ state: 'visible' });
    await this.editEncounterMenuItem.click();
  }

  // -- Sidebar forms --

  private async clickSubmitButton(button: Locator): Promise<void> {
    await button.click();
  }

  async addOngoingCondition(name: string): Promise<void> {
    await this.addOngoingConditionButton.click();
    await this.ongoingConditionNameField.fill(name);
    await this.page.getByRole('menuitem', { name, exact: true }).click();
    await this.clickSubmitButton(this.ongoingConditionSubmitButton);
  }

  async addOngoingConditionWithAllFields(
    name: string,
    date: string,
    clinician: string,
    notes: string,
  ): Promise<void> {
    await this.addOngoingConditionButton.click();
    await this.ongoingConditionNameField.fill(name);
    await this.page.getByRole('menuitem', { name, exact: true }).click();
    await fillDate(this.ongoingConditionDateField, date);
    await this.ongoingConditionClinicianField.click();
    await this.page.getByRole('menuitem', { name: clinician, exact: true }).click();
    await this.ongoingConditionNotesField.fill(notes);
    await this.clickSubmitButton(this.ongoingConditionSubmitButton);
  }

  async resolveOngoingCondition(clinician: string, note: string): Promise<void> {
    await this.resolvedCheckbox.check();
    await this.resolvedClinician.click();
    await this.page.getByRole('menuitem', { name: clinician }).click();
    await this.resolvedNote.fill(note);
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  async addAllergy(name: string): Promise<void> {
    await this.addAllergyButton.click();
    await this.allergyNameField.fill(name);
    await this.page.getByRole('menuitem', { name, exact: true }).click();
    await this.clickSubmitButton(this.allergySubmitButton);
  }

  async searchAllergyNotInDropdown(name: string): Promise<void> {
    await this.addAllergyButton.click();
    await this.allergyNameField.fill(name);
  }

  async addAllergyNotInDropdown(name: string): Promise<void> {
    await this.page.getByRole('menuitem', { name }).click();
    await this.dropdownMenuItem.waitFor({ state: 'hidden' });
    await expect(this.allergyNameField).toHaveValue(name);
    await this.clickSubmitButton(this.allergySubmitButton);
  }

  async addFamilyHistory(condition: string): Promise<void> {
    await this.addFamilyHistoryButton.click();
    await this.familyHistoryDiagnosisField.fill(condition);
    await this.page.getByRole('menuitem', { name: condition, exact: true }).click();
    await this.clickSubmitButton(this.familyHistorySubmitButton);
  }

  async addFamilyHistoryWithAllFields(
    condition: string,
    date: string,
    relationship: string,
    clinician: string,
    notes: string,
  ): Promise<void> {
    await this.addFamilyHistoryButton.click();
    await this.familyHistoryDiagnosisField.fill(condition);
    await this.page.getByRole('menuitem', { name: condition, exact: true }).click();
    await fillDate(this.familyHistoryDateField, date);
    await this.familyHistoryRelationshipField.fill(relationship);
    await this.familyHistoryClinicianField.click();
    await this.page.getByRole('menuitem', { name: clinician, exact: true }).click();
    await this.familyHistoryNotesField.fill(notes);
    await this.clickSubmitButton(this.familyHistorySubmitButton);
  }

  async addOtherIssueNote(note: string): Promise<void> {
    await this.otherIssueNoteField.fill(note);
    await this.clickSubmitButton(this.otherIssuesSubmitButton);
  }

  async addOtherIssueWarning(warning: string): Promise<void> {
    await this.addOtherIssuesButton.click();
    await this.defaultNewIssue.click();
    await this.page.getByText('Warning').click();
    await this.otherIssueNoteField.fill(warning);
    await this.clickSubmitButton(this.otherIssuesSubmitButton);
  }

  generateUniqueAllergy(nhn: string): string {
    return `Unique ${nhn} allergy`;
  }

  completedCarePlan(name: string): Locator {
    return this.firstCarePlanItem.filter({ hasText: name });
  }

  async getCurrentBrowserDate(): Promise<string> {
    return getBrowserDate(this.page);
  }

  // -- Edit submit buttons (scoped to collapsed section) --

  getOngoingConditionEditSubmitButton(): Locator {
    return this.collapseSection.getByTestId(ids.patientDetails.formGrid).getByRole('button', { name: 'Save' });
  }

  getAllergyEditSubmitButton(): Locator {
    return this.page.getByTestId(ids.patientDetails.collapseSection).getByTestId(ids.patientDetails.allergySubmit).first();
  }

  getFamilyHistoryEditSubmitButton(): Locator {
    return this.collapseSection.getByTestId(ids.patientDetails.familyHistorySubmit).first();
  }

  getOtherIssuesEditSubmitButton(): Locator {
    return this.collapseSection.getByTestId(ids.patientDetails.otherIssuesSubmit).first();
  }
}
