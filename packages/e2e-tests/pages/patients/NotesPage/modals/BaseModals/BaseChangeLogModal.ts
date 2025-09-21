import { Page, Locator } from '@playwright/test';

export abstract class BaseChangeLogModal {
  readonly page: Page;
  readonly modalContainer: Locator;
  readonly closeButton: Locator;
  readonly noteTypeLabel: Locator;
  readonly changeLogItems: Locator;
  readonly changeLogInfoWrappers: Locator;
  readonly changelogInfoDates: Locator;
  readonly changelogTextContents: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Common modal elements
    this.modalContainer = page.getByTestId('modalcontainer-uc2n');
    this.closeButton = page.getByTestId('iconbutton-eull');
    this.noteTypeLabel = page.getByTestId('cardbody-3iyj').getByTestId('cardcell-8efu').first().getByTestId('cardvalue-lcni');
    
    // Common change log elements
    this.changeLogItems = page.getByTestId('listitem-bgup');
    this.changeLogInfoWrappers = page.getByTestId('stylednotechangeloginfowrapper-zbh3');
    this.changelogInfoDates = this.changeLogInfoWrappers.getByTestId('tooltip-b4e8');
    this.changelogTextContents = this.changeLogInfoWrappers.locator('+ span');
  }

  async waitForModalToLoad() {
    await this.modalContainer.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async waitForModalToClose() {
    await this.modalContainer.waitFor({ state: 'detached' });
  }
}
