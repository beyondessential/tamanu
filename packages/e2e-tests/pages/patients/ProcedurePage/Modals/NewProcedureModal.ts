import { Locator, Page } from '@playwright/test';
import { BasePage } from '../../../BasePage';
import { selectAutocompleteFieldOption } from '../../../../utils/fieldHelpers';
import { UnsavedChangesModal } from './UnsavedChangesModal';

/**
 * Page Object for New Procedure Modal
 * Contains all form fields and interactions using getByTestId
 */
export class NewProcedureModal extends BasePage {

  readonly procedureInput!: Locator;
  readonly procedureDateInput!: Locator;
  readonly procedureAreaInput!: Locator;
  readonly procedureLocationInput!: Locator;
  readonly leadClinicianInput!: Locator;
  readonly departmentInput!: Locator;
  readonly anaesthetistInput!: Locator;
  readonly assistantAnaesthetistInput!: Locator;
  readonly anaestheticTypeInput!: Locator;
  readonly timeInInput!: Locator;
  readonly timeOutInput!: Locator;
  readonly timeStartedInput!: Locator;
  readonly timeEndedInput!: Locator;
  readonly notesInput!: Locator;
  readonly completedNotesInput!: Locator;
  readonly completedCheckbox!: Locator;
  readonly completedNotesCollapse!: Locator;
  readonly cancelButton!: Locator;
  readonly dialogActions!: Locator;
  readonly modalTitle!: Locator;
  readonly assistantCliniciansInput!: Locator;
  readonly procedureModalHeader!: Locator;

  readonly saveProcedureButton: Locator;
  
  unsavedChangesModal?: UnsavedChangesModal;

  constructor(page: Page) {
    super(page);
    
    const testIds = {
      procedureInput: 'field-87c2-input',
      procedureDateInput: 'field-3a5v-input',
      procedureAreaInput: 'field-p4ef-group-input',
      procedureLocationInput: 'field-p4ef-location-input',
      leadClinicianInput: 'field-lit6-input',
      departmentInput: 'field-3a5v1-input',
      anaesthetistInput: 'field-96eg-input',
      assistantAnaesthetistInput: 'field-96eg1-input',
      anaestheticTypeInput: 'field-w9b5-input',
      timeInInput: 'field-khml1-input',
      timeOutInput: 'field-hgzz1-input',
      timeStartedInput: 'field-khml-input',
      timeEndedInput: 'field-hgzz-input',
      notesInput: 'field-7en7-input',
      completedNotesInput: 'field-qrv7-input',
      assistantCliniciansInput: 'styledformcontrol-td30', 
     completedCheckbox: 'field-uaz4-controlcheck',
     completedNotesCollapse: 'collapse-e9ow',
     dialogActions: 'dialogactions-jkc6',
     procedureModalHeader: 'verticalcenteredtext-ni4s'
    } as const;
   

    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }
    
    // Special cases that need additional processing
    this.saveProcedureButton = page.getByRole('dialog').getByRole('button').filter({ hasText: 'Save procedure' });
    this.cancelButton = page.getByRole('dialog').getByRole('button').filter({ hasText: 'Cancel' });
    this.modalTitle = page.getByRole('dialog').getByTestId('modaltitle-ojhf');
  }

  async fillRequiredFields() {
    const procedure = await selectAutocompleteFieldOption(this.page, this.procedureInput, { 
      selectFirst: true,
      returnOptionText: true
    });
    const area = await selectAutocompleteFieldOption(this.page, this.procedureAreaInput, { 
      selectFirst: true,
      returnOptionText: true
    });
    const location = await selectAutocompleteFieldOption(this.page, this.procedureLocationInput, { 
      selectFirst: true,
      returnOptionText: true
    });
   

    return { procedure, area, location };
  }     

  async fillAllFields() {
    const requiredFields = await this.fillRequiredFields();
    
    const department = await selectAutocompleteFieldOption(this.page, this.departmentInput, { 
      selectFirst: true,
      returnOptionText: true
    });
    const anaesthetist = await selectAutocompleteFieldOption(this.page, this.anaesthetistInput, { 
      selectFirst: true,
      returnOptionText: true
    });
    const assistantAnaesthetist = await selectAutocompleteFieldOption(this.page, this.assistantAnaesthetistInput, { 
      selectFirst: true,
      returnOptionText: true
    });
    const anaestheticType = await selectAutocompleteFieldOption(this.page, this.anaestheticTypeInput, { 
      selectFirst: true,
      returnOptionText: true
    });

    const timeIn = '09:00';
    const timeOut = '10:00';
    const timeStarted = '09:00';
    const timeEnded = '10:00';
    const notes = 'This is a test note';
    const completedNotes = 'This is a test completed note';

    await this.timeInInput.locator('input').fill(timeIn);
    await this.timeOutInput.locator('input').fill(timeOut);
    await this.timeStartedInput.locator('input').fill(timeStarted);
    await this.timeEndedInput.locator('input').fill(timeEnded);
    await this.notesInput.fill(notes);
    await this.completedCheckbox.check();
    await this.completedNotesInput.fill(completedNotes);

    return {
      ...requiredFields,
      department,
      anaesthetist,
      assistantAnaesthetist,
      anaestheticType,
      timeIn,
      timeOut,
      timeStarted,
      timeEnded,
      notes,
      completedNotes,
    };
  }

  /**
   * Wait for the modal to close
   */
  async waitForModalToClose(): Promise<void> {
    await this.modalTitle.waitFor({ state: 'detached' });
  }

  async waitForModalToLoad(): Promise<void> {
   await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  getLocatorInput(locator: Locator): Locator {
    return locator.locator('input');
  }

  /**
   * Get the Unsaved Changes Modal instance
   */
  getUnsavedChangesModal(): UnsavedChangesModal {
    if (!this.unsavedChangesModal) {
      this.unsavedChangesModal = new UnsavedChangesModal(this.page);
    }
    return this.unsavedChangesModal;
  }
  
}
