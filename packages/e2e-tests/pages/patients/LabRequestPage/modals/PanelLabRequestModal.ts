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

  /**
   * Get the title of the modal
   * @returns The title of the modal
   */
  getModalTitle(): string {
    return 'Creating a new lab request';
  }

  /**
   * Get the description of the modal
   * @returns The description of the modal
   */
  getModalDescription(): string {
    return 'Please complete the details below and select the lab request type';
  }

  /**
   * Remove a selected panel from the table
   * @param panelName - The name of the panel to remove
   */
  async removeSelectedPanelFromTable(panelName: string) {
    // Find the remove button for the specific panel
    const removeButton = this.selectedPanelItems
      .filter({ hasText: panelName }).getByTestId(REMOVE_ICON_BUTTON_TEST_ID);
    
    await removeButton.click();
  }

  /**
   * Validate the selected panels and categories in the sample details page
   * @param expectedPanels - The names of the panels to validate
   * @param expectedCategories - The categories of the panels to validate
   */
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