import { Page, Locator } from '@playwright/test';

export abstract class BaseChangeLogModal {
  readonly page: Page;
  readonly closeButton!: Locator;
  readonly noteTypeLabel!: Locator;
  readonly changeLogInfoWrappers!: Locator;
  readonly changelogInfoDates!: Locator;
  readonly changelogTextContents!: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // TestId mapping for BaseChangeLogModal elements
    const testIds = {
      closeButton: 'iconbutton-eull',
      changeLogInfoWrappers: 'stylednotechangeloginfowrapper-zbh3',
    } as const;

    // Create locators using the testId mapping
    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }
    
    // Special cases that need additional processing
    this.noteTypeLabel = page.getByTestId('cardbody-3iyj').getByTestId('cardcell-8efu').first().getByTestId('cardvalue-lcni');
    this.changelogInfoDates = this.changeLogInfoWrappers.getByTestId('tooltip-b4e8');
    this.changelogTextContents = this.page.getByRole('dialog').getByTestId('stylednotechangeloginfowrapper-zbh3').locator('+ span');
  }

  async waitForModalToLoad() {
    await this.noteTypeLabel.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async waitForModalToClose() {
    await this.closeButton.waitFor({ state: 'detached' });
  }
}
