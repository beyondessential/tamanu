import { Locator, Page } from '@playwright/test';

import { BasePatientModal } from './BasePatientModal';
import { selectFieldOption, selectAutocompleteFieldOption } from '@utils/fieldHelpers';

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
  readonly areaField: Locator;
  readonly locationField: Locator;
  readonly departmentField: Locator;
  readonly vaccineNameField: Locator;

  constructor(page: Page) {
    super(page);

    this.modal = this.page.getByTestId('modal-record-vaccine');
    this.categoryRadioGroup = this.page.getByTestId('field-rd4e');
    this.vaccineSelectField = this.page.getByTestId('field-npct-select');
    this.consentCheckbox = this.page.getByTestId('consentfield-rvwt-controlcheck');
    this.confirmButton = this.page.getByTestId('formsubmitcancelrow-vv8q-confirmButton');
    this.givenTab = this.page.getByTestId('styledtab-gibh-GIVEN');
    this.notGivenTab = this.page.getByTestId('styledtab-gibh-NOT_GIVEN');
    this.categoryRoutineRadio = this.page.getByTestId('controllabel-kkx2-Routine');
    this.categoryCatchupRadio = this.page.getByTestId('controllabel-kkx2-Catchup');
    this.categoryCampaignRadio = this.page.getByTestId('controllabel-kkx2-Campaign');
    this.categoryOtherRadio = this.page.getByTestId('controllabel-kkx2-Other');
    this.scheduleRadioGroup = this.page.getByTestId('field-rggk-styledradiogroup');
    this.areaField = this.page.getByTestId('field-zrlv-group-input');
    this.locationField = this.page.getByTestId('field-zrlv-location-input');
    this.departmentField = this.page.getByTestId('field-5sfc-input');
    this.vaccineNameField = this.page.getByTestId('field-vaccineName-input');
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
    await selectFieldOption(this.page, this.vaccineSelectField);
  }

  async selectLocationGroup() {
    await selectAutocompleteFieldOption(this.page, this.areaField, {
      optionToSelect: 'Emergency Department',
    });
    await selectAutocompleteFieldOption(this.page, this.locationField, { optionToSelect: 'Bed 1' });
    await selectAutocompleteFieldOption(this.page, this.departmentField);
  }

  async selectScheduleOption(option?: string) {
    const scheduleOption = option
      ? this.scheduleRadioGroup.getByRole('radio', { name: option, disabled: false })
      : this.scheduleRadioGroup.getByRole('radio', { disabled: false }).first();

    await scheduleOption.click();
  }

  // TODO: Refactor to use VACCINE_CATEGORIES when importing is working
  async recordVaccine(given: boolean, category: 'Routine' | 'Catchup' | 'Campaign' | 'Other') {
    await this.selectIsVaccineGiven(given);
    await this.selectCategory(category);

    if (category !== 'Other') {
      await this.selectVaccine();
      await this.selectScheduleOption();
    } else {
      await this.vaccineNameField.fill('Test Vaccine');
    }

    await this.selectLocationGroup();

    if (given) {
      await this.consentCheckbox.check();
    }

    await this.page.waitForTimeout(2000);
    await this.confirmButton.click();
  }

  async waitForModalToClose() {
    await this.modal.waitFor({ state: 'detached' });
  }
}
