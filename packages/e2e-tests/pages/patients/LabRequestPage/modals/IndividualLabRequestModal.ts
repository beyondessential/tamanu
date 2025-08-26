import { Locator, Page, expect } from '@playwright/test';
import { LabRequestModalBase } from './LabRequestModalBase';
import { format } from 'date-fns';


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
  readonly individualTestSearchInput: Locator;
  readonly individualTestCheckboxes: Locator;
  readonly selectedTestsSection: Locator;
  readonly selectedTestsLabels: Locator;
  readonly individualTestNotesTextarea: Locator;
  
  // Page 3: Sample details (same as panel)
  readonly dateTimeCollectedInputs: Locator;
  readonly collectedByInputs: Locator;
  readonly collectedByExpandIcons: Locator;
  readonly specimenTypeInputs: Locator;
  readonly specimenTypeExpandIcons: Locator;
  readonly siteInputs: Locator;
  readonly siteExpandIcons: Locator;
  readonly categoryDropdown: Locator;
  readonly categoryListItems: Locator;

  constructor(page: Page) {
    super(page);
    
    // Page 2: Individual test selection
    this.individualTestSearchInput = page.getByTestId('styledsearchfield-92y3-input');
    this.individualTestCheckboxes = page.getByTestId('styledcheckboxcontrol-6oiy');
    this.selectedTestsSection = page.getByTestId('selectorcontainer-gewc');
    this.selectedTestsLabels = page.getByTestId('selectortable-6eaw').getByTestId('labeltext-6stl');
    this.individualTestNotesTextarea = page.getByTestId('field-3t0x-input');
    
    // Page 3: Sample details
    this.dateTimeCollectedInputs = page.getByTestId('styledfield-ratc-input');
    this.collectedByInputs = page.getByTestId('styledfield-wifm-input');
    this.collectedByExpandIcons = page.getByTestId('styledfield-wifm-input-expandmoreicon');
    this.specimenTypeInputs = page.getByTestId('styledfield-8g4b-input');
    this.specimenTypeExpandIcons = page.getByTestId('styledfield-8g4b-input-expandmoreicon');
    this.siteInputs = page.getByTestId('styledfield-mog8-input');
    this.siteExpandIcons = page.getByTestId('styledfield-mog8-input-expandmoreicon');
    this.categoryDropdown = page.getByTestId('selectinput-phtg-select');  
    this.categoryListItems = page.getByTestId('selectortable-dwrp').getByTestId('categorytext-jno3');
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
   * Validate the selected tests in the table
   * @param selectedTests - The tests to validate
   */
  async validateSelectedTestsInTable(selectedTests: string[]) {
    // Validate that the selected tests are displayed in the table
    for (let i=0; i<selectedTests.length; i++) {
      const testName=await this.selectedTestsLabels.nth(i).textContent();
      await expect(testName).toBe(selectedTests[i]);
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
      formattedSampleDate = format(new Date(expectedSampleDate), 'MM/dd/yyyy h:mm a');
    } else {
      formattedSampleDate = expectedSampleDate || 'Sample not collected';
    }
    for (let i = 0; i < expectedCategories.length; i++) {
      expect(requestFinalisedSampleDateItems[i]).toEqual(formattedSampleDate);
    }
  }

  /**
   * Select a category
   * @param category - The category to select
   */
  async selectCategory(category: string) {
    await this.categoryDropdown.click();
    await this.page.getByText(category).first().waitFor({ state: 'visible' });
    await this.page.getByText(category).first().click();
  }

  /**
   * Validate the tests category
   * @param category - The category to validate
   */
  async validateTestsCategory(category: string) {
    const categoryCount = await this.categoryListItems.count();
    for (let i = 0; i < categoryCount; i++) {
      await expect(this.categoryListItems.nth(i)).toHaveText(category);
    }
  }
} 