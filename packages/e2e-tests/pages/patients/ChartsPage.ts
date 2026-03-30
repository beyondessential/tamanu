import { Locator, Page, expect } from '@playwright/test';
import { ids, TABLE_CELL_PREFIX } from '@ids';
import { fillDateTime } from '@helpers/dates';
import { selectOption } from '@helpers/fields';
import { format, parse } from 'date-fns';

// ---------------------------------------------------------------------------
// Charts Pane
// ---------------------------------------------------------------------------

export class ChartsPane {
  readonly chartTypeSelect: Locator;
  readonly recordButton: Locator;
  readonly tableBody: Locator;

  constructor(readonly page: Page) {
    this.chartTypeSelect = page.getByTestId(ids.chartsPane.chartTypeSelect);
    this.recordButton = page
      .getByTestId(ids.chartsPane.recordButtonRow)
      .getByRole('button', { name: 'Record' });
    this.tableBody = page.getByTestId(ids.table.body);
  }

  async waitForPaneToLoad(): Promise<void> {
    await this.chartTypeSelect.waitFor({ state: 'visible' });
  }

  async selectChartType(type: string): Promise<void> {
    await selectOption(this.page, this.chartTypeSelect, type);
  }

  /**
   * Read the latest column values from the charts table.
   * The chart table has rows = measures, columns = date/time headers.
   */
  async getLatestValues(fieldKeys: readonly string[]): Promise<Record<string, string>> {
    const headers = this.page.locator('[data-testid^="tablelabel-"]');
    const headerCount = await headers.count();
    if (headerCount < 2) throw new Error('No data columns in chart table');

    const lastHeaderTestId = await headers.last().getAttribute('data-testid');
    if (!lastHeaderTestId) throw new Error('Missing header testid');

    const dateTimeColumn = lastHeaderTestId.replace(/^tablelabel-[a-z0-9]+-/, '');
    if (!dateTimeColumn) throw new Error(`Could not extract date/time from header: ${lastHeaderTestId}`);

    const dateTimeFormatted = format(
      parse(dateTimeColumn, 'yyyy-MM-dd HH:mm:ss', new Date()),
      'dd/MM/yyyy hh:mm a',
    );

    const measureRows = this.page.locator('[data-testid^="styledtablecell-2gyy-"]').filter({
      has: this.page.locator(`[data-testid$="-measure"]`),
    });

    const result: Record<string, string> = { dateTime: dateTimeFormatted };

    const allMeasureCells = this.page.locator(
      `[data-testid*="-measure"]`,
    );
    const measureCount = await allMeasureCells.count();

    for (let i = 0; i < measureCount; i++) {
      const measureCell = this.page.getByTestId(`${TABLE_CELL_PREFIX}${i}-measure`);
      const measureName = (await measureCell.textContent())?.trim() || '';

      for (const key of fieldKeys) {
        if (measureName.toLowerCase().includes(key.toLowerCase())) {
          const valueCell = this.page.getByTestId(`${TABLE_CELL_PREFIX}${i}-${dateTimeColumn}`);
          result[key] = (await valueCell.textContent())?.trim() || '';
        }
      }
    }

    return result;
  }
}

// ---------------------------------------------------------------------------
// Simple Chart Modal (e.g. Neurological Observation Chart)
// ---------------------------------------------------------------------------

export interface SimpleChartFormValues {
  dateTime?: string;
  gcsEyeOpening?: string;
  gcsVerbal?: string;
  gcsMotor?: string;
  rightPupilsSize?: string;
  rightPupilsReaction?: string;
  leftPupilsSize?: string;
  leftPupilsReaction?: string;
}

export class SimpleChartModal {
  readonly form: Locator;
  readonly dateTimeInput: Locator;
  readonly gcsEyeOpeningSelect: Locator;
  readonly gcsVerbalSelect: Locator;
  readonly gcsMotorSelect: Locator;
  readonly rightPupilsSizeSelect: Locator;
  readonly rightPupilsReactionSelect: Locator;
  readonly leftPupilsSizeSelect: Locator;
  readonly leftPupilsReactionSelect: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(readonly page: Page) {
    const m = ids.chartModal;
    this.form = page.getByTestId(m.form);
    this.dateTimeInput = this.form.locator('input[type="text"]').first();
    this.confirmButton = page.getByTestId(m.confirmButton);
    this.cancelButton = page.getByTestId(m.cancelButton);

    const selects = page.getByTestId('wrapperfieldcomponent-mkjr-select');
    this.gcsEyeOpeningSelect = selects.nth(0);
    this.gcsVerbalSelect = selects.nth(1);
    this.gcsMotorSelect = selects.nth(2);
    this.rightPupilsSizeSelect = selects.nth(3);
    this.rightPupilsReactionSelect = this.page.getByTestId('multiselectinput-cxdw').nth(0);
    this.leftPupilsSizeSelect = selects.nth(4);
    this.leftPupilsReactionSelect = this.page.getByTestId('multiselectinput-cxdw').nth(1);
  }

  async waitForOpen(): Promise<void> {
    await this.form.waitFor({ state: 'visible' });
  }

  async fillForm(values: SimpleChartFormValues): Promise<Record<string, string | undefined>> {
    const result: Record<string, string | undefined> = {};

    if (values.dateTime) {
      await fillDateTime(this.dateTimeInput, values.dateTime);
    }
    if (values.gcsEyeOpening) {
      result.gcsEyeOpening = await selectOption(this.page, this.gcsEyeOpeningSelect, values.gcsEyeOpening);
    }
    if (values.gcsVerbal) {
      result.gcsVerbal = await selectOption(this.page, this.gcsVerbalSelect, values.gcsVerbal);
    }
    if (values.gcsMotor) {
      result.gcsMotor = await selectOption(this.page, this.gcsMotorSelect, values.gcsMotor);
    }
    if (values.rightPupilsSize) {
      result.rightPupilsSize = await selectOption(this.page, this.rightPupilsSizeSelect, values.rightPupilsSize);
    }
    if (values.leftPupilsSize) {
      result.leftPupilsSize = await selectOption(this.page, this.leftPupilsSizeSelect, values.leftPupilsSize);
    }

    return result;
  }

  async submit(): Promise<void> {
    await this.confirmButton.click();
  }
}
