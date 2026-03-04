import { Locator, Page } from '@playwright/test';
import { selectAutocompleteFieldOption, selectFieldOption } from '@utils/fieldHelpers';

export class HospitalAdmissionModal {
  readonly page: Page;

  readonly modalTitle!: Locator;
  readonly modalContainer!: Locator;
  readonly modalContent!: Locator;
  readonly form!: Locator;
  readonly formGrid!: Locator;

  readonly encounterTypeInput!: Locator;
  readonly checkInDateInput!: Locator;
  readonly departmentInput!: Locator;
  readonly clinicianInput!: Locator;
  readonly areaInput!: Locator;
  readonly locationInput!: Locator;
  readonly referralSourceInput!: Locator;
  readonly patientTypeSelect!: Locator;
  readonly dietMultiSelect!: Locator;
  readonly reasonForEncounterInput!: Locator;

  readonly confirmButton!: Locator;
  readonly dialogActions!: Locator;

  constructor(page: Page) {
    this.page = page;

    const testIds = {
      modalContainer: 'modalcontainer-uc2n',
      modalContent: 'modalcontent-bk4w',
      form: 'styledform-5o5i',
      formGrid: 'formgrid-ima9',
      encounterTypeInput: 'field-t9el-input',
      checkInDateInput: 'field-vol8-input',
      departmentInput: 'field-gfz3-input',
      clinicianInput: 'field-o6eb-input',
      areaInput: 'field-25q3-group-input',
      locationInput: 'field-25q3-location-input',
      referralSourceInput: 'localisedfield-3vac-input',
      patientTypeSelect: 'selectinput-phtg-select',
      dietMultiSelect: 'multiselectinput-vf2i',
      reasonForEncounterInput: 'field-o5gm-input',
      confirmButton: 'formsubmitbutton-4ker',
      dialogActions: 'dialogactions-jkc6',
    } as const;

    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }
    this.modalTitle = page.getByRole('dialog').getByTestId('modaltitle-ojhf');

  }

  async waitForModalToLoad(): Promise<void> {
    await this.modalTitle.waitFor({ state: 'visible' });
    await this.checkInDateInput.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async fillHospitalAdmissionForm(values: Record<string, string> = {}): Promise<Record<string, string>> {
    const department = await selectAutocompleteFieldOption(this.page, this.departmentInput, {
      selectFirst: true,
      optionToSelect: values.department,
      returnOptionText: true,
    });
    const clinician = await selectAutocompleteFieldOption(this.page, this.clinicianInput, {
      selectFirst: true,
      optionToSelect: values.clinician,
      returnOptionText: true,
    });
    const area = await selectAutocompleteFieldOption(this.page, this.areaInput, {
      selectFirst: true,
      optionToSelect: values.area,
      returnOptionText: true,
    });
    const location = await selectAutocompleteFieldOption(this.page, this.locationInput, {
      selectFirst: true,
      optionToSelect: values.location,
      returnOptionText: true,
    });
    
    let referralSource = '';
    if (values.referralSource) {
      referralSource = (await selectAutocompleteFieldOption(this.page, this.referralSourceInput, {
        selectFirst: true,
        optionToSelect: values.referralSource,
        returnOptionText: true,
      })) || '';
    }
    
    let patientType = '';
    if (values.patientType) {
      patientType = (await selectFieldOption(this.page, this.patientTypeSelect, {
        selectFirst: true,
        optionToSelect: values.patientType,
        returnOptionText: true,
      })) || '';
    }
    
    let diet = '';
    if (values.diet) {
      diet = (await selectFieldOption(this.page, this.dietMultiSelect, {
        selectFirst: true,
        optionToSelect: values.diet,
        returnOptionText: true,
      })) || '';
    }
    
    let reasonForEncounter = '';
    if (values.reasonForEncounter) {
      await this.reasonForEncounterInput.fill(values.reasonForEncounter);
      reasonForEncounter = values.reasonForEncounter;
    }
    
    return {
      department: department || '',
      clinician: clinician || '',
      area: area || '',
      location: location || '',
      referralSource: referralSource || '',
      patientType: patientType || '',
      diet: diet || '',
      reasonForEncounter: reasonForEncounter || '',
    };
  }
}
