import { Locator, Page, expect } from '@playwright/test';

/**
 * The encounter "Invoicing" tab pane. Auto-added fees (encounter fee, ED fee, bed fee) render as
 * invoice item lines here, so this pane guards the display layer where the encounter/bed-fee bugs
 * surfaced.
 */
export class InvoicePane {
  readonly page: Page;
  readonly pane: Locator;
  readonly invoiceTotal: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pane = this.page.getByTestId('encounterinvoicingpane-sci0');
    this.invoiceTotal = this.page.getByTestId('invoice-summary-invoiceTotal');
  }

  async waitForLoad(): Promise<void> {
    await this.pane.waitFor({ state: 'visible' });
  }

  // Fee lines are shown by product name; there is no per-row testid, so match on the visible name.
  itemByName(name: string | RegExp): Locator {
    return this.pane.getByText(name).first();
  }

  async expectItemVisible(name: string | RegExp): Promise<void> {
    await expect(this.itemByName(name)).toBeVisible();
  }
}
