import { Locator, Page, expect } from '@playwright/test';
import { LabRequestModalBase } from './LabRequestModalBase';
import { selectFieldOption } from '../../../../utils/fieldHelpers';

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

  /**
   * Create a panel lab request with all fields filled
   * @param panelsToSelect - Array of panel names to select
   * @returns Object containing requestedDateTime, priority, and panel categories
   */
  async createPanelLabRequestWithAllFields(panelsToSelect: string[]): Promise<{ requestedDateTime: string; priority: string | null; panelCategories: string[] }> {
    await this.waitForModalToLoad();
    const requestedDateTime = await this.validateRequestedDateTimeIsToday();
    await selectFieldOption(this.page, this.prioritySelect, {
      selectFirst: true,
    });
    const priority = await this.selectedPriority.textContent();
    await this.nextButton.click();
    const panelCategories = await this.selectItemsByText(panelsToSelect);
    await this.validateSelectedItemsAndCategoriesInTable(
      panelsToSelect,
      panelCategories,
    );
    const noteToAdd = 'This is a test note';
    await this.addNotes(noteToAdd);
    await this.nextButton.click();
    const currentDateTime = this.getCurrentDateTime();
    await this.setDateTimeCollected(currentDateTime);
    await this.selectFirstCollectedBy(0);
    await this.selectFirstSpecimenType(0);
    await this.selectFirstSite(0);
    await this.validateSelectedPanelsAndCategoriesInSampleDetailsPage(
      panelsToSelect,
      panelCategories,
    );
    await this.finaliseButton.click();
    await this.closeButton.click();
    return { requestedDateTime, priority, panelCategories };
  }
} 