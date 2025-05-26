import { Locator, Page } from '@playwright/test';
import { routes } from '../../config/routes';
import { BasePage } from '../BasePage';
import { expect } from '../../fixtures/baseFixture';
import { SelectingFromSearchBox, convertDateFormat } from '../../utils/testHelper';


export class AllPatientsPage extends BasePage {
  readonly allPatientsTable: Locator;
  readonly allPatientsTableLoadingCell: Locator;
  readonly addNewPatientBtn: Locator;
  readonly NewPatientFirstName: Locator;
  readonly NewPatientLastName: Locator;
  readonly NewPatientDOBtxt: Locator;
  readonly NewPatientMaleChk: Locator;
  readonly NewPatientFemaleChk: Locator;
  readonly NewPatientNHN: Locator;
  readonly NewPatientConfirmBtn: Locator;
  _patientData?: {
    id: string;
    firstName: string;
    lastName: string;
    gender: string;
    formattedDOB: string;
    nhn: string;
    village: string,
    culturalName: string
    };
  readonly nhnSearchInput: Locator;
  readonly patientSearchButton: Locator;
  readonly patientListingsHeader: Locator;
  readonly searchResultsPagination: Locator;
  readonly searchResultsPaginationOneOfOne: Locator;
  readonly nhnResultCell: Locator;
  readonly secondNHNResultCell: Locator;
  readonly NHNTxt: Locator;
  readonly firstNameTxt: Locator;
  readonly lastNameTxt: Locator;
  readonly DOBTxt: Locator;
  readonly CulturalNameTxt: Locator;
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

    this.allPatientsTable = page.getByRole('table');
    this.allPatientsTableLoadingCell = page
      .getByTestId('statustablecell-rwkq')
      .filter({ hasText: 'Loading' });
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
    this.NHNTxt = page.getByTestId('localisedfield-dzml-input');
    this.firstNameTxt = page.getByTestId('localisedfield-i9br-input');
    this.lastNameTxt = page.getByTestId('localisedfield-ngsn-input');
    this.DOBTxt = page.getByTestId('field-qk60-input').locator('input[type="date"]');
    this.CulturalNameTxt = page.getByTestId('localisedfield-epbq-input');
    this.villageSearchBox = page.getByTestId('villagelocalisedfield-mcri-input').locator('input');
    this.newPatientVillageSearchBox = page.getByTestId('localisedfield-rpma-input').locator('input');
    this.includeDeceasedChk = page.getByTestId('checkinput-x2e3-controlcheck');
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
   setPatientData(data: {
    id: string;
    firstName: string;
    lastName: string;
    gender: string;
    formattedDOB: string;
    nhn: string;
    culturalName: string;
    village: string;
  }) {
    this._patientData = data;
  }

  getPatientData() {
    if (!this._patientData) throw new Error('Patient data has not been set');
    return this._patientData;
  }

  async waitForTableToLoad() {
    try {
      await this.page.waitForLoadState('networkidle', { timeout: 10000 });
      await this.allPatientsTableLoadingCell.waitFor({ state: 'hidden' });      
    } catch (error) {
      throw new Error(`Failed to wait for table to load: ${error.message}`);
    }
  }

  /**
   * Waits for the table to have a specific number of rows
   * @param expectedRowCount The number of rows to wait for
   * @param timeout Optional timeout in milliseconds (default: 10000)
   * @throws Error if the expected row count is not reached within the timeout
   */
  async waitForTableRowCount(expectedRowCount: number, timeout: number = 10000) {
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
        `Table did not reach expected row count of ${expectedRowCount} within ${timeout}ms. ${error.message}`
      );
    }
  }

  async clickOnFirstRow() {
    await this.waitForTableToLoad();
    await this.allPatientsTable.locator('tbody tr').first().click();
    await this.page.waitForURL('**/#/patients/all/*');
  }

  async clickOnSearchResult(nhn: string) {
    //this has a short timeout to account for flakiness, in searchForAndSelectPatientByNHN it will try again if it timesout
    await this.nhnResultCell.filter({ hasText: nhn }).click({ timeout: 5000 });
    await this.page.waitForURL('**/#/patients/all/*');
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
   async searchTable(searchCriteria: {
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
  }) {
    if (searchCriteria.advancedSearch) {
      await this.advanceSearchIcon.click();
    }
    // Fill search fields if provided
    if (searchCriteria.NHN) {
      await this.NHNTxt.fill(searchCriteria.NHN);
    }
    if (searchCriteria.firstName) {
      await this.firstNameTxt.fill(searchCriteria.firstName);
    }
    if (searchCriteria.lastName) {
      await this.lastNameTxt.fill(searchCriteria.lastName);
    }
    if (searchCriteria.DOB) {
      await this.DOBTxt.fill(searchCriteria.DOB);
    }
    if (searchCriteria.culturalName) {
      await this.CulturalNameTxt.fill(searchCriteria.culturalName);
    }
    if (searchCriteria.village) {
      await SelectingFromSearchBox(
        this.villageSearchBox,
        this.villageSuggestionList,
        searchCriteria.village
      );
    }
    if (searchCriteria.sex) {
      await this.sexDropDownIcon.click();
      await this.page.getByTestId('twocolumnsfield-wg4x').getByText(new RegExp(`^${searchCriteria.sex}$`, 'i')).click();
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
    await expect(this.NHNTxt).toHaveValue('');
    await expect(this.firstNameTxt).toHaveValue('');
    await expect(this.lastNameTxt).toHaveValue('');
    await expect(this.DOBTxt).toHaveValue('');
    await expect(this.CulturalNameTxt).toHaveValue('');
    await expect(this.villageSearchBox).toHaveValue('');
    await expect(this.sexDropDownCrossIcon).not.toBeVisible();
    await expect(this.DOBFromTxt).toHaveValue('');
    await expect(this.DOBToTxt).toHaveValue('');
  }
  async validateAllRowsContain(expectedText: string, columnName: string) {
    const rowCount = await this.tableRows.count();
    const lowerExpectedText = expectedText.toLowerCase();
    for (let i = 0; i < rowCount; i++) {
      const row = this.tableRows.nth(i);
      const locatorText = "styledtablecell-2gyy-" + i + "-" + columnName;
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
      await expect(cell).toHaveCSS('color', 'rgb(237, 51, 58)');
    }
  }
  // Validate date in all rows for a specific column
  async validateAllRowsDateMatches(expectedDate: string, columnName: string) {
    const rowCount = await this.tableRows.count();
    const convertedExpectedDate = await convertDateFormat(expectedDate);
    
    for (let i = 0; i < rowCount; i++) {
      const row = await this.tableRows.nth(i);
      const locatorText = "styledtablecell-2gyy-" + i + "-" + columnName;
      const cellLocator = row.locator(`[data-testid="${locatorText}"]`);
      await expect(cellLocator).toHaveText(convertedExpectedDate);
    }
  }
 // Validate that a specific row appears
 async validateFirstRowContainsNHN(expectedText: string) {
  const firstRowNHN = this.page.locator('[data-testid="styledtablecell-2gyy-0-displayId"]');
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
      const locatorText = "styledtablecell-2gyy-" + i + "-"+columnName;
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
      const locatorText = "styledtablecell-2gyy-" + i + "-dateOfBirth";
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
        await this.nhnSearchInput.fill(nhn);
        await this.patientSearchButton.click();
        await this.waitForTableToLoad();

        //the below if statement is to handle flakiness where sometimes a patient isn't immediately searchable after being created
        if (await this.page.getByRole('cell', { name: 'No patients found' }).isVisible()) {
          attempts++;
          continue;
        }

        //the below if statement is required because sometimes the search results load all results instead of the specific result
        if (await this.secondNHNResultCell.isVisible()) {
          await this.page.reload();
          await this.page.waitForTimeout(3000);
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
}
