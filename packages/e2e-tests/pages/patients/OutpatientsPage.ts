import { Locator, Page } from '@playwright/test';
import { routes } from '../../config/routes';
import { BasePatientListPage, BaseSearchCriteria } from './BasePatientListPage';
import { selectAutocompleteFieldOption } from '../../utils/fieldHelpers';
import { expect } from '../../fixtures/baseFixture';

export interface OutpatientSearchCriteria extends BaseSearchCriteria {
  area?: string;
  department?: string;
  clinician?: string;
}

export class OutpatientsPage extends BasePatientListPage {
  readonly areaInput: Locator;
  readonly departmentInput: Locator;
  readonly clinicianInput: Locator;

  constructor(page: Page) {
    super(page, routes.patients.outpatients);
    // Override specific locators for outpatients
    this.searchTitle = page.getByTestId('searchtabletitle-09n6');
    this.tableFooter = page.getByTestId('styledtablefooter-0eff');
    this.tableRows = this.tableBody.locator('tr');
    this.downloadButton = page.getByTestId('downloadbutton-0eff');
    
    // Outpatient-specific locators
    this.areaInput = page.getByTestId('localisedfield-p72m-input');
    this.departmentInput = page.getByTestId('localisedfield-50wl-input');
    this.clinicianInput = page.getByTestId('localisedfield-8w55-input');
  }

  // Implement abstract method from base class
  async searchTable(searchCriteria: OutpatientSearchCriteria): Promise<void> {
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

  // Implement abstract method from base class
  async validateAllFieldsAreEmpty() {
    await expect(this.nhnInput).toHaveValue('');
    await expect(this.firstNameInput).toHaveValue('');
    await expect(this.lastNameInput).toHaveValue('');
    await expect(this.areaInput.locator('input')).toHaveValue('');
    await expect(this.departmentInput.locator('input')).toHaveValue('');
    await expect(this.clinicianInput.locator('input')).toHaveValue('');
  }
}