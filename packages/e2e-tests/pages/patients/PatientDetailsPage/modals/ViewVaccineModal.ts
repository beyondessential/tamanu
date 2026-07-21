import { Locator, Page, expect } from '@playwright/test';

import { BasePatientModal } from './BasePatientModal';
import { convertDateFormat, getSidebarFacilityDisplayName } from '../../../../utils/testHelper';
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
    this.givenVaccineName = this.page.getByTestId('displayfield-jkpx-vaccine-vaccine.vaccine.label');
    this.vaccineNameOther = this.page.getByTestId(
      'displayfield-jkpx-vaccine-vaccine.vaccineName.label',
    );
    this.vaccineBatch = this.page.getByTestId('displayfield-jkpx-vaccine-vaccine.batch.label');
    this.scheduleOption = this.page.getByTestId('displayfield-jkpx-vaccine-vaccine.schedule.label');
    this.givenStatus = this.page.getByTestId('displayfield-jkpx-vaccine-vaccine.status.label');
    this.dateGiven = this.page.getByTestId('displayfield-jkpx-vaccine-vaccine.dateGiven.label');
    this.dateNotGiven = this.page.getByTestId(
      'displayfield-jkpx-vaccine-vaccine.dateRecorded.label',
    );
    this.injectionSite = this.page.getByTestId(
      'displayfield-jkpx-vaccine-vaccine.injectionSite.label',
    );
    this.area = this.page.getByTestId('displayfield-jkpx-location-general.area.label');
    this.location = this.page.getByTestId('displayfield-jkpx-location-general.location.label');
    this.givenBy = this.page.getByTestId('displayfield-jkpx-recorded-vaccine.givenBy.label');
    this.department = this.page.getByTestId(
      'displayfield-jkpx-location-general.department.label',
    );
    this.notGivenReason = this.page.getByTestId(
      'displayfield-jkpx-vaccine-general.localisedField.notGivenReasonId.label.short',
    );
    this.otherDisease = this.page.getByTestId('displayfield-jkpx-vaccine-vaccine.disease.label');
    this.notGivenSupervisingClinician = this.page.getByTestId(
      'displayfield-jkpx-recorded-general.supervisingClinician.label',
    );
    this.otherBrand = this.page.getByTestId(
      'displayfield-jkpx-vaccine-vaccine.vaccineBrand.label',
    );
    this.facilityLocation = this.page.getByTestId(
      'displayfield-jkpx-location-general.facility.label',
    );
    this.recordedBy = this.page.getByTestId('displayfield-jkpx-recorded-vaccine.recordedBy.label');
    this.givenElsewhereReason = this.page.getByTestId(
      'displayfield-jkpx-status-vaccine.circumstance.label',
    );
    this.givenElsewhereCountry = this.page.getByTestId(
      'displayfield-jkpx-country-vaccine.country.label',
    );
    this.givenElsewhereFacility = this.page.getByTestId(
      'displayfield-jkpx-recorded-general.facility.label',
    );
    this.status = this.page.getByTestId('displayfield-jkpx-status-vaccine.status.label');
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

    const facilityDisplayName = await getSidebarFacilityDisplayName(this.page);

    await expect(this.area).toContainText(area);
    await expect(this.location).toContainText(location);
    await expect(this.department).toContainText(department);
    await expect(this.facilityLocation).toContainText(facilityDisplayName);
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
    const { vaccineName, dateGiven, category, givenElsewhereCountry, givenElsewhereReason } = vaccine;

    if (!vaccineName) {
      throw new Error('Missing vaccine name for given-elsewhere assertion');
    }
    if (!givenElsewhereCountry) {
      throw new Error('Missing givenElsewhereCountry for given-elsewhere assertion');
    }

    if (dateGiven) {
      await expect(this.dateGiven).toContainText(convertDateFormat(dateGiven));
    } else {
      await expect(this.dateGiven).toContainText('‒‒/‒‒/‒‒‒‒' /* Figure dashes U+2012 */);
    }

    const facilityDisplayName = await getSidebarFacilityDisplayName(this.page);

    if (givenElsewhereReason) {
      await expect(this.givenElsewhereReason).toContainText(givenElsewhereReason);
    }
    await expect(this.givenElsewhereCountry).toContainText(givenElsewhereCountry);
    await expect(this.status).toContainText('Given elsewhere');
    await expect(this.givenElsewhereFacility).toContainText(facilityDisplayName);
    await expect(this.recordedBy).toContainText('Initial Admin');
    if (category === 'Other') {
      await expect(this.vaccineNameOther).toContainText(vaccineName);
    } else {
      await expect(this.givenVaccineName).toContainText(vaccineName);
    }
  }
}
