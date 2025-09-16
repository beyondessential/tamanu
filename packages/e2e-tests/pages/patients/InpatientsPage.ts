import { Locator, Page } from '@playwright/test';
import { routes } from '../../config/routes';
import { BasePage } from '../BasePage';
import { expect } from '../../fixtures/baseFixture';
import { convertDateFormat, STYLED_TABLE_CELL_PREFIX } from '../../utils/testHelper';
import { selectAutocompleteFieldOption } from '../../utils/fieldHelpers';
import { PatientTable } from './PatientTable';
import { Patient } from '../../types/Patient';
import { ERROR_RED_RGB } from '../../utils/testColors';

export interface InpatientSearchCriteria {
  NHN?: string;
  firstName?: string;
  lastName?: string;
  area?: string;
  department?: string;
  clinician?: string;
  diet?: string;
  advancedSearch: boolean;
}

export class InpatientsPage extends BasePage {
  readonly patientTable: PatientTable;
  readonly searchTitle: Locator;
  readonly searchForm: Locator;
  readonly nhnInput: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly areaInput: Locator;
  readonly departmentInput: Locator;
  readonly clinicianInput: Locator;
  readonly dietInput: Locator;
  readonly hideAdvancedSearchBtn: Locator;
  readonly searchButton: Locator;
  readonly clearButton: Locator;
  readonly tableContainer: Locator;
  readonly table: Locator;
  readonly tableHead: Locator;
  readonly tableBody: Locator;
  readonly tableFooter: Locator;
  readonly tableRows: Locator;
  readonly downloadButton: Locator;
  readonly pageRecordCount: Locator;
  readonly pagination: Locator;
  readonly pageRecordCountDropdown: Locator;
  readonly previousPageButton: Locator;
  readonly nextPageButton: Locator;
  readonly pageButtons: Locator;
  readonly sortButtons: Locator;
  _patientData?: Patient;

  constructor(page: Page) {
    super(page, routes.patients.inpatients);
    this.patientTable = new PatientTable(page);
    this.searchTitle = page.getByTestId('searchtabletitle-v9md');
    this.searchForm = page.getByTestId('styledform-5o5i');
    this.nhnInput = page.getByTestId('localisedfield-4cb5-input');
    this.firstNameInput = page.getByTestId('localisedfield-0m33-input');
    this.lastNameInput = page.getByTestId('localisedfield-26d7-input');
    this.areaInput = page.getByTestId('localisedfield-p72m-input');
    this.departmentInput = page.getByTestId('localisedfield-50wl-input');
    this.clinicianInput = page.getByTestId('localisedfield-8w55-input');
    this.dietInput = page.getByTestId('localisedfield-gzn5-input');
    this.hideAdvancedSearchBtn = page.getByTestId('iconbutton-zrkv');
    this.searchButton = page.getByTestId('searchbutton-nt24');
    this.clearButton = page.getByTestId('clearbutton-z9x3');
    this.tableContainer = page.getByTestId('styledtablecontainer-3ttp');
    this.table = page.getByTestId('styledtable-1dlu');
    this.tableHead = page.getByTestId('styledtablehead-ays3');
    this.tableBody = page.getByTestId('styledtablebody-a0jz');
    this.tableFooter = page.getByTestId('styledtablefooter-7pgn');
    this.tableRows = page.getByTestId('styledtablebody-a0jz').locator('tr');
    this.downloadButton = page.getByTestId('download-data-button');
    this.pageRecordCount = page.getByTestId('pagerecordcount-m8ne');
    this.pagination = page.getByTestId('styledpagination-fbr1');
    this.pageRecordCountDropdown = page.getByTestId('styledselectfield-lunn');
    this.previousPageButton = page.getByTestId('paginationitem-hcui');
    this.nextPageButton = page.getByTestId('paginationitem-d791');
    this.pageButtons = page.getByTestId('paginationitem-c5vg');
    this.sortButtons = page.locator('[data-testid^="tablesortlabel-"]');
  }

  setPatientData(data: Patient) {
    this._patientData = data;
  }

  getPatientData() {
    if (!this._patientData) throw new Error('Patient data has not been set');
    return this._patientData;
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

  async clickOnFirstRow() {
    await this.patientTable.waitForTableToLoad();
    await this.patientTable.rows.first().click();
    await this.page.waitForURL(`**/${routes.patients.inpatients}/*`);
  }

  async clickOnSearchResult(nhn: string) {
    await this.getNHNCell(nhn).click({ timeout: 5000 });
    await this.page.waitForURL(`**/${routes.patients.inpatients}/*`);
  }

  async navigateToPatientDetailsPage(nhn: string) {
    await this.goto();
    await expect(this.searchTitle).toBeVisible();
    await this.searchForAndSelectPatientByNHN(nhn);
  }

  // Generic method to search with different field combinations
  async searchTable(searchCriteria: InpatientSearchCriteria) {
    if (searchCriteria.advancedSearch) {
      await this.hideAdvancedSearchBtn.click();
    }
    
    // Fill search fields if provided
    if (searchCriteria.NHN) {
      await this.nhnInput.fill(searchCriteria.NHN);
    }
    if (searchCriteria.firstName) {
      await this.firstNameInput.fill(searchCriteria.firstName);
    }
    if (searchCriteria.lastName) {
      await this.lastNameInput.fill(searchCriteria.lastName);
    }
    if (searchCriteria.area) {
      await selectAutocompleteFieldOption(
        this.page,
        this.areaInput,
        { optionToSelect: searchCriteria.area }
      );
    }
    if (searchCriteria.department) {
      await selectAutocompleteFieldOption(
        this.page,
        this.departmentInput,
        { optionToSelect: searchCriteria.department }
      );
    }
    if (searchCriteria.clinician) {
      await selectAutocompleteFieldOption(
        this.page,
        this.clinicianInput,
        { optionToSelect: searchCriteria.clinician }
      );
    }
    if (searchCriteria.diet) {
      await selectAutocompleteFieldOption(
        this.page,
        this.dietInput,
        { optionToSelect: searchCriteria.diet }
      );
    }
    
    await this.searchButton.click();
  }

  async clearSearch() {
    await this.clearButton.click();
  }

  // Validate that at least one row is displayed after search
  async validateAtLeastOneSearchResult() {
    const rowCount = await this.tableRows.count();
    await expect(rowCount).toBeGreaterThan(0);
  }

  async validateAllFieldsAreEmpty() {
    await expect(this.nhnInput).toHaveValue('');
    await expect(this.firstNameInput).toHaveValue('');
    await expect(this.lastNameInput).toHaveValue('');
    await expect(this.areaInput).toHaveValue('');
    await expect(this.departmentInput).toHaveValue('');
    await expect(this.clinicianInput).toHaveValue('');
    await expect(this.dietInput).toHaveValue('');
  }

  async validateAllRowsContain(expectedText: string, columnName: string) {
    const rowCount = await this.tableRows.count();
    const lowerExpectedText = expectedText.toLowerCase();
    for (let i = 0; i < rowCount; i++) {
      const row = this.tableRows.nth(i);
      const locatorText = STYLED_TABLE_CELL_PREFIX + i + "-" + columnName;
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
      const locatorText = STYLED_TABLE_CELL_PREFIX + i + "-dateOfBirth";
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
      const locatorText = STYLED_TABLE_CELL_PREFIX + i + "-" + columnName;
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
      const locatorText = STYLED_TABLE_CELL_PREFIX + i + "-dateOfBirth";
      const cellLocator = row.locator(`[data-testid="${locatorText}"]`);
      const cellText = await cellLocator.textContent();
      if (cellText) dateValues.push(cellText);
    }

    const sortedValues = [...dateValues].sort((a, b) => {
      // Convert MM/DD/YYYY to YYYY-MM-DD for proper date comparison
      const dateA = a.split('/').reverse().join('-');
      const dateB = b.split('/').reverse().join('-');
      return isAscending 
        ? new Date(dateA).getTime() - new Date(dateB).getTime()
        : new Date(dateB).getTime() - new Date(dateA).getTime();
    });
    expect(dateValues).toEqual(sortedValues);
  }

  async searchForAndSelectPatientByNHN(nhn: string, maxAttempts = 100) {
    let attempts = 0;
    while (attempts < maxAttempts) {
      try {
        await this.nhnInput.fill(nhn);
        await this.searchButton.click();
        await this.patientTable.waitForTableToLoad();

        // Handle flakiness where sometimes a patient isn't immediately searchable after being created
        if (await this.page.getByRole('cell', { name: 'No patients found' }).isVisible()) {
          attempts++;
          continue;
        }

        // Handle cases where search results load all results instead of the specific result
        if (await this.getSecondNHNCell().isVisible()) {
          await this.page.reload();
          await this.searchTitle.waitFor({ state: 'visible' });
          attempts++;
          continue;
        }

        await this.clickOnSearchResult(nhn);
        return;
      } catch (error) {
        attempts++;
        if (attempts === maxAttempts) {
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

  async sortByArea() {
    await this.sortByColumn('locationGroupName');
  }

  async sortByLocation() {
    await this.sortByColumn('locationName');
  }

  async sortByDepartment() {
    await this.sortByColumn('departmentName');
  }

  async sortByClinician() {
    await this.sortByColumn('clinician');
  }

  async sortByDiet() {
    await this.sortByColumn('diets');
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
