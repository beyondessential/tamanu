import { Locator, Page, expect } from '@playwright/test';
import { PatientDetailsPage } from '@pages/patients/PatientDetailsPage';
import { createApiContext, getUser } from '../../../../utils/apiHelpers';
import { selectFieldOption } from '../../../../utils/fieldHelpers';
import {
  fillMuiDateTimeField,
  formatDateTimeForDisplay,
  getTableItems,
  normalizeToIsoDateTimeMinute,
} from '../../../../utils/testHelper';

export interface ValidateRequestFinalisedPageParams {
  requestingClinician: string;
  requestedDateTime: string;
  department: string;
  priority?: string;
  expectedCategories: string[];
  expectedSampleDate?: string;
}

/**
 * Page object for the New lab request modal (2-step combined test/panel flow).
 *
 * Step 1: request details + the combined test/panel selector + notes, then Next.
 * Step 2: sample details, then Finalise.
 *
 * Tests and panels live in a single category-grouped list; a submission can mix panels and
 * standalone tests. Selector rows are keyed by lab-test-type / panel id (a UUID), so this object
 * locates rows by their visible name rather than by a hardcoded testid suffix.
 */
export class LabRequestModal {
  readonly page: Page;

  // Step 1: request details
  readonly requestingClinicianInput: Locator;
  readonly requestDateTimeInput: Locator;
  readonly departmentInput: Locator;
  readonly prioritySelect: Locator;
  readonly selectedPriority: Locator;
  readonly notesTextarea: Locator;

  // Step 1: combined test/panel selector
  readonly selector: Locator;
  readonly selectorList: Locator;
  readonly selectorSelected: Locator;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly clearAllButton: Locator;
  readonly selectorEmpty: Locator;
  readonly testRows: Locator;
  readonly panelRows: Locator;
  readonly selectedItems: Locator;

  // Action buttons (shared across steps)
  readonly backButton: Locator;
  readonly cancelButton: Locator;
  readonly nextButton: Locator;
  readonly finaliseButton: Locator;

  // Step 2: sample details
  readonly dateTimeCollectedInputs: Locator;
  readonly collectedByInputs: Locator;
  readonly collectedBySuggestionsList: Locator;
  readonly specimenTypeInputs: Locator;
  readonly specimenTypeSuggestionsList: Locator;
  readonly siteInputs: Locator;
  readonly siteSuggestionsList: Locator;
  readonly sampleDetailsTests: Locator;
  readonly sampleDetailsCategories: Locator;

  // Request finalised summary
  readonly requestingClinicianValue: Locator;
  readonly requestDateTimeValue: Locator;
  readonly departmentValue: Locator;
  readonly priorityValue: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Step 1: request details
    this.requestingClinicianInput = page.getByTestId('field-requestedby-input').locator('input');
    this.requestDateTimeInput = page.getByTestId('field-requesteddate').locator('input');
    this.departmentInput = page.getByTestId('field-department-input').locator('input');
    this.prioritySelect = page.getByTestId('field-priority-select');
    this.selectedPriority = this.prioritySelect.locator('div').locator('div').first();
    this.notesTextarea = page.getByTestId('field-notes-input');

    // Step 1: combined test/panel selector
    this.selector = page.getByTestId('test-selector');
    this.selectorList = page.getByTestId('test-selector-list');
    this.selectorSelected = page.getByTestId('test-selector-selected');
    this.searchInput = page.getByTestId('test-selector-search').locator('input');
    this.categoryFilter = page.getByTestId('test-selector-category-filter');
    this.clearAllButton = page.getByTestId('test-selector-clear-all');
    this.selectorEmpty = page.getByTestId('test-selector-empty');
    this.testRows = this.selectorList.locator(
      '[data-testid^="testrow-"]:not([data-testid*="checkbox"]):not([data-testid*="tooltip"])',
    );
    this.panelRows = this.selectorList.locator(
      '[data-testid^="panelrow-"]:not([data-testid*="checkbox"]):not([data-testid*="expand"])',
    );
    this.selectedItems = this.selectorSelected.locator(
      '[data-testid^="selecteditem-"]:not([data-testid*="remove"])',
    );

    // Action buttons
    this.backButton = page.getByTestId('styledbackbutton-016f');
    this.nextButton = page.getByTestId('formsubmitcancelrow-aaiz-confirmButton');
    this.finaliseButton = page.getByTestId('formsubmitcancelrow-aaiz-confirmButton');
    this.cancelButton = page.getByTestId('formsubmitcancelrow-aaiz-cancelButton');

    // Step 2: sample details
    this.dateTimeCollectedInputs = page.getByTestId('styledfield-sampletime-input');
    this.collectedByInputs = page.getByTestId('styledfield-collectedby-input');
    this.collectedBySuggestionsList = page.getByTestId('styledfield-collectedby-suggestionslist');
    this.specimenTypeInputs = page.getByTestId('styledfield-specimentype-input');
    this.specimenTypeSuggestionsList = page.getByTestId('styledfield-specimentype-suggestionslist');
    this.siteInputs = page.getByTestId('styledfield-site-input');
    this.siteSuggestionsList = page.getByTestId('styledfield-site-option-typography');
    this.sampleDetailsTests = page.getByTestId('typography-test');
    this.sampleDetailsCategories = page.getByTestId('typography-category');

    // Request finalised summary
    const clinicianLabel = page
      .getByTestId('cardlabel-6kys')
      .filter({ hasText: 'Requesting clinician' });
    this.requestingClinicianValue = clinicianLabel.locator('..').getByTestId('cardvalue-lcni');
    const dateTimeLabel = page
      .getByTestId('cardlabel-6kys')
      .filter({ hasText: 'Request date & time' });
    this.requestDateTimeValue = dateTimeLabel.locator('..').getByTestId('cardvalue-lcni');
    const departmentLabel = page.getByTestId('cardlabel-6kys').filter({ hasText: 'Department' });
    this.departmentValue = departmentLabel.locator('..').getByTestId('cardvalue-lcni');
    const priorityLabel = page.getByTestId('cardlabel-6kys').filter({ hasText: 'Priority' });
    this.priorityValue = priorityLabel.locator('..').getByTestId('cardvalue-lcni');
    this.closeButton = page.getByTestId('button-9vga');
  }

  async waitForModalToLoad() {
    await this.requestingClinicianInput.waitFor({ state: 'visible' });
  }

  async validateRequestedDateTimeIsToday() {
    const todayString = await this.getCurrentDateTime();
    const actual = normalizeToIsoDateTimeMinute(await this.requestDateTimeInput.inputValue());
    expect(actual).toBe(todayString);
    return todayString;
  }

  async validateDepartment() {
    const patientDetailsPage = new PatientDetailsPage(this.page);
    const departmentLabel = await patientDetailsPage.departmentLabel.textContent();
    await expect(this.departmentInput).toHaveValue(departmentLabel || '');
    return departmentLabel;
  }

  async validateRequestingClinician() {
    const currentUser = await this.getCurrentUser();
    await expect(this.requestingClinicianInput).toHaveValue(currentUser.displayName);
    return currentUser.displayName;
  }

  async getCurrentUser() {
    const api = await createApiContext({ page: this.page });
    const currentUser = await getUser(api);
    return currentUser;
  }

  async getCurrentDateTime(): Promise<string> {
    return this.page.evaluate(() => {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    });
  }

  // ---------------------------------------------------------------------------
  // Combined test/panel selector (step 1)
  // ---------------------------------------------------------------------------

  /** Every selectable list row (tests and panels), excluding nested checkboxes/toggles. */
  private get listRows(): Locator {
    return this.selectorList.locator(
      '[data-testid^="testrow-"]:not([data-testid*="checkbox"]):not([data-testid*="tooltip"]), ' +
        '[data-testid^="panelrow-"]:not([data-testid*="checkbox"]):not([data-testid*="expand"])',
    );
  }

  private testRowByName(name: string): Locator {
    return this.testRows.filter({ hasText: name }).first();
  }

  private panelRowByName(name: string): Locator {
    return this.panelRows.filter({ hasText: name }).first();
  }

  private testCheckbox(name: string): Locator {
    return this.testRowByName(name).locator('[data-testid^="testrow-checkbox-"] input');
  }

  private panelCheckbox(name: string): Locator {
    return this.panelRowByName(name).locator('[data-testid^="panelrow-checkbox-"] input');
  }

  /** Check a standalone test by its visible name. */
  async selectIndividualTest(name: string) {
    await this.testCheckbox(name).check();
  }

  /** Check several standalone tests in order. */
  async selectIndividualTests(names: string[]) {
    for (const name of names) {
      await this.selectIndividualTest(name);
    }
  }

  /** Check a panel by its visible name. */
  async selectPanel(name: string) {
    await this.panelCheckbox(name).check();
  }

  /** Check several panels in order. */
  async selectPanels(names: string[]) {
    for (const name of names) {
      await this.selectPanel(name);
    }
  }

  /** Expand a panel to reveal its read-only member tests. */
  async expandPanel(name: string) {
    await this.panelRowByName(name)
      .locator('[data-testid^="panelrow-expand-"]')
      .click();
  }

  /** A read-only member row (rendered when a panel is expanded) with the given visible name. */
  memberRow(name: string): Locator {
    return this.selectorList
      .locator('[data-testid^="member-"]')
      .filter({ hasText: name })
      .first();
  }

  /** Is a standalone test's row disabled (covered by an already-selected panel)? */
  async isTestDisabled(name: string): Promise<boolean> {
    return this.testCheckbox(name).isDisabled();
  }

  /**
   * The tooltip wrapper for a disabled test row. This element is only rendered when the row is
   * disabled (i.e. covered by an already-selected panel).
   */
  disabledTestTooltip(name: string): Locator {
    return this.selectorList
      .locator('[data-testid^="testrow-tooltip-"]')
      .filter({ hasText: name })
      .first();
  }

  /**
   * Hover a disabled test row and assert its "covered by a selected panel" tooltip appears.
   */
  async expectDisabledTestTooltip(name: string) {
    await this.disabledTestTooltip(name).hover();
    await expect(
      this.page.getByRole('tooltip', {
        name: 'A panel containing this test has already been selected',
      }),
    ).toBeVisible();
  }

  /** Type into the selector search box; the list flattens to matching rows. */
  async search(term: string) {
    await this.searchInput.fill(term);
  }

  /** Clear the selector search box. */
  async clearSearch() {
    await this.searchInput.fill('');
  }

  /** Remove a selected test or panel from the Selected pane by its visible name. */
  async removeSelected(name: string) {
    await this.selectedItems
      .filter({ hasText: name })
      .first()
      .getByTestId(/^selecteditem-remove-/)
      .click();
  }

  /** Clear the whole selection. */
  async clearAll() {
    await this.clearAllButton.click();
  }

  /** Number of items shown in the Selected pane. */
  async getSelectedCount(): Promise<number> {
    return this.selectedItems.count();
  }

  /** Visible names of the items shown in the Selected pane, in display order. */
  async getSelectedNames(): Promise<string[]> {
    const names = await this.selectedItems.allTextContents();
    return names.map(name => name.trim());
  }

  /** Assert the Selected pane contains exactly `expectedNames` (order-independent). */
  async validateSelectedItems(expectedNames: string[]) {
    await expect(this.selectedItems).toHaveCount(expectedNames.length);
    for (const name of expectedNames) {
      await expect(this.selectedItems.filter({ hasText: name })).toHaveCount(1);
    }
  }

  /**
   * Search for a single item by name and assert it is the only row in the list.
   */
  async searchItemAndValidate(itemName: string) {
    await this.search(itemName);
    await this.listRows.first().waitFor({ state: 'visible' });
    await expect(this.listRows).toHaveCount(1);
    await expect(this.listRows.first()).toContainText(itemName);
  }

  // ---------------------------------------------------------------------------
  // Step transitions
  // ---------------------------------------------------------------------------

  /** Proceed from request details (step 1) to sample details (step 2). */
  async proceedToSampleDetails() {
    await this.nextButton.click();
  }

  /** Submit the request from sample details (step 2). */
  async finalise() {
    await this.finaliseButton.click();
  }

  /** Go back to the previous step. */
  async goBack() {
    await this.backButton.click();
  }

  /** Cancel the modal. */
  async cancel() {
    await this.cancelButton.click();
  }

  /** Add notes on step 1. */
  async addNotes(notes: string) {
    await this.notesTextarea.fill(notes);
  }

  // ---------------------------------------------------------------------------
  // Sample details (step 2)
  // ---------------------------------------------------------------------------

  /**
   * Assert an item (panel or test) appears in the Test column of the sample details table.
   * Panels no longer get their own row — they appear in their category row's Test column.
   */
  async validateTestInSampleDetails(name: string) {
    await this.dateTimeCollectedInputs.first().waitFor({ state: 'visible' });
    await expect(this.sampleDetailsTests.filter({ hasText: name })).toBeVisible();
  }

  /**
   * Assert each expected category appears as a category row in the sample details table.
   */
  async validateCategoriesInSampleDetails(expectedCategories: string[]) {
    await this.dateTimeCollectedInputs.first().waitFor({ state: 'visible' });
    for (const category of expectedCategories) {
      await expect(this.sampleDetailsCategories.filter({ hasText: category })).toBeVisible();
    }
  }

  /**
   * Set date/time collected for a sample row (index targets a specific row when several exist).
   */
  async setDateTimeCollected(dateTime: string, index: number = 0) {
    const input = this.dateTimeCollectedInputs.nth(index);
    await input.click();
    await input.waitFor({ state: 'visible' });
    await fillMuiDateTimeField(input, dateTime);
  }

  /** Select the first "collected by" option for a sample row. */
  async selectFirstCollectedBy(index: number = 0) {
    const input = this.collectedByInputs.nth(index);
    await input.click();
    const firstOption = this.collectedBySuggestionsList.locator('ul').locator('li').first();
    await firstOption.click();
    return firstOption.textContent();
  }

  /** Select the first specimen type option for a sample row. */
  async selectFirstSpecimenType(index: number = 0) {
    const input = this.specimenTypeInputs.nth(index);
    await input.click();
    await this.specimenTypeSuggestionsList.locator('ul').locator('li').first().click();
  }

  /** Select the first site option for a sample row. */
  async selectFirstSite(index: number = 0) {
    const input = this.siteInputs.nth(index);
    await input.click();
    await this.siteSuggestionsList.first().click();
  }

  // ---------------------------------------------------------------------------
  // Request finalised summary
  // ---------------------------------------------------------------------------

  /** Read a column from the finalised summary table. */
  async getRequestFinalisedTableItems(tableRowCount: number, columnName: string) {
    return getTableItems(this.page, tableRowCount, columnName);
  }

  /**
   * Read the distinct category names shown on the finalised summary table. Used to feed
   * downstream lab-request-pane assertions without hardcoding category strings.
   */
  async getFinalisedCategories(rowCount: number): Promise<string[]> {
    const categories = await this.getRequestFinalisedTableItems(rowCount, 'labTestCategory');
    return [...new Set(categories.map(category => category.trim()).filter(Boolean))];
  }

  async validateRequestFinalisedPage({
    requestingClinician,
    requestedDateTime,
    department,
    priority,
    expectedCategories,
    expectedSampleDate,
  }: ValidateRequestFinalisedPageParams) {
    await expect(this.requestingClinicianValue).toHaveText(requestingClinician || 'Unknown');
    await expect(this.requestDateTimeValue).toHaveText(requestedDateTime);
    await expect(this.departmentValue).toHaveText(department || 'Unknown');
    await expect(this.priorityValue).toHaveText(priority || '-');

    const finalisedCategories = await this.getRequestFinalisedTableItems(
      expectedCategories.length,
      'labTestCategory',
    );
    expect(finalisedCategories).toEqual(expectedCategories);

    const finalisedSampleDates = await this.getRequestFinalisedTableItems(
      expectedCategories.length,
      'sampleDate',
    );
    let formattedSampleDate: string;
    if (expectedSampleDate && !isNaN(Date.parse(expectedSampleDate))) {
      formattedSampleDate = formatDateTimeForDisplay(new Date(expectedSampleDate));
    } else {
      formattedSampleDate = expectedSampleDate || 'Sample not collected';
    }
    for (let i = 0; i < expectedCategories.length; i++) {
      expect(finalisedSampleDates[i]).toEqual(formattedSampleDate);
    }
  }

  // ---------------------------------------------------------------------------
  // Composite flows used across specs
  // ---------------------------------------------------------------------------

  /**
   * Create a lab request from a set of standalone tests, straight through to close, leaving
   * sample details blank.
   * @returns the selected test names.
   */
  async createBasicIndividualLabRequest(testsToSelect?: string[]): Promise<string[]> {
    const selectedTests = testsToSelect || [
      'AgRDT Negative, no further testing needed',
      'AgRDT Positive, no further testing needed',
    ];
    await this.waitForModalToLoad();
    await this.selectIndividualTests(selectedTests);
    await this.proceedToSampleDetails();
    await this.finalise();
    await this.closeButton.click();
    return selectedTests;
  }

  /**
   * Create a panel lab request with priority chosen and sample details filled for the first row.
   * Finalises but leaves the summary open so the caller can read finalised details before closing.
   * @param panelsToSelect - panels to add to the request.
   * @returns the request date/time, the chosen priority label, and the finalised categories.
   */
  async createPanelLabRequestWithAllFields(
    panelsToSelect: string[],
  ): Promise<{ requestedDateTime: string; priority: string | null; categories: string[] }> {
    await this.waitForModalToLoad();
    const requestedDateTime = await this.validateRequestedDateTimeIsToday();
    await selectFieldOption(this.page, this.prioritySelect, { selectFirst: true });
    const priority = await this.selectedPriority.textContent();
    await this.selectPanels(panelsToSelect);
    await this.validateSelectedItems(panelsToSelect);
    await this.addNotes('This is a test note');
    await this.proceedToSampleDetails();
    const currentDateTime = await this.getCurrentDateTime();
    await this.setDateTimeCollected(currentDateTime);
    await this.selectFirstCollectedBy(0);
    await this.selectFirstSpecimenType(0);
    await this.selectFirstSite(0);
    for (const panel of panelsToSelect) {
      await this.validateTestInSampleDetails(panel);
    }
    await this.finalise();
    const categories = await this.getFinalisedCategories(panelsToSelect.length);
    await this.closeButton.click();
    return { requestedDateTime, priority, categories };
  }
}
