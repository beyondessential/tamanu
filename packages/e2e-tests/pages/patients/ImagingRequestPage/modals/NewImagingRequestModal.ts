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
      notes
    } = values;

    if (orderDateTime) {
      await this.orderDateTimeInput.fill(orderDateTime);
    }

    const selectedRequestingClinician = await selectAutocompleteFieldOption(this.page, this.requestingClinicianField, {
      optionToSelect: requestingClinician ?? null,
      selectFirst: !requestingClinician,
      returnOptionText: true,
    });
   

    const selectedPriority = await selectFieldOption(this.page, this.prioritySelect, {
      optionToSelect: priority ?? null,
      selectFirst: !priority,
      returnOptionText: true,
    });

    const selectedImagingRequestType = await selectFieldOption(this.page, this.imagingRequestTypeSelect, {
      optionToSelect: imagingRequestType ?? null,
      selectFirst: !imagingRequestType,
      returnOptionText: true,
    });

    await this.areasToBeImagedSelect.click();
    await this.page.keyboard.press('Enter'); 

    if (notes !== undefined) {
      await this.notesTextarea.fill(notes);
    }

    return {
      requestingClinician: selectedRequestingClinician,
      priority: selectedPriority,
      imagingRequestType: selectedImagingRequestType
    };
  }
}
