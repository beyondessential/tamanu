import { Locator, Page } from '@playwright/test';
import { routes } from '../../config/routes';
import { expect } from '../../fixtures/baseFixture';
import { selectAutocompleteFieldOption, selectFieldOption } from '../../utils/fieldHelpers';
import { ALERT_RED_RGB } from '../../utils/testColors';
import { STYLED_TABLE_CELL_PREFIX } from '../../utils/testHelper';
import { BasePatientListPage, BaseSearchCriteria } from './BasePatientListPage';

export interface RecentlyDischargedSearchCriteria extends BaseSearchCriteria {
  encounterType?: string;
  area?: string;
  department?: string;
  dischargingClinician?: string;
}

export class RecentlyDischargedPatientsPage extends BasePatientListPage {
  readonly encounterTypeSelect!: Locator;
  readonly areaInput!: Locator;
  readonly departmentInput!: Locator;
  readonly dischargingClinicianInput!: Locator;

  constructor(page: Page) {
    super(page, routes.facilityAdmin.recentlyDischargedPatients);

    // This view has its own search bar, so its fields replace the shared patient search ones
    const testIds = {
      searchTitle: 'searchtabletitle-rdp',
      nhnInput: 'field-rdp-patient-id-input',
      firstNameInput: 'field-rdp-first-name-input',
      lastNameInput: 'field-rdp-last-name-input',
      encounterTypeSelect: 'field-rdp-encounter-type-select',
      areaInput: 'field-rdp-area-input',
      departmentInput: 'field-rdp-department-input',
      dischargingClinicianInput: 'field-rdp-discharging-clinician-input',
    } as const;

    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }
  }

  async searchTable(searchCriteria: RecentlyDischargedSearchCriteria): Promise<void> {
    if (searchCriteria.advancedSearch) {
      await this.toggleAdvancedSearch();
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
    if (searchCriteria.encounterType) {
      await selectFieldOption(this.page, this.encounterTypeSelect, {
        optionToSelect: searchCriteria.encounterType,
      });
    }
    if (searchCriteria.area) {
      await selectAutocompleteFieldOption(this.page, this.areaInput, {
        optionToSelect: searchCriteria.area,
      });
    }
    if (searchCriteria.department) {
      await selectAutocompleteFieldOption(this.page, this.departmentInput, {
        optionToSelect: searchCriteria.department,
      });
    }
    if (searchCriteria.dischargingClinician) {
      await selectAutocompleteFieldOption(this.page, this.dischargingClinicianInput, {
        optionToSelect: searchCriteria.dischargingClinician,
      });
    }

    await this.searchButton.click();
    await this.patientTable.waitForTableToLoad();
  }

  async validateAllFieldsAreEmpty() {
    await expect(this.nhnInput).toHaveValue('');
    await expect(this.firstNameInput).toHaveValue('');
    await expect(this.lastNameInput).toHaveValue('');
    await expect(this.areaInput.locator('input')).toHaveValue('');
    await expect(this.departmentInput.locator('input')).toHaveValue('');
    await expect(this.dischargingClinicianInput.locator('input')).toHaveValue('');
  }

  getCell(rowIndex: number, columnKey: string) {
    return this.tableBody.getByTestId(`${STYLED_TABLE_CELL_PREFIX}${rowIndex}-${columnKey}`);
  }

  async validateNoSearchResults() {
    await expect(this.getCell(0, 'displayId')).toBeHidden();
    await expect(this.tableBody).toContainText('No patients found');
  }

  // Unlike the other patient listings, every cell of a deceased patient's row is red, Patient ID
  // included
  async validateWholeRowIsRed(rowIndex: number = 0) {
    const cells = this.tableRows.nth(rowIndex).locator('td');
    const cellCount = await cells.count();
    for (let i = 0; i < cellCount; i++) {
      await expect(cells.nth(i)).toHaveCSS('color', ALERT_RED_RGB);
    }
  }

  async openPatientFromRow(rowIndex: number, patientId: string) {
    await this.getCell(rowIndex, 'displayId').click();
    await this.page.waitForURL(`**/patients/all/${patientId}**`);
    // The URL changes before React swaps the route in, and the sidebar re-renders with it
    await expect(this.searchTitle).toBeHidden();
  }

  // The shared search form test id is not unique once a patient view is on screen, and this
  // page is navigated back to from one, so key the wait on this view's own title instead
  async waitForPageToLoad() {
    await this.searchTitle.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }
}
