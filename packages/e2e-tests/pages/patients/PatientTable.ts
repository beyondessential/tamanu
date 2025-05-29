import { Locator, Page } from '@playwright/test';
import { expect } from '../../fixtures/baseFixture';
import { convertDateFormat, SelectingFromSearchBox } from '../../utils/testHelper';

export class PatientTable {
  readonly page: Page;
  readonly table: Locator;
  readonly loadingCell: Locator;
  readonly rows: Locator;
  readonly nhnResultCell: Locator;
  readonly secondNHNResultCell: Locator;
  readonly villageSuggestionList: Locator;
  readonly searchBtn: Locator;
  readonly clearSearchBtn: Locator;
  readonly firstNameSortButton: Locator;
  readonly lastNameSortButton: Locator;
  readonly culturalNameSortButton: Locator;
  readonly villageSortButton: Locator;
  readonly dobSortButton: Locator;
  readonly NHNTxt: Locator;
  readonly firstNameTxt: Locator;
  readonly lastNameTxt: Locator;
  readonly DOBTxt: Locator;
  readonly CulturalNameTxt: Locator;
  readonly villageSearchBox: Locator;
  readonly includeDeceasedChk: Locator;
  readonly advanceSearchIcon: Locator;
  readonly sexDropDownIcon: Locator;
  readonly sexDropDownCrossIcon: Locator;
  readonly DOBFromTxt: Locator;
  readonly DOBToTxt: Locator;
  readonly downloadBtn: Locator;
  readonly pageRecordCountDropDown: Locator;
  readonly patientPageRecordCount25: Locator;
  readonly patientPageRecordCount50: Locator;
  readonly patientPage2: Locator;
  readonly pageRecordCount: Locator;

  constructor(page: Page) {
    this.page = page;
    this.table = page.getByRole('table');
    this.loadingCell = page.getByTestId('statustablecell-rwkq').filter({ hasText: 'Loading' });
    this.rows = page.getByTestId('styledtablebody-a0jz').locator('tr');
    this.nhnResultCell = page.getByTestId('styledtablecell-2gyy-0-displayId');
    this.secondNHNResultCell = page.getByTestId('styledtablecell-2gyy-1-displayId');
    this.villageSuggestionList = page.getByTestId('villagelocalisedfield-mcri-suggestionslist').locator('ul').locator('li');
    this.searchBtn = page.getByTestId('searchbutton-nt24');
    this.clearSearchBtn = page.getByTestId('clearbutton-z9x3');
    this.firstNameSortButton = page.getByTestId('tablesortlabel-0qxx-firstName').locator('svg');
    this.lastNameSortButton = page.getByTestId('tablesortlabel-0qxx-lastName').locator('svg');
    this.culturalNameSortButton = page.getByTestId('tablesortlabel-0qxx-culturalName').locator('svg');
    this.villageSortButton = page.getByTestId('tablesortlabel-0qxx-villageName').locator('svg');
    this.dobSortButton = page.getByTestId('tablesortlabel-0qxx-dateOfBirth').locator('svg');
    this.NHNTxt = page.getByTestId('localisedfield-dzml-input');
    this.firstNameTxt = page.getByTestId('localisedfield-i9br-input');
    this.lastNameTxt = page.getByTestId('localisedfield-ngsn-input');
    this.DOBTxt = page.getByTestId('field-qk60-input').locator('input[type="date"]');
    this.CulturalNameTxt = page.getByTestId('localisedfield-epbq-input');
    this.villageSearchBox = page.getByTestId('villagelocalisedfield-mcri-input').locator('input');
    this.includeDeceasedChk = page.getByTestId('checkinput-x2e3-controlcheck');
    this.advanceSearchIcon = page.getByTestId('iconbutton-zrkv');
    this.sexDropDownIcon = page.getByTestId('sexlocalisedfield-7lm9-expandmoreicon-h115');
    this.sexDropDownCrossIcon = page.getByTestId('stylediconbutton-6vh3');
    this.DOBFromTxt = page.getByTestId('joinedfield-swzm-input').locator('input[type="date"]');
    this.DOBToTxt = page.getByTestId('field-aax5-input').locator('input[type="date"]');
    this.downloadBtn = page.getByTestId('download-data-button');
    this.pageRecordCountDropDown = page.getByTestId('styledselectfield-lunn').locator('div');
    this.patientPageRecordCount25 = page.getByTestId('styledmenuitem-fkrw-undefined').getByText('25');
    this.patientPageRecordCount50 = page.getByTestId('styledmenuitem-fkrw-undefined').getByText('50');
    this.patientPage2 = page.getByTestId('paginationitem-c5vg').getByText('2', { exact: true });
    this.pageRecordCount = page.getByTestId('pagerecordcount-m8ne');
  }

  async waitForTableToLoad() {
    try {
      await this.page.waitForLoadState('networkidle', { timeout: 10000 });
      await this.loadingCell.waitFor({ state: 'hidden' });      
    } catch (error) {
      throw new Error(`Failed to wait for table to load: ${error.message}`);
    }
  }

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
        `Table did not reach expected row count of ${expectedRowCount} within ${timeout}ms. ${error.message}`
      );
    }
  }

  async clickOnFirstRow() {
    await this.waitForTableToLoad();
    await this.table.locator('tbody tr').first().click();
    await this.page.waitForURL('**/#/patients/all/*');      
  }

  async clickOnSearchResult(nhn: string) {
    await this.nhnResultCell.filter({ hasText: nhn }).click({ timeout: 5000 });
    await this.page.waitForURL('**/#/patients/all/*');          
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
      const locatorText = `styledtablecell-2gyy-${i}-${columnName}`;
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
      const locatorText = `styledtablecell-2gyy-${i}-${columnName}`;
      const cellLocator = row.locator(`[data-testid="${locatorText}"]`);
      await expect(cellLocator).toHaveText(convertedExpectedDate);
    }
  }

  async validateFirstRowContainsNHN(expectedText: string) {
    await expect(this.nhnResultCell).toHaveText(expectedText)
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
      const locatorText = `styledtablecell-2gyy-${i}-${columnName}`;
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
      const locatorText = `styledtablecell-2gyy-${i}-dateOfBirth`;  
      const cellLocator = row.locator(`[data-testid="${locatorText}"]`);
      const cellText = await cellLocator.textContent();
      if (cellText) dateValues.push(cellText);
    }

    const sortedValues = [...dateValues].sort((a, b) => {
      const dateA = new Date(a.split('/').reverse().join('-')).getTime();
      const dateB = new Date(b.split('/').reverse().join('-')).getTime();
      return isAscending ? dateA - dateB : dateB - dateA;
    });
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
} 