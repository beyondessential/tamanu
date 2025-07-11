import { Locator, Page, expect } from '@playwright/test';

import { BasePatientModal } from './BasePatientModal';
import { editFieldOption } from '@utils/fieldHelpers';
import { Vaccine } from 'types/vaccine/Vaccine';

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

  async editFields(vaccine: Partial<Vaccine>) {
    const { batch, dateGiven, injectionSite, area, location, department, givenBy, consentGivenBy } = vaccine;
    let editedInjectionSite = undefined;
    let editedArea = undefined;
    let editedLocation = undefined;
    let editedDepartment = undefined;

    if (batch) {
      await this.batch.fill(batch);
    }

    if (injectionSite) {
    const newInjectionSite = await editFieldOption(this.page, this.injectionSite, {
      optionToAvoid: injectionSite,
      returnOptionText: true,
    });
    editedInjectionSite = newInjectionSite;

    if (!newInjectionSite) {
        throw new Error('Unable to select a new injection site');
      }
    }

    if (dateGiven) {
        await this.dateGiven.fill(dateGiven);
      }

    if (area) {
        const newArea = await editFieldOption(this.page, this.area, {
            fieldType: 'autocompleteFieldOption',
            optionToAvoid: area,
            returnOptionText: true,
        });
        editedArea = newArea;
    }

    if (location) {
        const newLocation = await editFieldOption(this.page, this.location, {
            fieldType: 'autocompleteFieldOption',
            optionToAvoid: location,
            returnOptionText: true,
        });  
        editedLocation = newLocation;
        }

        if (department) {
            const newDepartment = await editFieldOption(this.page, this.department, {
                fieldType: 'autocompleteFieldOption',
                optionToAvoid: department,
                returnOptionText: true,
            });
            editedDepartment = newDepartment;
        }

        if (givenBy) {
            await this.givenBy.fill(givenBy);
        }

        if (consentGivenBy) {
            await this.consentGivenBy.fill(consentGivenBy);
        }

        await this.submitEditsButton.click();
        return {
            batch: batch,
            dateGiven: dateGiven,
            injectionSite: editedInjectionSite,
            area: editedArea,
            location: editedLocation,
            department: editedDepartment,
            givenBy: givenBy,
            consentGivenBy: consentGivenBy,
        }
  }

  async assertUneditableFields(vaccine: Partial<Vaccine>) {
    const { vaccineName, scheduleOption, givenStatus } = vaccine;

    if (!vaccineName || !scheduleOption || !givenStatus) {
      throw new Error('Missing required vaccine fields');
    }

    await expect(this.vaccineName).toContainText(vaccineName);
    await expect(this.schedule).toContainText(scheduleOption);
    await expect(this.givenStatus).toContainText(givenStatus);
    await expect(this.recordedBy).toContainText('Initial Admin');
    await expect(this.facility).toContainText('facility-1');
  }

  async assertEditableFields(vaccine: Partial<Vaccine>) {
    const { batch, dateGiven, injectionSite, area, location, department, givenBy, consentGivenBy } = vaccine;

    if (batch) {
      expect(this.batch).toHaveValue(batch);
    }
  }
}