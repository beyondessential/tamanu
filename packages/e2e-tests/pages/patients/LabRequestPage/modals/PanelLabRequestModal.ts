import { Locator, Page, expect } from '@playwright/test';
import { LabRequestModalBase } from './LabRequestModalBase';

const CATEGORY_TEXT_TEST_ID = 'categorytext-jno3';
const REMOVE_ICON_BUTTON_TEST_ID = 'removeiconbutton-iwj5';

export class PanelLabRequestModal extends LabRequestModalBase {
  
  // Page 2: Panel selection
  readonly searchInput: Locator;
  readonly panelCheckboxes: Locator;
  readonly selectedPanelsList: Locator;
  readonly selectedPanelItems: Locator;
  readonly selectedPanelLabels: Locator;
  readonly notesTextarea: Locator;
  readonly panelSelectionError: Locator;
  readonly panelsList: Locator;
  readonly clearAllButton: Locator;
  
  // Page 3: Sample details
  readonly dateTimeCollectedInputs: Locator;
  readonly collectedByInputs: Locator;
  readonly collectedBySuggestionsList: Locator;
  readonly specimenTypeInputs: Locator;
  readonly specimenTypeSuggestionsList: Locator;
  readonly siteInputs: Locator;
  readonly siteSuggestionsList: Locator;
  readonly sampleDetailsPanels: Locator;
  readonly sampleDetailsCategories: Locator;
  
  // Page 4: Request Finalised
  readonly requestFinalisedHeading: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    super(page);
    
    // Page 2: Panel selection
    this.searchInput = page.getByTestId('styledsearchfield-92y3-input');
    this.panelCheckboxes = page.getByTestId('selectortable-dwrp');
    this.selectedPanelsList = page.getByTestId('selectortable-6eaw');
    this.selectedPanelItems = page.getByTestId('testitemwrapper-o7ha');
    this.selectedPanelLabels = page.getByTestId('selectortable-6eaw').getByTestId('labeltext-6stl');
    this.notesTextarea = page.getByTestId('field-3t0x-input');
    this.panelSelectionError = page.getByTestId('formhelpertext-198r');
    this.panelsList = page.getByTestId('labeltext-6stl');
    this.clearAllButton = page.getByTestId('clearallbutton-ao0r');
    
    // Page 3: Sample details
    this.dateTimeCollectedInputs = page.getByTestId('styledfield-ratc-input').locator('input');
    this.collectedByInputs = page.getByTestId('styledfield-wifm-input').locator('input');
    this.collectedBySuggestionsList = page.getByTestId('styledfield-wifm-suggestionslist');
    this.specimenTypeInputs = page.getByTestId('styledfield-8g4b-input').locator('input');
    this.specimenTypeSuggestionsList = page.getByTestId('styledfield-8g4b-suggestionslist');
    this.siteInputs = page.getByTestId('styledfield-mog8-input').locator('input');
    this.siteSuggestionsList = page.getByTestId('styledfield-mog8-suggestionslist');
    this.sampleDetailsPanels = page.getByTestId('typography-ex0x');
    this.sampleDetailsCategories = page.getByTestId('typography-772r');
    
    // Page 4: Request Finalised
    this.requestFinalisedHeading = page.getByTestId('heading3-en7t');
    this.closeButton = page.getByTestId('button-9vga');
  }

  // Abstract method implementations
  getModalTitle(): string {
    return 'Creating a new lab request';
  }

  getModalDescription(): string {
    return 'Please complete the details below and select the lab request type';
  }

  // Selects the panels by text and returns the categories of the selected panels
  async selectPanelsByText(panelNames: string[]) {
    const panelCategories: string[] = [];
    for (const panelName of panelNames) {
      const panel = this.panelsList.filter({ hasText: panelName });
      const panelCategory = await panel.locator('..').getByTestId(CATEGORY_TEXT_TEST_ID).textContent();
      panelCategories.push(panelCategory || '');
      await panel.click();
    }
    return panelCategories; 
  }

  async searchPanelAndValidate(panelName: string) {
    await this.searchInput.fill(panelName);
    
    // Verify the searched panel is visible
    const panel = this.panelsList.filter({ hasText: panelName });
    const panelCount = await panel.count();
    await expect(panelCount).toBe(1);
    await expect(panel).toBeVisible();
  }

  async validateSelectedPanelsAndCategoriesInTable(expectedPanels: string[], expectedCategories: string[]) {
    // Wait for the selected panels table to be visible
    await this.selectedPanelsList.waitFor({ state: 'visible' });
    
    // Get all selected panel items in the table
    const actualCount = await this.selectedPanelItems.count();
    
    // Verify the count matches
    await expect(actualCount).toBe(expectedPanels.length);
    
    // Verify each expected panel is present in the table
    for (let i = 0; i < expectedPanels.length; i++) {
      const expectedPanel = expectedPanels[i];
      const expectedCategory = expectedCategories[i];
      const panelLabel = this.selectedPanelsList.filter({ hasText: expectedPanel });
      await expect(panelLabel).toBeVisible();
      const categoryLabel = this.selectedPanelsList.locator('..').getByTestId(CATEGORY_TEXT_TEST_ID).filter({ hasText: expectedCategory });
      await expect(categoryLabel).toBeVisible();
    }
  }

  async removeSelectedPanelFromTable(panelName: string) {
    // Find the remove button for the specific panel
    const removeButton = this.selectedPanelItems
      .filter({ hasText: panelName }).getByTestId(REMOVE_ICON_BUTTON_TEST_ID);
    
    await removeButton.click();
  }

  async validateSelectedPanelInSampleDetailsPage(panelName: string) {
    // Wait for the sample details page to load
    await this.dateTimeCollectedInputs.first().waitFor({ state: 'visible' });
    
    // Look for the panel name in the sample details typography element
    const panelInSampleDetails = this.sampleDetailsPanels.filter({ hasText: panelName });
    await expect(panelInSampleDetails).toBeVisible();
  }

  async validateSelectedPanelsAndCategoriesInSampleDetailsPage(expectedPanels: string[], expectedCategories: string[]) {
    // Wait for the sample details page to load
    await this.dateTimeCollectedInputs.first().waitFor({ state: 'visible' });
    
    // Get all panel elements in the sample details page
    const allPanelElements = await this.sampleDetailsPanels.all();
    
    // Verify the count matches
    await expect(allPanelElements.length).toBe(expectedPanels.length);
    
    // Verify each expected panel and category is present in the sample details page using for loop
    for (let i = 0; i < expectedPanels.length; i++) {
      const expectedPanel = expectedPanels[i];
      const panelElement = allPanelElements[i];
      const text = await panelElement.textContent();
      await expect(text).toContain(expectedPanel);
      const categoryElement = this.sampleDetailsCategories.filter({ hasText: expectedCategories[i] });
      await expect(categoryElement).toBeVisible();
    }
  }

  // Page 3: Sample details methods
  async setDateTimeCollected(dateTime: string, index: number = 0) {
    const input = this.dateTimeCollectedInputs.nth(index);
    await input.fill(dateTime);
  }
  
  async selectFirstCollectedBy() {
    const input = this.collectedByInputs.nth(0);
    await input.click();
    const firstOptionLocator = this.collectedBySuggestionsList.locator('ul').locator('li').first();
    await firstOptionLocator.click();
    return await firstOptionLocator.textContent();
  }

  async selectFirstSpecimenType() {
    const input = this.specimenTypeInputs.nth(0);
    await input.click();
    await this.specimenTypeSuggestionsList.locator('ul').locator('li').first().click();
  }

  async selectFirstSite() {
    const input = this.siteInputs.nth(0);
    await input.click();
    await this.siteSuggestionsList.locator('ul').locator('li').first().click();
  }

  async addNotes(notes: string) {
    await this.notesTextarea.fill(notes);
  }
} 