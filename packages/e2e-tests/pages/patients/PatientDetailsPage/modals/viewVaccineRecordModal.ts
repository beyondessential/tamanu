import { Locator, Page, expect } from '@playwright/test';

import { BasePatientModal } from './BasePatientModal';
import {
  RequiredVaccineModalAssertionParams,
  OptionalVaccineModalAssertionParams,
} from '../../../../types/vaccine/ViewVaccineModalAssertions';
import { convertDateFormat } from '../../../../utils/testHelper';

export class ViewVaccineRecordModal extends BasePatientModal {
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
  }

  async waitForModalToOpen() {
    // Wait for modal content to load before progressing
    await expect(this.area).toBeVisible();
  }

  async assertVaccineModalRequiredFields(requiredParams: RequiredVaccineModalAssertionParams) {
    const { vaccineName, date, area, location, department, given, category } = requiredParams;

    await expect(this.area).toContainText(area);
    await expect(this.location).toContainText(location);
    await expect(this.department).toContainText(department);

    if (category === 'Other') {
      await expect(this.vaccineNameOther).toContainText(vaccineName);
    } else {
      await expect(this.givenVaccineName).toContainText(vaccineName);
    }

    if (given) {
      await expect(this.givenStatus).toContainText('Given');
      await expect(this.dateGiven).toContainText(convertDateFormat(date));
    } else {
      await expect(this.givenStatus).toContainText('Not given');
      await expect(this.dateNotGiven).toContainText(convertDateFormat(date));
    }
  }

  async assertVaccineModalOptionalFields(
    requiredParams: RequiredVaccineModalAssertionParams,
    optionalParams: OptionalVaccineModalAssertionParams,
  ) {
    await this.assertVaccineModalRequiredFields(requiredParams);

    const { given, category } = requiredParams;

    const {
      batch,
      schedule,
      injectionSite,
      givenBy,
      brand,
      disease,
      notGivenClinician,
      notGivenReason,
    } = optionalParams;

    if (category === 'Other') {
      await expect(this.otherDisease).toContainText(disease!);
    } else {
      await expect(this.scheduleOption).toContainText(schedule!);
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
}
