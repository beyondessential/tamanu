import { Page, Locator } from '@playwright/test';
import { NewNoteModal } from '../modals/newNoteModal';
import { EditNoteModal } from '../modals/editNoteModal';
import { UpdateTreatmentPlanModal } from '../modals/updateTreatmentPlanModal';
import { DiscardNoteModal } from '../modals/discardNoteModal';
import { ChangeLogModal } from '../modals/ChangeLogModal';
import { ChangeLogTreatmentPlanModal } from '../modals/ChangeLogTreatmentPlanModal';

export class NotesPane {
  readonly page: Page;

  readonly notesTab!: Locator;

  // Notes section controls
  readonly noteTypeSelect!: Locator;
  readonly newNoteButton!: Locator;
  readonly noteTypeOptions!: Locator;

  // Individual note elements
  readonly noteRows!: Locator;
  readonly noteHeaderTexts!: Locator;
  readonly noteContents!: Locator;
  readonly readMoreButton!: Locator;
  readonly showLessButton!: Locator;
  readonly editIcons!: Locator;
  readonly editedButtons!: Locator;
  readonly tooltips!: Locator;
  readonly noDataMessage!: Locator;
  notesTable!: Locator;

  // Modal properties
  newNoteModal?: NewNoteModal;
  editNoteModal?: EditNoteModal;
  updateTreatmentPlanModal?: UpdateTreatmentPlanModal;
  discardNoteModal?: DiscardNoteModal;
  changeLogModal?: ChangeLogModal;
  changeLogTreatmentPlanModal?: ChangeLogTreatmentPlanModal;

  constructor(page: Page) {
    this.page = page;

    // TestId mapping for NotesPane elements
    const testIds = {
      notesTab: 'styledtab-ccs8-notes',
      noteTypeSelect: 'styledtranslatedselectfield-oy9y-input-outerlabelfieldwrapper',
      newNoteButton: 'component-enxe',
      readMoreButton: 'readmorespan-dpwv',
      showLessButton: 'showlessspan-7kuw',
      editIcons: 'styledediticon-nmdz',
      editedButtons: 'editedbutton-jn5i',
      tooltips: 'tooltip-b4e8',
      notesTable: 'datafetchingtable-qdej',
      noteTypeOptions: 'styledtranslatedselectfield-oy9y-suggestionslist',
      noDataMessage: 'nodatamessage-78ud',
    } as const;

    // Create locators using the testId mapping
    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }
    
    // Special cases that need additional processing
    this.noteRows = page.getByTestId('styledtable-1dlu').locator('tbody').locator('tr');
    this.noteHeaderTexts = page.getByTestId('styledtablebody-a0jz').getByTestId('noteheadertext-e3kq');
    this.noteContents = page.getByTestId('styledtablebody-a0jz').getByTestId('notecontentcontainer-cgxg');
  }

  // Wait for the notes pane to load
  async waitForNotesPaneToLoad() {
    await this.notesTable.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async waitForNoteRowsToEqual(count: number) {
    await this.noteRows.nth(count - 1).waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async selectNoteType(noteType: string) {
    await this.noteTypeSelect.click();
    await this.noteTypeOptions.getByText(noteType).click();
  }

  // Modal getters
  getNewNoteModal(): NewNoteModal {
    if (!this.newNoteModal) {
      this.newNoteModal = new NewNoteModal(this.page);
    }
    return this.newNoteModal;
  }

  getEditNoteModal(): EditNoteModal {
    if (!this.editNoteModal) {
      this.editNoteModal = new EditNoteModal(this.page);
    }
    return this.editNoteModal;
  }

  getUpdateTreatmentPlanModal(): UpdateTreatmentPlanModal {
    if (!this.updateTreatmentPlanModal) {
      this.updateTreatmentPlanModal = new UpdateTreatmentPlanModal(this.page);
    }
    return this.updateTreatmentPlanModal;
  }

  getDiscardNoteModal(): DiscardNoteModal {
    if (!this.discardNoteModal) {
      this.discardNoteModal = new DiscardNoteModal(this.page);
    }
    return this.discardNoteModal;
  }

  getChangeLogModal(): ChangeLogModal {
    if (!this.changeLogModal) {
      this.changeLogModal = new ChangeLogModal(this.page);
    }
    return this.changeLogModal;
  }

  getChangeLogTreatmentPlanModal(): ChangeLogTreatmentPlanModal {
    if (!this.changeLogTreatmentPlanModal) {
      this.changeLogTreatmentPlanModal = new ChangeLogTreatmentPlanModal(this.page);
    }
    return this.changeLogTreatmentPlanModal;
  }

}
