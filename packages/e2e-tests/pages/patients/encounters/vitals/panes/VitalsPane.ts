import { Locator, Page, expect } from '@playwright/test';
import { BasePatientPage } from '../../../BasePatientPage';
import { RecordVitalsModal } from '../modals/RecordVitalsModal';
import { Vitals } from '../../../../../types/vitals/Vitals';
import { format } from 'date-fns';

export class VitalsPane extends BasePatientPage {
  readonly recordVitalsButton: Locator;
  recordVitalsModal?: RecordVitalsModal;
  constructor(page: Page) {
    super(page);
    this.recordVitalsButton = this.page.getByTestId('button-mk5r');
  }

  async clickRecordVitalsButton() {
    await this.recordVitalsButton.click();
    if (!this.recordVitalsModal) {
      this.recordVitalsModal = new RecordVitalsModal(this.page);
    }
    return this.recordVitalsModal;
  }

  //TODO: delete below
  //format of locator: getByTestId('styledtablecell-2gyy-0-2025-09-11 13:13:58').getByTestId('limitedlinescellwrapper-imvw')
  //format of cell locator: getByTestId('styledtablecell-2gyy-0-2025-09-11 13:29:44')
  async assertVitals(vitals: Vitals) {
    const { date } = vitals;
    /*
    THE BELOW WORKS BUT IT WON"T WORK IF THERE ARE MULTIPLE COLUMNS WITH THE SAME DATE
    if (date) {
      const locator = await this.buildLocatorBasedOnDate(date);
      await expect(this.page.locator(`[data-testid*="${locator}"]`)).toBeVisible();
    }
    */
    if (date) {
      const locator = await this.buildLocatorBasedOnDate(date);
      await expect(this.page.locator(`[data-testid*="${locator}"]`)).toBeVisible();
    }
  }

  async buildLocatorBasedOnDate(date: string) {
    // use 'date-fns' to format the date 2025-09-11T13:13 to 2025-09-11 13:13
    const formattedDate = format(new Date(date), 'yyyy-MM-dd HH:mm');
    console.log('formattedDate', formattedDate);
    return `styledtablecell-2gyy-0-${formattedDate}`;
  }
}
