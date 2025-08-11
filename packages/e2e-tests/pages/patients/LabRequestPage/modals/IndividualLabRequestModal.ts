import { Locator, Page } from '@playwright/test';
import { LabRequestModalBase } from './LabRequestModalBase';


export class IndividualLabRequestModal extends LabRequestModalBase {
  
  // Page 2: Individual test selection (different from panel)
  readonly individualTestSearchInput: Locator;
  readonly individualTestCheckboxes: Locator;
  readonly selectedTestsSection: Locator;
  readonly selectedTestsLabels: Locator;
  readonly individualTestNotesTextarea: Locator;
  readonly individualTestSelectionError: Locator;
  
  // Page 3: Sample details (same as panel)
  readonly dateTimeCollectedInputs: Locator;
  readonly collectedByInputs: Locator;
  readonly collectedByExpandIcons: Locator;
  readonly specimenTypeInputs: Locator;
  readonly specimenTypeExpandIcons: Locator;
  readonly siteInputs: Locator;
  readonly siteExpandIcons: Locator;

  constructor(page: Page) {
    super(page);
    
    // Page 2: Individual test selection
    this.individualTestSearchInput = page.getByTestId('styledsearchfield-92y3-input');
    this.individualTestCheckboxes = page.getByTestId('styledcheckboxcontrol-6oiy');
    this.selectedTestsSection = page.getByTestId('selectorcontainer-gewc');
    this.selectedTestsLabels = page.getByTestId('selectortable-6eaw').getByTestId('labeltext-6stl');
    this.individualTestNotesTextarea = page.getByTestId('field-3t0x-input');
    this.individualTestSelectionError = page.getByTestId('formhelpertext-198r');
    
    // Page 3: Sample details
    this.dateTimeCollectedInputs = page.getByTestId('styledfield-ratc-input');
    this.collectedByInputs = page.getByTestId('styledfield-wifm-input');
    this.collectedByExpandIcons = page.getByTestId('styledfield-wifm-input-expandmoreicon');
    this.specimenTypeInputs = page.getByTestId('styledfield-8g4b-input');
    this.specimenTypeExpandIcons = page.getByTestId('styledfield-8g4b-input-expandmoreicon');
    this.siteInputs = page.getByTestId('styledfield-mog8-input');
    this.siteExpandIcons = page.getByTestId('styledfield-mog8-input-expandmoreicon');
  }

  async selectTestsByIndex(testIndexes: number[]) {
    const selectedTests: string[] = [];
    // Select individual tests by their index in the list
    for (const index of testIndexes) {
      const testCheckbox = this.individualTestCheckboxes.nth(index);
      await testCheckbox.click();
      const testName = await testCheckbox.locator('..').getByTestId('labeltext-6stl').textContent();
      selectedTests.push(testName || '');
    }
    return selectedTests;
  }

  async validateSelectedTestsInTable(selectedTests: string[]) {
    // Validate that the selected tests are displayed in the table
    for (let i=0; i<selectedTests.length; i++) {
      const testName=await this.selectedTestsLabels.nth(i).textContent();
      await expect(testName).toBe(selectedTests[i]);
    }
  }
} 