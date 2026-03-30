import { Locator, Page, expect } from '@playwright/test';
import { ids, TABLE_CELL_PREFIX } from '@ids';
import { DataTable } from '@components/DataTable';
import { fillDateTime, toIsoDateTime, toTableDate, getBrowserDateTime } from '@helpers/dates';
import { selectOption, selectAutocomplete, selectFirstFromListbox } from '@helpers/fields';
import { createApiContext, getUser } from '@fixtures/api';

export interface LabRequestTestDetails {
  labTestId: string;
  category: string;
  requestedDate: string;
  requestedBy: string;
  priority: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Lab Request Pane (the tab within an encounter)
// ---------------------------------------------------------------------------

export class LabRequestPane {
  readonly table: DataTable;
  readonly newLabRequestButton: Locator;
  readonly categoryHeader: Locator;

  constructor(readonly page: Page) {
    this.table = new DataTable(page);
    this.newLabRequestButton = page.getByTestId(ids.labPane.newRequestButton).getByText('New Lab Request');
    this.categoryHeader = page.getByTestId(ids.labPane.sortByCategory);
  }

  cell(row: number, column: string): Locator {
    return this.page.getByTestId(`${TABLE_CELL_PREFIX}${row}-${column}`);
  }

  async waitForTableToLoad(): Promise<void> {
    await this.table.waitForTable();
  }

  async sortTableByCategory(): Promise<void> {
    await this.categoryHeader.click();
    await this.categoryHeader.click();
  }

  async validateLabRequestTableContent(
    categories: string[],
    requestedDate: string,
    requestedBy: string,
    priority: string,
    status: string,
  ): Promise<void> {
    await this.table.waitForTable();
    const sorted = [...categories].sort();

    for (let i = 0; i < sorted.length; i++) {
      await expect(this.cell(i, 'category.name')).toHaveText(sorted[i]);
      const dateText = await this.cell(i, 'requestedDate').textContent();
      expect(dateText).toBe(toTableDate(requestedDate));
      await expect(this.cell(i, 'displayName')).toHaveText(requestedBy);
      await expect(this.cell(i, 'priority.name')).toHaveText(priority);
      await expect(this.cell(i, 'status')).toHaveText(status);
    }
  }

  async getFirstRowDetails(): Promise<LabRequestTestDetails> {
    return {
      labTestId: (await this.cell(0, 'requestId').textContent()) || '',
      category: (await this.cell(0, 'category.name').textContent()) || '',
      requestedDate: (await this.cell(0, 'requestedDate').textContent()) || '',
      requestedBy: (await this.cell(0, 'displayName').textContent()) || '',
      priority: (await this.cell(0, 'priority.name').textContent()) || '',
      status: (await this.cell(0, 'status').textContent()) || '',
    };
  }
}

// ---------------------------------------------------------------------------
// Lab Request Modal (multi-step wizard for creating lab requests)
// ---------------------------------------------------------------------------

export class LabRequestModal {
  readonly page: Page;

  // Step 1: Basic details
  readonly form: Locator;
  readonly requestingClinicianInput: Locator;
  readonly requestDateTimeInput: Locator;
  readonly departmentInput: Locator;
  readonly prioritySelect: Locator;
  readonly panelRadioButton: Locator;
  readonly individualRadioButton: Locator;

  // Navigation
  readonly backButton: Locator;
  readonly nextButton: Locator;
  readonly finaliseButton: Locator;
  readonly cancelButton: Locator;
  readonly closeButton: Locator;

  // Step 2: Panel/test selection
  readonly selectedItemsList: Locator;
  readonly listItems: Locator;
  readonly selectedCategoryList: Locator;
  readonly clearAllButton: Locator;
  readonly testSelectionError: Locator;
  readonly searchInput: Locator;
  readonly notesInput: Locator;

  // Step 3: Sample details
  readonly dateTimeCollectedInputs: Locator;
  readonly collectedByInputs: Locator;
  readonly specimenTypeInputs: Locator;
  readonly siteInputs: Locator;

  // Step 4: Finalized
  readonly requestingClinicianLabel: Locator;
  readonly requestingClinicianValue: Locator;

  // Panel-specific
  readonly panelSelector: Locator;
  readonly panelTestSelector: Locator;
  readonly selectedPanelsList: Locator;

  constructor(page: Page) {
    this.page = page;
    const m = ids.labModal;

    this.form = page.getByTestId(m.form);
    this.requestingClinicianInput = page.getByTestId(m.requestingClinicianInput).locator('input');
    this.requestDateTimeInput = page.getByTestId(m.requestDateTimeField).locator('input');
    this.departmentInput = page.getByTestId(m.departmentInput).locator('input');
    this.prioritySelect = page.getByTestId(m.formGrid).getByTestId(m.prioritySelect);
    this.panelRadioButton = page.getByTestId(m.panelRadio);
    this.individualRadioButton = page.getByTestId(m.individualRadio);

    this.backButton = page.getByTestId(m.backButton);
    this.nextButton = page.getByTestId(m.nextButton);
    this.finaliseButton = page.getByTestId(m.nextButton);
    this.cancelButton = page.getByTestId(m.formGrid).getByTestId(m.cancelButton);
    this.closeButton = page.getByTestId(m.closeButton);

    this.selectedItemsList = page.getByTestId(m.selectedItems).getByTestId(m.labelText);
    this.listItems = page.getByTestId(m.selectorTable).getByTestId(m.labelText);
    this.selectedCategoryList = page.getByTestId(m.selectedItems).getByTestId(m.categoryText);
    this.clearAllButton = page.getByTestId(m.clearAllButton);
    this.testSelectionError = page.getByTestId(m.validationError);
    this.searchInput = page.getByTestId(m.searchInput);
    this.notesInput = page.getByTestId(m.notesInput);

    this.dateTimeCollectedInputs = page.getByTestId(m.dateTimeCollectedInputs);
    this.collectedByInputs = page.getByTestId(m.collectedByInputs);
    this.specimenTypeInputs = page.getByTestId(m.specimenTypeInputs);
    this.siteInputs = page.getByTestId(m.siteInputs);

    this.requestingClinicianLabel = page.getByTestId(m.requestingClinicianLabel).filter({ hasText: 'Requesting clinician' });
    this.requestingClinicianValue = this.requestingClinicianLabel.locator('..').getByTestId('cardvalue-lcni');

    this.panelSelector = page.getByTestId(ids.labPanel.panelSelector);
    this.panelTestSelector = page.getByTestId(ids.labPanel.testSelector);
    this.selectedPanelsList = page.getByTestId(ids.labPanel.selectedPanelsList);
  }

  async waitForModalToLoad(): Promise<void> {
    await this.form.waitFor({ state: 'visible' });
  }

  async validateRequestedDateTimeIsToday(): Promise<string> {
    const todayString = await getBrowserDateTime(this.page);
    const actual = toIsoDateTime(await this.requestDateTimeInput.inputValue());
    expect(actual).toBe(todayString);
    return todayString;
  }

  async validateDepartment(): Promise<void> {
    await expect(this.departmentInput).not.toBeEmpty();
  }

  async validateRequestingClinician(): Promise<string> {
    const value = await this.requestingClinicianInput.inputValue();
    expect(value).toBeTruthy();
    return value;
  }

  async getCurrentUser(): Promise<{ displayName: string; id: string }> {
    const api = await createApiContext({ page: this.page });
    try {
      return await getUser(api);
    } finally {
      await api.dispose();
    }
  }

  async getCurrentDateTime(): Promise<string> {
    return getBrowserDateTime(this.page);
  }

  /** Select panels or individual tests by their label text. Returns their categories. */
  async selectItemsByText(items: string[]): Promise<string[]> {
    const categories: string[] = [];
    for (const item of items) {
      const listItem = this.listItems.filter({ hasText: item });
      await listItem.click();
      const row = this.panelSelector.locator('tr').filter({ hasText: item });
      const cat = await row.getByTestId(ids.labModal.categoryText).textContent();
      if (cat) categories.push(cat);
    }
    return categories;
  }

  async validateSelectedItemsAndCategoriesInTable(
    items: string[],
    categories: string[],
  ): Promise<void> {
    for (let i = 0; i < items.length; i++) {
      await expect(this.selectedItemsList.nth(i)).toHaveText(items[i]);
      await expect(this.selectedCategoryList.nth(i)).toHaveText(categories[i]);
    }
  }

  async searchItemAndValidate(searchText: string): Promise<void> {
    await this.searchInput.fill(searchText);
    await expect(this.listItems.first()).toContainText(searchText);
  }

  async addNotes(noteText: string): Promise<void> {
    await this.notesInput.fill(noteText);
  }

  async setDateTimeCollected(dateTime: string, index = 0): Promise<void> {
    const input = this.dateTimeCollectedInputs.nth(index);
    await input.click();
    await input.waitFor({ state: 'visible' });
    await fillDateTime(input, dateTime);
  }

  async selectFirstCollectedBy(index = 0): Promise<string> {
    return selectFirstFromListbox(this.page, this.collectedByInputs.nth(index));
  }

  async selectFirstSpecimenType(index = 0): Promise<string> {
    return selectFirstFromListbox(this.page, this.specimenTypeInputs.nth(index));
  }

  // -- Panel-specific flows --

  async validateSelectedPanelsInSampleDetails(
    panels: string[],
    categories: string[],
  ): Promise<void> {
    const sorted = [...panels].sort();
    const sortedCats = panels.map((_, i) => categories[panels.indexOf(sorted[i] || panels[i])]);
    for (let i = 0; i < sorted.length; i++) {
      await expect(this.selectedPanelsList.getByTestId(ids.labModal.labelText).nth(i)).toHaveText(sorted[i]);
    }
  }

  async createPanelLabRequestWithAllFields(panelsToSelect: string[]): Promise<{
    requestedDateTime: string;
    priority: string | undefined;
    panelCategories: string[];
  }> {
    await this.waitForModalToLoad();
    const requestedDateTime = await this.validateRequestedDateTimeIsToday();
    const priority = await selectOption(this.page, this.prioritySelect);
    await this.nextButton.click();
    const panelCategories = await this.selectItemsByText(panelsToSelect);
    await this.addNotes('This is a test note');
    await this.nextButton.click();
    const currentDateTime = await this.getCurrentDateTime();
    await this.setDateTimeCollected(currentDateTime);
    await this.selectFirstCollectedBy(0);
    await this.selectFirstSpecimenType(0);
    await this.finaliseButton.click();
    await this.closeButton.click();

    return { requestedDateTime, priority, panelCategories };
  }
}
