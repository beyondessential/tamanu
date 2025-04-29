import { Locator, Page } from '@playwright/test';

import { BasePatientModal } from './BasePatientModal';

export class RecordVaccineModal extends BasePatientModal {
  readonly modal: Locator;
  readonly categoryRadioGroup: Locator;
  readonly vaccineSelectField: Locator;
  readonly scheduleRadioGroup: Locator;
  readonly consentCheckbox: Locator;
  readonly confirmButton: Locator;

  constructor(page: Page) {
    super(page);

    this.modal = this.page.getByTestId('modal-record-vaccine');
    this.categoryRadioGroup = this.page.getByTestId('field-rd4e');
    this.vaccineSelectField = this.page.getByTestId('field-npct');
    this.scheduleRadioGroup = this.page.getByTestId('field-rggk');
    this.consentCheckbox = this.page.getByTestId('field-wvyn');
    this.confirmButton = this.page.getByRole('button', { name: 'Confirm' });
  }

  async recordRandomVaccine() {
    await this.categoryRadioGroup.getByRole('radio').first().check();
    await this.vaccineSelectField.click();
    await this.page.keyboard.down('Tab'); // One way of selecting an option from our select fields
    await this.selectScheduleOption();
    await this.consentCheckbox.check();
    await this.confirmButton.click();
  }

  async selectScheduleOption(option?: string) {
    const scheduleOption = option
      ? this.scheduleRadioGroup.getByRole('radio', { name: option, disabled: false })
      : this.scheduleRadioGroup.getByRole('radio', { disabled: false }).first();

    if (await scheduleOption.isEnabled()) {
      await scheduleOption.check();
    }
  }

  async waitForModalToClose() {
    await this.modal.waitFor({ state: 'detached' });
  }
}
