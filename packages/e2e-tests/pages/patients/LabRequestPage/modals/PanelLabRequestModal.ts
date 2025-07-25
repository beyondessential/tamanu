import { Locator, Page, expect } from '@playwright/test';
import { LabRequestModalBase } from './LabRequestModalBase';


const REMOVE_ICON_BUTTON_TEST_ID = 'removeiconbutton-iwj5';

export class PanelLabRequestModal extends LabRequestModalBase {
  
  // Page 2: Panel selection
  readonly panelCheckboxes: Locator;
  readonly selectedPanelsList: Locator;
  readonly selectedPanelItems: Locator;
  readonly selectedPanelLabels: Locator;
  readonly notesTextarea: Locator;
  readonly panelSelectionError: Locator;
  readonly panelsList: Locator;

  constructor(page: Page) {
    super(page);
    
    // Page 2: Panel selection
    this.panelCheckboxes = page.getByTestId('selectortable-dwrp');
    this.selectedPanelsList = page.getByTestId('selectortable-6eaw');
    this.selectedPanelItems = page.getByTestId('testitemwrapper-o7ha');
    this.selectedPanelLabels = page.getByTestId('selectortable-6eaw').getByTestId('labeltext-6stl');
    this.notesTextarea = page.getByTestId('field-3t0x-input');
    this.panelSelectionError = page.getByTestId('formhelpertext-198r');
    this.panelsList = page.getByTestId('labeltext-6stl');
  }

  // Abstract method implementations
  getModalTitle(): string {
    return 'Creating a new lab request';
  }

  getModalDescription(): string {
    return 'Please complete the details below and select the lab request type';
  }

  async removeSelectedPanelFromTable(panelName: string) {
    // Find the remove button for the specific panel
    const removeButton = this.selectedPanelItems
      .filter({ hasText: panelName }).getByTestId(REMOVE_ICON_BUTTON_TEST_ID);
    
    await removeButton.click();
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
} 