import { Locator, Page } from '@playwright/test';
import { expect } from '../../fixtures/baseFixture';
import { convertDateFormat, SelectingFromSearchBox ,STYLED_TABLE_CELL_PREFIX} from '../../utils/testHelper';
import { routes } from '../../config/routes';
import { Patient } from '../../types/Patient'; 
import { TWO_COLUMNS_FIELD_TEST_ID } from './AllPatientsPage';
type PatientTableRow = Locator & {
  getPatientInfo(): Promise<Patient>;
};

export class PatientTable {
  readonly page: Page;
  readonly table!: Locator;
  readonly loadingCell!: Locator;
  readonly rows!: Locator;
  readonly nhnResultCell!: Locator;
  readonly secondNHNResultCell!: Locator;
  readonly villageSuggestionList!: Locator;
  readonly searchBtn!: Locator;
  readonly clearSearchBtn!: Locator;
  readonly firstNameSortButton!: Locator;
  readonly lastNameSortButton!: Locator;
  readonly culturalNameSortButton!: Locator;
  readonly villageSortButton!: Locator;
  readonly dobSortButton!: Locator;
  readonly NHNTxt!: Locator;
  readonly firstNameTxt!: Locator;
  readonly lastNameTxt!: Locator;
  readonly DOBTxt!: Locator;
  readonly CulturalNameTxt!: Locator;
  readonly villageSearchBox!: Locator;
  readonly includeDeceasedChk!: Locator;
  readonly advanceSearchIcon!: Locator;
  readonly sexDropDownIcon!: Locator;
  readonly sexDropDownCrossIcon!: Locator;
  readonly DOBFromTxt!: Locator;
  readonly DOBToTxt!: Locator;
  readonly downloadBtn!: Locator;
  readonly pageRecordCountDropDown!: Locator;
  readonly patientPageRecordCount25!: Locator;
  readonly patientPageRecordCount50!: Locator;
  readonly patientPage2!: Locator;
  readonly pageRecordCount!: Locator;
  readonly pageRecordCountDropDownOptions!: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // TestId mapping for PatientTable elements
    const testIds = {
      loadingCell: 'statustablecell-rwkq',
      rows: 'styledtablebody-a0jz',
      nhnResultCell: 'styledtablecell-2gyy-0-displayId',
      secondNHNResultCell: 'styledtablecell-2gyy-1-displayId',
      villageSuggestionList: 'villagelocalisedfield-mcri-suggestionslist',
      searchBtn: 'searchbutton-nt24',
      clearSearchBtn: 'clearbutton-z9x3',
      firstNameSortButton: 'tablesortlabel-0qxx-firstName',
      lastNameSortButton: 'tablesortlabel-0qxx-lastName',
      culturalNameSortButton: 'tablesortlabel-0qxx-culturalName',
      villageSortButton: 'tablesortlabel-0qxx-villageName',
      dobSortButton: 'tablesortlabel-0qxx-dateOfBirth',
      NHNTxt: 'localisedfield-dzml-input',
      firstNameTxt: 'localisedfield-i9br-input',
      lastNameTxt: 'localisedfield-ngsn-input',
      DOBTxt: 'field-qk60-input',
      CulturalNameTxt: 'localisedfield-epbq-input',
      villageSearchBox: 'villagelocalisedfield-mcri-input',
      includeDeceasedChk: 'field-ngy7-controlcheck',
      advanceSearchIcon: 'iconbutton-zrkv',
      sexDropDownIcon: 'sexlocalisedfield-7lm9-expandmoreicon-h115',
      sexDropDownCrossIcon: 'stylediconbutton-6vh3',
      DOBFromTxt: 'joinedfield-swzm-input',
      DOBToTxt: 'field-aax5-input',
      downloadBtn: 'download-data-button',
      pageRecordCountDropDown: 'styledselectfield-lunn',
      pageRecordCountDropDownOptions: 'styledmenuitem-fkrw-undefined',
      patientPageRecordCount25: 'styledmenuitem-fkrw-undefined',
      patientPageRecordCount50: 'styledmenuitem-fkrw-undefined',
      patientPage2: 'paginationitem-c5vg',
      pageRecordCount: 'pagerecordcount-m8ne',
    } as const;

    // Create locators using the testId mapping
    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }
    
    // Special cases that need additional processing
    this.table = page.getByRole('table');
    this.loadingCell = page.getByTestId('statustablecell-rwkq').filter({ hasText: 'Loading' });
    this.rows = page.getByTestId('styledtablebody-a0jz').locator('tr');
    this.villageSuggestionList = page
      .getByTestId('villagelocalisedfield-mcri-suggestionslist')
      .locator('ul')
      .locator('li');
    this.firstNameSortButton = page.getByTestId('tablesortlabel-0qxx-firstName').locator('svg');
    this.lastNameSortButton = page.getByTestId('tablesortlabel-0qxx-lastName').locator('svg');
    this.culturalNameSortButton = page
      .getByTestId('tablesortlabel-0qxx-culturalName')
      .locator('svg');
    this.villageSortButton = page.getByTestId('tablesortlabel-0qxx-villageName').locator('svg');
    this.dobSortButton = page.getByTestId('tablesortlabel-0qxx-dateOfBirth').locator('svg');
    this.DOBTxt = page.getByTestId('field-qk60-input').locator('input[type="date"]');
    this.villageSearchBox = page.getByTestId('villagelocalisedfield-mcri-input').locator('input');
    this.DOBFromTxt = page.getByTestId('joinedfield-swzm-input').locator('input[type="date"]');
    this.DOBToTxt = page.getByTestId('field-aax5-input').locator('input[type="date"]');
    this.pageRecordCountDropDown = page.getByTestId('styledselectfield-lunn').locator('div');
    this.patientPageRecordCount25 = page
      .getByTestId('styledmenuitem-fkrw-undefined')
      .getByText('25');
    this.patientPageRecordCount50 = page
      .getByTestId('styledmenuitem-fkrw-undefined')
      .getByText('50');
    this.patientPage2 = page.getByTestId('paginationitem-c5vg').getByText('2', { exact: true });
  }

  async waitForTableToLoad() {
    try {
      await this.loadingCell.waitFor({ state: 'detached' });
      await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch (error) {
      throw new Error(`Failed to wait for table to load: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async waitForTableRowCount(expectedRowCount: number, timeout: number = 50000) {
  /**  try {
      await this.page.waitForFunction(
        (count) => {
          const table = document.querySelector('table');
          if (!table) return false;
          const rows = table.querySelectorAll('tbody tr');
          return rows.length === count;
        },
        expectedRowCount,
        { timeout },
      );
    } catch (error) {
      throw new Error(
        `Table did not reach expected row count of ${expectedRowCount} within ${timeout}ms. ${error instanceof Error ? error.message : String(error)}`,
      );
    }*/
      await expect(async () => {
      expect(await this.rows.count()).toBe(expectedRowCount);
    }).toPass({ timeout });
  }

  async clickOnFirstRow() {
    await this.waitForTableToLoad();
    await this.table.locator('tbody tr').first().click();
    await this.page.waitForURL(`**/*${routes.patients.patientDetails}`);
  }

  async clickOnSearchResult(nhn: string) {
    await this.nhnResultCell.filter({ hasText: nhn }).click({ timeout: 5000 });
    await this.page.waitForURL(`**/*${routes.patients.patientDetails}`);
  }

  async validateAtLeastOneSearchResult() {
    const rowCount = await this.rows.count();
    await expect(rowCount).toBeGreaterThan(0);
  }

  async validateAllRowsContain(expectedText: string, columnName: string) {
    const rowCount = await this.rows.count();
    const lowerExpectedText = expectedText.toLowerCase();
    for (let i = 0; i < rowCount; i++) {
      const row = this.rows.nth(i);
      const locatorText = `${STYLED_TABLE_CELL_PREFIX}${i}-${columnName}`;
      const cellLocator = row.locator(`[data-testid="${locatorText}"]`);
      const cellText = await cellLocator.textContent();
      const actualText = cellText || '';
      await expect(actualText.toLowerCase()).toContain(lowerExpectedText);
    }
  }

  async validateNumberOfPatients(expectedCount: number) {
    const rowCount = await this.rows.count();
    await expect(rowCount).toBe(expectedCount);
  }

  async validateRowColorIsRed(rowIndex: number = 0) {
    const row = this.rows.nth(rowIndex);
    const cells = row.locator('td');
    const cellCount = await cells.count();

    for (let i = 1; i < cellCount; i++) {
      const cell = cells.nth(i);
      await expect(cell).toHaveCSS('color', 'rgb(237, 51, 58)');
    }
  }

  async validateAllRowsDateMatches(expectedDate: string, columnName: string) {
    const rowCount = await this.rows.count();
    const convertedExpectedDate = await convertDateFormat(expectedDate);

    for (let i = 0; i < rowCount; i++) {
      const row = await this.rows.nth(i);
      const locatorText = `${STYLED_TABLE_CELL_PREFIX}${i}-${columnName}`;
      const cellLocator = row.locator(`[data-testid="${locatorText}"]`);
      await expect(cellLocator).toHaveText(convertedExpectedDate);
    }
  }

  async validateFirstRowContainsNHN(expectedText: string) {
    await expect(this.nhnResultCell).toHaveText(expectedText);
  }

  async validateOneSearchResult() {
    const rowCount = await this.rows.count();
    await expect(rowCount).toBe(1);
  }

  async validateSortOrder(isAscending: boolean, columnName: string) {
    const rowCount = await this.rows.count();
    const Values: string[] = [];

    for (let i = 0; i < rowCount; i++) {
      const row = this.rows.nth(i);
      const locatorText = `${STYLED_TABLE_CELL_PREFIX}${i}-${columnName}`;
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
    const rowCount = await this.rows.count();
    const dateValues: string[] = [];

    for (let i = 0; i < rowCount; i++) {
      const row = this.rows.nth(i);
      const locatorText = `${STYLED_TABLE_CELL_PREFIX}${i}-dateOfBirth`;
      const cellLocator = row.locator(`[data-testid="${locatorText}"]`);
      const cellText = await cellLocator.textContent();
      if (cellText) dateValues.push(cellText);
    }

    const sortedValues = [...dateValues].sort((a, b) => {
      const [month, day, year] = a.split('/');
      const dateA = new Date(`${year}-${month}-${day}`).getTime();
      const [monthB, dayB, yearB] = b.split('/');
      const dateB = new Date(`${yearB}-${monthB}-${dayB}`).getTime();
      return isAscending ? dateA - dateB : dateB - dateA;
    });
    console.log('result', dateValues);
    console.log('expected', sortedValues);
    expect(dateValues).toEqual(sortedValues);
    
  }

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
        searchCriteria.village,
      );
    }
    if (searchCriteria.sex) {
      await this.sexDropDownIcon.click();
      await this.page
        .getByTestId(TWO_COLUMNS_FIELD_TEST_ID)
        .getByText(new RegExp(`^${searchCriteria.sex}$`, 'i'))
        .click();
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

  async changePageSize(recordsPerPage: number) {
    try {
      // Click on the page record count dropdown
      await this.pageRecordCountDropDown.click();
      
      // Select the specified number of records per page
      await this.pageRecordCountDropDownOptions
        .getByText(recordsPerPage.toString())
        .click();
      
      // Wait for the table to reload with the new page size
      await this.waitForTableToLoad();
      // Verify the page size has been changed by checking the page record count
      await expect(this.pageRecordCount).toContainText(recordsPerPage.toString());
      
    } catch (error) {
      throw new Error(`Failed to change page size to ${recordsPerPage}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getTotalRowCount(): Promise<number> {
    await this.waitForTableToLoad();
    return await this.rows.count();
  }

  getRow(index: number): PatientTableRow {
    const rowLocator = this.rows.nth(index);
    return Object.assign(rowLocator, {
      async getPatientInfo(): Promise<Patient> {
        const firstName = await rowLocator.locator('[data-testid*="-firstName"]').textContent() || '';
        const lastName = await rowLocator.locator('[data-testid*="-lastName"]').textContent() || '';
        const nhn = await rowLocator.locator('[data-testid*="-displayId"]').textContent() || '';
        const sex = await rowLocator.locator('[data-testid*="-sex"]').textContent() || '';
        const dateOfBirth = await rowLocator.locator('[data-testid*="-dateOfBirth"]').textContent() || '';
        
        return {
          firstName,
          lastName,
          nhn,
          sex,
          dateOfBirth
        };
      }
    }) as PatientTableRow;
  }

  async getAllPatientInfo(): Promise<Patient[]> {
    const rowCount = await this.getTotalRowCount();
    const patients: Patient[] = [];
    
    for (let i = 0; i < rowCount; i++) {
      const row = this.getRow(i);
      const patientInfo = await row.getPatientInfo();
      patients.push(patientInfo);
    }
    
    return patients;
  }

  async clickOnRow(rowIndex: number) {
    try {
      await this.waitForTableToLoad();
      
      // Get the row at the specified index (0-based)
      const targetRow = this.rows.nth(rowIndex);
      
      // Wait for the row to be visible
      await targetRow.waitFor({ state: 'visible' });
      
      // Click on the row
      await targetRow.click();
      
      // Wait for navigation to patient details page
      await this.page.waitForURL(`**/*${routes.patients.patientDetails}`);
      
    } catch (error) {
      throw new Error(`Failed to click on row ${rowIndex}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
