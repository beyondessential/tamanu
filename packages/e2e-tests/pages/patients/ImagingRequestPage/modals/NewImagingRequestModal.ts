import { Locator, Page } from '@playwright/test';
import { selectAutocompleteFieldOption, selectFieldOption } from '../../../../utils/fieldHelpers';

export interface ImagingRequestFormValues {
  orderDateTime?: string;
  requestingClinician?: string;
  priority?: string;
  imagingRequestType?: string;
  areasToBeImaged?: string;
  notes?: string;
}

export class NewImagingRequestModal {
  readonly page: Page;

  readonly imagingRequestCodeInput!: Locator;
  readonly orderDateTimeField!: Locator;
  readonly orderDateTimeInput!: Locator;
  readonly supervisingClinicianInput!: Locator;
  readonly requestingClinicianField!: Locator;
  readonly requestingClinicianInput!: Locator;
  readonly requestingClinicianClearButton!: Locator;
  readonly requestingClinicianExpandIcon!: Locator;
  readonly prioritySelect!: Locator;
  readonly encounterInput!: Locator;
  readonly imagingRequestTypeSelect!: Locator;
  readonly areasToBeImagedSelect!: Locator;
  readonly notesTextarea!: Locator;

  readonly cancelButton!: Locator;
  readonly finaliseButton!: Locator;
  readonly moreActionsButton!: Locator;

  constructor(page: Page) {
    this.page = page;

    const testIds = {
      imagingRequestCodeInput: 'field-6jew-input',
      orderDateTimeField: 'field-xsta-input',
      supervisingClinicianInput: 'textinput-3wnq-input',
      requestingClinicianField: 'field-g6kl-input',
      requestingClinicianClearButton: 'field-g6kl-input-clearbutton',
      requestingClinicianExpandIcon: 'field-g6kl-input-expandmoreicon',
      prioritySelect: 'field-xemr-select',
      encounterInput: 'textinput-tyem-input',
      imagingRequestTypeSelect: 'field-khld-select',
      notesTextarea: 'field-hhqc-input',
      cancelButton: 'outlinedbutton-8rnr',
      moreActionsButton: 'menubutton-dc8o',
    } as const;

    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }

    this.orderDateTimeInput = this.orderDateTimeField.locator('input');
    this.requestingClinicianInput = this.requestingClinicianField.locator('input');
    this.finaliseButton = this.page.getByTestId('formgrid-4uzw').getByTestId('mainbuttoncomponent-06gp');
    this.areasToBeImagedSelect = this.page.getByText('Areas to be imaged').locator('..').getByTestId('multiselectinput-dvij');
  }

  async waitForModalToLoad(): Promise<void> {
    await this.imagingRequestCodeInput.waitFor({ state: 'visible' });
    await this.supervisingClinicianInput.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async fillForm(values: ImagingRequestFormValues) {
    const {
      orderDateTime,
      requestingClinician,
      priority,
      imagingRequestType,
      areasToBeImaged,
      notes
    } = values;

    if (orderDateTime) {
      await this.orderDateTimeInput.fill(orderDateTime);
    }

    let selectedRequestingClinician: string | undefined;
    if (requestingClinician) {
      selectedRequestingClinician = await selectAutocompleteFieldOption(this.page, this.requestingClinicianField, {
        optionToSelect: requestingClinician,
        returnOptionText: true,
      });
    } else {
      selectedRequestingClinician = await selectAutocompleteFieldOption(this.page, this.requestingClinicianField, {
        selectFirst: true,
        returnOptionText: true,
      });
    }


    let selectedPriority: string | undefined;
    if (priority) {
      selectedPriority = await selectFieldOption(this.page, this.prioritySelect, {
        optionToSelect: priority,
        returnOptionText: true,
      });
    } else {
      selectedPriority = await selectFieldOption(this.page, this.prioritySelect, {
        selectFirst: true,
        returnOptionText: true,
      });
    }

    let selectedImagingRequestType: string | undefined;
    if (imagingRequestType) {
      selectedImagingRequestType = await selectFieldOption(this.page, this.imagingRequestTypeSelect, {
        optionToSelect: imagingRequestType,
        returnOptionText: true,
      });
    } else {
      selectedImagingRequestType = await selectFieldOption(this.page, this.imagingRequestTypeSelect, {
        selectFirst: true,
        returnOptionText: true,
      });
    }

    let selectedAreasToBeImaged: string | undefined;
    if (areasToBeImaged) {
      await this.areasToBeImagedSelect.click();
      const option = this.areasToBeImagedSelect.getByText(areasToBeImaged, { exact: true });
      await option.waitFor({ state: 'visible', timeout: 5000 });
      await option.click();
      await this.areasToBeImagedSelect.click(); // Close the multiselect
      selectedAreasToBeImaged = areasToBeImaged;
    }
    else {
      await this.areasToBeImagedSelect.click();
      await this.page.keyboard.press('Enter');
      const textContent = await this.areasToBeImagedSelect.textContent();
      selectedAreasToBeImaged = textContent?.trim() || undefined;
    }

    if (notes !== undefined) {
      await this.notesTextarea.fill(notes);
    }

    return {
      requestingClinician: selectedRequestingClinician,
      priority: selectedPriority,
      imagingRequestType: selectedImagingRequestType,
      areasToBeImaged: selectedAreasToBeImaged
    };
  }
}
