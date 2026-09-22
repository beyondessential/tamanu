import { Page, Locator } from '@playwright/test';

export class SyndromicSurveillanceStatus {
  readonly page: Page;
  readonly container: Locator;
  readonly recordLink: Locator;
  readonly viewEditLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.getByTestId('syndromicsurveillancestatus-diagnosis');
    // Before anything is recorded, the whole status container is itself the clickable link.
    this.recordLink = this.container;
    // Once recorded, the status becomes a read-only row and a separate button opens the modal.
    this.viewEditLink = page.getByTestId('textbutton-syndromic-surveillance-viewedit');
  }

  async open() {
    if (await this.viewEditLink.isVisible()) {
      await this.viewEditLink.click();
    } else {
      await this.recordLink.click();
    }
  }
}

export class SyndromicSurveillanceModal {
  readonly page: Page;
  readonly noSyndromeCheckbox: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.noSyndromeCheckbox = page.getByTestId('field-no-syndrome-controlcheck');
    // ModalFormActionRow (packages/web/app/components/ModalActionRow.jsx) overwrites whatever
    // data-testid its caller passes with its own hardcoded one, so the confirm/cancel buttons
    // never receive the `modalformactionrow-syndromic-surveillance-*` ids the form appears to
    // set — they fall through to FormSubmitCancelRow's default `testId`. Addressed by role
    // within the dialog instead, which doesn't depend on that plumbing.
    const dialog = page.getByRole('dialog', { name: 'Syndromic surveillance' });
    this.confirmButton = dialog.getByRole('button', { name: 'Confirm', exact: true });
    this.cancelButton = dialog.getByRole('button', { name: 'Cancel', exact: true });
  }

  async waitForModalToLoad() {
    await this.noSyndromeCheckbox.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async waitForModalToClose() {
    await this.page.getByRole('dialog').waitFor({ state: 'detached' });
  }

  symptomCheckbox(symptomId: string): Locator {
    return this.page.getByTestId(`field-symptom-${symptomId}-controlcheck`);
  }

  async selectNoSyndrome() {
    await this.noSyndromeCheckbox.check();
  }

  async confirm() {
    await this.confirmButton.click();
    await this.waitForModalToClose();
  }
}
