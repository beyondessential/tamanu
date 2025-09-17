import { Locator, Page } from '@playwright/test';
import { routes } from '../../config/routes';
import { BasePatientListPage, BaseSearchCriteria } from './BasePatientListPage';
import { selectAutocompleteFieldOption } from '../../utils/fieldHelpers';
import { expect } from '../../fixtures/baseFixture';

export interface InpatientSearchCriteria extends BaseSearchCriteria {
  area?: string;
  department?: string;
  clinician?: string;
  diet?: string;
}

export class InpatientsPage extends BasePatientListPage {
  readonly areaInput: Locator;
  readonly departmentInput: Locator;
  readonly clinicianInput: Locator;
  readonly dietInput: Locator;

  constructor(page: Page) {
    super(page, routes.patients.inpatients);
    // Override specific locators for inpatients
    this.searchTitle = page.getByTestId('searchtabletitle-v9md');
    this.tableFooter = page.getByTestId('styledtablefooter-7pgn');
    this.tableRows = page.getByTestId('styledtablebody-a0jz').locator('tr');
    this.downloadButton = page.getByTestId('download-data-button');
    
    // Inpatient-specific locators
    this.areaInput = page.getByTestId('localisedfield-p72m-input');
    this.departmentInput = page.getByTestId('localisedfield-50wl-input');
    this.clinicianInput = page.getByTestId('localisedfield-8w55-input');
    this.dietInput = page.getByTestId('localisedfield-gzn5-input');
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

  // Implement abstract method from base class
  async searchTable(searchCriteria: InpatientSearchCriteria): Promise<void> {
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
    await this.patientTable.waitForTableToLoad();
  }

  // Implement abstract method from base class
  async validateAllFieldsAreEmpty() {
    await expect(this.nhnInput).toHaveValue('');
    await expect(this.firstNameInput).toHaveValue('');
    await expect(this.lastNameInput).toHaveValue('');
    await expect(this.areaInput.locator('input')).toHaveValue('');
    await expect(this.departmentInput.locator('input')).toHaveValue('');
    await expect(this.clinicianInput.locator('input')).toHaveValue('');
    await expect(this.dietInput.locator('input')).toHaveValue('');
  }

  // Inpatient-specific sorting methods
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
}
