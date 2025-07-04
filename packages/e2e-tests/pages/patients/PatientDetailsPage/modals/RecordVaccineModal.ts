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
  readonly givenByField: Locator;
  readonly categoryRoutineRadio: Locator;
  readonly categoryCatchupRadio: Locator;
  readonly categoryCampaignRadio: Locator;
  readonly categoryOtherRadio: Locator;
  readonly scheduleRadioGroup: Locator;
  readonly areaField: Locator;
  readonly locationField: Locator;
  readonly departmentField: Locator;
  readonly vaccineNameField: Locator;
  readonly vaccineBatchField: Locator;
  readonly injectionSiteField: Locator;
  readonly consentGivenByField: Locator;
  readonly dateField: Locator;
  readonly notGivenReasonField: Locator;
  readonly notGivenClinicianField: Locator;
  readonly otherVaccineBrand: Locator;
  readonly otherVaccineDisease: Locator;

  constructor(page: Page) {
    super(page);

    this.modal = this.page.getByTestId('modal-record-vaccine');
    this.categoryRadioGroup = this.page.getByTestId('field-rd4e');
    this.vaccineSelectField = this.page.getByTestId('field-npct-select');
    this.consentCheckbox = this.page.getByTestId('consentfield-rvwt-controlcheck');
    this.confirmButton = this.page.getByTestId('formsubmitcancelrow-vv8q-confirmButton');
    this.givenTab = this.page.getByTestId('styledtab-gibh-GIVEN');
    this.notGivenTab = this.page.getByTestId('styledtab-gibh-NOT_GIVEN');
    this.givenByField = this.page.getByTestId('field-xycc-input');
    this.categoryRoutineRadio = this.page.getByTestId('controllabel-kkx2-Routine');
    this.categoryCatchupRadio = this.page.getByTestId('controllabel-kkx2-Catchup');
    this.categoryCampaignRadio = this.page.getByTestId('controllabel-kkx2-Campaign');
    this.categoryOtherRadio = this.page.getByTestId('controllabel-kkx2-Other');
    this.scheduleRadioGroup = this.page.getByTestId('field-rggk-styledradiogroup');
    this.areaField = this.page.getByTestId('field-zrlv-group-input');
    this.locationField = this.page.getByTestId('field-zrlv-location-input');
    this.departmentField = this.page.getByTestId('field-5sfc-input');
    this.vaccineNameField = this.page.getByTestId('field-vaccineName-input');
    this.vaccineBatchField = this.page.getByTestId('field-865y-input');
    this.injectionSiteField = this.page.getByTestId('field-jz48-select');
    this.consentGivenByField = this.page.getByTestId('field-inc8-input');
    this.dateField = this.page.getByTestId('field-8sou-input').getByRole('textbox');
    this.notGivenReasonField = this.page.getByTestId('selectinput-phtg-select');
    this.notGivenClinicianField = this.page.getByTestId('field-xycc-input');
    this.otherVaccineBrand = this.page.getByTestId('field-f1vm-input');
    this.otherVaccineDisease = this.page.getByTestId('field-gcfk-input');
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

  //TODO: should this always return vaccine name or should it sometimes not?
  async selectVaccine(specificVaccine?: string) {
    const vaccineName = await selectFieldOption(this.page, this.vaccineSelectField, {
      optionToSelect: specificVaccine,
      returnOptionText: true,
    });
    return vaccineName;
  }

  async selectNotGivenReason() {
    const notGivenReason = await selectFieldOption(this.page, this.notGivenReasonField, {
      returnOptionText: true,
    });
    return notGivenReason;
  }

  async selectInjectionSite() {
    const injectionSite = await selectFieldOption(this.page, this.injectionSiteField, {
      returnOptionText: true,
    });
    return injectionSite;
  }

  async selectLocationGroup() {
    const area = await selectAutocompleteFieldOption(this.page, this.areaField, {
      returnOptionText: true,
    });
    const location = await selectAutocompleteFieldOption(this.page, this.locationField, {
      returnOptionText: true,
    });
    const department = await selectAutocompleteFieldOption(this.page, this.departmentField, {
      returnOptionText: true,
    });
    return { area, location, department };
  }

  //TODO: find some way to get the text of the selected option
  async selectScheduleOption(option?: string) {
    let scheduleOption: string | undefined;

    if (option) {
      scheduleOption = option;
      const scheduleOptionLocator = this.scheduleRadioGroup.getByRole('radio', {
        name: option,
        disabled: false,
      });
      await scheduleOptionLocator.click();
    } else {
      const firstRadioOption = this.scheduleRadioGroup.locator('label').first();
      scheduleOption = await firstRadioOption.locator('span.MuiFormControlLabel-label').innerText();
      await firstRadioOption.click();
    }

    return scheduleOption;
  }

  // TODO: Refactor to use VACCINE_CATEGORIES when importing is working
  async recordVaccine(
    given: boolean,
    category: 'Routine' | 'Catchup' | 'Campaign' | 'Other',
    specificVaccine?: string,
    fillOptionalFields?: boolean,
  ) {
    await this.selectIsVaccineGiven(given);
    await this.selectCategory(category);

    let vaccineName: string | undefined;
    let scheduleOption: string | undefined;
    let optionalFields:
      | {
          givenBy?: string;
          vaccineBatch?: string;
          injectionSite?: string;
          consentGivenBy?: string;
          brand?: string;
          disease?: string;
          notGivenReason?: string;
          notGivenClinician?: string;
        }
      | undefined;

    const date = await this.dateField.evaluate((el: HTMLInputElement) => el.value);

    if (category !== 'Other') {
      vaccineName = await this.selectVaccine(specificVaccine);
      scheduleOption = await this.selectScheduleOption();
    } else {
      vaccineName = 'Test Vaccine';
      scheduleOption = 'N/A';
      await this.vaccineNameField.fill(vaccineName);
    }

    const locationGroup = await this.selectLocationGroup();

    if (given) {
      await this.consentCheckbox.check();
    }

    if (fillOptionalFields) {
      optionalFields = given
        ? await this.recordOptionalVaccineFieldsGiven(category)
        : await this.recordOptionalVaccineFieldsNotGiven(category);
    }

    await this.page.waitForTimeout(2000);
    await this.confirmButton.click();

    return { vaccineName, scheduleOption, date, ...optionalFields, ...locationGroup };
  }

  async waitForModalToClose() {
    await this.modal.waitFor({ state: 'detached' });
  }

  async recordOptionalVaccineFieldsGiven(category: 'Routine' | 'Catchup' | 'Campaign' | 'Other') {
    const givenBy = 'Test Doctor';
    const vaccineBatch = 'A12B3C';
    const consentGivenBy = 'Recipient';

    let brand: string | undefined;
    let disease: string | undefined;

    await this.givenByField.fill(givenBy);
    await this.vaccineBatchField.fill(vaccineBatch);
    const injectionSite = await this.selectInjectionSite();
    await this.consentGivenByField.fill(consentGivenBy);

    if (category === 'Other') {
      brand = 'Test Brand';
      await this.otherVaccineBrand.fill(brand);
      disease = 'Test Disease';
      await this.otherVaccineDisease.fill(disease);
    }

    return { givenBy, vaccineBatch, injectionSite, consentGivenBy, brand, disease };
  }

  async recordOptionalVaccineFieldsNotGiven(
    category: 'Routine' | 'Catchup' | 'Campaign' | 'Other',
  ) {
    let disease: string | undefined;
    const notGivenClinician = 'Test Clinician';

    const notGivenReason = await this.selectNotGivenReason();

    await this.notGivenClinicianField.fill(notGivenClinician);

    if (category === 'Other') {
      disease = 'Test disease';
      await this.otherVaccineDisease.fill(disease);
    }

    return { notGivenReason, notGivenClinician, disease };
  }
}
