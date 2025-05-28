import { Locator, Page } from '@playwright/test';

import { BasePatientModal } from './BasePatientModal';

export class RecordVaccineModal extends BasePatientModal {
  readonly modal: Locator;
  readonly categoryRadioGroup: Locator;
  readonly vaccineSelectField: Locator;
  readonly scheduleRadioGroup: Locator;
  readonly consentCheckbox: Locator;
  readonly confirmButton: Locator;
  readonly givenTab: Locator;
  readonly notGivenTab: Locator;
  readonly categoryRoutineRadio: Locator;
  readonly categoryCatchupRadio: Locator;
  readonly categoryCampaignRadio: Locator;
  readonly categoryOtherRadio: Locator;

  constructor(page: Page) {
    super(page);

    this.modal = this.page.getByTestId('modal-record-vaccine');
    this.categoryRadioGroup = this.page.getByTestId('field-rd4e');
    this.vaccineSelectField = this.page.getByTestId('field-npct-select');
    this.scheduleRadioGroup = this.page.getByTestId('field-rggk');
    this.consentCheckbox = this.page.getByTestId('field-wvyn');
    this.confirmButton = this.page.getByRole('button', { name: 'Confirm' });
    this.givenTab = this.page.getByTestId('styledtab-gibh-GIVEN');
    this.notGivenTab = this.page.getByTestId('styledtab-gibh-NOT_GIVEN');
    this.categoryRoutineRadio = this.page.getByTestId('controllabel-kkx2-Routine');
    this.categoryCatchupRadio = this.page.getByTestId('controllabel-kkx2-Catchup');
    this.categoryCampaignRadio = this.page.getByTestId('controllabel-kkx2-Campaign');
    this.categoryOtherRadio = this.page.getByTestId('controllabel-kkx2-Other');
  }

  async selectIsVaccineGiven(isVaccineGiven: boolean) {
    if (isVaccineGiven) {
      await this.givenTab.click();
    } else {
      await this.notGivenTab.click();
    }
  }

  async selectCategory(category: 'Routine' | 'Catchup' | 'Campaign' | 'Other') {
    switch (category) {
      case 'Routine':
        await this.categoryRoutineRadio.click();
        break;
      case 'Catchup':
        await this.categoryCatchupRadio.click();
        break;
      case 'Campaign':
        await this.categoryCampaignRadio.click();
        break;
      case 'Other':
        await this.categoryOtherRadio.click();
        break;
    }
  }

  async selectVaccine() {
    await this.vaccineSelectField.click();
    const vaccines = await this.page.getByTestId('field-npct-option').all();
    await vaccines[Math.floor(Math.random() * vaccines.length)].click();
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
