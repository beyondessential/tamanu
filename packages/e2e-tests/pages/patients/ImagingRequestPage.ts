import { Locator, Page, expect } from '@playwright/test';
import { ids, TABLE_CELL_PREFIX } from '@ids';
import { DataTable } from '@components/DataTable';
import { fillDateTime, expectRecentDateTime } from '@helpers/dates';
import { selectOption, selectAutocomplete } from '@helpers/fields';

// ---------------------------------------------------------------------------
// Imaging Request Pane
// ---------------------------------------------------------------------------

export class ImagingRequestPane {
  readonly table: DataTable;
  readonly newImagingRequestButton: Locator;

  constructor(readonly page: Page) {
    this.table = new DataTable(page);
    this.newImagingRequestButton = page.getByTestId(ids.imagingPane.newButton);
  }

  async waitForTableToLoad(): Promise<void> {
    await this.table.waitForTable();
  }
}

// ---------------------------------------------------------------------------
// New Imaging Request Modal
// ---------------------------------------------------------------------------

export interface ImagingRequestFormValues {
  orderDateTime?: string;
  imagingType?: string;
  areaToBeImaged?: string;
  priority?: string;
  noteText?: string;
}

export class NewImagingRequestModal {
  readonly codeInput: Locator;
  readonly orderDateTimeInput: Locator;
  readonly supervisingInput: Locator;
  readonly requestingClinicianInput: Locator;
  readonly requestingClinicianClear: Locator;
  readonly imagingTypeSelect: Locator;
  readonly areaInput: Locator;
  readonly prioritySelect: Locator;
  readonly noteInput: Locator;
  readonly cancelButton: Locator;
  readonly submitButton: Locator;
  readonly formGrid: Locator;
  readonly areasMultiSelect: Locator;

  constructor(readonly page: Page) {
    const m = ids.imagingModal;
    this.codeInput = page.getByTestId(m.codeInput).locator('input');
    this.orderDateTimeInput = page.getByTestId(m.orderDateTimeField).locator('input');
    this.supervisingInput = page.getByTestId(m.supervisingInput).locator('input');
    this.requestingClinicianInput = page.getByTestId(m.requestingClinicianInput).locator('input');
    this.requestingClinicianClear = page.getByTestId(m.requestingClinicianClear);
    this.imagingTypeSelect = page.getByTestId(m.imagingTypeSelect);
    this.areaInput = page.getByTestId(m.areaInput).locator('input');
    this.prioritySelect = page.getByTestId(m.prioritySelect);
    this.noteInput = page.getByTestId(m.noteInput).locator('input');
    this.cancelButton = page.getByTestId(m.cancelButton);
    this.submitButton = page.getByTestId(m.submitButton);
    this.formGrid = page.getByTestId(m.formGrid);
    this.areasMultiSelect = page.getByTestId(m.areasMultiSelect);
  }

  async waitForModalToLoad(): Promise<void> {
    await this.formGrid.waitFor({ state: 'visible' });
  }

  async fillForm(values: ImagingRequestFormValues): Promise<Record<string, string>> {
    const filled: Record<string, string> = {};

    if (values.orderDateTime) {
      await fillDateTime(this.orderDateTimeInput, values.orderDateTime);
      filled.orderDateTime = values.orderDateTime;
    }

    if (values.imagingType) {
      await selectOption(this.page, this.imagingTypeSelect, values.imagingType);
      filled.imagingType = values.imagingType;
    } else {
      filled.imagingType = await selectOption(this.page, this.imagingTypeSelect);
    }

    if (values.areaToBeImaged) {
      await this.areaInput.fill(values.areaToBeImaged);
      filled.area = values.areaToBeImaged;
    }

    if (values.priority) {
      await selectOption(this.page, this.prioritySelect, values.priority);
      filled.priority = values.priority;
    }

    if (values.noteText) {
      await this.noteInput.fill(values.noteText);
      filled.note = values.noteText;
    }

    return filled;
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
