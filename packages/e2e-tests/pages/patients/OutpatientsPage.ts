import { Locator, Page } from '@playwright/test';
import { routes } from '../../config/routes';
import { BasePage } from '../BasePage';
import { expect } from '../../fixtures/baseFixture';
import { convertDateFormat, STYLED_TABLE_CELL_PREFIX } from '../../utils/testHelper';
import { selectAutocompleteFieldOption } from '../../utils/fieldHelpers';
import { PatientTable } from './PatientTable';
import { Patient } from '../../types/Patient';

export interface OutpatientSearchCriteria {
  NHN?: string;
  firstName?: string;
  lastName?: string;
  area?: string;
  department?: string;
  clinician?: string;
  advancedSearch: boolean;
}

export class OutpatientsPage extends BasePage {
  readonly patientTable: PatientTable;
  readonly searchTitle: Locator;
  readonly searchForm: Locator;
  readonly nhnInput: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly areaInput: Locator;
  readonly departmentInput: Locator;
  readonly clinicianInput: Locator;
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
    super(page, routes.patients.outpatients);
    this.patientTable = new PatientTable(page);
    this.searchTitle = page.getByTestId('searchtabletitle-09n6');
    this.searchForm = page.getByTestId('styledform-5o5i');
    this.nhnInput = page.getByTestId('localisedfield-4cb5-input');
    this.firstNameInput = page.getByTestId('localisedfield-0m33-input');
    this.lastNameInput = page.getByTestId('localisedfield-26d7-input');
    this.areaInput = page.getByTestId('localisedfield-p72m-input');
    this.departmentInput = page.getByTestId('localisedfield-50wl-input');
    this.clinicianInput = page.getByTestId('localisedfield-8w55-input');
    this.hideAdvancedSearchBtn = page.getByTestId('iconbutton-zrkv');
    this.searchButton = page.getByTestId('searchbutton-nt24');
    this.clearButton = page.getByTestId('clearbutton-z9x3');
    this.tableContainer = page.getByTestId('styledtablecontainer-3ttp');
    this.table = page.getByTestId('styledtable-1dlu');
    this.tableHead = page.getByTestId('styledtablehead-ays3');
    this.tableBody = page.getByTestId('styledtablebody-a0jz');
    this.tableFooter = page.getByTestId('styledtablefooter-0eff');
    this.tableRows =this.tableBody.locator('tr');
    this.downloadButton = page.getByTestId('downloadbutton-0eff');
    this.pageRecordCount = page.getByTestId('pagerecordcount-m8ne');
    this.pagination = page.getByTestId('styledpagination-fbr1');
    this.pageRecordCountDropdown = page.getByTestId('styledselectfield-lunn');
    this.previousPageButton = page.getByTestId('paginationitem-hcui');
    this.nextPageButton = page.getByTestId('paginationitem-d791');
    this.pageButtons = page.getByTestId('paginationitem-c5vg');
    this.sortButtons = page.locator('[data-testid^="tablesortlabel-"]');
  }

  async goto() {
    await super.goto();
    await this.waitForPageToLoad();
  }

  async waitForPageToLoad() {
    await this.searchTitle.waitFor({ state: 'visible' });
    await this.searchForm.waitFor({ state: 'visible' });
  }

  async waitForTableRowCount(expectedRowCount: number, timeout: number = 30000) {
    await this.page.waitForFunction(
      (expected) => {
        const rows = document.querySelectorAll('[data-testid^="styledtablerow-"]');
        return rows.length === expected;
      },
      expectedRowCount,
      { timeout }
    );
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

  async searchTable(searchCriteria: OutpatientSearchCriteria) {
    if (searchCriteria.advancedSearch) {
      await this.hideAdvancedSearchBtn.click();
    }
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
      await selectAutocompleteFieldOption(this.page, this.areaInput, { optionToSelect: searchCriteria.area });
    }
    if (searchCriteria.department) {
      await selectAutocompleteFieldOption(this.page, this.departmentInput, { optionToSelect: searchCriteria.department });
    }
    if (searchCriteria.clinician) {
      await selectAutocompleteFieldOption(this.page, this.clinicianInput, { optionToSelect: searchCriteria.clinician });
    }

    await this.searchButton.click();
    await this.patientTable.waitForTableToLoad();
  }

  async clearSearch() {
    await this.clearButton.click();
    await this.patientTable.waitForTableToLoad();
  }

  async validateAllFieldsAreEmpty() {
    await expect(this.nhnInput).toHaveValue('');
    await expect(this.firstNameInput).toHaveValue('');
    await expect(this.lastNameInput).toHaveValue('');
    await expect(this.areaInput.locator('input')).toHaveValue('');
    await expect(this.departmentInput.locator('input')).toHaveValue('');
    await expect(this.clinicianInput.locator('input')).toHaveValue('');
  }

  async validateOneSearchResult() {
    await expect(this.tableRows).toHaveCount(1);
  }

  async validateAtLeastOneSearchResult() {
    const count = await this.tableRows.count();
    await expect(count).toBeGreaterThanOrEqual(1);
  }

  async validateAllRowsContain(expectedText: string, columnName: string) {
    const rowCount = await this.tableRows.count();
    for (let i = 0; i < rowCount; i++) {
      const cell = this.page.getByTestId(`${STYLED_TABLE_CELL_PREFIX}${i}-${columnName}`);
      await expect(cell).toContainText(expectedText);
    }
  }

  async validateFirstRowContainsNHN(expectedText: string) {
    const firstRowNHN = this.page.getByTestId(`${STYLED_TABLE_CELL_PREFIX}0-displayId`);
    await expect(firstRowNHN).toHaveText(expectedText);
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

  getNHNCell(nhn: string) {
    return this.page.getByTestId('styledtablecell-2gyy-0-displayId').filter({ hasText: nhn });
  }

  getSecondNHNCell() {
    return this.page.getByTestId('styledtablecell-2gyy-1-displayId');
  }

  async validateSortOrder(isAscending: boolean, columnName: string) {
    const rowCount = await this.tableRows.count();
    const Values: string[] = [];
    for (let i = 0; i < rowCount; i++) {
      const locatorText = STYLED_TABLE_CELL_PREFIX + i + "-" + columnName;
      const cell = this.page.getByTestId(locatorText);
      const text = await cell.textContent();
      if (text) Values.push(text);
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
      const locatorText = STYLED_TABLE_CELL_PREFIX + i + "-dateOfBirth";
      const cell = this.page.getByTestId(locatorText);
      const text = await cell.textContent();
      if (text) dateValues.push(text);
    }
    const sortedValues = [...dateValues].sort((a, b) => {
      const dateA = new Date(convertDateFormat(a)).getTime();
      const dateB = new Date(convertDateFormat(b)).getTime();
      return isAscending ? dateA - dateB : dateB - dateA;
    });
    expect(dateValues).toEqual(sortedValues);
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

  async sortBySex() {
    await this.sortByColumn('sex');
  }
}
