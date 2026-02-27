import { Locator, Page, expect } from '@playwright/test';
import { LabRequestModalBase } from './LabRequestModalBase';
import { formatDateTimeForDisplay } from '@utils/testHelper';


export interface ValidateRequestFinalisedPageParams {
  requestingClinician: string;
  requestedDateTime: string;
  department: string;
  priority?: string;
  expectedCategories: string[];
  expectedSampleDate?: string;
}

export class IndividualLabRequestModal extends LabRequestModalBase {
  
  // Page 2: Individual test selection (different from panel)
  readonly individualTestSearchInput!: Locator;
  readonly individualTestCheckboxes!: Locator;
  readonly selectedTestsSection!: Locator;
  readonly selectedTestsLabels!: Locator;
  readonly individualTestNotesTextarea!: Locator;
  
  // Page 3: Sample details (same as panel)
  readonly dateTimeCollectedInputs!: Locator;
  readonly collectedByInputs!: Locator;
  readonly collectedByExpandIcons!: Locator;
  readonly specimenTypeInputs!: Locator;
  readonly specimenTypeExpandIcons!: Locator;
  readonly siteInputs!: Locator;
  readonly siteExpandIcons!: Locator;

  constructor(page: Page) {
    super(page);
    
    // TestId mapping for IndividualLabRequestModal elements
    const testIds = {
      // Page 2: Individual test selection
      individualTestSearchInput: 'styledsearchinput-92y3-input',
      individualTestCheckboxes: 'styledcheckboxcontrol-6oiy',
      selectedTestsSection: 'selectorcontainer-gewc',
      selectedTestsLabels: 'selectortable-6eaw',
      individualTestNotesTextarea: 'field-3t0x-input',
      
      // Page 3: Sample details
      dateTimeCollectedInputs: 'styledfield-ratc-input',
      collectedByInputs: 'styledfield-wifm-input',
      collectedByExpandIcons: 'styledfield-wifm-input-expandmoreicon',
      specimenTypeInputs: 'styledfield-8g4b-input',
      specimenTypeExpandIcons: 'styledfield-8g4b-input-expandmoreicon',
      siteInputs: 'styledfield-mog8-input',
      siteExpandIcons: 'styledfield-mog8-input-expandmoreicon',
    } as const;

    // Create locators using the testId mapping
    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }
    
    // Special cases that need additional processing
    this.selectedTestsLabels = page.getByTestId('selectortable-6eaw').getByTestId('labeltext-6stl');
  }

  /**
   * Validate the selected categories in the sample details page
   * @param expectedCategories - The categories to validate
   */
  async validateSelectedCategoriesInSampleDetailsPage(expectedCategories: string[]) {
    // Wait for the sample details page to load
    await this.dateTimeCollectedInputs.first().waitFor({ state: 'visible' });
    
    for (let i = 0; i < expectedCategories.length; i++) {
      await expect(this.sampleDetailsCategories.nth(i)).toHaveText(expectedCategories[i]);
    }
  }


  /**
   * Validate the request finalised page
   * @param requestingClinician - The requesting clinician
   * @param requestedDateTime - The requested date/time
   * @param department - The department
   * @param priority - The priority
   * @param expectedCategories - The categories to validate
   * @param expectedSampleDate - The sample date to validate
   */
  async validateRequestFinalisedPage({
    requestingClinician,
    requestedDateTime,
    department,
    priority,
    expectedCategories,
    expectedSampleDate,
  }: ValidateRequestFinalisedPageParams) {
    // Validate header values
    await expect(this.requestingClinicianValue).toHaveText(requestingClinician || 'Unknown');
    await expect(this.requestDateTimeValue).toHaveText(requestedDateTime);
    await expect(this.departmentValue).toHaveText(department || 'Unknown');
    await expect(this.priorityValue).toHaveText(priority || '-');

    // Validate finalised table categories
    const requestFinalisedCategoryItems = await this.getRequestFinalisedTableItems(expectedCategories.length, 'labTestCategory');
      expect(requestFinalisedCategoryItems).toEqual(expectedCategories);
    // Validate finalised table sample dates
    const requestFinalisedSampleDateItems = await this.getRequestFinalisedTableItems(expectedCategories.length, 'sampleDate');
    let formattedSampleDate: string;
    if (
      expectedSampleDate &&
      !isNaN(Date.parse(expectedSampleDate)) // valid date string
    ) {
      formattedSampleDate = formatDateTimeForDisplay(new Date(expectedSampleDate));
    } else {
      formattedSampleDate = expectedSampleDate || 'Sample not collected';
    }
    for (let i = 0; i < expectedCategories.length; i++) {
      expect(requestFinalisedSampleDateItems[i]).toEqual(formattedSampleDate);
    }
  }

  /**
   * Helper method to create a basic individual lab request
   * @param testsToSelect - Optional array of test names to select. Defaults to common AgRDT tests.
   * @returns The array of selected test names
   */
  async createBasicIndividualLabRequest(testsToSelect?: string[]): Promise<string[]> {
    const selectedTests = testsToSelect || [
      'AgRDT Negative, no further testing needed',
      'AgRDT Positive, no further testing needed',
    ];
    await this.waitForModalToLoad();
    await this.individualRadioButton.click();
    await this.nextButton.click();
    await this.selectItemsByText(selectedTests);
    await this.nextButton.click();
    await this.finaliseButton.click();
    await this.closeButton.click();
    return selectedTests;
  }

} 