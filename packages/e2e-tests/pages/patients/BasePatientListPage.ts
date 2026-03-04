import { Locator, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { expect } from '../../fixtures/baseFixture';
import { convertDateFormat, STYLED_TABLE_CELL_PREFIX } from '../../utils/testHelper';
import { PatientTable } from './PatientTable';
import { Patient } from '../../types/Patient';
import { ERROR_RED_RGB } from '../../utils/testColors';

export interface BaseSearchCriteria {
  NHN?: string;
  firstName?: string;
  lastName?: string;
  advancedSearch: boolean;
}

export abstract class BasePatientListPage extends BasePage {
  readonly patientTable: PatientTable;
  searchTitle!: Locator;
  searchForm!: Locator;
  nhnInput!: Locator;
  firstNameInput!: Locator;
  lastNameInput!: Locator;
  hideAdvancedSearchBtn!: Locator;
  searchButton!: Locator;
  clearButton!: Locator;
  tableContainer!: Locator;
  table!: Locator;
  tableHead!: Locator;
  tableBody!: Locator;
  tableFooter!: Locator;
  tableRows!: Locator;
  downloadButton!: Locator;
  pageRecordCount!: Locator;
  pagination!: Locator;
  pageRecordCountDropdown!: Locator;
  previousPageButton!: Locator;
  nextPageButton!: Locator;
  pageButtons!: Locator;
  sortButtons!: Locator;
  _patientData?: Patient;

  constructor(page: Page, url: string) {
    super(page, url);
    this.patientTable = new PatientTable(page);
    
    // TestId mapping for base patient list page elements
    const testIds = {
      searchTitle: 'searchtabletitle-09n6',
      searchForm: 'styledform-5o5i',
      nhnInput: 'localisedfield-4cb5-input',
      firstNameInput: 'localisedfield-0m33-input',
      lastNameInput: 'localisedfield-26d7-input',
      hideAdvancedSearchBtn: 'iconbutton-zrkv',
      searchButton: 'searchbutton-nt24',
      clearButton: 'clearbutton-z9x3',
      tableContainer: 'styledtablecontainer-3ttp',
      table: 'styledtable-1dlu',
      tableHead: 'styledtablehead-ays3',
      tableBody: 'styledtablebody-a0jz',
      tableFooter: 'styledtablefooter-0eff',
      downloadButton: 'downloadbutton-0eff',
      pageRecordCount: 'pagerecordcount-m8ne',
      pagination: 'styledpagination-fbr1',
      pageRecordCountDropdown: 'styledselectfield-lunn',
      previousPageButton: 'paginationitem-hcui',
      nextPageButton: 'paginationitem-d791',
      pageButtons: 'paginationitem-c5vg',
    } as const;

    // Create locators using the testId mapping
    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }
    
    // Special cases that need additional processing
    this.tableRows = this.tableBody.locator('tr');
    this.sortButtons = page.locator('[data-testid^="tablesortlabel-"]');
  }

  setPatientData(data: Patient) {
    this._patientData = data;
  }

  getPatientData() {
    if (!this._patientData) throw new Error('Patient data has not been set');
    return this._patientData;
  }

  async goto() {
    await super.goto();
    await this.waitForPageToLoad();
  }

  async waitForPageToLoad() {
    await this.searchForm.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  /**
   * Waits for the table to have a specific number of rows
   * @param expectedRowCount The number of rows to wait for
   * @param timeout Optional timeout in milliseconds (default: 30000)
   * @throws Error if the expected row count is not reached within the timeout
   */
  async waitForTableRowCount(expectedRowCount: number, timeout: number = 30000) {
    await expect(async () => {
      expect(await this.tableRows.count()).toBe(expectedRowCount);
    }).toPass({ timeout });
  }

  async waitForTableToLoad() {
    await this.patientTable.waitForTableToLoad();
  }

  async clickOnSearchResult(nhn: string) {
    await this.getNHNCell(nhn).click({ timeout: 5000 });
  }

  async navigateToPatientDetailsPage(nhn: string) {
    await this.waitForPageToLoad();
    await this.searchForAndSelectPatientByNHN(nhn);
  }

  // Abstract method for search - each page implements its own search criteria
  abstract searchTable(searchCriteria: BaseSearchCriteria): Promise<void>;

  async clearSearch() {
    await this.clearButton.click();
    await this.patientTable.waitForTableToLoad();
  }

  // Validate that at least one row is displayed after search
  async validateAtLeastOneSearchResult() {
    const count = await this.tableRows.count();
    await expect(count).toBeGreaterThanOrEqual(1);
  }

  // Abstract method for field validation - each page has different fields
  abstract validateAllFieldsAreEmpty(): Promise<void>;

  async validateAllRowsContain(expectedText: string, columnName: string) {
    const rowCount = await this.tableRows.count();
    const lowerExpectedText = expectedText.toLowerCase();
    for (let i = 0; i < rowCount; i++) {
      const row = this.tableRows.nth(i);
      const locatorText = STYLED_TABLE_CELL_PREFIX + i + '-' + columnName;
      const cellLocator = row.locator(`[data-testid="${locatorText}"]`);
      const cellText = await cellLocator.textContent();
      const actualText = cellText || '';
      await expect(actualText.toLowerCase()).toContain(lowerExpectedText);
    }
  }

  async validateNumberOfPatients(expectedCount: number) {
    const rowCount = await this.tableRows.count();
    await expect(rowCount).toBe(expectedCount);
  }

  async validateRowColorIsRed(rowIndex: number = 0) {
    const row = this.tableRows.nth(rowIndex);
    const cells = row.locator('td');
    const cellCount = await cells.count();

    for (let i = 1; i < cellCount; i++) {
      const cell = cells.nth(i);
      await expect(cell).toHaveCSS('color', ERROR_RED_RGB);
    }
  }

  // Validate date in all rows for a specific column
  async validateAllRowsDateMatches(expectedDate: string) {
    const rowCount = await this.tableRows.count();
    const convertedExpectedDate = await convertDateFormat(expectedDate);

    for (let i = 0; i < rowCount; i++) {
      const row = await this.tableRows.nth(i);
      const locatorText = STYLED_TABLE_CELL_PREFIX + i + '-dateOfBirth';
      const cellLocator = row.locator(`[data-testid="${locatorText}"]`);
      await expect(cellLocator).toHaveText(convertedExpectedDate);
    }
  }

  // Validate that a specific row appears
  async validateFirstRowContainsNHN(expectedText: string) {
    const firstRowNHN = this.page.getByTestId(`${STYLED_TABLE_CELL_PREFIX}0-displayId`);
    await expect(firstRowNHN).toHaveText(expectedText);
  }

  // Validate that there is only one row displayed after search
  async validateOneSearchResult() {
    const rowCount = await this.tableRows.count();
    await expect(rowCount).toBe(1);
  }

  async validateSortOrder(isAscending: boolean, columnName: string) {
    const rowCount = await this.tableRows.count();
    const Values: string[] = [];

    for (let i = 0; i < rowCount; i++) {
      const row = this.tableRows.nth(i);
      const locatorText = STYLED_TABLE_CELL_PREFIX + i + '-' + columnName;
      const cellLocator = row.locator(`[data-testid="${locatorText}"]`);
      const cellText = await cellLocator.textContent();
      if (cellText) Values.push(cellText);
    }

    const sortedValues = [...Values].sort((a, b) => {
      return isAscending ? a.localeCompare(b) : b.localeCompare(a);
    });

    expect(Values).toEqual(sortedValues);
  }

  async validateDateSortOrder(isAscending: boolean) {
    const rowCount = await this.tableRows.count();
    const dateValues: string[] = [];

    for (let i = 0; i < rowCount; i++) {
      const row = this.tableRows.nth(i);
      const locatorText = STYLED_TABLE_CELL_PREFIX + i + '-dateOfBirth';
      const cellLocator = row.locator(`[data-testid="${locatorText}"]`);
      const cellText = await cellLocator.textContent();
      if (cellText) dateValues.push(cellText);
    }

    const sortedValues = [...dateValues].sort((a, b) => {
      // Convert MM/DD/YYYY to YYYY-MM-DD for proper date comparison
      const [monthA, dayA, yearA] = a.split('/');
      const [monthB, dayB, yearB] = b.split('/');
      const dateA = new Date(
        `${yearA}-${monthA.padStart(2, '0')}-${dayA.padStart(2, '0')}`,
      ).getTime();
      const dateB = new Date(
        `${yearB}-${monthB.padStart(2, '0')}-${dayB.padStart(2, '0')}`,
      ).getTime();
      return isAscending ? dateA - dateB : dateB - dateA;
    });
    expect(dateValues).toEqual(sortedValues);
  }

  async searchForAndSelectPatientByNHN(nhn: string, maxAttempts = 100) {
    let attempts = 0;
    while (attempts < maxAttempts) {
      try {
        await this.waitForPageToLoad();
        await this.nhnInput.fill(nhn);
        await this.searchButton.click();
        await this.patientTable.waitForTableToLoad();

        if (await this.getSecondNHNCell().isVisible()) {
          await this.page.waitForTimeout(1000);
          attempts++;
          continue;
        }

        await this.clickOnSearchResult(nhn);
        return;
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw error;
        }
        await this.page.waitForTimeout(1000);
      }
    }
  }

  // Helper methods for specific table cells
  getNHNCell(nhn: string) {
    return this.page.getByTestId('styledtablecell-2gyy-0-displayId').filter({ hasText: nhn });
  }

  getSecondNHNCell() {
    return this.page.getByTestId('styledtablecell-2gyy-1-displayId');
  }

  // Pagination methods
  async goToPage(pageNumber: number) {
    await this.pageButtons.filter({ hasText: pageNumber.toString() }).click();
  }

  async goToNextPage() {
    await this.nextPageButton.click();
  }

  async goToPreviousPage() {
    await this.previousPageButton.click();
  }

  async setPageRecordCount(count: number) {
    await this.pageRecordCountDropdown.click();
    await this.page.getByText(count.toString()).click();
  }

  // Sorting methods
  async sortByColumn(columnName: string) {
    await this.page.getByTestId(`tablesortlabel-0qxx-${columnName}`).click();
  }

  async sortByNHN() {
    await this.sortByColumn('displayId');
  }

  async sortByFirstName() {
    await this.sortByColumn('firstName');
  }

  async sortByLastName() {
    await this.sortByColumn('lastName');
  }

  async sortByDOB() {
    await this.sortByColumn('dateOfBirth');
  }

  async sortBySex() {
    await this.sortByColumn('sex');
  }

  // Download functionality
  async downloadData() {
    await this.downloadButton.click();
  }

  // Advanced search toggle
  async toggleAdvancedSearch() {
    await this.hideAdvancedSearchBtn.click();
  }
}
