import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';
import { STYLED_TABLE_CELL_PREFIX } from '../../utils/testHelper';
import { routes } from '../../config/routes';
import { expect } from '../../fixtures/baseFixture';
import { PatientTable } from './PatientTable';

export interface TriageSearchCriteria {
  displayId?: string;
  firstName?: string;
  lastName?: string;
  advancedSearch: boolean;
}

export class EmergencyPatientsPage extends BasePage {
  readonly patientTable: PatientTable;

  // Page elements
  readonly pageHeading!: Locator;

  // Search elements
  readonly searchButton!: Locator;
  readonly displayIdInput!: Locator;
  readonly firstNameInput!: Locator;
  readonly lastNameInput!: Locator;

  // Statistics cards
  readonly statisticsCardContainer!: Locator;
  readonly level1Container!: Locator;
  readonly level1Header!: Locator;
  readonly level1Value!: Locator;
  readonly level2Container!: Locator;
  readonly level2Header!: Locator;
  readonly level2Value!: Locator;
  readonly level3Container!: Locator;
  readonly level3Header!: Locator;
  readonly level3Value!: Locator;
  readonly level4Container!: Locator;
  readonly level4Header!: Locator;
  readonly level4Value!: Locator;
  readonly level5Container!: Locator;
  readonly level5Header!: Locator;
  readonly level5Value!: Locator;

  // Table elements
  readonly tableBody!: Locator;

  // Table sort labels
  readonly arrivalTimeSortButton!: Locator;
  readonly chiefComplaintSortButton!: Locator;
  readonly displayIdSortButton!: Locator;
  readonly patientNameSortButton!: Locator;
  readonly dateOfBirthSortButton!: Locator;
  readonly sexSortButton!: Locator;
  readonly areaSortButton!: Locator;
  readonly locationSortButton!: Locator;

  // Table rows
  readonly tableRows!: Locator;

  // Footer elements
  readonly downloadButton!: Locator;
  readonly pageRecordCount!: Locator;
  readonly pagination!: Locator;

  constructor(page: Page) {
    super(page, routes.patients.emergency);
    this.patientTable = new PatientTable(page);

    const testIds = {
      // Page elements
      pageContainer: 'pagecontainer-mjc9',
      appBar: 'appbar-eplg',
      pageHeading: 'topbarheading-bgnl',

      // Statistics cards
      statisticsCardContainer: 'statisticscardcontainer-4vpu',
      level1Container: 'container-qbh0-1',
      level1Header: 'header-2rlj-1',
      level1Value: 'valuetext-0dus-1',
      level2Container: 'container-qbh0-2',
      level2Header: 'header-2rlj-2',
      level2Value: 'valuetext-0dus-2',
      level3Container: 'container-qbh0-3',
      level3Header: 'header-2rlj-3',
      level3Value: 'valuetext-0dus-3',
      level4Container: 'container-qbh0-4',
      level4Header: 'header-2rlj-4',
      level4Value: 'valuetext-0dus-4',
      level5Container: 'container-qbh0-5',
      level5Header: 'header-2rlj-5',
      level5Value: 'valuetext-0dus-5',

      // Table elements
      table: 'styledtable-1dlu',
      tableHead: 'styledtablehead-ays3',
      tableBody: 'styledtablebody-a0jz',
      tableFooter: 'styledtablefooter-7pgn',

      // Table sort labels
      arrivalTimeSortButton: 'tablesortlabel-0qxx-arrivalTime',
      chiefComplaintSortButton: 'tablesortlabel-0qxx-chiefComplaint',
      displayIdSortButton: 'tablesortlabel-0qxx-displayId',
      patientNameSortButton: 'tablesortlabel-0qxx-patientName',
      dateOfBirthSortButton: 'tablesortlabel-0qxx-dateOfBirth',
      sexSortButton: 'tablesortlabel-0qxx-sex',
      areaSortButton: 'tablesortlabel-0qxx-locationGroupName',
      locationSortButton: 'tablesortlabel-0qxx-locationName',

      // Footer elements
      downloadButton: 'download-data-button',
      pageRecordCount: 'pagerecordcount-m8ne',
      pagination: 'styledpagination-fbr1',
    } as const;

    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }

    this.tableRows = this.tableBody.locator('tr');
    this.searchButton = page.getByTestId('searchbutton-nt24');
    this.displayIdInput = page.getByTestId('field-display-id-input');
    this.firstNameInput = page.getByTestId('field-first-name-input');
    this.lastNameInput = page.getByTestId('field-last-name-input');
  }

  async goto() {
    await super.goto();
    await this.waitForPageToLoad();
  }

  async waitForPageToLoad() {
    await this.pageHeading.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async searchTable(searchCriteria: TriageSearchCriteria): Promise<void> {
    if (searchCriteria.displayId) {
      await this.displayIdInput.fill(searchCriteria.displayId);
    }
    if (searchCriteria.firstName) {
      await this.firstNameInput.fill(searchCriteria.firstName);
    }
    if (searchCriteria.lastName) {
      await this.lastNameInput.fill(searchCriteria.lastName);
    }

    await this.searchButton.click();
    await this.patientTable.waitForTableToLoad();
  }

  async validateOneSearchResult() {
    await expect(this.tableBody.getByTestId(`${STYLED_TABLE_CELL_PREFIX}0-displayId`)).toBeVisible();
    await expect(this.tableRows).toHaveCount(1);
  }

  async validateFirstRowContainsDisplayId(expectedText: string) {
    const firstRowDisplayId = this.page.getByTestId(`${STYLED_TABLE_CELL_PREFIX}0-displayId`);
    await expect(firstRowDisplayId).toHaveText(expectedText);
  }

  async getLevelCardValue(level: 1 | 2 | 3 | 4 | 5): Promise<string> {
    const valueLocators = {
      1: this.level1Value,
      2: this.level2Value,
      3: this.level3Value,
      4: this.level4Value,
      5: this.level5Value,
    };
    return await valueLocators[level].innerText();
  }

  async getTableItemValue(index: number, columnName: string): Promise<string> {
    const itemLocator = this.page.getByTestId(`${STYLED_TABLE_CELL_PREFIX}${index}-${columnName}`);
    return await itemLocator.innerText();
  }
}
