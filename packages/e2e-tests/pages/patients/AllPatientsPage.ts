import { Locator, Page } from '@playwright/test';
import { routes } from '../../config/routes';
import { BasePatientListPage, BaseSearchCriteria } from './BasePatientListPage';
import { selectAutocompleteFieldOption } from '../../utils/fieldHelpers';
import { RecentlyViewedPatientsList } from './RecentlyViewedPatientsList';
import { expect } from '../../fixtures/baseFixture';

export const TWO_COLUMNS_FIELD_TEST_ID = 'twocolumnsfield-wg4x';

export interface PatientSearchCriteria extends BaseSearchCriteria {
  DOB?: string;
  culturalName?: string;
  DOBFrom?: string;
  DOBTo?: string;
  sex?: string;
  village?: string;
  deceased?: boolean;
}

export class AllPatientsPage extends BasePatientListPage {
  readonly recentlyViewedPatientsList: RecentlyViewedPatientsList;
  readonly addNewPatientBtn: Locator;
  readonly NewPatientFirstName: Locator;
  readonly NewPatientLastName: Locator;
  readonly NewPatientDOBtxt: Locator;
  readonly NewPatientMaleChk: Locator;
  readonly NewPatientFemaleChk: Locator;
  readonly NewPatientNHN: Locator;
  readonly NewPatientConfirmBtn: Locator;
  readonly nhnSearchInput: Locator;
  readonly patientSearchButton: Locator;
  readonly patientListingsHeader: Locator;
  readonly searchResultsPagination: Locator;
  readonly searchResultsPaginationOneOfOne: Locator;
  readonly nhnResultCell: Locator;
  readonly secondNHNResultCell: Locator;
  readonly NHNInput: Locator;
  readonly DOBInput: Locator;
  readonly culturalNameInput: Locator;
  readonly villageSearchBox: Locator;
  readonly newPatientVillageSearchBox: Locator;
  readonly includeDeceasedChk: Locator;
  readonly advanceSearchIcon: Locator;
  readonly searchBtn: Locator;
  readonly villageSuggestionList: Locator;
  readonly sexDropDownIcon: Locator;
  readonly sexDropDownCrossIcon: Locator;
  readonly DOBFromTxt: Locator;
  readonly DOBToTxt: Locator;
  readonly clearSearchBtn: Locator;
  readonly patientPageRecordCount25: Locator;
  readonly patientPageRecordCount50: Locator;
  readonly patientPage2: Locator;
  readonly firstNameSortButton: Locator;
  readonly lastNameSortButton: Locator;
  readonly culturalNameSortButton: Locator;
  readonly villageSortButton: Locator;
  readonly dobSortButton: Locator;

  constructor(page: Page) {
    super(page, routes.patients.all);
    this.recentlyViewedPatientsList = new RecentlyViewedPatientsList(page);
    
    // Override specific locators for all patients - using correct test IDs from HTML
    this.searchTitle = page.getByTestId('searchtabletitle-09n6'); // Default from base
    this.tableFooter = page.getByTestId('styledtablefooter-0eff'); // Default from base
    this.tableRows = page.getByTestId('styledtablebody-a0jz').locator('tr');
    this.downloadButton = page.getByTestId('downloadbutton-0eff'); // Default from base
    this.hideAdvancedSearchBtn = page.getByTestId('iconbutton-zrkv'); // Same as advanceSearchIcon
    this.searchButton = page.getByTestId('searchbutton-nt24'); // Same as searchBtn
    this.clearButton = page.getByTestId('clearbutton-z9x3'); // Same as clearSearchBtn
    
    // Override base search field locators with correct AllPatients test IDs
    this.nhnInput = page.getByTestId('localisedfield-dzml-input');
    this.firstNameInput = page.getByTestId('localisedfield-i9br-input');
    this.lastNameInput = page.getByTestId('localisedfield-ngsn-input');
    
    // AllPatients-specific locators
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
    this.DOBInput = page.getByTestId('field-qk60-input').locator('input[type="date"]');
    this.culturalNameInput = page.getByTestId('localisedfield-epbq-input');
    this.villageSearchBox = page.getByTestId('villagelocalisedfield-mcri-input');
    this.newPatientVillageSearchBox = page.getByTestId('localisedfield-rpma-input').locator('input');
    this.includeDeceasedChk = page.getByTestId('field-ngy7-controlcheck');
    this.advanceSearchIcon = page.getByTestId('iconbutton-zrkv');
    this.searchBtn = page.getByTestId('searchbutton-nt24');
    this.villageSuggestionList = page.getByTestId('villagelocalisedfield-mcri-suggestionslist').locator('ul').locator('li');
    this.sexDropDownIcon = page.getByTestId('sexlocalisedfield-7lm9-expandmoreicon-h115');
    this.sexDropDownCrossIcon = page.getByTestId('stylediconbutton-6vh3');
    this.DOBFromTxt = page.getByTestId('joinedfield-swzm-input').locator('input[type="date"]');
    this.DOBToTxt = page.getByTestId('field-aax5-input').locator('input[type="date"]');
    this.clearSearchBtn = page.getByTestId('clearbutton-z9x3');
    this.patientPageRecordCount25 = page.getByTestId('styledmenuitem-fkrw-undefined').getByText('25');
    this.patientPageRecordCount50 = page.getByTestId('styledmenuitem-fkrw-undefined').getByText('50');
    this.patientPage2 = page.getByTestId('paginationitem-c5vg').getByText('2');
    this.firstNameSortButton = page.getByTestId('tablesortlabel-0qxx-firstName').locator('svg');
    this.lastNameSortButton = page.getByTestId('tablesortlabel-0qxx-lastName').locator('svg');
    this.culturalNameSortButton = page.getByTestId('tablesortlabel-0qxx-culturalName').locator('svg');
    this.villageSortButton = page.getByTestId('tablesortlabel-0qxx-villageName').locator('svg');
    this.dobSortButton = page.getByTestId('tablesortlabel-0qxx-dateOfBirth').locator('svg');
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

  // Implement abstract method from base class
  async searchTable(searchCriteria: PatientSearchCriteria): Promise<void> {
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

  // Implement abstract method from base class
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

  // AllPatients-specific search method
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