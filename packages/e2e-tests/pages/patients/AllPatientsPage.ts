import { Locator, Page, expect } from '@playwright/test';
import { ids, TABLE_CELL_PREFIX } from '@ids';
import { DataTable } from '@components/DataTable';
import { facilityUrl, routes } from '@helpers/navigation';
import { fillDate } from '@helpers/dates';
import { selectAutocomplete } from '@helpers/fields';

export interface PatientSearchCriteria {
  NHN?: string;
  firstName?: string;
  lastName?: string;
  DOB?: string;
  culturalName?: string;
  village?: string;
  sex?: string;
  DOBFrom?: string;
  DOBTo?: string;
  deceased?: boolean;
}

export class AllPatientsPage {
  readonly table: DataTable;

  // Search form
  readonly searchForm: Locator;
  readonly nhnInput: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly searchButton: Locator;
  readonly clearButton: Locator;
  readonly advancedSearchToggle: Locator;

  // Advanced search
  readonly dobInput: Locator;
  readonly culturalNameInput: Locator;
  readonly villageSearchBox: Locator;
  readonly villageSuggestionList: Locator;
  readonly sexDropdownIcon: Locator;
  readonly sexDropdownClear: Locator;
  readonly deceasedCheckbox: Locator;
  readonly dobFromInput: Locator;
  readonly dobToInput: Locator;

  // New patient form
  readonly newPatientButton: Locator;
  readonly newPatientFirstName: Locator;
  readonly newPatientLastName: Locator;
  readonly newPatientDob: Locator;
  readonly newPatientMale: Locator;
  readonly newPatientFemale: Locator;
  readonly newPatientId: Locator;
  readonly newPatientSubmit: Locator;
  readonly newPatientVillageInput: Locator;

  // Sort buttons
  readonly firstNameSortButton: Locator;
  readonly lastNameSortButton: Locator;
  readonly culturalNameSortButton: Locator;
  readonly villageSortButton: Locator;
  readonly dobSortButton: Locator;

  // Pagination
  readonly paginationText: Locator;

  constructor(readonly page: Page) {
    this.table = new DataTable(page);

    // Search form
    this.searchForm = page.getByTestId(ids.patientSearch.form);
    this.nhnInput = page.getByTestId(ids.allPatients.nhnSearchInput).locator('input');
    this.firstNameInput = page.getByTestId(ids.allPatients.firstNameSearchInput).locator('input');
    this.lastNameInput = page.getByTestId(ids.allPatients.lastNameSearchInput).locator('input');
    this.searchButton = page.getByTestId(ids.patientSearch.searchButton);
    this.clearButton = page.getByTestId(ids.patientSearch.clearButton);
    this.advancedSearchToggle = page.getByTestId(ids.patientSearch.advancedSearchToggle);

    // Advanced search
    this.dobInput = page.getByTestId(ids.allPatients.dobField).getByRole('textbox');
    this.culturalNameInput = page.getByTestId(ids.allPatients.culturalNameInput).locator('input');
    this.villageSearchBox = page.getByTestId(ids.allPatients.villageInput).locator('input');
    this.villageSuggestionList = page
      .getByTestId(ids.allPatients.villageSuggestionList)
      .locator('ul li');
    this.sexDropdownIcon = page.getByTestId(ids.allPatients.sexDropdownIcon);
    this.sexDropdownClear = page.getByTestId(ids.allPatients.sexDropdownClear);
    this.deceasedCheckbox = page.getByTestId(ids.allPatients.deceasedCheckbox);
    this.dobFromInput = page.getByTestId(ids.allPatients.dobFromField).getByRole('textbox');
    this.dobToInput = page.getByTestId(ids.allPatients.dobToField).getByRole('textbox');

    // New patient form
    this.newPatientButton = page.getByTestId(ids.allPatients.newPatientButton);
    this.newPatientFirstName = page.getByTestId(ids.allPatients.newPatientFirstName).locator('input');
    this.newPatientLastName = page.getByTestId(ids.allPatients.newPatientLastName).locator('input');
    this.newPatientDob = page.getByTestId(ids.allPatients.newPatientDob).locator('input');
    this.newPatientMale = page.getByTestId(ids.allPatients.newPatientMale);
    this.newPatientFemale = page.getByTestId(ids.allPatients.newPatientFemale);
    this.newPatientId = page.getByTestId(ids.allPatients.newPatientId);
    this.newPatientSubmit = page.getByTestId(ids.allPatients.newPatientSubmit);
    this.newPatientVillageInput = page.getByTestId(ids.allPatients.newPatientVillageInput).locator('input');

    // Sort
    this.firstNameSortButton = page.getByTestId(`${ids.table.sortPrefix}firstName`).locator('svg');
    this.lastNameSortButton = page.getByTestId(`${ids.table.sortPrefix}lastName`).locator('svg');
    this.culturalNameSortButton = page.getByTestId(`${ids.table.sortPrefix}culturalName`).locator('svg');
    this.villageSortButton = page.getByTestId(`${ids.table.sortPrefix}villageName`).locator('svg');
    this.dobSortButton = page.getByTestId(`${ids.table.sortPrefix}dateOfBirth`).locator('svg');

    // Pagination
    this.paginationText = page
      .getByTestId(ids.table.pageRecordCount)
      .filter({ hasText: '1–1 of 1' });
  }

  async goto(): Promise<void> {
    await this.page.goto(facilityUrl(routes.patients.all));
    await this.waitForPageToLoad();
  }

  async waitForPageToLoad(): Promise<void> {
    await this.searchForm.waitFor({ state: 'visible' });
  }

  async search(criteria: PatientSearchCriteria): Promise<void> {
    if (criteria.NHN) await this.nhnInput.fill(criteria.NHN);
    if (criteria.firstName) await this.firstNameInput.fill(criteria.firstName);
    if (criteria.lastName) await this.lastNameInput.fill(criteria.lastName);
    if (criteria.DOB) await fillDate(this.dobInput, criteria.DOB);
    if (criteria.culturalName) await this.culturalNameInput.fill(criteria.culturalName);
    if (criteria.village) {
      await selectAutocomplete(this.page, this.page.getByTestId(ids.allPatients.villageInput), criteria.village);
    }
    if (criteria.sex) {
      await this.sexDropdownIcon.click();
      await this.page
        .getByTestId(ids.allPatients.twoColumnsField)
        .getByText(new RegExp(`^${criteria.sex}$`, 'i'))
        .click();
    }
    if (criteria.deceased) await this.deceasedCheckbox.check();
    if (criteria.DOBFrom) await fillDate(this.dobFromInput, criteria.DOBFrom);
    if (criteria.DOBTo) await fillDate(this.dobToInput, criteria.DOBTo);

    await this.searchButton.click();
  }

  async clearSearch(): Promise<void> {
    await this.clearButton.click();
  }

  async createNewPatient(
    firstName: string,
    lastName: string,
    dob: string,
    gender: 'male' | 'female',
  ): Promise<void> {
    await this.newPatientButton.click();
    await this.newPatientFirstName.fill(firstName);
    await this.newPatientLastName.fill(lastName);
    await this.newPatientDob.click();
    await fillDate(this.newPatientDob, dob);
    if (gender === 'female') {
      await this.newPatientFemale.check();
    } else {
      await this.newPatientMale.check();
    }
    await this.newPatientSubmit.click();
  }

  async searchAndSelectByNHN(nhn: string, maxAttempts = 100): Promise<void> {
    let attempts = 0;
    while (attempts < maxAttempts) {
      try {
        await this.waitForPageToLoad();
        await this.nhnInput.fill(nhn);
        await this.searchButton.click();
        await this.table.waitForTable();

        const secondRow = this.table.body.getByTestId(`${TABLE_CELL_PREFIX}1-displayId`);
        if (await secondRow.isVisible()) {
          await this.page.waitForTimeout(1000);
          attempts++;
          continue;
        }

        await this.table.cell(0, 'displayId').filter({ hasText: nhn }).click({ timeout: 5000 });
        return;
      } catch {
        attempts++;
        if (attempts >= maxAttempts) throw new Error(`Could not find patient ${nhn}`);
        await this.page.waitForTimeout(1000);
      }
    }
  }

  async validateAllFieldsAreEmpty(): Promise<void> {
    await expect(this.nhnInput).toHaveValue('');
    await expect(this.firstNameInput).toHaveValue('');
    await expect(this.lastNameInput).toHaveValue('');
  }
}
