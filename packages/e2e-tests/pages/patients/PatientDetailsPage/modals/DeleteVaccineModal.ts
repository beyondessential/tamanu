import { Locator, Page } from '@playwright/test';

import { BasePatientModal } from './BasePatientModal';

export class DeleteVaccineModal extends BasePatientModal {
  readonly modalTitle: Locator;
  readonly modalContent: Locator;
  readonly confirmButton: Locator;

  constructor(page: Page) {
    super(page);
    this.modalTitle = this.page.getByTestId('modaltitle-ojhf');
    this.modalContent = this.page.getByTestId('modalcontent-bk4w');
    this.confirmButton = this.page.getByTestId('confirmbutton-y3tb');
  }
}
