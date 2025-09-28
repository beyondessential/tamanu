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
  readonly addNewPatientBtn!: Locator;
  readonly NewPatientFirstName!: Locator;
  readonly NewPatientLastName!: Locator;
  readonly NewPatientDOBtxt!: Locator;
  readonly NewPatientMaleChk!: Locator;
  readonly NewPatientFemaleChk!: Locator;
  readonly NewPatientNHN!: Locator;
  readonly NewPatientConfirmBtn!: Locator;
  readonly nhnSearchInput!: Locator;
  readonly patientSearchButton!: Locator;
  readonly patientListingsHeader!: Locator;
  readonly searchResultsPagination!: Locator;
  readonly searchResultsPaginationOneOfOne!: Locator;
  readonly nhnResultCell!: Locator;
  readonly secondNHNResultCell!: Locator;
  readonly NHNInput!: Locator;
  readonly DOBInput!: Locator;
  readonly culturalNameInput!: Locator;
  readonly villageSearchBox!: Locator;
  readonly newPatientVillageSearchBox!: Locator;
  readonly includeDeceasedChk!: Locator;
  readonly advanceSearchIcon!: Locator;
  readonly searchBtn!: Locator;
  readonly villageSuggestionList!: Locator;
  readonly sexDropDownIcon!: Locator;
  readonly sexDropDownCrossIcon!: Locator;
  readonly DOBFromTxt!: Locator;
  readonly DOBToTxt!: Locator;
  readonly clearSearchBtn!: Locator;
  readonly patientPageRecordCount25!: Locator;
  readonly patientPageRecordCount50!: Locator;
  readonly patientPage2!: Locator;
  readonly firstNameSortButton!: Locator;
  readonly lastNameSortButton!: Locator;
  readonly culturalNameSortButton!: Locator;
  readonly villageSortButton!: Locator;
  readonly dobSortButton!: Locator;

  constructor(page: Page) {
    super(page, routes.patients.all);
    this.recentlyViewedPatientsList = new RecentlyViewedPatientsList(page);
    
    // TestId mapping for AllPatients page elements
    const testIds = {
      // Override base locators with AllPatients-specific test IDs
      searchTitle: 'searchtabletitle-09n6',
      tableFooter: 'styledtablefooter-0eff',
      downloadButton: 'downloadbutton-0eff',
      hideAdvancedSearchBtn: 'iconbutton-zrkv',
      searchButton: 'searchbutton-nt24',
      clearButton: 'clearbutton-z9x3',
      nhnInput: 'localisedfield-dzml-input',
      firstNameInput: 'localisedfield-i9br-input',
      lastNameInput: 'localisedfield-ngsn-input',
      
      // AllPatients-specific locators
      addNewPatientBtn: 'component-enxe',
      NewPatientFirstName: 'localisedfield-cqua-input',
      NewPatientLastName: 'localisedfield-41un-input',
      NewPatientDOBtxt: 'localisedfield-oafl-input',
      NewPatientMaleChk: 'controllabel-kkx2-male',
      NewPatientFemaleChk: 'controllabel-kkx2-female',
      NewPatientNHN: 'id-8niy',
      NewPatientConfirmBtn: 'formsubmitbutton-ygc6',
      searchResultsPagination: 'pagerecordcount-m8ne',
      nhnResultCell: 'styledtablecell-2gyy-0-displayId',
      secondNHNResultCell: 'styledtablecell-2gyy-1-displayId',
      NHNInput: 'localisedfield-dzml-input',
      DOBInput: 'field-qk60-input',
      culturalNameInput: 'localisedfield-epbq-input',
      villageSearchBox: 'villagelocalisedfield-mcri-input',
      newPatientVillageSearchBox: 'localisedfield-rpma-input',
      includeDeceasedChk: 'field-ngy7-controlcheck',
      advanceSearchIcon: 'iconbutton-zrkv',
      searchBtn: 'searchbutton-nt24',
      villageSuggestionList: 'villagelocalisedfield-mcri-suggestionslist',
      sexDropDownIcon: 'sexlocalisedfield-7lm9-expandmoreicon-h115',
      sexDropDownCrossIcon: 'stylediconbutton-6vh3',
      DOBFromTxt: 'joinedfield-swzm-input',
      DOBToTxt: 'field-aax5-input',
      clearSearchBtn: 'clearbutton-z9x3',
      patientPageRecordCount25: 'styledmenuitem-fkrw-undefined',
      patientPageRecordCount50: 'styledmenuitem-fkrw-undefined',
      patientPage2: 'paginationitem-c5vg',
      firstNameSortButton: 'tablesortlabel-0qxx-firstName',
      lastNameSortButton: 'tablesortlabel-0qxx-lastName',
      culturalNameSortButton: 'tablesortlabel-0qxx-culturalName',
      villageSortButton: 'tablesortlabel-0qxx-villageName',
      dobSortButton: 'tablesortlabel-0qxx-dateOfBirth',
    } as const;

    // Create locators using the testId mapping
    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }
    
    // Override specific locators that need additional processing
    this.tableRows = page.getByTestId('styledtablebody-a0jz').locator('tr');
    this.NewPatientDOBtxt = page.getByTestId('localisedfield-oafl-input').getByRole('textbox');
    this.nhnSearchInput = page.getByRole('textbox', { name: 'NHN' });
    this.patientSearchButton = page.getByRole('button', { name: 'Search', exact: true });
    this.patientListingsHeader = page.getByRole('heading', { name: 'Patient listing' });
    this.searchResultsPaginationOneOfOne = page
      .getByTestId('pagerecordcount-m8ne')
      .filter({ hasText: '1–1 of 1' });
    this.DOBInput = page.getByTestId('field-qk60-input').locator('input[type="date"]');
    this.newPatientVillageSearchBox = page.getByTestId('localisedfield-rpma-input').locator('input');
    this.villageSuggestionList = page.getByTestId('villagelocalisedfield-mcri-suggestionslist').locator('ul').locator('li');
    this.DOBFromTxt = page.getByTestId('joinedfield-swzm-input').locator('input[type="date"]');
    this.DOBToTxt = page.getByTestId('field-aax5-input').locator('input[type="date"]');
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