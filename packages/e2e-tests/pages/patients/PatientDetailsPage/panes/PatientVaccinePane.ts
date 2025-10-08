import { Locator, Page, expect } from '@playwright/test';
import { BasePatientPane } from './BasePatientPane';
import { RecordVaccineModal } from '../modals/RecordVaccineModal';
import {
  convertDateFormat,
  compareAlphabetically,
  compareByDate,
} from '../../../../utils/testHelper';
import { ViewVaccineModal } from '../modals/ViewVaccineModal';
import { EditVaccineModal } from '../modals/EditVaccineModal';
import { Vaccine } from 'types/vaccine/Vaccine';
import { DeleteVaccineModal } from '../modals/DeleteVaccineModal';

export class PatientVaccinePane extends BasePatientPane {
  readonly recordVaccineButton: Locator;
  readonly recordedVaccinesTable: Locator;
  readonly recordedVaccinesTableLoadingIndicator: Locator;
  readonly recordedVaccinesTablePaginator: Locator;
  recordVaccineModal?: RecordVaccineModal;
  viewVaccineModal?: ViewVaccineModal;
  editVaccineModal?: EditVaccineModal;
  deleteVaccineModal?: DeleteVaccineModal;
  readonly recordedVaccinesTableWrapper: Locator;
  readonly scheduledVaccinesTableWrapper: Locator;
  readonly vaccineNotGivenCheckbox: Locator;
  readonly vaccineTableRowPrefix: string;
  readonly dateFieldForSingleVaccine: Locator;
  readonly vaccineKebabMenuTestId: string;
  readonly editVaccineOption: Locator;
  readonly deleteVaccineOption: Locator;
  readonly closeModalButton: Locator;
  readonly vaccineColumnHeader: Locator;
  readonly dateColumnHeader: Locator;
  readonly scheduledVaccinesTableBody: Locator;
  readonly finalScheduledVaccine: Locator;
  readonly scheduledVaccinesTableSearchLimit = 20;
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
    this.recordedVaccinesTableWrapper = this.page.getByTestId('immunisationstable-q9jd');
    this.scheduledVaccinesTableWrapper = this.page.getByTestId('tablewrapper-rbs7');
    this.vaccineNotGivenCheckbox = this.page.getByTestId('notgivencheckbox-mz3p-controlcheck');
    this.vaccineTableRowPrefix = `styledtablecell-2gyy-`;
    this.dateFieldForSingleVaccine = this.page.getByTestId('styledtablecell-2gyy-0-date');
    this.vaccineKebabMenuTestId = 'openbutton-d1ec';
    this.editVaccineOption = this.page.getByTestId('item-8ybn-0');
    this.deleteVaccineOption = this.page.getByTestId('item-8ybn-1');
    this.closeModalButton = this.page.getByTestId('iconbutton-eull');
    this.vaccineColumnHeader = this.page.getByTestId('tablesortlabel-0qxx-vaccineDisplayName');
    this.dateColumnHeader = this.page.getByTestId('tablesortlabel-0qxx-date');
    this.scheduledVaccinesTableBody = this.page
      .getByTestId('tablewrapper-rbs7')
      .getByTestId('styledtablebody-a0jz');
    this.finalScheduledVaccine = this.page.getByTestId('styledtablecell-2gyy-18-vaccine');
  }

  async clickRecordVaccineButton(): Promise<RecordVaccineModal> {
    await this.recordVaccineButton.click();
    if (!this.recordVaccineModal) {
      this.recordVaccineModal = new RecordVaccineModal(this.page);
    }

    return this.recordVaccineModal;
  }

  async clickEditVaccineButton(vaccine: Partial<Vaccine>) {
    await this.openVaccineKebabMenu(vaccine);
    await this.editVaccineOption.click();
    if (!this.editVaccineModal) {
      this.editVaccineModal = new EditVaccineModal(this.page);
    }

    return this.editVaccineModal;
  }

  async openVaccineKebabMenu(vaccine: Partial<Vaccine>) {
    const { vaccineName, count, scheduleOption } = vaccine;

    if (!vaccineName || count === undefined || !scheduleOption) {
      throw new Error('Missing required vaccine fields');
    }

    const row = await this.findRowNumberForVaccine(
      this.recordedVaccinesTableWrapper,
      vaccineName,
      scheduleOption,
      this.vaccineTableRowPrefix,
      'vaccineDisplayName',
      count,
    );
    const vaccineKebabMenu = this.recordedVaccinesTableWrapper
      .getByTestId(`${this.vaccineTableRowPrefix}${row}-action`)
      .getByTestId(this.vaccineKebabMenuTestId);
    await vaccineKebabMenu.click();
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
   * @param vaccine - A partial vaccine object containing the fields to assert against
   */
  async assertRecordedVaccineTable(vaccine: Partial<Vaccine>) {
    const {
      vaccineName,
      scheduleOption,
      dateGiven,
      count,
      given,
      givenBy,
      givenElsewhereReason,
      givenElsewhereCountry,
    } = vaccine;
    const recordedVaccinesTable = 'recordedVaccines';

    if (!vaccineName || count === undefined || !scheduleOption) {
      throw new Error('Missing required vaccine fields');
    }

    const correctVaccineFound = await this.searchSpecificTableRowForMatch(
      recordedVaccinesTable,
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
      recordedVaccinesTable,
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

    const dateValue = dateGiven ? convertDateFormat(dateGiven) : 'Unknown';

    const correctDateFound = await this.searchSpecificTableRowForMatch(
      recordedVaccinesTable,
      dateValue,
      'date',
      count,
      vaccineName,
      scheduleOption,
    );

    if (!correctDateFound) {
      throw new Error(`Date "${dateValue}" not found in the recorded vaccines table`);
    }

    const givenByValue = givenElsewhereReason ? 'Given elsewhere' : 'Unknown';

    const correctGivenByFound = await this.searchSpecificTableRowForMatch(
      recordedVaccinesTable,
      given ? givenBy || givenByValue : 'Not given',
      'givenBy',
      count,
      vaccineName,
      scheduleOption,
    );
    if (!correctGivenByFound) {
      const expectedValue = given ? givenBy || givenByValue : 'Not given';
      throw new Error(`Given by "${expectedValue}" not found in the recorded vaccines table`);
    }

    const displayLocationValue = givenElsewhereReason ? givenElsewhereCountry : 'facility-1';
    if (!displayLocationValue) {
      throw new Error(
        'Display location value is not defined - likely the country was not selected',
      );
    }

    const correctDisplayLocationFound = await this.searchSpecificTableRowForMatch(
      recordedVaccinesTable,
      displayLocationValue,
      'displayLocation',
      count,
      vaccineName,
      scheduleOption,
    );
    if (!correctDisplayLocationFound) {
      throw new Error(
        `Display location "${displayLocationValue}" not found in the recorded vaccines table`,
      );
    }
  }

  /**
   * Asserts the values for a specific vaccine in the scheduled vaccines table are correct
   * @param vaccine - The vaccine name to search for, e.g. "Pentavalent"
   * @param schedule - The schedule option to search for, e.g. "10 weeks"
   * @param expectedDueDate - The expected due date of the vaccine, e.g. "2025-01-01"
   * @param status - The status of the vaccine, e.g. "Due", "Scheduled", "Overdue", "Upcoming"
   */
  async assertScheduledVaccinesTable(
    vaccine: string,
    schedule: string,
    expectedDueDate: string,
    status: string,
  ) {
    const rowsToSearch = this.scheduledVaccinesTableSearchLimit;
    const scheduledVaccinesTable = 'scheduledVaccines';
    const expectedDueDateFormatted = `Week of ${expectedDueDate}`;

    // Define the assertions to check in the scheduled vaccines table
    const assertions = [
      { value: vaccine, locatorSuffix: 'vaccine', errorPrefix: `Vaccine "${vaccine}"` },
      { value: schedule, locatorSuffix: 'schedule', errorPrefix: `Schedule option "${schedule}"` },
      {
        value: expectedDueDateFormatted,
        locatorSuffix: 'dueDate',
        errorPrefix: `Due date "${expectedDueDate}"`,
      },
      { value: status, locatorSuffix: 'status', errorPrefix: `Status "${status}"` },
    ];

    // Check each assertion
    for (const assertion of assertions) {
      const found = await this.searchSpecificTableRowForMatch(
        scheduledVaccinesTable,
        assertion.value,
        assertion.locatorSuffix,
        rowsToSearch,
        vaccine,
        schedule,
      );

      if (!found) {
        throw new Error(
          `${assertion.errorPrefix} not found in the scheduled vaccines table for the specified vaccine`,
        );
      }
    }
  }

  /**
   * Records a scheduled vaccine
   * @param vaccine - The vaccine name you want to record, e.g. "Pentavalent"
   * @param schedule - The schedule option for the vaccine you want to record, e.g. "10 weeks"
   * @returns The RecordVaccineModal instance
   */
  async recordScheduledVaccine(vaccine: string, schedule: string) {
    const rowsToSearch = this.scheduledVaccinesTableSearchLimit;

    const row = await this.findRowNumberForVaccine(
      this.scheduledVaccinesTableWrapper,
      vaccine,
      schedule,
      this.vaccineTableRowPrefix,
      'vaccine',
      rowsToSearch,
    );

    const rowTestId = `styledtablecell-2gyy-${row}-action`;
    const recordButton = this.page.getByTestId(rowTestId).getByRole('button', { name: 'Record' });

    await recordButton.click();

    if (!this.recordVaccineModal) {
      this.recordVaccineModal = new RecordVaccineModal(this.page);
    }
    return this.recordVaccineModal;
  }

  /**
   * Confirms that a scheduled vaccine no longer exists in the scheduled vaccines table
   * @param vaccine - The vaccine name to search for, e.g. "Pentavalent"
   * @param schedule - The schedule option to search for, e.g. "10 weeks"
   * @returns True if the vaccine does not exist in the scheduled vaccines table, throws custom error if found
   */
  async confirmScheduledVaccineDoesNotExist(vaccine: string, schedule: string) {
    const rowsToSearch = this.scheduledVaccinesTableSearchLimit;
    const returnFalseIfNotFound = true;
    const rowFound = await this.findRowNumberForVaccine(
      this.scheduledVaccinesTableWrapper,
      vaccine,
      schedule,
      this.vaccineTableRowPrefix,
      'vaccine',
      rowsToSearch,
      returnFalseIfNotFound,
    );

    if (rowFound) {
      throw new Error(
        `Vaccine "${vaccine}" with schedule "${schedule}" still exists in the scheduled vaccines table`,
      );
    } else {
      return true;
    }
  }

  /**
   * Searches the recorded vaccine table and asserts the values for each vaccine are correct
   * @param table - The table to search, e.g. "recordedVaccines" or "scheduledVaccines"
   * @param valueToMatch - The value to match in the table, e.g. asserting the correct date is displayed
   * @param locatorSuffix - The suffix of the locator to use to find the value in the table
   * @param count - The number of times to run the search
   * @param vaccine - The vaccine name to search for, e.g. "Pentavalent" (only used for scheduled vaccines)
   * @param scheduleOption - The schedule option to search for, e.g. "10 weeks" (only used for scheduled vaccines)
   * @returns True if the value is found in the table, false otherwise
   */
  async searchSpecificTableRowForMatch(
    table: 'recordedVaccines' | 'scheduledVaccines',
    valueToMatch: string,
    locatorSuffix: string,
    count: number,
    vaccine: string,
    scheduleOption: string,
  ) {
    let tableLocator: Locator;
    let tableFirstColumnPrefix: string;

    if (table === 'recordedVaccines') {
      tableLocator = this.recordedVaccinesTableWrapper;
      tableFirstColumnPrefix = 'vaccineDisplayName';
    } else if (table === 'scheduledVaccines') {
      tableLocator = this.scheduledVaccinesTableWrapper;
      tableFirstColumnPrefix = 'vaccine';
    } else {
      throw new Error('Invalid table type');
    }

    const row = await this.findRowNumberForVaccine(
      tableLocator,
      vaccine,
      scheduleOption,
      this.vaccineTableRowPrefix,
      tableFirstColumnPrefix,
      count,
    );
    //Search the specific row in the table for the value to match
    const locator = tableLocator.getByTestId(
      `${this.vaccineTableRowPrefix}${row}-${locatorSuffix}`,
    );
    const text = await locator.innerText();
    if (text.includes(valueToMatch)) {
      return true;
    }
    return false;
  }

  /**
   * Uses the unique combination of a vaccine name and schedule option to find the unique row in the table to run assertions against
   * @param table - The locator of the table to search, e.g. "recordedVaccines" or "scheduledVaccines"
   * @param vaccine - The vaccine name to search for, e.g. "Pentavalent"
   * @param scheduleOption - The schedule option to search for, e.g. "10 weeks"
   * @param locatorPrefix - The prefix of the locator to use to find the value in the table
   * @param locatorSuffix - The suffix of the locator to use to find the value in the table
   * @param count - The number of times to run the search
   * @returns The row number of the unique vaccine name / schedule combo
   */
  async findRowNumberForVaccine(
    table: Locator,
    vaccine: string,
    scheduleOption: string,
    locatorPrefix: string,
    locatorSuffix: string,
    count: number,
    returnFalseIfNotFound?: boolean,
  ) {
    let row: number | undefined;
    const timesToRun = count > 1 ? count : 1;
    const firstRow = table.getByTestId(`${locatorPrefix}0-${locatorSuffix}`);
    await firstRow.waitFor({ state: 'visible' });

    //Find the row that contains the unique vaccine name / schedule combo and save the row number
    for (let i = 0; i < timesToRun; i++) {
      const locator = table.getByTestId(`${locatorPrefix}${i}-${locatorSuffix}`);

      //Check if the locator is visible and skip iteration if it's not
      const isVisible = await locator.isVisible();
      if (!isVisible) {
        continue;
      }

      const text = await locator.innerText();
      if (
        text.includes(vaccine) &&
        (await this.rowScheduleOptionMatchesVaccine(table, scheduleOption, locatorPrefix, i))
      ) {
        row = i;
        break;
      }
    }

    if (row === undefined) {
      if (returnFalseIfNotFound) {
        return false;
      }
      throw new Error(`Vaccine "${vaccine}" not found in the table`);
    }

    return row;
  }

  /**
   * Checks if the schedule option for a specific row in the recorded vaccines table matches the schedule option given for a specific vaccine
   * @param table - The locator of the table to search, e.g. "recordedVaccines" or "scheduledVaccines"
   * @param scheduleOption - The schedule option to search for, e.g. "10 weeks"
   * @param locatorPrefix - The prefix of the locator to use to find the value in the table
   * @param row - The row number to search for, e.g. 0
   * @returns True if the schedule option matches, false otherwise
   */
  async rowScheduleOptionMatchesVaccine(
    table: Locator,
    scheduleOption: string,
    locatorPrefix: string,
    row: number,
  ) {
    const locator = table.getByTestId(`${locatorPrefix}${row}-schedule`);

    const text = await locator.innerText();
    if (text.includes(scheduleOption)) {
      return true;
    }
    return false;
  }

  /**
   * Views a vaccine record and asserts the values are correct
   * @param vaccine - Takes a vaccine object and extracts the relevant fields to run assertions against
   */
  async viewVaccineRecordAndAssert(vaccine: Partial<Vaccine>) {
    const { vaccineName, count, fillOptionalFields, scheduleOption } = vaccine;

    if (!vaccineName || count === undefined || !scheduleOption) {
      throw new Error('Missing required vaccine fields');
    }

    const row = await this.findRowNumberForVaccine(
      this.recordedVaccinesTableWrapper,
      vaccineName,
      scheduleOption,
      this.vaccineTableRowPrefix,
      'vaccineDisplayName',
      count,
    );
    const viewButton = this.recordedVaccinesTableWrapper
      .getByTestId(`${this.vaccineTableRowPrefix}${row}-action`)
      .getByRole('button', { name: 'View' });
    const viewVaccineModal = await this.openViewVaccineModal(viewButton);

    await viewVaccineModal.assertVaccineModalRequiredFields(vaccine);

    if (fillOptionalFields) {
      await viewVaccineModal.assertVaccineModalOptionalFields(vaccine);
    }

    await this.closeModalButton.click();
  }

  async openViewVaccineModal(viewButton: Locator) {
    await viewButton.click();
    if (!this.viewVaccineModal) {
      this.viewVaccineModal = new ViewVaccineModal(this.page);
    }
    await this.viewVaccineModal.waitForModalToOpen();
    return this.viewVaccineModal;
  }

  async deleteVaccine(vaccine: Partial<Vaccine>) {
    await this.openVaccineKebabMenu(vaccine);
    await this.deleteVaccineOption.isVisible();
    await this.deleteVaccineOption.click();

    if (!this.deleteVaccineModal) {
      this.deleteVaccineModal = new DeleteVaccineModal(this.page);
    }

    await expect(this.deleteVaccineModal.modalTitle).toContainText('Delete vaccination record');
    await expect(this.deleteVaccineModal.modalContent).toContainText(
      'WARNING: This action is irreversible!',
    );
    await this.deleteVaccineModal.confirmButton.click();
    //Confirm the modal is closed before progressing
    await expect(this.deleteVaccineModal.modalTitle).not.toBeVisible();
  }

  /**
   * Asserts the order of the vaccines in the table is correct
   * @param vaccines - An array of vaccines to assert the order of, each vaccine includes properties like vaccineName, dateGiven etc
   * @param sortBy - The column to sort by, e.g. "vaccine" or "date"
   * @param order - The order to sort by, e.g. "asc" or "desc"
   */

  async assertVaccineOrder(
    vaccines: Partial<Vaccine>[],
    sortBy: 'vaccine' | 'date',
    order: 'asc' | 'desc',
  ) {
    let sortedVaccineNames: string[] = [];

    if (sortBy === 'vaccine') {
      const filteredVaccineNames = vaccines
        .map(vaccine => vaccine.vaccineName)
        .filter((name): name is string => name !== undefined);
      sortedVaccineNames = [...filteredVaccineNames].sort(compareAlphabetically(order));
    } else if (sortBy === 'date') {
      sortedVaccineNames = vaccines
        .filter(
          (vaccine): vaccine is Vaccine =>
            vaccine.vaccineName !== undefined && vaccine.dateGiven !== undefined,
        )
        .sort(compareByDate(order))
        .map(vaccine => vaccine.vaccineName);
    }

    if (sortedVaccineNames.length === 0) {
      throw new Error('Test data has not been sorted correctly');
    }

    //Iterate through the table and assert each row is in the correct order
    for (let i = 0; i < sortedVaccineNames.length; i++) {
      const sortedVaccineName = sortedVaccineNames[i];
      const row = this.recordedVaccinesTableWrapper.getByTestId(
        `${this.vaccineTableRowPrefix}${i}-vaccineDisplayName`,
      );
      await expect(row, `Vaccine ${sortedVaccineName} is not in the correct order`).toContainText(
        sortedVaccineName,
      );
    }
  }
}
