import { Page, Locator } from '@playwright/test';
import { assignTestIdLocators } from '@utils/locatorFactory';
import { waitForModalOpen, waitForModalClose } from '@utils/dialogHelpers';

export abstract class BaseChangeLogModal {
  readonly page: Page;
  readonly closeButton!: Locator;
  readonly noteTypeLabel!: Locator;
  readonly changeLogInfoWrappers!: Locator;
  readonly changelogInfoDates!: Locator;
  readonly changelogTextContents!: Locator;

  constructor(page: Page) {
    this.page = page;

    assignTestIdLocators(this, page, {
      closeButton: 'iconbutton-eull',
      changeLogInfoWrappers: 'stylednotechangeloginfowrapper-zbh3',
    });

    this.noteTypeLabel = page.getByTestId('cardbody-3iyj').getByTestId('cardcell-8efu').first().getByTestId('cardvalue-lcni');
    this.changelogInfoDates = this.changeLogInfoWrappers.getByTestId('datedisplay-o9yj');
    this.changelogTextContents = this.page.getByRole('dialog').getByTestId('stylednotechangeloginfowrapper-zbh3').locator('+ span');
  }

  async waitForModalToLoad() {
    await waitForModalOpen(this.noteTypeLabel, this.page);
  }

  async waitForModalToClose() {
    await waitForModalClose(this.closeButton);
  }
}
