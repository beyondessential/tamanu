import { Locator, Page, expect } from '@playwright/test';
import { PatientDetailsPage } from '@pages/patients/PatientDetailsPage';
import { createApiContext, getUser } from '../../../../utils/apiHelpers';
import { format } from 'date-fns';
import { getTableItems } from '../../../../utils/testHelper';

const CATEGORY_TEXT_TEST_ID = 'categorytext-jno3';

export class LabRequestModalBase {
  readonly page: Page;
  readonly form: Locator;
  readonly heading: Locator;
  readonly description: Locator;
  
  // Page 1: Basic lab request details (shared across all modals)
  readonly requestingClinicianInput: Locator;
  readonly requestDateTimeInput: Locator;
  readonly departmentInput: Locator;
  readonly prioritySelect: Locator;
  readonly panelRadioButton: Locator;
  readonly individualRadioButton: Locator;
  
  // Action buttons (shared across all modals)
  readonly backButton: Locator;
  readonly cancelButton: Locator;
  readonly nextButton: Locator;
  readonly finaliseButton: Locator;
  
  // Generic locators for selected items (shared across all modals)
  readonly selectedItemsList: Locator;
  readonly selectedItems: Locator;
  readonly listItems: Locator;
  readonly selectedCategoryList: Locator;
  readonly clearAllButton: Locator;
  readonly testSelectionError: Locator;
  
  // Page 3: Sample details (shared across all modals)
  readonly dateTimeCollectedInputs: Locator;
  readonly collectedByInputs: Locator;
  readonly collectedBySuggestionsList: Locator;
  readonly specimenTypeInputs: Locator;
  readonly specimenTypeSuggestionsList: Locator;
  readonly siteInputs: Locator;
  readonly siteSuggestionsList: Locator;
  readonly sampleDetailsPanels: Locator;
  readonly sampleDetailsCategories: Locator;
  
  // Page 4: Request Finalised (shared across all modals)
  readonly requestingClinicianLabel: Locator;
  readonly requestingClinicianValue: Locator;
  readonly requestDateTimeLabel: Locator;
  readonly requestDateTimeValue: Locator;
  readonly departmentLabel: Locator;
  readonly departmentValue: Locator;
  readonly priorityLabel: Locator;
  readonly priorityValue: Locator;
  readonly selectAllCheckbox: Locator;
  readonly testIdColumnHeader: Locator;
  readonly tableRowCheckboxes: Locator;
  readonly tableRowTestIds: Locator;
  readonly tableRowPanels: Locator;
  readonly tableRowCategories: Locator;
  readonly tableRowSampleDates: Locator;
  readonly printLabelButton: Locator;
  readonly printRequestButton: Locator;
  readonly closeButton: Locator;
  readonly notesTextarea: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.form = page.getByTestId('styledform-5o5i');
    this.heading = page.getByTestId('heading3-keat');
    this.description = page.getByTestId('styledbodytext-8egc');
    
    // Page 1: Basic lab request details
    this.requestingClinicianInput = page.getByTestId('field-z6gb-input').locator('input');
    this.requestDateTimeInput = page.getByTestId('field-y6ku-input').locator('input');
    this.departmentInput = page.getByTestId('field-wobc-input').locator('input');
    this.prioritySelect = page.getByTestId('selectinput-phtg-select');
    this.panelRadioButton = page.getByTestId('radio-il3t-panel');
    this.individualRadioButton = page.getByTestId('radio-il3t-individual');
    
    // Action buttons
    this.backButton = page.getByTestId('styledbackbutton-016f');
    this.cancelButton = page.getByTestId('formgrid-wses').getByTestId('outlinedbutton-8rnr');
    this.nextButton = page.getByTestId('formsubmitcancelrow-aaiz-confirmButton');
    this.finaliseButton = page.getByTestId('formsubmitcancelrow-aaiz-confirmButton');
    
    // Generic locators for selected items
    this.selectedItemsList = page.getByTestId('testitemwrapper-o7ha').getByTestId('labeltext-6stl');
    this.selectedItems = page.getByTestId('testitemwrapper-o7ha');
    this.listItems = page.getByTestId('selectortable-dwrp').getByTestId('labeltext-6stl');
    this.selectedCategoryList = page.getByTestId('testitemwrapper-o7ha').getByTestId('categorytext-jno3');
    this.clearAllButton = page.getByTestId('clearallbutton-ao0r');
    this.testSelectionError = page.getByTestId('formhelpertext-198r');
    // Page 3: Sample details
    this.dateTimeCollectedInputs = page.getByTestId('styledfield-ratc-input');
    this.collectedByInputs = page.getByTestId('styledfield-wifm-input').locator('input');
    this.collectedBySuggestionsList = page.getByTestId('styledfield-wifm-suggestionslist');
    this.specimenTypeInputs = page.getByTestId('styledfield-8g4b-input').locator('input');
    this.specimenTypeSuggestionsList = page.getByTestId('styledfield-8g4b-suggestionslist');
    this.siteInputs = page.getByTestId('styledfield-mog8-input').locator('input');
    this.siteSuggestionsList = page.getByTestId('styledfield-mog8-option-typography');
    this.sampleDetailsPanels = page.getByTestId('typography-ex0x');
    this.sampleDetailsCategories = page.getByTestId('typography-772r');
    
    // Page 4: Request Finalised
    this.requestingClinicianLabel = page.getByTestId('cardlabel-6kys').filter({ hasText: 'Requesting clinician' });
    this.requestingClinicianValue = this.requestingClinicianLabel.locator('..').getByTestId('cardvalue-lcni');
    this.requestDateTimeLabel = page.getByTestId('cardlabel-6kys').filter({ hasText: 'Request date & time' });
    this.requestDateTimeValue = this.requestDateTimeLabel.locator('..').getByTestId('cardvalue-lcni');
    this.departmentLabel = page.getByTestId('cardlabel-6kys').filter({ hasText: 'Department' });
    this.departmentValue = this.departmentLabel.locator('..').getByTestId('cardvalue-lcni');
    this.priorityLabel = page.getByTestId('cardlabel-6kys').filter({ hasText: 'Priority' });
    this.priorityValue = this.priorityLabel.locator('..').getByTestId('cardvalue-lcni');
    this.selectAllCheckbox = page.getByTestId('checkinput-irky-controlcheck');
    this.testIdColumnHeader = page.getByTestId('tablelabel-0eff-displayId');
    this.tableRowCheckboxes = page.getByTestId('checkinput-83pj-controlcheck');
    this.tableRowTestIds = page.getByTestId('styledtablecell-2gyy-0-displayId');
    this.tableRowPanels = page.getByTestId('styledtablecell-2gyy-0-panelId');
    this.tableRowCategories = page.getByTestId('styledtablecell-2gyy-0-labTestCategory');
    this.tableRowSampleDates = page.getByTestId('styledtablecell-2gyy-0-sampleDate');
    this.printLabelButton = page.getByTestId('outlinedbutton-skm0');
    this.printRequestButton = page.getByTestId('outlinedbutton-01eu');
    this.closeButton = page.getByTestId('button-9vga');
    this.notesTextarea = page.getByTestId('field-3t0x-input');
    this.searchInput = page.getByTestId('styledsearchfield-92y3-input');
  }

  async waitForModalToLoad() {
    await this.requestingClinicianInput.waitFor({ state: 'visible' });
  }

  async validateRequestedDateTimeIsToday() {
    const todayString = this.getCurrentDateTime();
    console.log('todayString', todayString);
    console.log('requestDateTimeInput', await this.requestDateTimeInput.inputValue());
    await expect(this.requestDateTimeInput).toHaveValue(todayString);
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

  getCurrentDateTime(): string {
    return format(new Date(), "yyyy-MM-dd'T'HH:mm");
  }

  /**
   * Generic method to select items by text and return their categories
   * @param itemNames - The names of the items to select
   * @returns The categories of the selected items
   */
  async selectItemsByText(itemNames: string[]) {
    const itemCategories: string[] = [];
    for (const itemName of itemNames) {
      const item = this.listItems.filter({ hasText: itemName }).nth(0);
      const itemCategory = await item.locator('..').getByTestId(CATEGORY_TEXT_TEST_ID).nth(0).textContent();
      itemCategories.push(itemCategory || '');
      await item.click();
    }
    return itemCategories; 
  }

  /**
   * Generic method to validate selected items and their categories in a table
   * @param expectedItems - The names of the items to validate
   * @param expectedCategories - The categories of the items to validate
   */
  async validateSelectedItemsAndCategoriesInTable(
    expectedItems: string[], 
    expectedCategories: string[]
  ) {
    // Wait for the selected items table to be visible
    await this.selectedItemsList.first().waitFor({ state: 'visible' });
    
    // Get all selected items in the table
    const actualCount = await this.selectedItems.count();
    
    // Verify the count matches
    await expect(actualCount).toBe(expectedItems.length);
    
    // Verify each expected item is present in the table
    for (let i = 0; i < expectedItems.length; i++) {
      const expectedItem = expectedItems[i];
      const expectedCategory = expectedCategories[i];
      const itemLabel = this.selectedItemsList.nth(i);
      await expect(itemLabel).toHaveText(expectedItem);
      const categoryLabel = this.selectedCategoryList.nth(i);
      await expect(categoryLabel).toHaveText(expectedCategory);
    }
  }

  /**
   * Sample details methods (shared across all modals)
   * @param itemName - The name of the item to validate
   */
  async validateSelectedItemInSampleDetailsPage(itemName: string) {
    // Wait for the sample details page to load
    await this.dateTimeCollectedInputs.first().waitFor({ state: 'visible' });
    
    // Look for the item name in the sample details typography element
    const itemInSampleDetails = this.sampleDetailsPanels.filter({ hasText: itemName });
    await expect(itemInSampleDetails).toBeVisible();
  }

  /**
   * Set date/time collected for a specific test/panel (index allows targeting multiple inputs when multiple tests are selected)
   * @param dateTime - The date/time to set
   * @param index - The index of the input to set
   */
  async setDateTimeCollected(dateTime: string, index: number = 0) {
    const input = this.dateTimeCollectedInputs.locator('input').nth(index);
    await input.click();
    await input.waitFor({ state: 'visible' });
    await input.fill(dateTime);
  }
  
  /**
   * Select first collected by option for a specific test/panel (index allows targeting multiple inputs when multiple tests are selected)
   * @param index - The index of the input to select
   */
  async selectFirstCollectedBy(index: number = 0) {
    const input = this.collectedByInputs.nth(index);
    await input.click();
    const firstOptionLocator = this.collectedBySuggestionsList.locator('ul').locator('li').first();
    await firstOptionLocator.click();
    return await firstOptionLocator.textContent();
  }

  /**
   * Select first specimen type option for a specific test/panel (index allows targeting multiple inputs when multiple tests are selected)
   * @param index - The index of the input to select
   */
  async selectFirstSpecimenType(index: number = 0) {
    const input = this.specimenTypeInputs.nth(index);
    await input.click();
    await this.specimenTypeSuggestionsList.locator('ul').locator('li').first().click();
  }

  /**
   * Select first site option for a specific test/panel (index allows targeting multiple inputs when multiple tests are selected)
   * @param index - The index of the input to select
   */
  async selectFirstSite(index: number = 0) {
    const input = this.siteInputs.nth(index);
    await input.click();
    await this.siteSuggestionsList.first().click();
  }

  /**
   * Add notes to the request
   * @param notes - The notes to add
   */
  async addNotes(notes: string) {
    await this.notesTextarea.fill(notes);
  }

  /**
   * Get the items from the request finalised table
   * @param tableRowCount - The number of rows in the table
   * @param columnName - The name of the column to get the items from
   * @returns The items from the table
   */
  async getRequestFinalisedTableItems(tableRowCount: number, columnName: string){
    return await getTableItems(this.page, tableRowCount, columnName);
  }

  /**
   * Search for an item and validate it
   * @param itemName - The name of the item to search for
   */
  async searchItemAndValidate(itemName: string) {
    await this.searchInput.fill(itemName);
    await this.listItems.first().waitFor({ state: 'visible' });
    const listItemCount = await this.listItems.count();
    await expect(listItemCount).toBe(1);
    const item = this.listItems.first();
    await expect(item).toHaveText(itemName);
  }
  
} 