import { Locator, Page } from '@playwright/test';
import { selectAutocompleteFieldOption, selectFieldOption } from '@utils/fieldHelpers';

export class AddTaskModal {
  readonly page: Page;

  readonly startDateTimeField!: Locator;
  readonly startDateTimeInput!: Locator;
  readonly requestDateTimeField!: Locator;
  readonly requestDateTimeInput!: Locator;
  readonly requestedByField!: Locator;
  readonly requestedByInput!: Locator;
  readonly notesField!: Locator;
  readonly notesInput!: Locator;
  readonly taskInput!: Locator;
  readonly frequencyValueField!: Locator;
  readonly frequencyValueInput!: Locator;
  readonly frequencyUnitSelect!: Locator;
  readonly durationValueInput!: Locator;
  readonly durationUnitSelect!: Locator;
  readonly highPriorityInput!: Locator;
  readonly assignedToInput!: Locator;
  readonly confirmButton!: Locator;
  readonly cancelButton!: Locator;

  constructor(page: Page) {
    this.page = page;

    const testIds = {
      startDateTimeField: 'field-om46-input',
      requestDateTimeField: 'field-yduo-input',
      requestedByField: 'field-xhot-input',
      notesField: 'field-e475',
      taskInput: 'field-hp09-input',
      frequencyValueField: 'field-7vdy',
      frequencyUnitSelect: 'field-tadr-select',
      durationUnitSelect: 'undefined-select',
      highPriorityInput: 'styledcheckfield-qicr-controlcheck',
      assignedToInput: 'multiselectinput-vf2i',
      confirmButton: 'formsubmitcancelrow-jcmz-confirmButton',
      cancelButton: 'outlinedbutton-8rnr',
    } as const;

    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }

    // Fields that need nested locators
    this.startDateTimeInput = this.startDateTimeField.locator('input');
    this.requestDateTimeInput = this.requestDateTimeField.locator('input');
    this.requestedByInput = this.requestedByField.locator('input');
    this.notesInput = this.notesField.locator('textarea').first();
    this.frequencyValueInput = this.frequencyValueField.locator('input');
    this.durationValueInput = page.locator('input[name="durationValue"]');
    // assignedToInput needs to be the second occurrence
    const assignedToBase = this.assignedToInput;
    this.assignedToInput = assignedToBase.nth(1);
  }

  async waitForModalToLoad(): Promise<void> {
    await this.startDateTimeInput.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async fillForm(values: { 
    taskName: string; 
    notes?: string; 
    isRepeating?: boolean;
    frequencyValue?: number;
    frequencyUnit?: string;
    durationValue?: number;
    durationUnit?: string;
    highPriority?: boolean;
    assignedTo?: string;
  }): Promise<{ name: string; notes?: string, dateTime: string }> {

    const taskName = await selectAutocompleteFieldOption(this.page, this.taskInput, {
      optionToSelect: values.taskName,
      returnOptionText: true,
    });
    
    if (values.notes) {
      await this.notesInput.fill(values.notes);
    }

    if (values.frequencyValue && values.frequencyUnit){
      // Wait for frequency fields to appear after task selection
      await this.frequencyValueInput.waitFor({ state: 'visible' });
      
      // Fill frequency value
      if (values.frequencyValue) {
        await this.frequencyValueInput.fill(values.frequencyValue.toString());
      }
      
      // Select frequency unit
      if (values.frequencyUnit) {
        await selectFieldOption(this.page, this.frequencyUnitSelect, {
          optionToSelect: values.frequencyUnit,
          returnOptionText: false,
        });
      }

      // Fill duration if provided
      if (values.durationValue) {
        await this.durationValueInput.fill(values.durationValue.toString());
      }
      
      if (values.durationUnit) {
        await selectFieldOption(this.page, this.durationUnitSelect, {
          optionToSelect: values.durationUnit,
          returnOptionText: false,
        });
      }
    }

    const dateTime = await this.startDateTimeInput.inputValue();
    if (values.highPriority) {
      await this.highPriorityInput.check();
    }
    if (values.assignedTo) {
    this.assignedToInput.click();
    await this.assignedToInput.getByText(values.assignedTo).click();
    await this.assignedToInput.click();
    }
    return {
      name: taskName || '',
      notes: values.notes || '',  
      dateTime: dateTime || '',
    };
  }
}
