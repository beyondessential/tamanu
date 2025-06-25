import { Locator, Page, expect } from '@playwright/test';
import { BasePatientPane } from './BasePatientPane';
import { RecordVaccineModal } from '../modals/RecordVaccineModal';
import { convertDateFormat } from '../../../../utils/testHelper';
export class PatientVaccinePane extends BasePatientPane {
  readonly recordVaccineButton: Locator;
  readonly recordedVaccinesTable: Locator;
  readonly recordedVaccinesTableLoadingIndicator: Locator;
  readonly recordedVaccinesTablePaginator: Locator;
  recordVaccineModal?: RecordVaccineModal;
  readonly recordedVaccinesTableBody: Locator;
  readonly vaccineNotGivenCheckbox: Locator;

  constructor(page: Page) {
    super(page);

    this.recordVaccineButton = this.page.getByTestId('component-enxe');
    this.recordedVaccinesTable = this.page
      .getByRole('table')
      .filter({ hasText: 'VaccineScheduleDateGiven' });
    this.recordedVaccinesTableLoadingIndicator = this.recordedVaccinesTable.getByRole('cell', {
      name: 'Loading...',
    });
    this.recordedVaccinesTablePaginator = this.page.getByTestId('pagerecordcount-m8ne');
    this.recordedVaccinesTableBody = this.page.getByTestId('styledtablebody-a0jz');
    this.vaccineNotGivenCheckbox = this.page.getByTestId('notgivencheckbox-mz3p-controlcheck');
  }

  async clickRecordVaccineButton(): Promise<RecordVaccineModal> {
    await this.recordVaccineButton.click();
    if (!this.recordVaccineModal) {
      this.recordVaccineModal = new RecordVaccineModal(this.page);
    }

    return this.recordVaccineModal;
  }

  async getRecordedVaccineCount(): Promise<number> {
    await this.recordedVaccinesTable.waitFor();
    await this.recordedVaccinesTableLoadingIndicator.waitFor({ state: 'detached' });

    // Check if the paginator is visible and extract the number of vaccines
    if (await this.recordedVaccinesTablePaginator.isVisible()) {
      const paginationText = await this.recordedVaccinesTablePaginator.innerText();
      const match = paginationText.match(/of (\d+)/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }

    // Pagination is not visible, so we assume 0 vaccines recorded
    return 0;
  }

  async waitForRecordedVaccinesTableToLoad() {
    await this.recordedVaccinesTable.waitFor();
    await this.recordedVaccinesTableLoadingIndicator.waitFor({ state: 'detached' });
  }

  async assertRecordedVaccineDetails( vaccineName: string, scheduleOption: string, date: string, count: number, givenBy?: string) {
    //The date field in this table uses the MM/DD/YYYY format immediately after creation so that's why this format is used here
    const formattedDate = convertDateFormat(date);

    const correctVaccineFound = await this.searchRecordVaccineTableForMatch(vaccineName, 'vaccineDisplayName', count);
    const correctScheduleOptionFound = await this.searchRecordVaccineTableForMatch(scheduleOption, 'schedule', count);
    const correctDateFound = await this.searchRecordVaccineTableForMatch(formattedDate, 'date', count);

    if (!correctVaccineFound) {
      throw new Error(`Vaccine "${vaccineName}" not found in the recorded vaccines table`);
    }
    if (!correctScheduleOptionFound) {
      throw new Error(`Schedule option "${scheduleOption}" not found in the recorded vaccines table`);
    }
    if (!correctDateFound) {
      throw new Error(`Date "${formattedDate}" not found in the recorded vaccines table`);
    }

    if (givenBy) {
      const correctGivenByFound = await this.searchRecordVaccineTableForMatch(givenBy, 'givenBy', count);
      if (!correctGivenByFound) {
        throw new Error(`Given by "${givenBy}" not found in the recorded vaccines table`);
      }
    }
  }

  async searchRecordVaccineTableForMatch(valueToMatch: string, locatorSuffix: string, count: number) {
    for (let i = 0; i < count; i++) {
      const locator = this.recordedVaccinesTableBody.getByTestId(`styledtablecell-2gyy-${i}-${locatorSuffix}`);
      const text = await locator.innerText();
      if (text.includes(valueToMatch)) {
        return true;
      }
    }
    return false;
  }

  async confirmNotGivenLabelIsVisible() {
    const notGivenLabelFound = await this.searchRecordVaccineTableForMatch('Not given', 'givenBy', 1);
    if (!notGivenLabelFound) {
      throw new Error('Not given label not found in the recorded vaccines table');
    }
  }
}
