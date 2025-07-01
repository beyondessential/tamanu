import { Locator, Page } from '@playwright/test';

import { BasePatientModal } from './BasePatientModal';

export class ViewVaccineRecordModal extends BasePatientModal {
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
    this.notGivenSupervisingClinician = this.page.getByTestId('displayfield-jkpx-recorded-translatedtext-qoi6');
    this.otherBrand = this.page.getByTestId('displayfield-jkpx-vaccine-translatedtext-q3yc');
  }

}
