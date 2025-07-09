import { Locator, Page, expect } from '@playwright/test';

import { BasePatientModal } from './BasePatientModal';
import { selectFieldOption, editFieldOption } from '@utils/fieldHelpers';

export class EditVaccineModal extends BasePatientModal {
  readonly vaccineName: Locator;
  readonly schedule: Locator;
  readonly givenStatus: Locator;
  readonly recordedBy: Locator;
  readonly facility: Locator;
  readonly batch: Locator;
  readonly dateGiven: Locator;
  readonly injectionSite: Locator;
  readonly area: Locator;
  readonly location: Locator;
  readonly department: Locator;
  readonly givenBy: Locator;
  readonly consentCheckbox: Locator;
  readonly consentGivenBy: Locator;
  readonly submitEditsButton: Locator;

  constructor(page: Page) {
    super(page);
    this.vaccineName = this.page.getByTestId('displayfield-jkpx-vaccine-translatedtext-igtk');
    this.schedule = this.page.getByTestId('displayfield-jkpx-vaccine-translatedtext-s88j');
    this.givenStatus = this.page.getByTestId('displayfield-jkpx-vaccine-translatedtext-qgo7');
    this.recordedBy = this.page.getByTestId('displayfield-jkpx-vaccine-translatedtext-e9ru');
    this.facility = this.page.getByTestId('displayfield-jkpx-vaccine-translatedtext-iukb');
    this.batch = this.page.getByTestId('field-865y-input');
    this.dateGiven = this.page.getByTestId('field-8sou-input').getByRole('textbox');
    this.injectionSite = this.page.getByTestId('field-jz48-select');
    this.area = this.page.getByTestId('field-zrlv-group-input');
    this.location = this.page.getByTestId('field-zrlv-location-input');
    this.department = this.page.getByTestId('field-5sfc-input');
    this.givenBy = this.page.getByTestId('field-xycc-input');
    this.consentCheckbox = this.page.getByTestId('consentfield-rvwt-controlcheck');
    this.consentGivenBy = this.page.getByTestId('field-inc8-input');
    this.submitEditsButton = this.page.getByTestId('formsubmitcancelrow-vv8q-confirmButton');
  }

  async editFields(fields: {
    batch?: string;
    dateGiven?: string;
    injectionSite?: string;
    area?: string;
    location?: string;
    department?: string;
    givenBy?: string;
    consentCheckbox?: boolean;
    consentGivenBy?: string;
  }) {
    let injectionSite = undefined;
    let area = undefined;
    let location = undefined;
    let department = undefined;

    if (fields.batch) {
      await this.batch.fill(fields.batch);
    }

    if (fields.injectionSite) {
    const newInjectionSite = await editFieldOption(this.page, this.injectionSite, {
      optionToAvoid: fields.injectionSite,
      returnOptionText: true,
    });
    injectionSite = newInjectionSite;

    if (!newInjectionSite) {
        throw new Error('Unable to select a new injection site');
      }
    }

    if (fields.dateGiven) {
        await this.dateGiven.fill(fields.dateGiven);
      }

    if (fields.area) {
        console.log('fields.area', fields.area);
        const newArea = await editFieldOption(this.page, this.area, {
            fieldType: 'autocompleteFieldOption',
            optionToAvoid: fields.area,
            returnOptionText: true,
        });
        console.log('newArea', newArea);
        area = newArea;
    }

    if (fields.location) {
        console.log('fields.location', fields.location);
        const newLocation = await editFieldOption(this.page, this.location, {
            fieldType: 'autocompleteFieldOption',
            optionToAvoid: fields.location,
            returnOptionText: true,
        });  
        console.log('newLocation', newLocation);
        location = newLocation;
        }

        if (fields.department) {
            console.log('fields.department', fields.department);
            const newDepartment = await editFieldOption(this.page, this.department, {
                fieldType: 'autocompleteFieldOption',
                optionToAvoid: fields.department,
                returnOptionText: true,
            });
            console.log('newDepartment', newDepartment);
            department = newDepartment;
        }

        if (fields.givenBy) {
            await this.givenBy.fill(fields.givenBy);
        }

        if (fields.consentGivenBy) {
            await this.consentGivenBy.fill(fields.consentGivenBy);
        }

        if (fields.consentCheckbox) {
        //This will intentionally trigger a validation error if the box is already checked
            await this.consentCheckbox.click();
        }

        await this.submitEditsButton.click();
        return {
            batch: fields.batch,
            dateGiven: fields.dateGiven,
            injectionSite: injectionSite,
            area: area,
            location: location,
            department: department,
            givenBy: fields.givenBy,
            consentGivenBy: fields.consentGivenBy,
        }
  }
}
