import { Locator, Page, expect } from '@playwright/test';

import { BasePatientModal } from './BasePatientModal';
import { convertDateFormat } from '../../../../utils/testHelper';
import { Vaccine } from 'types/vaccine/Vaccine';

export class ViewVaccineModal extends BasePatientModal {
  readonly modalTitle: Locator;
  readonly givenVaccineName: Locator;
  readonly vaccineNameOther: Locator;
  readonly vaccineBatch: Locator;
  readonly scheduleOption: Locator;
  readonly givenStatus: Locator;
  readonly givenBy: Locator;
  readonly dateGiven: Locator;
  readonly injectionSite: Locator;
  readonly area: Locator;
  readonly location: Locator;
  readonly department: Locator;
  readonly notGivenReason: Locator;
  readonly dateNotGiven: Locator;
  readonly otherDisease: Locator;
  readonly notGivenSupervisingClinician: Locator;
  readonly otherBrand: Locator;
  readonly facilityLocation: Locator;
  readonly recordedBy: Locator;
  readonly givenElsewhereReason: Locator;
  readonly givenElsewhereCountry: Locator;
  readonly givenElsewhereFacility: Locator;
  readonly status: Locator;

  constructor(page: Page) {
    super(page);
    this.modalTitle = this.page.getByTestId('modaltitle-ojhf');
    this.givenVaccineName = this.page.getByTestId('displayfield-jkpx-vaccine-translatedtext-igtk');
    this.vaccineNameOther = this.page.getByTestId('displayfield-jkpx-vaccine-translatedtext-jbi4');
    this.vaccineBatch = this.page.getByTestId('displayfield-jkpx-vaccine-translatedtext-j02w');
    this.scheduleOption = this.page.getByTestId('displayfield-jkpx-vaccine-translatedtext-s88j');
    this.givenStatus = this.page.getByTestId('displayfield-jkpx-vaccine-translatedtext-qgo7');
    this.dateGiven = this.page.getByTestId('displayfield-jkpx-vaccine-translatedtext-t6f2');
    this.dateNotGiven = this.page.getByTestId('displayfield-jkpx-vaccine-translatedtext-r2gm');
    this.injectionSite = this.page.getByTestId('displayfield-jkpx-vaccine-injectsite-m8uo');
    this.area = this.page.getByTestId('displayfield-jkpx-location-translatedtext-zk1l');
    this.location = this.page.getByTestId('displayfield-jkpx-location-translatedtext-7h0p');
    this.givenBy = this.page.getByTestId('displayfield-jkpx-recorded-translatedtext-21u3');
    this.department = this.page.getByTestId('displayfield-jkpx-location-translatedtext-n704');
    this.notGivenReason = this.page.getByTestId('displayfield-jkpx-vaccine-translatedtext-ewjz');
    this.otherDisease = this.page.getByTestId('displayfield-jkpx-vaccine-translatedtext-h50a');
    this.notGivenSupervisingClinician = this.page.getByTestId(
      'displayfield-jkpx-recorded-translatedtext-qoi6',
    );
    this.otherBrand = this.page.getByTestId('displayfield-jkpx-vaccine-translatedtext-q3yc');
    this.facilityLocation = this.page.getByTestId('displayfield-jkpx-location-translatedtext-iukb');
    this.recordedBy = this.page.getByTestId('displayfield-jkpx-recorded-translatedtext-e9ru');
    this.givenElsewhereReason = this.page.getByTestId(
      'displayfield-jkpx-status-translatedtext-rth0',
    );
    this.givenElsewhereCountry = this.page.getByTestId(
      'displayfield-jkpx-country-translatedtext-c7hy',
    );
    this.givenElsewhereFacility = this.page.getByTestId(
      'displayfield-jkpx-recorded-translatedtext-iukb',
    );
    this.status = this.page.getByTestId('displayfield-jkpx-status-translatedtext-qgo7');
  }

  async waitForModalToOpen() {
    // Wait for modal content to load before progressing
    await expect(this.recordedBy).toBeVisible();
  }

  /**
   * Asserts the values for the required fields in the vaccine record modal match what was entered when creating the vaccine record
   * @param vaccine - Takes a vaccine object and extracts the relevant fields to run assertions against
   */
  async assertVaccineModalRequiredFields(vaccine: Partial<Vaccine>) {
    const {
      vaccineName,
      dateGiven,
      area,
      location,
      department,
      given,
      category,
      scheduleOption,
      givenElsewhereReason,
    } = vaccine;

    //Most of the locators are custom here so it's cleaner to assert the given elsewhere fields separately
    if (givenElsewhereReason) {
      await this.assertGivenElsewhereVaccineModalFields(vaccine);
      return;
    }

    if (!vaccineName || !dateGiven || !area || !location || !department || !scheduleOption) {
      throw new Error('Missing required vaccine fields');
    }

    await expect(this.area).toContainText(area);
    await expect(this.location).toContainText(location);
    await expect(this.department).toContainText(department);
    await expect(this.facilityLocation).toContainText('facility-1');
    await expect(this.recordedBy).toContainText('Initial Admin');

    if (category === 'Other') {
      await expect(this.vaccineNameOther).toContainText(vaccineName);
    } else {
      await expect(this.givenVaccineName).toContainText(vaccineName);
      await expect(this.scheduleOption).toContainText(scheduleOption);
    }

    if (given) {
      await expect(this.givenStatus).toContainText('Given');
      await expect(this.dateGiven).toContainText(convertDateFormat(dateGiven));
    } else {
      await expect(this.givenStatus).toContainText('Not given');
      await expect(this.dateNotGiven).toContainText(convertDateFormat(dateGiven));
    }
  }

  /**
   * Asserts the values for the optional fields in the vaccine record modal match what was entered when creating the vaccine record
   * @param vaccine - Takes a vaccine object and extracts the relevant fields to run assertions against
   */
  async assertVaccineModalOptionalFields(vaccine: Partial<Vaccine>) {
    const {
      given,
      category,
      batch,
      injectionSite,
      givenBy,
      brand,
      disease,
      notGivenClinician,
      notGivenReason,
    } = vaccine;

    if (category === 'Other') {
      await expect(this.otherDisease).toContainText(disease!);
    }

    if (given) {
      await expect(this.vaccineBatch).toContainText(batch!);
      await expect(this.givenBy).toContainText(givenBy!);
      await expect(this.injectionSite).toContainText(injectionSite!);
      if (category === 'Other') {
        await expect(this.otherBrand).toContainText(brand!);
      }
    } else {
      await expect(this.notGivenReason).toContainText(notGivenReason!);
      await expect(this.notGivenSupervisingClinician).toContainText(notGivenClinician!);
    }
  }

  async assertGivenElsewhereVaccineModalFields(vaccine: Partial<Vaccine>) {
    const { vaccineName, givenElsewhereReason, givenElsewhereCountry, dateGiven, category } =
      vaccine;

    if (!vaccineName || !givenElsewhereReason || !givenElsewhereCountry) {
      throw new Error('Missing required given elsewhere fields');
    }

    if (dateGiven) {
      await expect(this.dateGiven).toContainText(convertDateFormat(dateGiven));
    } else {
      await expect(this.dateGiven).toContainText('--/--/----');
    }

    await expect(this.givenElsewhereReason).toContainText(givenElsewhereReason);
    await expect(this.givenElsewhereCountry).toContainText(givenElsewhereCountry);
    await expect(this.status).toContainText('Given elsewhere');
    await expect(this.givenElsewhereFacility).toContainText('facility-1');
    await expect(this.recordedBy).toContainText('Initial Admin');
    if (category === 'Other') {
      await expect(this.vaccineNameOther).toContainText(vaccineName);
    } else {
      await expect(this.givenVaccineName).toContainText(vaccineName);
    }
  }
}
