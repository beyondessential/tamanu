import { Page, Locator } from '@playwright/test';

export class PrepareDischargeModal {
  readonly page: Page;
  readonly modalContainer!: Locator;
  readonly dischargeForm!: Locator;
  readonly dischargeNoteTextarea!: Locator;
  readonly confirmButton!: Locator;
  readonly cancelButton!: Locator;
  readonly finaliseDischargeButton!: Locator;
  constructor(page: Page) {
    this.page = page;

    const dialog = page.getByRole('dialog');
    this.modalContainer = dialog.getByTestId('formmodal-ti1m');
    this.dischargeForm = dialog.getByTestId('dischargeform-xolc');
    this.dischargeNoteTextarea = this.page.getByTestId('field-0uma-input');
    this.finaliseDischargeButton = this.page.getByTestId('box-p5wr');
    this.confirmButton = this.page.getByTestId('formsubmitcancelrow-il44-confirmButton');
    this.cancelButton = this.dischargeForm.getByTestId('formconfirmcancelbackrow-xkrs').getByTestId('outlinedbutton-8rnr');
  }

  async waitForModalToLoad(): Promise<void> {
    await this.dischargeNoteTextarea.waitFor({ state: 'visible'});
    await this.page.waitForLoadState('networkidle');
  }

  async waitForModalToClose(): Promise<void> {
    await this.dischargeNoteTextarea.waitFor({ state: 'detached'});
  }
}
