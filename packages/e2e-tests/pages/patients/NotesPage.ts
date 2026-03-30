import { Locator, Page, expect } from '@playwright/test';
import { ids } from '@ids';
import { selectOption, selectAutocomplete } from '@helpers/fields';

// ---------------------------------------------------------------------------
// Notes Pane
// ---------------------------------------------------------------------------

export class NotesPane {
  readonly noteTypeFilter: Locator;
  readonly noteTypeSuggestions: Locator;
  readonly readMore: Locator;
  readonly showLess: Locator;
  readonly editIcon: Locator;
  readonly editedButton: Locator;
  readonly dataTable: Locator;
  readonly noDataMessage: Locator;
  readonly noteRows: Locator;
  readonly noteHeaders: Locator;
  readonly noteContents: Locator;
  readonly tableBody: Locator;

  constructor(readonly page: Page) {
    const n = ids.notesPane;
    this.noteTypeFilter = page.getByTestId(n.noteTypeFilter);
    this.noteTypeSuggestions = page.getByTestId(n.noteTypeSuggestions);
    this.readMore = page.getByTestId(n.readMore);
    this.showLess = page.getByTestId(n.showLess);
    this.editIcon = page.getByTestId(n.editIcon);
    this.editedButton = page.getByTestId(n.editedButton);
    this.dataTable = page.getByTestId(n.dataTable);
    this.noDataMessage = page.getByTestId(n.noDataMessage);
    // Table body rows (toolbar uses the same `row-v55c` pattern elsewhere; rows live in the notes table).
    this.noteRows = page.getByTestId(ids.table.table).locator('tbody').locator('tr');
    this.noteHeaders = page.getByTestId(n.noteHeader);
    this.noteContents = page.getByTestId(n.noteContent);
    this.tableBody = page.getByTestId(ids.table.body);
  }

  async waitForNotesLoaded(): Promise<void> {
    await this.dataTable.waitFor({ state: 'visible' });
  }

  async waitForNoteRowsToEqual(count: number): Promise<void> {
    await expect(async () => {
      await expect(this.noteRows).toHaveCount(count);
    }).toPass({ timeout: 10000 });
  }

  async filterByNoteType(type: string): Promise<void> {
    await selectAutocomplete(this.page, this.noteTypeFilter, type);
  }

  async getNoteHeaderTexts(): Promise<string[]> {
    const texts: string[] = [];
    const count = await this.noteHeaders.count();
    for (let i = 0; i < count; i++) {
      texts.push((await this.noteHeaders.nth(i).textContent()) || '');
    }
    return texts;
  }

  async getNoteContentTexts(): Promise<string[]> {
    const texts: string[] = [];
    const count = await this.noteContents.count();
    for (let i = 0; i < count; i++) {
      texts.push((await this.noteContents.nth(i).textContent()) || '');
    }
    return texts;
  }
}

// ---------------------------------------------------------------------------
// New / Edit Note Modal
// ---------------------------------------------------------------------------

export class NoteModal {
  readonly confirmButton: Locator;
  readonly writtenByInput: Locator;
  readonly dateTimeInput: Locator;
  readonly contentTextarea: Locator;
  readonly cancelButton: Locator;
  readonly noteTypeSelect: Locator;
  readonly noteTypeError: Locator;

  constructor(readonly page: Page) {
    const n = ids.noteModal;
    this.confirmButton = page.getByTestId(n.confirmButton);
    this.writtenByInput = page.getByTestId(n.writtenByInput).locator('input');
    this.dateTimeInput = page.getByTestId(n.dateTimeField).locator('input');
    this.contentTextarea = page.getByTestId(n.contentTextarea).locator('textarea').nth(0);
    this.cancelButton = page.getByRole('dialog').getByTestId(n.cancelButton);
    this.noteTypeSelect = page.getByTestId(n.noteTypeSelect);
    this.noteTypeError = page.getByTestId(n.noteTypeError);
  }

  async waitForOpen(): Promise<void> {
    await this.contentTextarea.waitFor({ state: 'visible' });
  }

  async fillAndSubmit(content: string, noteType?: string): Promise<void> {
    if (noteType) {
      await selectOption(this.page, this.noteTypeSelect, noteType);
    }
    await this.contentTextarea.fill(content);
    await this.confirmButton.click();
  }

  async getWrittenByValue(): Promise<string> {
    return this.writtenByInput.inputValue();
  }

  async getDateTimeValue(): Promise<string> {
    return this.dateTimeInput.inputValue();
  }
}

// ---------------------------------------------------------------------------
// Discard Note Modal
// ---------------------------------------------------------------------------

export class DiscardNoteModal {
  readonly cancelButton: Locator;
  readonly confirmButton: Locator;

  constructor(readonly page: Page) {
    this.cancelButton = page.getByTestId(ids.discardNote.cancelButton);
    this.confirmButton = page.getByTestId(ids.discardNote.confirmButton);
  }
}

// ---------------------------------------------------------------------------
// Changelog Modal
// ---------------------------------------------------------------------------

export class ChangelogModal {
  readonly closeButton: Locator;
  readonly infoWrappers: Locator;
  readonly headerDate: Locator;
  readonly noteTypeLabel: Locator;
  readonly changelogDates: Locator;
  readonly changelogTexts: Locator;

  constructor(readonly page: Page) {
    const c = ids.changelog;
    this.closeButton = page.getByTestId(c.closeButton);
    this.infoWrappers = page.getByTestId(c.infoWrapper);
    this.headerDate = page.getByTestId(c.headerDate);
    this.noteTypeLabel = page.getByTestId(c.cardBody).getByTestId(c.cardCell).first().getByTestId(c.cardValue);
    this.changelogDates = this.infoWrappers.getByTestId(c.dateDisplay);
    this.changelogTexts = page.getByRole('dialog').getByTestId(c.infoWrapper).locator('+ span');
  }
}
