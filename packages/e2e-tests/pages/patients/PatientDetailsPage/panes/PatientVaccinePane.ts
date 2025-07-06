import { Locator, Page, expect } from '@playwright/test';
import { BasePatientPane } from './BasePatientPane';
import { RecordVaccineModal } from '../modals/RecordVaccineModal';
import { convertDateFormat } from '../../../../utils/testHelper';
import { ViewVaccineRecordModal } from '../modals/viewVaccineRecordModal';
import {
  RequiredVaccineModalAssertionParams,
  OptionalVaccineModalAssertionParams,
} from '../../../../types/vaccine/ViewVaccineModalAssertions';

export class PatientVaccinePane extends BasePatientPane {
  readonly recordVaccineButton: Locator;
  readonly recordedVaccinesTable: Locator;
  readonly recordedVaccinesTableLoadingIndicator: Locator;
  readonly recordedVaccinesTablePaginator: Locator;
  recordVaccineModal?: RecordVaccineModal;
  viewVaccineRecordModal?: ViewVaccineRecordModal;
  readonly recordedVaccinesTableBody: Locator;
  readonly vaccineNotGivenCheckbox: Locator;
  readonly tableRowPrefix: string;
  readonly dateFieldForSingleVaccine: Locator;

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
    this.tableRowPrefix = `styledtablecell-2gyy-`;
    this.dateFieldForSingleVaccine = this.page.getByTestId('styledtablecell-2gyy-0-date');
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

 /**
  * Asserts the values for a specific vaccine in the recorded vaccines table are correct
  * @param vaccineName - The name of the vaccine to search for, e.g. "Pentavalent"
  * @param scheduleOption - The schedule option to search for, e.g. "10 weeks"
  * @param date - The date of the vaccine to search for, e.g. "2024-11-27"
  * @param count - The number of times to run the search
  * @param given - Whether the vaccine was given, e.g. true
  * @param givenBy - The name of the person who gave the vaccine, e.g. "John Doe"
  */ 
  async assertRecordedVaccineTable(
    vaccineName: string,
    scheduleOption: string,
    date: string,
    count: number,
    given: boolean,
    givenBy?: string,
  ) {
    //The date field in this table uses the MM/DD/YYYY format immediately after creation so that's why this format is used here
    const formattedDate = convertDateFormat(date);

    const correctVaccineFound = await this.searchSpecificTableRowForMatch(
      vaccineName,
      'vaccineDisplayName',
      count,
      vaccineName,
      scheduleOption,
    );

    if (!correctVaccineFound) {
      throw new Error(`Vaccine "${vaccineName}" not found in the recorded vaccines table`);
    }

    const correctScheduleOptionFound = await this.searchSpecificTableRowForMatch(
      scheduleOption,
      'schedule',
      count,
      vaccineName,
      scheduleOption,
    );

    if (!correctScheduleOptionFound) {
      throw new Error(
        `Schedule option "${scheduleOption}" not found in the recorded vaccines table`,
      );
    }

    const correctDateFound = await this.searchSpecificTableRowForMatch(
      formattedDate,
      'date',
      count,
      vaccineName,
      scheduleOption,
    );

    if (!correctDateFound) {
      throw new Error(`Date "${formattedDate}" not found in the recorded vaccines table`);
    }

    const correctGivenByFound = await this.searchSpecificTableRowForMatch(
      given ? givenBy || 'Unknown' : 'Not given',
      'givenBy',
      count,
      vaccineName,
      scheduleOption,
    );
    if (!correctGivenByFound) {
      const expectedValue = given ? givenBy || 'Unknown' : 'Not given';
      throw new Error(`Given by "${expectedValue}" not found in the recorded vaccines table`);
    }

    const correctDisplayLocationFound = await this.searchSpecificTableRowForMatch(
      'facility-1',
      'displayLocation',
      count,
      vaccineName,
      scheduleOption,
    );
    if (!correctDisplayLocationFound) {
      throw new Error('Display location "facility-1" not found in the recorded vaccines table');
    }
  }

  /**
   * Searches the recorded vaccine table and asserts the values for each vaccine are correct
   * @param valueToMatch - The value to match in the table, e.g. asserting the correct date is displayed
   * @param locatorSuffix - The suffix of the locator to use to find the value in the table
   * @param count - The number of times to run the search
   * @param vaccine - The vaccine name to search for, e.g. "Pentavalent"
   * @param scheduleOption - The schedule option to search for, e.g. "10 weeks"
   * @returns True if the value is found in the table, false otherwise
   */
  async searchSpecificTableRowForMatch(
    valueToMatch: string,
    locatorSuffix: string,
    count: number,
    vaccine: string,
    scheduleOption: string,
  ) {
    const row = await this.findRowNumberForVaccine(vaccine, scheduleOption, count);
    //Search the specific row in the table for the value to match
    const locator = this.recordedVaccinesTableBody.getByTestId(
      `${this.tableRowPrefix}${row}-${locatorSuffix}`,
    );
    const text = await locator.innerText();
    if (text.includes(valueToMatch)) {
      return true;
    }
    return false;
  }

  /**
   * Uses the unique combination of a vaccine name and schedule option to find the unique row in the table to run assertions against
   * @param vaccine - The vaccine name to search for, e.g. "Pentavalent"
   * @param scheduleOption - The schedule option to search for, e.g. "10 weeks"
   * @param count - The number of times to run the search
   * @returns The row number of the unique vaccine name / schedule combo
   */
  async findRowNumberForVaccine(vaccine: string, scheduleOption: string, count: number) {
    let row: number | undefined;
    const timesToRun = count > 1 ? count : 1;

    //Find the row that contains the unique vaccine name / schedule combo and save the row number
    for (let i = 0; i < timesToRun; i++) {
      const locator = this.recordedVaccinesTableBody.getByTestId(
        `${this.tableRowPrefix}${i}-vaccineDisplayName`,
      );
      const text = await locator.innerText();
      if (
        text.includes(vaccine) &&
        (await this.rowScheduleOptionMatchesVaccine(scheduleOption, i))
      ) {
        row = i;
        break;
      }
    }

    if (row === undefined) {
      throw new Error(`Vaccine "${vaccine}" not found in the table`);
    }

    return row;
  }

  /**
   * Checks if the schedule option for a specific row in the recorded vaccines table matches the schedule option given for a specific vaccine
   * @param scheduleOption - The schedule option to search for, e.g. "10 weeks"
   * @param row - The row number to search for, e.g. 0
   * @returns True if the schedule option matches, false otherwise
   */
  async rowScheduleOptionMatchesVaccine(scheduleOption: string, row: number) {
    const locator = this.recordedVaccinesTableBody.getByTestId(
      `${this.tableRowPrefix}${row}-schedule`,
    );

    const text = await locator.innerText();
    if (text.includes(scheduleOption)) {
      return true;
    }
    return false;
  }

  /**
   * Views a vaccine record and asserts the values are correct
   * @param requiredParams - The required parameters when creating a vaccine record
   * @param optionalParams - The optional parameters when creating a vaccine record
   */
  async viewVaccineRecordAndAssert(
    requiredParams: RequiredVaccineModalAssertionParams,
    optionalParams: OptionalVaccineModalAssertionParams,
  ) {
    const { vaccineName, count, fillOptionalFields, schedule } = requiredParams;

    const row = await this.findRowNumberForVaccine(vaccineName, schedule, count);
    const viewButton = this.recordedVaccinesTableBody
      .getByTestId(`${this.tableRowPrefix}${row}-action`)
      .getByRole('button', { name: 'View' });
    const viewVaccineRecordModal = await this.viewVaccineModal(viewButton);

    await viewVaccineRecordModal.assertVaccineModalRequiredFields(requiredParams);

    if (fillOptionalFields) {
      await viewVaccineRecordModal.assertVaccineModalOptionalFields(requiredParams, optionalParams);
    }
  }

  async viewVaccineModal(viewButton: Locator) {
    await viewButton.click();
    if (!this.viewVaccineRecordModal) {
      this.viewVaccineRecordModal = new ViewVaccineRecordModal(this.page);
    }
    await this.viewVaccineRecordModal.waitForModalToOpen();
    return this.viewVaccineRecordModal;
  }
}
