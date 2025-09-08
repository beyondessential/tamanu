import { Locator, Page, expect } from '@playwright/test';

import { BasePatientModal } from './BasePatientModal';
import { editFieldOption } from '@utils/fieldHelpers';
import { Vaccine } from 'types/vaccine/Vaccine';

export class EditVaccineModal extends BasePatientModal {
  readonly modalTitle: Locator;
  readonly vaccineName: Locator;
  readonly vaccineNameOther: Locator;
  readonly schedule: Locator;
  readonly givenStatus: Locator;
  readonly recordedBy: Locator;
  readonly facility: Locator;
  readonly batch: Locator;
  readonly dateGiven: Locator;
  readonly injectionSite: Locator;
  readonly area: Locator;
  readonly areaSearch: Locator;
  readonly location: Locator;
  readonly locationSearch: Locator;
  readonly department: Locator;
  readonly departmentSearch: Locator;
  readonly givenBy: Locator;
  readonly consentCheckbox: Locator;
  readonly consentGivenBy: Locator;
  readonly submitEditsButton: Locator;
  readonly brand: Locator;
  readonly disease: Locator;
  readonly reason: Locator;
  readonly notGivenClinician: Locator;
  readonly closeModalButton: Locator;
  readonly areaFieldClearButton: Locator;
  readonly locationFieldClearButton: Locator;
  readonly departmentFieldClearButton: Locator;
  readonly areaRequiredError: Locator;
  readonly locationRequiredError: Locator;
  readonly departmentRequiredError: Locator;
  readonly consentRequiredError: Locator;

  constructor(page: Page) {
    super(page);
    this.modalTitle = this.page.getByTestId('modaltitle-ojhf');
    this.vaccineName = this.page.getByTestId('displayfield-jkpx-vaccine-translatedtext-igtk');
    this.vaccineNameOther = this.page.getByTestId('displayfield-jkpx-vaccine-translatedtext-jbi4');
    this.schedule = this.page.getByTestId('displayfield-jkpx-vaccine-translatedtext-s88j');
    this.givenStatus = this.page.getByTestId('displayfield-jkpx-vaccine-translatedtext-qgo7');
    this.recordedBy = this.page.getByTestId('displayfield-jkpx-vaccine-translatedtext-e9ru');
    this.facility = this.page.getByTestId('displayfield-jkpx-vaccine-translatedtext-iukb');
    this.batch = this.page.getByTestId('field-865y-input');
    this.dateGiven = this.page.getByTestId('field-8sou-input').getByRole('textbox');
    this.injectionSite = this.page.getByTestId('field-jz48-select');
    this.area = this.page.getByTestId('field-zrlv-group-input');
    this.areaSearch = this.page
      .getByTestId('field-zrlv-group-input')
      .getByRole('textbox', { name: 'Search...' });
    this.location = this.page.getByTestId('field-zrlv-location-input');
    this.locationSearch = this.page
      .getByTestId('field-zrlv-location-input')
      .getByRole('textbox', { name: 'Search...' });
    this.department = this.page.getByTestId('field-5sfc-input');
    this.departmentSearch = this.page
      .getByTestId('field-5sfc-input')
      .getByRole('textbox', { name: 'Search...' });
    this.givenBy = this.page.getByTestId('field-xycc-input');
    this.consentCheckbox = this.page.getByTestId('consentfield-rvwt-controlcheck');
    this.consentGivenBy = this.page.getByTestId('field-inc8-input');
    this.submitEditsButton = this.page.getByTestId('formsubmitcancelrow-vv8q-confirmButton');
    this.brand = this.page.getByTestId('field-f1vm-input');
    this.disease = this.page.getByTestId('field-gcfk-input');
    this.reason = this.page.getByTestId('selectinput-phtg-select');
    this.notGivenClinician = this.page.getByTestId('field-xycc-input');
    this.closeModalButton = this.page.getByTestId('iconbutton-eull');
    this.areaFieldClearButton = this.page.getByTestId('field-zrlv-group-input-clearbutton');
    this.locationFieldClearButton = this.page.getByTestId('field-zrlv-location-input-clearbutton');
    this.departmentFieldClearButton = this.page.getByTestId('field-5sfc-input-clearbutton');
    this.areaRequiredError = this.page
      .getByTestId('field-zrlv-group-input-outerlabelfieldwrapper')
      .getByText('*Required');
    this.locationRequiredError = this.page
      .getByTestId('field-zrlv-location-input-outerlabelfieldwrapper')
      .getByText('*Required');
    this.departmentRequiredError = this.page
      .getByTestId('field-5sfc-input-outerlabelfieldwrapper')
      .getByText('*Required');
    this.consentRequiredError = this.page.getByTestId('formhelpertext-2d0o');
  }

  async editFields(vaccine: Partial<Vaccine>) {
    const {
      batch,
      dateGiven,
      injectionSite,
      area,
      location,
      department,
      givenBy,
      consentGivenBy,
      fillOptionalFields,
      brand,
      disease,
      notGivenReason,
      notGivenClinician,
    } = vaccine;
    const editedFields: Partial<Vaccine> = {};

    if (batch) {
      await this.batch.fill(batch);
      editedFields.batch = batch;
    }

    if (injectionSite) {
      const newInjectionSite = await editFieldOption(this.page, this.injectionSite, {
        optionToAvoid: injectionSite,
        returnOptionText: true,
      });
      if (!newInjectionSite) {
        throw new Error('Unable to select a new injection site');
      }
      editedFields.injectionSite = newInjectionSite;
    }

    if (dateGiven) {
      await this.dateGiven.fill(dateGiven);
      editedFields.dateGiven = dateGiven;
    }

    if (area) {
      const newArea = await editFieldOption(this.page, this.area, {
        fieldType: 'autocompleteFieldOption',
        optionToAvoid: area,
        returnOptionText: true,
      });
      editedFields.area = newArea;
    }

    if (location) {
      const newLocation = await editFieldOption(this.page, this.location, {
        fieldType: 'autocompleteFieldOption',
        optionToAvoid: location,
        returnOptionText: true,
      });
      editedFields.location = newLocation;
    }

    if (department) {
      const newDepartment = await editFieldOption(this.page, this.department, {
        fieldType: 'autocompleteFieldOption',
        optionToAvoid: department,
        returnOptionText: true,
      });
      editedFields.department = newDepartment;
    }

    if (givenBy) {
      await this.givenBy.fill(givenBy);
      editedFields.givenBy = givenBy;
    }

    if (consentGivenBy) {
      await this.consentGivenBy.fill(consentGivenBy);
      editedFields.consentGivenBy = consentGivenBy;
    }

    if (brand) {
      await this.brand.fill(brand);
      editedFields.brand = brand;
    }

    if (disease) {
      await this.disease.fill(disease);
      editedFields.disease = disease;
    }

    if (notGivenReason) {
      const newReason = await editFieldOption(this.page, this.reason, {
        optionToAvoid: notGivenReason,
        returnOptionText: true,
      });
      editedFields.notGivenReason = newReason;
    }

    if (notGivenClinician) {
      await this.notGivenClinician.fill(notGivenClinician);
      editedFields.notGivenClinician = notGivenClinician;
    }

    //Sets fillOptionalFields to true if a user has edited a field that was originally skipped
    if (!fillOptionalFields && (editedFields.batch || editedFields.injectionSite)) {
      editedFields.fillOptionalFields = true;
    }

    await this.submitEditsButton.click();
    //Confirm the modal is closed before progressing
    await expect(this.modalTitle).not.toBeVisible();

    return editedFields;
  }

  async assertUneditableFields(vaccine: Partial<Vaccine>) {
    const { vaccineName, scheduleOption, givenStatus, category } = vaccine;

    if (!vaccineName || !scheduleOption || !givenStatus) {
      throw new Error('Missing required vaccine fields');
    }

    await expect(category === 'Other' ? this.vaccineNameOther : this.vaccineName).toContainText(
      vaccineName,
    );
    if (category !== 'Other') {
      await expect(this.schedule).toContainText(scheduleOption);
    }
    await expect(this.givenStatus).toContainText(givenStatus);
    await expect(this.recordedBy).toContainText('Initial Admin');
    if (givenStatus !== 'Not given') {
      await expect(this.facility).toContainText('facility-1');
    }
  }

  async assertEditableFields(vaccine: Partial<Vaccine>) {
    const {
      batch,
      dateGiven,
      injectionSite,
      area,
      location,
      department,
      givenBy,
      consentGivenBy,
      brand,
      disease,
      notGivenReason,
      notGivenClinician,
    } = vaccine;

    if (batch) {
      await expect(this.batch).toHaveValue(batch);
    }

    if (dateGiven) {
      await expect(this.dateGiven).toHaveValue(dateGiven);
    }

    if (injectionSite) {
      await expect(this.injectionSite).toContainText(injectionSite);
    }

    if (area) {
      await expect(this.areaSearch).toHaveValue(area);
    }

    if (location) {
      await expect(this.locationSearch).toHaveValue(location);
    }

    if (department) {
      await expect(this.departmentSearch).toHaveValue(department);
    }

    if (givenBy) {
      await expect(this.givenBy).toHaveValue(givenBy);
    }

    if (consentGivenBy) {
      await expect(this.consentGivenBy).toHaveValue(consentGivenBy);
    }

    if (brand) {
      await expect(this.brand).toHaveValue(brand);
    }

    if (disease) {
      await expect(this.disease).toHaveValue(disease);
    }

    if (notGivenReason) {
      await expect(this.reason).toContainText(notGivenReason);
    }

    if (notGivenClinician) {
      await expect(this.notGivenClinician).toHaveValue(notGivenClinician);
    }
  }

  async clearAllFields() {
    //Note: location field is cleared automatically due to area being cleared
    await this.areaFieldClearButton.click();
    await this.departmentFieldClearButton.click();
    await this.consentCheckbox.click();
  }

  async assertRequiredFieldErrors() {
    const errorFields = [
      this.areaRequiredError,
      this.locationRequiredError,
      this.departmentRequiredError,
      this.consentRequiredError,
    ];

    for (const errorField of errorFields) {
      await expect(errorField).toContainText('Required');
    }
  }
}
