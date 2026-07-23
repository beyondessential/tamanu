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

  // Search bar filters
  readonly searchInput!: Locator;
  readonly authorSelect!: Locator;
  readonly authorOptions!: Locator;
  readonly advancedSearchToggle!: Locator;
  readonly clearButton!: Locator;
  readonly dateFromField!: Locator;
  readonly dateToField!: Locator;

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
      readMoreButton: 'readmorespan-dpwv',
      showLessButton: 'showlessspan-7kuw',
      editIcons: 'styledediticon-nmdz',
      editedButtons: 'editedbutton-jn5i',
      tooltips: 'tooltip-b4e8',
      notesTable: 'datafetchingtable-qdej',
      noteTypeOptions: 'field-notes-type-suggestionslist',
      noDataMessage: 'nodatamessage-78ud',
      // Search bar filters
      searchInput: 'field-notes-search-input',
      authorOptions: 'field-notes-author-suggestionslist',
      advancedSearchToggle: 'notes-search-expand',
      clearButton: 'notes-search-clear',
      dateFromField: 'field-notes-from-date',
      dateToField: 'field-notes-to-date',
    } as const;

    // Create locators using the testId mapping
    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }

    // The note-type and author filters are AutocompleteFields. The bare `field-notes-type` /
    // `field-notes-author` data-testid is only a prefix; the clickable input is exposed under the
    // `-input` suffix (the suggestions list stays `-suggestionslist`). Clicking the input focuses it,
    // which fetches and shows the full option list.
    this.noteTypeSelect = page.getByTestId('field-notes-type-input').locator('input');
    this.authorSelect = page.getByTestId('field-notes-author-input').locator('input');

    // The New note button now lives in the notes search bar alongside the filters.
    this.newNoteButton = page
      .getByTestId('notes-search-bar')
      .getByRole('button', { name: 'New note' });

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

  // Free-text search over note content (debounced; assertions auto-wait for the result).
  async searchNotes(text: string) {
    await this.searchInput.fill(text);
  }

  async selectAuthor(author: string) {
    await this.authorSelect.click();
    await this.authorOptions.getByText(author).click();
  }

  async openAdvancedSearch() {
    await this.advancedSearchToggle.click();
  }

  async clearFilters() {
    await this.clearButton.click();
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
