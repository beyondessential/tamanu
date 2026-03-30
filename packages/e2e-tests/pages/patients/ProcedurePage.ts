import { Locator, Page } from '@playwright/test';
import { ids } from '@ids';
import { DataTable } from '@components/DataTable';
import { fillTime } from '@helpers/dates';
import { selectAutocomplete } from '@helpers/fields';
import { formatForMuiTimePicker } from '@utils/testHelper';

// ---------------------------------------------------------------------------
// Procedure Pane
// ---------------------------------------------------------------------------

export class ProcedurePane {
  readonly page: Page;
  readonly table: DataTable;
  readonly tabPane: Locator;
  readonly newProcedureButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.table = new DataTable(page);
    this.tabPane = page.getByTestId(ids.procedurePane.tabPane);
    this.newProcedureButton = this.tabPane.getByRole('button', { name: 'New procedure' });
  }

  async waitForPaneToLoad(): Promise<void> {
    await this.tabPane.waitFor({ state: 'visible' });
  }

  cell(row: number, column: string): Locator {
    return this.table.cell(row, column);
  }

  async waitForTableToLoad(): Promise<void> {
    await this.table.pagination.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }
}

export type ProcedureRequiredData = {
  procedure: string;
  area: string;
  location: string;
};

export type ProcedureFullData = ProcedureRequiredData & {
  department: string;
  anaesthetist: string;
  assistantAnaesthetist: string;
  anaestheticType: string;
  timeIn: string;
  timeOut: string;
  timeStarted: string;
  timeEnded: string;
  notes: string;
  completedNotes: string;
};

// ---------------------------------------------------------------------------
// New Procedure Modal
// ---------------------------------------------------------------------------

export class NewProcedureModal {
  readonly procedureInput: Locator;
  readonly procedureDateInput: Locator;
  readonly procedureAreaInput: Locator;
  readonly procedureLocationInput: Locator;
  readonly leadClinicianInput: Locator;
  readonly departmentInput: Locator;
  readonly anaesthetistInput: Locator;
  readonly assistantAnaesthetistInput: Locator;
  readonly anaestheticTypeInput: Locator;
  readonly timeInInput: Locator;
  readonly timeOutInput: Locator;
  readonly timeStartedInput: Locator;
  readonly timeEndedInput: Locator;
  readonly notesInput: Locator;
  readonly completedNotesInput: Locator;
  readonly completedCheckbox: Locator;
  readonly saveProcedureButton: Locator;
  readonly cancelButton: Locator;
  readonly title: Locator;

  readonly page: Page;
  private unsavedChangesModal?: UnsavedChangesModal;

  constructor(page: Page) {
    this.page = page;
    const m = ids.procedureModal;
    this.procedureInput = page.getByTestId(m.procedureInput);
    this.procedureDateInput = page.getByTestId(m.procedureDateInput);
    this.procedureAreaInput = page.getByTestId(m.procedureAreaInput);
    this.procedureLocationInput = page.getByTestId(m.procedureLocationInput);
    this.leadClinicianInput = page.getByTestId(m.leadClinicianInput);
    this.departmentInput = page.getByTestId(m.departmentInput);
    this.anaesthetistInput = page.getByTestId(m.anaesthetistInput);
    this.assistantAnaesthetistInput = page.getByTestId(m.assistantAnaesthetistInput);
    this.anaestheticTypeInput = page.getByTestId(m.anaestheticTypeInput);
    this.timeInInput = page.getByTestId(m.timeInInput);
    this.timeOutInput = page.getByTestId(m.timeOutInput);
    this.timeStartedInput = page.getByTestId(m.timeStartedInput);
    this.timeEndedInput = page.getByTestId(m.timeEndedInput);
    this.notesInput = page.getByTestId(m.notesInput).locator('input, textarea').first();
    this.completedNotesInput = page.getByTestId(m.completedNotesInput).locator('input').first();
    this.completedCheckbox = page.getByTestId(m.completedCheckbox);
    this.saveProcedureButton = page
      .getByRole('dialog')
      .getByRole('button', { name: 'Save procedure' });
    this.cancelButton = page.getByRole('dialog').getByRole('button', { name: 'Cancel' });
    this.title = page.getByTestId(m.title);
  }

  getLocatorInput(locator: Locator): Locator {
    return locator.locator('input');
  }

  async waitForModalToLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async waitForModalToClose(): Promise<void> {
    await this.title.waitFor({ state: 'detached' });
  }

  async fillRequiredFields(): Promise<ProcedureRequiredData> {
    const procedure = await selectAutocomplete(this.page, this.procedureInput);
    const area = await selectAutocomplete(this.page, this.procedureAreaInput);
    const location = await selectAutocomplete(this.page, this.procedureLocationInput);
    return { procedure, area, location };
  }

  async fillAllFields(): Promise<ProcedureFullData> {
    const requiredFields = await this.fillRequiredFields();

    const department = await selectAutocomplete(this.page, this.departmentInput);
    const anaesthetist = await selectAutocomplete(this.page, this.anaesthetistInput);
    const assistantAnaesthetist = await selectAutocomplete(
      this.page,
      this.assistantAnaesthetistInput,
    );
    const anaestheticType = await selectAutocomplete(this.page, this.anaestheticTypeInput);

    const timeInRaw = '09:00';
    const timeOutRaw = '10:00';
    const timeStartedRaw = '09:00';
    const timeEndedRaw = '10:00';
    const timeIn = formatForMuiTimePicker(timeInRaw);
    const timeOut = formatForMuiTimePicker(timeOutRaw);
    const timeStarted = formatForMuiTimePicker(timeStartedRaw);
    const timeEnded = formatForMuiTimePicker(timeEndedRaw);

    const notes = 'This is a test note';
    const completedNotes = 'This is a test completed note';

    await fillTime(this.getLocatorInput(this.timeInInput), timeInRaw);
    await fillTime(this.getLocatorInput(this.timeOutInput), timeOutRaw);
    await fillTime(this.getLocatorInput(this.timeStartedInput), timeStartedRaw);
    await fillTime(this.getLocatorInput(this.timeEndedInput), timeEndedRaw);
    await this.notesInput.fill(notes);
    await this.completedCheckbox.check();
    await this.completedNotesInput.fill(completedNotes);

    return {
      ...requiredFields,
      department,
      anaesthetist,
      assistantAnaesthetist,
      anaestheticType,
      timeIn,
      timeOut,
      timeStarted,
      timeEnded,
      notes,
      completedNotes,
    };
  }

  getUnsavedChangesModal(): UnsavedChangesModal {
    if (!this.unsavedChangesModal) {
      this.unsavedChangesModal = new UnsavedChangesModal(this.page);
    }
    return this.unsavedChangesModal;
  }
}

// ---------------------------------------------------------------------------
// Unsaved Changes Modal
// ---------------------------------------------------------------------------

export class UnsavedChangesModal {
  readonly page: Page;
  readonly title: Locator;
  readonly content: Locator;
  readonly discardButton: Locator;
  readonly continueButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    const u = ids.unsavedChanges;
    this.title = page.getByTestId(u.title);
    this.content = page.getByRole('dialog').getByTestId(u.content);
    this.discardButton = page.getByTestId(u.discardButton);
    this.continueButton = page.getByTestId(u.continueButton);
    this.closeButton = page.getByTestId(u.closeButton);
  }

  async waitForModalToLoad(): Promise<void> {
    await this.content.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async waitForModalToClose(): Promise<void> {
    await this.content.waitFor({ state: 'detached' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }
}
