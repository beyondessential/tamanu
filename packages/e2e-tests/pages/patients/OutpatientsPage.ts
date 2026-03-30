import { Locator, Page, expect } from '@playwright/test';
import { ids, TABLE_CELL_PREFIX } from '@ids';
import { DataTable } from '@components/DataTable';
import { facilityUrl, routes } from '@helpers/navigation';
import { selectAutocomplete } from '@helpers/fields';

export interface OutpatientSearchCriteria {
  NHN?: string;
  firstName?: string;
  lastName?: string;
  area?: string;
  department?: string;
  clinician?: string;
  advancedSearch?: boolean;
}

export class OutpatientsPage {
  readonly table: DataTable;

  readonly searchForm: Locator;
  readonly nhnInput: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly areaInput: Locator;
  readonly departmentInput: Locator;
  readonly clinicianInput: Locator;
  readonly searchButton: Locator;
  readonly clearButton: Locator;
  readonly advancedSearchToggle: Locator;

  constructor(readonly page: Page) {
    this.table = new DataTable(page);

    this.searchForm = page.getByTestId(ids.patientSearch.form);
    this.nhnInput = page.getByTestId(ids.patientSearch.nhnInput).locator('input');
    this.firstNameInput = page.getByTestId(ids.patientSearch.firstNameInput).locator('input');
    this.lastNameInput = page.getByTestId(ids.patientSearch.lastNameInput).locator('input');
    this.areaInput = page.getByTestId(ids.outpatients.nhnInput);
    this.departmentInput = page.getByTestId(ids.outpatients.firstNameInput);
    this.clinicianInput = page.getByTestId(ids.outpatients.lastNameInput);
    this.searchButton = page.getByTestId(ids.patientSearch.searchButton);
    this.clearButton = page.getByTestId(ids.patientSearch.clearButton);
    this.advancedSearchToggle = page.getByTestId(ids.patientSearch.advancedSearchToggle);
  }

  async goto(): Promise<void> {
    await this.page.goto(facilityUrl(routes.patients.outpatients));
    await this.waitForPageToLoad();
  }

  async waitForPageToLoad(): Promise<void> {
    await this.searchForm.waitFor({ state: 'visible' });
  }

  async search(criteria: OutpatientSearchCriteria): Promise<void> {
    if (criteria.advancedSearch) await this.advancedSearchToggle.click();
    if (criteria.NHN) await this.nhnInput.fill(criteria.NHN);
    if (criteria.firstName) await this.firstNameInput.fill(criteria.firstName);
    if (criteria.lastName) await this.lastNameInput.fill(criteria.lastName);
    if (criteria.area) {
      await selectAutocomplete(this.page, this.areaInput, criteria.area);
    }
    if (criteria.department) {
      await selectAutocomplete(this.page, this.departmentInput, criteria.department);
    }
    if (criteria.clinician) {
      await selectAutocomplete(this.page, this.clinicianInput, criteria.clinician);
    }
    await this.searchButton.click();
    await this.table.waitForTable();
  }

  async clearSearch(): Promise<void> {
    await this.clearButton.click();
  }

  async validateAllFieldsAreEmpty(): Promise<void> {
    await expect(this.nhnInput).toHaveValue('');
    await expect(this.firstNameInput).toHaveValue('');
    await expect(this.lastNameInput).toHaveValue('');
    await expect(this.areaInput.locator('input')).toHaveValue('');
    await expect(this.departmentInput.locator('input')).toHaveValue('');
    await expect(this.clinicianInput.locator('input')).toHaveValue('');
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
}
