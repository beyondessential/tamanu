import { Locator, Page } from '@playwright/test';

import { BasePatientModal } from './BasePatientModal';

export class RecordVaccineModal extends BasePatientModal {
  readonly modal: Locator;
  readonly categoryRadioGroup: Locator;
  readonly vaccineSelectField: Locator;
  readonly consentCheckbox: Locator;
  readonly confirmButton: Locator;
  readonly givenTab: Locator;
  readonly notGivenTab: Locator;
  readonly categoryRoutineRadio: Locator;
  readonly categoryCatchupRadio: Locator;
  readonly categoryCampaignRadio: Locator;
  readonly categoryOtherRadio: Locator;
  readonly scheduleRadioGroup: Locator;

  constructor(page: Page) {
    super(page);

    this.modal = this.page.getByTestId('modal-record-vaccine');
    this.categoryRadioGroup = this.page.getByTestId('field-rd4e');
    this.vaccineSelectField = this.page.getByTestId('field-npct-select');
    this.consentCheckbox = this.page
      .getByTestId('fullwidthcol-q2z3')
      .getByTestId('checkinput-x2e3-controlcheck');
    this.confirmButton = this.page
      .getByTestId('twotwogrid-2swz')
      .getByTestId('formsubmitbutton-ygc6');
    this.givenTab = this.page.getByTestId('styledtab-gibh-GIVEN');
    this.notGivenTab = this.page.getByTestId('styledtab-gibh-NOT_GIVEN');
    this.categoryRoutineRadio = this.page.getByTestId('controllabel-kkx2-Routine');
    this.categoryCatchupRadio = this.page.getByTestId('controllabel-kkx2-Catchup');
    this.categoryCampaignRadio = this.page.getByTestId('controllabel-kkx2-Campaign');
    this.categoryOtherRadio = this.page.getByTestId('controllabel-kkx2-Other');
    this.scheduleRadioGroup = this.page
      .getByTestId('fullwidthcol-3xje')
      .getByTestId('styledradiogroup-13do');
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

  async recordVaccine(given: boolean, category: 'Routine' | 'Catchup' | 'Campaign' | 'Other') {
    await this.selectIsVaccineGiven(given);
    await this.selectCategory(category);
    await this.selectVaccine();
    await this.selectScheduleOption();
    await this.consentCheckbox.check();
    await this.confirmButton.click();
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

    await scheduleOption.click();
  }

  async waitForModalToClose() {
    await this.modal.waitFor({ state: 'detached' });
  }
}
