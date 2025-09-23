import { Locator, Page } from '@playwright/test';
import { routes } from '../../config/routes';
import { BasePage } from '../BasePage';
import { expect } from '../../fixtures/baseFixture';
import { convertDateFormat, STYLED_TABLE_CELL_PREFIX } from '../../utils/testHelper';
import { selectAutocompleteFieldOption } from '../../utils/fieldHelpers';
import { PatientTable } from './PatientTable';
import { RecentlyViewedPatientsList } from './RecentlyViewedPatientsList';
import { Patient } from '../../types/Patient';
import { ERROR_RED_RGB } from '../../utils/testColors';

export const TWO_COLUMNS_FIELD_TEST_ID = 'twocolumnsfield-wg4x';

export interface PatientSearchCriteria {
  NHN?: string;
  firstName?: string;
  lastName?: string;
  DOB?: string;
  culturalName?: string;
  DOBFrom?: string;
  DOBTo?: string;
  sex?: string;
  village?: string;
  deceased?: boolean;
  advancedSearch: boolean;
}

export class AllPatientsPage extends BasePage {
  readonly patientTable: PatientTable;
  readonly recentlyViewedPatientsList: RecentlyViewedPatientsList;
  readonly addNewPatientBtn: Locator;
  readonly NewPatientFirstName: Locator;
  readonly NewPatientLastName: Locator;
  readonly NewPatientDOBtxt: Locator;
  readonly NewPatientMaleChk: Locator;
  readonly NewPatientFemaleChk: Locator;
  readonly NewPatientNHN: Locator;
  readonly NewPatientConfirmBtn: Locator;
  _patientData?: Patient;
  readonly nhnSearchInput: Locator;
  readonly patientSearchButton: Locator;
  readonly patientListingsHeader: Locator;
  readonly searchResultsPagination: Locator;
  readonly searchResultsPaginationOneOfOne: Locator;
  readonly nhnResultCell: Locator;
  readonly secondNHNResultCell: Locator;
  readonly NHNInput: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly DOBInput: Locator;
  readonly culturalNameInput: Locator;
  readonly villageSearchBox: Locator;
  readonly newPatientVillageSearchBox: Locator;
  readonly includeDeceasedChk: Locator;
  readonly advanceSearchIcon: Locator;
  readonly searchBtn: Locator;
  readonly tableRows: Locator;
  readonly villageSuggestionList: Locator;
  readonly sexDropDownIcon: Locator;
  readonly sexDropDownCrossIcon: Locator;
  readonly DOBFromTxt: Locator;
  readonly DOBToTxt: Locator;
  readonly clearSearchBtn: Locator;
  readonly downloadBtn: Locator;
  readonly pageRecordCountDropDown: Locator;
  readonly patientPageRecordCount25: Locator;
  readonly patientPageRecordCount50: Locator;
  readonly patientPage2:Locator;
  readonly pageRecordCount:Locator;
  readonly firstNameSortButton: Locator;
  readonly lastNameSortButton: Locator;
  readonly culturalNameSortButton: Locator;
  readonly villageSortButton: Locator;
  readonly dobSortButton: Locator;

  constructor(page: Page) {
    super(page, routes.patients.all);
    this.patientTable = new PatientTable(page);
    this.recentlyViewedPatientsList = new RecentlyViewedPatientsList(page);
    this.addNewPatientBtn = page.getByTestId('component-enxe');
    this.NewPatientFirstName = page.getByTestId('localisedfield-cqua-input');
    this.NewPatientLastName = page.getByTestId('localisedfield-41un-input');
    this.NewPatientDOBtxt = page.getByTestId('localisedfield-oafl-input').getByRole('textbox');
    this.NewPatientMaleChk = page.getByTestId('controllabel-kkx2-male');
    this.NewPatientFemaleChk = page.getByTestId('controllabel-kkx2-female');
    this.NewPatientNHN = page.getByTestId('id-8niy');
    this.NewPatientConfirmBtn = page.getByTestId('formsubmitbutton-ygc6');
    this.nhnSearchInput = page.getByRole('textbox', { name: 'NHN' });
    this.patientSearchButton = page.getByRole('button', { name: 'Search', exact: true });
    this.patientListingsHeader = page.getByRole('heading', { name: 'Patient listing' });
    this.searchResultsPagination = page.getByTestId('pagerecordcount-m8ne');
    this.searchResultsPaginationOneOfOne = page
      .getByTestId('pagerecordcount-m8ne')
      .filter({ hasText: '1–1 of 1' });
    this.nhnResultCell = page.getByTestId('styledtablecell-2gyy-0-displayId');
    this.secondNHNResultCell = page.getByTestId('styledtablecell-2gyy-1-displayId');
    this.NHNInput = page.getByTestId('localisedfield-dzml-input');
    this.firstNameInput = page.getByTestId('localisedfield-i9br-input');
    this.lastNameInput = page.getByTestId('localisedfield-ngsn-input');
    this.DOBInput = page.getByTestId('field-qk60-input').locator('input[type="date"]');
    this.culturalNameInput = page.getByTestId('localisedfield-epbq-input');
    this.villageSearchBox = page.getByTestId('villagelocalisedfield-mcri-input');
    this.newPatientVillageSearchBox = page.getByTestId('localisedfield-rpma-input').locator('input');
    this.includeDeceasedChk = page.getByTestId('field-ngy7-controlcheck');
    this.advanceSearchIcon = page.getByTestId('iconbutton-zrkv');
    this.searchBtn = page.getByTestId('searchbutton-nt24');
    this.tableRows = page.getByTestId('styledtablebody-a0jz').locator('tr');
    this.villageSuggestionList = page.getByTestId('villagelocalisedfield-mcri-suggestionslist').locator('ul').locator('li');
    this.sexDropDownIcon = page.getByTestId('sexlocalisedfield-7lm9-expandmoreicon-h115');
    this.sexDropDownCrossIcon = page.getByTestId('stylediconbutton-6vh3');
    this.DOBFromTxt = page.getByTestId('joinedfield-swzm-input').locator('input[type="date"]');
    this.DOBToTxt = page.getByTestId('field-aax5-input').locator('input[type="date"]');
    this.clearSearchBtn = page.getByTestId('clearbutton-z9x3');
    this.downloadBtn = page.getByTestId('download-data-button');
    this.pageRecordCountDropDown= page.getByTestId('styledselectfield-lunn').locator('div');
    this.patientPageRecordCount25 = page.getByTestId('styledmenuitem-fkrw-undefined').getByText('25');
    this.patientPageRecordCount50 = page.getByTestId('styledmenuitem-fkrw-undefined').getByText('50');
    this.patientPage2=page.getByTestId('paginationitem-c5vg').getByText('2');
    this.pageRecordCount=page.getByTestId('pagerecordcount-m8ne');
    this.firstNameSortButton=page.getByTestId('tablesortlabel-0qxx-firstName').locator('svg');
    this.lastNameSortButton=page.getByTestId('tablesortlabel-0qxx-lastName').locator('svg');
    this.culturalNameSortButton=page.getByTestId('tablesortlabel-0qxx-culturalName').locator('svg');
    this.villageSortButton=page.getByTestId('tablesortlabel-0qxx-villageName').locator('svg');
    this.dobSortButton=page.getByTestId('tablesortlabel-0qxx-dateOfBirth').locator('svg');
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
   * @param timeout Optional timeout in milliseconds (default: 10000)
   * @throws Error if the expected row count is not reached within the timeout
   */
  async waitForTableRowCount(expectedRowCount: number, timeout: number = 30000) {
    try {
      await this.page.waitForFunction(
        (count) => {
          const table = document.querySelector('table');
          if (!table) return false;
          const rows = table.querySelectorAll('tbody tr');
          return rows.length === count;
        },
        expectedRowCount,
        { timeout }
      );
    } catch (error) {
      throw new Error(
        `Table did not reach expected row count of ${expectedRowCount} within ${timeout}ms. ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async clickOnFirstRow() {
    await this.patientTable.waitForTableToLoad();
    await this.patientTable.rows.first().click();
    await this.page.waitForURL(`**/${routes.patients.all}/*`);
  }

  async clickOnSearchResult(nhn: string) {
    //this has a short timeout to account for flakiness, in searchForAndSelectPatientByNHN it will try again if it timesout
    await this.nhnResultCell.filter({ hasText: nhn }).click({ timeout: 5000 });
    await this.page.waitForURL(`**/${routes.patients.all}/*`);
  }

  async navigateToPatientDetailsPage(nhn: string) {
    await this.goto();
    await expect(this.patientListingsHeader).toBeVisible();
    await this.searchForAndSelectPatientByNHN(nhn);
  }

  async fillNewPatientDetails(firstName: string, lastName: string, dob: string, gender: string) {
    await this.NewPatientFirstName.fill(firstName);
    await this.NewPatientLastName.fill(lastName);

    await this.NewPatientDOBtxt.click();
    await this.NewPatientDOBtxt.fill(dob);

    if (gender === 'female') {
      await this.NewPatientFemaleChk.check();
    } else {
      await this.NewPatientMaleChk.check();
    }
  }

  //Generic method to search with different field combinations
  async searchTable(searchCriteria: PatientSearchCriteria) {
    if (searchCriteria.advancedSearch) {
      await this.advanceSearchIcon.click();
    }
    // Fill search fields if provided
    if (searchCriteria.NHN) {
      await this.NHNInput.fill(searchCriteria.NHN);
    }
    if (searchCriteria.firstName) {
      await this.firstNameInput.fill(searchCriteria.firstName);
    }
    if (searchCriteria.lastName) {
      await this.lastNameInput.fill(searchCriteria.lastName);
    }
    if (searchCriteria.DOB) {
      await this.DOBInput.fill(searchCriteria.DOB);
    }
    if (searchCriteria.culturalName) {
      await this.culturalNameInput.fill(searchCriteria.culturalName);
    }
    if (searchCriteria.village) {
      await selectAutocompleteFieldOption(
        this.page,
        this.villageSearchBox,
        { optionToSelect: searchCriteria.village }
      );
    }
    if (searchCriteria.sex){
      await this.sexDropDownIcon.click();
      await this.page.getByTestId(TWO_COLUMNS_FIELD_TEST_ID).getByText(new RegExp(`^${searchCriteria.sex}$`, 'i')).click();
    }
    if (searchCriteria.deceased) {
      await this.includeDeceasedChk.check();
    }
    if (searchCriteria.DOBFrom) {
      await this.DOBFromTxt.fill(searchCriteria.DOBFrom);
    }
    if (searchCriteria.DOBTo) {
      await this.DOBToTxt.fill(searchCriteria.DOBTo);
    }
    
    await this.searchBtn.click();
  }

  async clearSearch() {
    await this.clearSearchBtn.click();
  }

  // Validate that at least one row is displayed after search
  async validateAtLeastOneSearchResult() {
    const rowCount = await this.tableRows.count();
    await expect(rowCount).toBeGreaterThan(0);
  }

  async validateAllFieldsAreEmpty() {
    await expect(this.NHNInput).toHaveValue('');
    await expect(this.firstNameInput).toHaveValue('');
    await expect(this.lastNameInput).toHaveValue('');
    await expect(this.DOBInput).toHaveValue('');
    await expect(this.culturalNameInput).toHaveValue('');
    await expect(this.villageSearchBox.locator('input')).toHaveValue('');
    await expect(this.sexDropDownCrossIcon).not.toBeVisible();
    await expect(this.DOBFromTxt).toHaveValue('');
    await expect(this.DOBToTxt).toHaveValue('');
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
      const locatorText = STYLED_TABLE_CELL_PREFIX + i + "-"+columnName;
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
      const [monthA, dayA, yearA] = a.split('/');
      const [monthB, dayB, yearB] = b.split('/');
      const dateA = `${yearA}-${monthA.padStart(2, '0')}-${dayA.padStart(2, '0')}`;
      const dateB = `${yearB}-${monthB.padStart(2, '0')}-${dayB.padStart(2, '0')}`;
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
        await this.nhnSearchInput.fill(nhn);
        await this.patientSearchButton.click();
        await this.patientTable.waitForTableToLoad();

        //the below if statement is to handle flakiness where sometimes a patient isn't immediately searchable after being created
        if (await this.page.getByRole('cell', { name: 'No patients found' }).isVisible()) {
          attempts++;
          continue;
        }

        //the below if statement is required because sometimes the search results load all results instead of the specific result
        if (await this.patientTable.secondNHNResultCell.isVisible()) {
          await this.page.reload();
          await this.page.waitForTimeout(3000);
          attempts++;
          continue;
        }

        await this.patientTable.clickOnSearchResult(nhn);
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
}