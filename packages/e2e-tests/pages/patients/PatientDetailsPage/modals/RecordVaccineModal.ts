import { Locator, Page, expect } from '@playwright/test';

import { BasePatientModal } from './BasePatientModal';
import {
  selectFieldOption,
  selectAutocompleteFieldOption,
  returnAllOptionsFromDropdown,
} from '@utils/fieldHelpers';

interface RecordVaccineOptions {
  specificVaccine?: string;
  fillOptionalFields?: boolean;
  isFollowUpVaccine?: boolean;
  specificScheduleOption?: string;
  specificDate?: string;
  recordScheduledVaccine?: boolean;
  prefilledLocations?: { area: string; location: string; department: string };
  vaccineGivenElsewhere?: string;
}

interface OptionalVaccineFields {
  givenBy?: string;
  vaccineBatch?: string;
  injectionSite?: string;
  consentGivenBy?: string;
  brand?: string;
  disease?: string;
  notGivenReason?: string;
  notGivenClinician?: string;
}

interface GivenElsewhereFields {
  givenElsewhereCountry?: string;
  givenElsewhereReason?: string;
}

const givenBy = 'Test Doctor';
const batch = 'A12B3C';
const consentGivenBy = 'Recipient';
const notGivenClinician = 'Test Clinician';

export class RecordVaccineModal extends BasePatientModal {
  readonly modal: Locator;
  readonly modalHeading: Locator;
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
  readonly dateFieldIncludingError: Locator;
  readonly areaFieldIncludingError: Locator;
  readonly locationFieldIncludingError: Locator;
  readonly departmentFieldIncludingError: Locator;
  readonly categoryRequiredError: Locator;
  readonly consentGivenRequiredError: Locator;
  readonly vaccineNameRequiredError: Locator;
  readonly vaccineGivenElsewhereDropdown: Locator;
  readonly givenElsewhereCheckbox: Locator;
  readonly countryField: Locator;
  readonly modalScrollManager: Locator;
  constructor(page: Page) {
    super(page);

    this.modal = this.page.getByTestId('modal-record-vaccine');
    this.modalHeading = this.page.getByRole('heading', { name: 'Record vaccine' });
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
    this.dateFieldIncludingError = this.page.getByTestId('field-8sou');
    this.areaFieldIncludingError = this.page.getByTestId(
      'field-zrlv-group-input-outerlabelfieldwrapper',
    );
    this.locationFieldIncludingError = this.page.getByTestId(
      'field-zrlv-location-input-outerlabelfieldwrapper',
    );
    this.departmentFieldIncludingError = this.page.getByTestId(
      'field-5sfc-input-outerlabelfieldwrapper',
    );
    this.categoryRequiredError = this.page.getByTestId('formhelpertext-sz5u');
    this.consentGivenRequiredError = this.page.getByTestId('formhelpertext-2d0o');
    this.vaccineNameRequiredError = this.page.getByTestId('field-npct-formhelptertext');
    this.vaccineGivenElsewhereDropdown = this.page.getByTestId('styledindicator-dx40');
    this.givenElsewhereCheckbox = this.page.getByTestId('field-w50x-controlcheck');
    this.countryField = this.page.getByTestId('field-e5kc-input');
    this.modalScrollManager = this.page.locator('.css-bp8cua-ScrollManager');
  }

  async selectIsVaccineGiven(isVaccineGiven: boolean) {
    if (isVaccineGiven) {
      await this.givenTab.click();
    } else {
      await this.notGivenTab.click();
    }

    return isVaccineGiven ? 'Given' : 'Not given';
  }

  async selectCategory(category: 'Routine' | 'Catchup' | 'Campaign' | 'Other') {
    const categoryMap = {
      Routine: this.categoryRoutineRadio,
      Catchup: this.categoryCatchupRadio,
      Campaign: this.categoryCampaignRadio,
      Other: this.categoryOtherRadio,
    };

    await categoryMap[category].click();
  }

  async selectVaccine(specificVaccine?: string) {
    const vaccineName = await selectFieldOption(this.page, this.vaccineSelectField, {
      optionToSelect: specificVaccine,
      returnOptionText: true,
    });
    return vaccineName;
  }

  async assertScheduledVaccine(specificVaccine: string, specificScheduleOption: string) {
    const scheduleOptionLocator = this.scheduleRadioGroup.getByRole('radio', {
      name: specificScheduleOption,
    });
    expect(this.vaccineSelectField).toContainText(specificVaccine);
    expect(scheduleOptionLocator).toBeChecked();
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
    if (!area || !location || !department) {
      throw new Error('Failed to select location group');
    }
    return { area, location, department };
  }

  async selectScheduleOption(option?: string, isFollowUpVaccine?: boolean) {
    const firstRadioOption = this.scheduleRadioGroup.locator('label').first();
    let scheduleOption: string | undefined;

    if (isFollowUpVaccine) {
      expect(firstRadioOption).toBeDisabled();
    }

    if (option) {
      scheduleOption = option;
      const scheduleOptionLocator = this.scheduleRadioGroup.getByRole('radio', {
        name: option,
        disabled: false,
      });
      await scheduleOptionLocator.click();
    } else {
      scheduleOption = await firstRadioOption.locator('span.MuiFormControlLabel-label').innerText();
      await firstRadioOption.click();
    }

    return scheduleOption;
  }

  // TODO: Refactor to use VACCINE_CATEGORIES when importing is working
  async recordVaccine(
    given: boolean,
    category: 'Routine' | 'Catchup' | 'Campaign' | 'Other',
    count: number,
    {
      specificVaccine = undefined,
      fillOptionalFields = false,
      isFollowUpVaccine = false,
      specificScheduleOption = undefined,
      specificDate = undefined,
      recordScheduledVaccine = false,
      prefilledLocations = undefined,
      vaccineGivenElsewhere = undefined,
    }: RecordVaccineOptions = {},
  ) {
    const givenStatus = await this.selectIsVaccineGiven(given);
    await this.selectCategory(category);

    let vaccineName: string | undefined;
    let scheduleOption: string | undefined;
    let optionalFields: OptionalVaccineFields | undefined;
    let givenElsewhere: GivenElsewhereFields | undefined;

    if (vaccineGivenElsewhere) {
      await this.givenElsewhereCheckbox.click();
      givenElsewhere = await this.recordVaccineGivenElsewhere(vaccineGivenElsewhere);
    }

    if (specificDate) {
      await this.dateField.fill(specificDate);
    }

    const dateGiven = await this.dateField.evaluate((el: HTMLInputElement) => el.value);

    if (category !== 'Other') {
      if (recordScheduledVaccine) {
        if (!specificVaccine || !specificScheduleOption) {
          throw new Error(
            'A specific vaccine and schedule option must be provided when recordScheduledVaccine is true',
          );
        }
        //Confirm the vaccine and schedule are prefilled
        await this.assertScheduledVaccine(specificVaccine, specificScheduleOption);
        vaccineName = specificVaccine;
        scheduleOption = specificScheduleOption;
      } else {
        vaccineName = await this.selectVaccine(specificVaccine);
        scheduleOption = await this.selectScheduleOption(specificScheduleOption, isFollowUpVaccine);
      }
    } else {
      vaccineName = 'Test Vaccine';
      scheduleOption = 'N/A';
      await this.vaccineNameField.fill(vaccineName);
    }

    let locationGroup: { area: string; location: string; department: string } | undefined;
    if (prefilledLocations) {
      locationGroup = prefilledLocations;
    } else if (vaccineGivenElsewhere) {
      //If the vaccine is given elsewhere there is no locationGroup
      locationGroup = undefined;
    } else {
      locationGroup = await this.selectLocationGroup();
    }

    if (given) {
      await this.consentCheckbox.check();
    }

    if (fillOptionalFields) {
      optionalFields = given
        ? await this.recordOptionalVaccineFieldsGiven(category)
        : await this.recordOptionalVaccineFieldsNotGiven(category);
    }

    await this.confirmButton.click();

    return {
      vaccineName,
      scheduleOption,
      dateGiven,
      count,
      category,
      given,
      givenStatus,
      fillOptionalFields,
      ...givenElsewhere,
      ...optionalFields,
      ...locationGroup,
    };
  }

  async waitForModalToClose() {
    await this.modal.waitFor({ state: 'detached' });
  }

  async recordOptionalVaccineFieldsGiven(category: 'Routine' | 'Catchup' | 'Campaign' | 'Other') {
    let brand: string | undefined;
    let disease: string | undefined;

    await this.givenByField.fill(givenBy);
    await this.vaccineBatchField.fill(batch);
    const injectionSite = await this.selectInjectionSite();
    await this.consentGivenByField.fill(consentGivenBy);

    if (category === 'Other') {
      brand = 'Test Brand';
      await this.otherVaccineBrand.fill(brand);
      disease = 'Test Disease';
      await this.otherVaccineDisease.fill(disease);
    }

    return { givenBy, batch, injectionSite, consentGivenBy, brand, disease };
  }

  async recordOptionalVaccineFieldsNotGiven(
    category: 'Routine' | 'Catchup' | 'Campaign' | 'Other',
  ) {
    let disease: string | undefined;

    const notGivenReason = await this.selectNotGivenReason();

    await this.notGivenClinicianField.fill(notGivenClinician);

    if (category === 'Other') {
      disease = 'Test disease';
      await this.otherVaccineDisease.fill(disease);
    }

    return { notGivenReason, notGivenClinician, disease };
  }

  async recordVaccineGivenElsewhere(vaccineGivenElsewhere: string) {
    await this.vaccineGivenElsewhereDropdown.click();
    await this.page.getByText(vaccineGivenElsewhere).click();
    await this.modalScrollManager.click(); //Close the dropdown
    const country = await selectAutocompleteFieldOption(this.page, this.countryField, {
      returnOptionText: true,
    });
    return { givenElsewhereCountry: country, givenElsewhereReason: vaccineGivenElsewhere };
  }

  async assertVaccineNotInDropdown(
    category: 'Routine' | 'Catchup' | 'Campaign' | 'Other',
    vaccineName: string,
  ) {
    await this.selectCategory(category);

    const allOptions = await returnAllOptionsFromDropdown(this.page, this.vaccineSelectField);

    // Check that the vaccine is not in the list of vaccine options and throws error if present
    for (const option of allOptions) {
      expect(
        option,
        `"${vaccineName}" was found in the dropdown when it should not be present`,
      ).not.toBe(vaccineName);
    }
  }

  async assertLocationPrefilled(prefilledLocations: {
    area: string;
    location: string;
    department: string;
  }) {
    const { area, location, department } = prefilledLocations;

    const inputFields = [
      { input: this.areaField.locator('input'), expectedValue: area },
      { input: this.locationField.locator('input'), expectedValue: location },
      { input: this.departmentField.locator('input'), expectedValue: department },
    ];

    //Wait for modal to open
    await expect(this.modalHeading).toBeVisible();

    //Assert the each location field is prefilled with the correct value
    for (const field of inputFields) {
      await expect(field.input).toHaveValue(field.expectedValue);
    }
  }

  async assertVaccineNotSelectable(
    vaccineName: string,
    category: 'Routine' | 'Catchup' | 'Campaign' | 'Other',
  ) {
    await this.selectCategory(category);
    await this.vaccineSelectField.click();
    await expect(this.vaccineSelectField.getByText(vaccineName)).not.toBeVisible();
  }
}
