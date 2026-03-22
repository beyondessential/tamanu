import { Locator, Page } from '@playwright/test';
import { format, parse } from 'date-fns';
import { STYLED_TABLE_CELL_PREFIX } from '@utils/testHelper';
import { SimpleChartModal } from '../modals/SimpleChartModal';

export class ChartsPane {
  readonly page: Page;

  readonly recordChartButton!: Locator;
  readonly chartTypeSelect!: Locator;
  private _simpleChartModal?: SimpleChartModal;

  constructor(page: Page) {
    this.page = page;

    const testIds = {
      recordChartButton: 'component-enxe',
      chartTypeSelect: 'styledtranslatedselectfield-vwze-select',
    } as const;

    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }
  }

  async waitForPageToLoad(): Promise<void> {
    await this.chartTypeSelect.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  getSimpleChartModal(): SimpleChartModal {
    if (!this._simpleChartModal) {
      this._simpleChartModal = new SimpleChartModal(this.page);
    }
    return this._simpleChartModal;
  }

  async selectChartType(chartType: string): Promise<void> {
    await this.chartTypeSelect.click();
    await this.page.getByTestId('styledtranslatedselectfield-vwze-optioncontainer').getByText(chartType).click();
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  /**
 * Get the values of the latest charts record
 * @param page - The Playwright page object
 * @param fieldKeys - Array of field keys to retrieve values for
 * @returns A record of the charts values
 */
async getLatestValuesFromChartsTable(page: Page, fieldKeys: readonly string[]): Promise<Record<string, string | string[]>> {
  const values: any = {};
  
  // Get date/time column from header
  const headerTestId = await page.getByTestId(/^tablelabel-/).first().getAttribute('data-testid');
  if (!headerTestId) throw new Error('Could not find table header with date/time column');
  
  const dateTimeColumn = headerTestId.match(/tablelabel-[^-]+-(.+)$/)?.[1];
  if (!dateTimeColumn) throw new Error(`Could not extract date/time from header: ${headerTestId}`);
  
  // Format dateTime
  const dateTimeFormatted = format(parse(dateTimeColumn, 'yyyy-MM-dd HH:mm:ss', new Date()), 'yyyy-MM-dd\'T\'HH:mm');
  
  // Field mappings
  const measureNameMap: Record<string, string> = {
    gcsEyeOpening: 'GCS Eye opening',
    gcsVerbalResponse: 'GCS Verbal response',
    gcsMotorResponse: 'GCS Motor response',
    gcsTotalScore: 'GCS Total score',
    rightPupilsSize: 'Right pupils size (mm)',
    rightPupilsReaction: 'Right pupils reaction',
    leftPupilsSize: 'Left pupils size (mm)',
    leftPupilsReaction: 'Left pupils reaction',
    rightArmLimbMovement: 'Right arm limb movement',
    rightLegLimbMovement: 'Right leg limb movement',
    leftArmLimbMovement: 'Left arm limb movement',
    leftLegLimbMovement: 'Left leg limb movement',
    comments: 'Comments',
  };
  
  const multiSelectFields = new Set(['rightArmLimbMovement', 'rightLegLimbMovement', 'leftArmLimbMovement', 'leftLegLimbMovement']);
  
  // Process each field
  for (const fieldKey of fieldKeys) {
    if (fieldKey === 'dateTime') {
      values.dateTime = dateTimeFormatted;
      continue;
    }
    
    const measureName = measureNameMap[fieldKey];
    if (!measureName) continue;
    
    // Find measure cell and extract row index
    const measureCell = page.getByTestId(new RegExp(`^${STYLED_TABLE_CELL_PREFIX}\\d+-measure$`)).filter({ hasText: measureName }).first();
    const testId = await measureCell.getAttribute('data-testid').catch(() => null);
    const rowIndex = testId?.match(new RegExp(`^${STYLED_TABLE_CELL_PREFIX}(\\d+)-measure$`))?.[1];
    
    if (!rowIndex) {
      values[fieldKey] = multiSelectFields.has(fieldKey) ? [] : '';
      continue;
    }
    
    // Get value and normalize
    const text = await page.getByTestId(`${STYLED_TABLE_CELL_PREFIX}${rowIndex}-${dateTimeColumn}`).textContent().catch(() => '') || '';
    const normalizedValue = text.trim().replace(/^—$/, '').trim();
    
    values[fieldKey] = multiSelectFields.has(fieldKey) ? (normalizedValue ? [normalizedValue] : []) : normalizedValue;
  }
  
  return values;
}
}

