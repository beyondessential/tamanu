import { Page, Locator, expect } from '@playwright/test';

import { selectFieldOption } from '@utils/fieldHelpers';

export class VitalChartsModal {
  readonly page: Page;

  readonly modal: Locator;
  readonly dateRangeSelect: Locator;
  readonly primaryTickLabels: Locator;
  readonly secondaryTickLabels: Locator;

  constructor(page: Page) {
    this.page = page;

    // VitalChartsModal.jsx passes data-testid="modal-uu1i" to <Modal>, but the
    // shared ui-components Modal/BaseModal chain (Modal.jsx, then again in
    // BaseModal.jsx) spreads props onto the next component and then
    // unconditionally overrides data-testid with its own hardcoded literal at
    // each layer, so the caller-supplied id never reaches the DOM. The MUI
    // Dialog root (BaseModal.jsx) ends up with "dialog-g9qi" — the same id on
    // every Modal-based dialog in the app, since it's hardcoded there too.
    this.modal = page.getByTestId('dialog-g9qi');
    this.dateRangeSelect = page.getByTestId('selectinput-i6gc-select');
    // The X-axis tick labels: every tick has a primary (date) line; ranges with
    // a two-line label (24h/48h/7-day) also render a secondary line below it
    // (time or weekday), see CustomisedTick.jsx.
    this.primaryTickLabels = page.getByTestId('text-ch4x');
    this.secondaryTickLabels = page.getByTestId('text-cydx');
  }

  async waitForModalToLoad() {
    await this.modal.waitFor({ state: 'visible' });
    await this.primaryTickLabels.first().waitFor({ state: 'visible' });
  }

  async selectDateRangeOption(optionLabel: string) {
    // Selecting a new range refetches chart data and regenerates ticks. Take the ticks first and
    // wait for them to actually be replaced, rather than racing the old DOM nodes.
    const previousTicks = await this.getPrimaryTickLabels();
    await selectFieldOption(this.page, this.dateRangeSelect, { optionToSelect: optionLabel });
    await expect(this.primaryTickLabels).not.toHaveText(previousTicks);
  }

  async getPrimaryTickLabels(): Promise<string[]> {
    return this.primaryTickLabels.allTextContents();
  }

  async getSecondaryTickLabels(): Promise<string[]> {
    return this.secondaryTickLabels.allTextContents();
  }
}
