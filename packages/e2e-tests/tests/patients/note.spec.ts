import { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/test';
import { getUser } from '../../fixtures/api';
import { seeds } from '@data/seeds';
import { toIsoDateTime } from '@helpers/dates';
import {
  NotesPane,
  NoteModal,
  DiscardNoteModal,
  ChangelogModal,
} from '@pages/patients/NotesPage';
import { PrepareDischargeModal } from '@pages/patients/PatientDetailsPage/modals/PrepareDischargeModal';
import { User } from '@tamanu/database';

function newNoteToolbarButton(page: Page) {
  return page.getByTestId('row-v55c').getByRole('button', { name: 'New note' });
}

async function waitForNoteModalClosed(noteModal: NoteModal): Promise<void> {
  await expect(noteModal.contentTextarea).toBeHidden({ timeout: 15000 });
}

test.describe('Notes Tests', () => {
  let user: User;

  const NOTE_TYPES = {
    TREATMENT_PLAN: 'Treatment plan',
    DISCHARGE_PLANNING: 'Discharge planning',
    OTHER: 'Other',
    MEDICAL: 'Medical',
  } as const;

  test.beforeEach(async ({ newPatientWithHospitalAdmission, patientDetailsPage, api, page }) => {
    user = await getUser(api);
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.navigateToNotesTab();
    const notesPane = new NotesPane(page);
    await notesPane.waitForNotesLoaded();
  });

  test.describe('Create Note Tests', () => {
    test('[T-0186][AT-0075]should create a treatment plan note with basic details', async ({
      page,
    }) => {
      const notesPane = new NotesPane(page);
      const noteContent = 'This is a test treatment plan note';
      const noteModal = new NoteModal(page);
      await newNoteToolbarButton(page).click();
      await noteModal.waitForOpen();
      await noteModal.fillAndSubmit(noteContent, NOTE_TYPES.TREATMENT_PLAN);
      await waitForNoteModalClosed(noteModal);
      await notesPane.waitForNotesLoaded();

      await expect(notesPane.noteHeaders.first()).toHaveText(NOTE_TYPES.TREATMENT_PLAN);
      await expect(notesPane.noteContents.first()).toContainText(noteContent);
    });

    test('[T-0186][AT-0076]should create a discharge planning note and validate it is shown in the discharge modal', async ({
      page,
      patientDetailsPage,
    }) => {
      const notesPane = new NotesPane(page);
      const noteContent = 'This is a discharge planning note';
      const noteModal = new NoteModal(page);
      await newNoteToolbarButton(page).click();
      await noteModal.waitForOpen();
      await noteModal.fillAndSubmit(noteContent, NOTE_TYPES.DISCHARGE_PLANNING);
      await waitForNoteModalClosed(noteModal);
      await notesPane.waitForNotesLoaded();

      await expect(notesPane.noteHeaders.first()).toHaveText(NOTE_TYPES.DISCHARGE_PLANNING);
      await expect(notesPane.noteContents.first()).toContainText(noteContent);

      await patientDetailsPage.prepareDischargeButton.click();
      const prepareDischargeModal = new PrepareDischargeModal(page);
      await prepareDischargeModal.waitForModalToLoad();
      await expect(prepareDischargeModal.dischargeNoteTextarea).toContainText(noteContent);
      await prepareDischargeModal.cancelButton.click();
    });

    test('[T-0186][AT-0077]should create an other note with basic details', async ({ page }) => {
      const notesPane = new NotesPane(page);
      const noteContent = 'This is a test other note';
      const noteModal = new NoteModal(page);
      await newNoteToolbarButton(page).click();
      await noteModal.waitForOpen();
      await noteModal.fillAndSubmit(noteContent, NOTE_TYPES.OTHER);
      await waitForNoteModalClosed(noteModal);
      await notesPane.waitForNotesLoaded();

      await expect(notesPane.noteHeaders.first()).toHaveText(NOTE_TYPES.OTHER);
      await expect(notesPane.noteContents.first()).toContainText(noteContent);
    });

    test('[T-0186][AT-0078]should validate form field values when creating a note', async ({
      page,
    }) => {
      const notesPane = new NotesPane(page);
      const noteContent = 'This is a test note for validation';
      const noteModal = new NoteModal(page);
      await newNoteToolbarButton(page).click();
      await noteModal.waitForOpen();

      await noteModal.noteTypeSelect.click();
      await noteModal.noteTypeSelect.getByText(NOTE_TYPES.OTHER, { exact: true }).click();
      await noteModal.contentTextarea.fill(noteContent);

      await expect(await noteModal.getWrittenByValue()).toBe(user.displayName);
      await expect(toIsoDateTime(await noteModal.getDateTimeValue())).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
      );

      await noteModal.confirmButton.click();
      await waitForNoteModalClosed(noteModal);
      await notesPane.waitForNotesLoaded();

      await expect(notesPane.noteHeaders.first()).toHaveText(NOTE_TYPES.OTHER);
      await expect(notesPane.noteContents.first()).toContainText(noteContent);
    });

    test('[T-0186][AT-0079]should not allow creating a note without required fields', async ({
      page,
    }) => {
      const noteModal = new NoteModal(page);
      await newNoteToolbarButton(page).click();
      await noteModal.waitForOpen();

      await noteModal.confirmButton.click();

      await expect(noteModal.noteTypeError.getByText('*Required')).toBeVisible();
      await expect(
        page.getByTestId('field-wxzr').locator('p').getByText('*Required'),
      ).toBeVisible();
    });

    test('[T-0186][AT-0080]should allow cancelling note creation', async ({ page }) => {
      const notesPane = new NotesPane(page);
      const noteModal = new NoteModal(page);
      const discardNoteModal = new DiscardNoteModal(page);
      await newNoteToolbarButton(page).click();
      await noteModal.waitForOpen();
      await noteModal.noteTypeSelect.click();
      await noteModal.noteTypeSelect.getByText(NOTE_TYPES.OTHER, { exact: true }).click();
      await noteModal.contentTextarea.fill('this is test note');
      await noteModal.cancelButton.click();
      await expect(discardNoteModal.confirmButton).toBeVisible();
      await discardNoteModal.confirmButton.click();
      await expect(discardNoteModal.confirmButton).toBeHidden();
      await waitForNoteModalClosed(noteModal);
      await notesPane.waitForNotesLoaded();

      const noteContent = await notesPane.noDataMessage.textContent();
      expect(noteContent).toBe(
        'This patient has no notes to display. Click ‘New note’ to add a note.',
      );
    });
  });

  test.describe('Edit Note Tests', () => {
    test('[T-0191][AT-0081]should edit an existing note and view the change log', async ({
      page,
    }) => {
      const notesPane = new NotesPane(page);
      const noteModal = new NoteModal(page);
      const changelogModal = new ChangelogModal(page);
      const originalContent = 'Original note content';
      const updatedContent = 'Updated note content';
      const noteType = NOTE_TYPES.OTHER;

      await newNoteToolbarButton(page).click();
      await noteModal.waitForOpen();
      await noteModal.fillAndSubmit(originalContent, noteType);
      await waitForNoteModalClosed(noteModal);
      await notesPane.waitForNotesLoaded();

      await notesPane.editIcon.nth(0).click();
      await noteModal.waitForOpen();
      await noteModal.contentTextarea.fill(updatedContent);
      await noteModal.confirmButton.click();
      await waitForNoteModalClosed(noteModal);
      await notesPane.waitForNotesLoaded();

      await expect(notesPane.noteContents.first()).toContainText(updatedContent);

      await notesPane.editedButton.first().click();
      await expect(changelogModal.noteTypeLabel).toBeVisible();

      await expect(changelogModal.noteTypeLabel).toHaveText(noteType);

      await expect(changelogModal.changelogTexts.first()).toContainText(updatedContent);
      await expect(changelogModal.changelogTexts.nth(1)).toContainText(originalContent);

      const newerChangeLogDate = (await changelogModal.changelogDates.nth(1).textContent())!.trim();
      await expect(changelogModal.headerDate).toHaveText(newerChangeLogDate);
      await expect(changelogModal.infoWrappers.first()).toContainText(user.displayName);
      await changelogModal.closeButton.click();
    });

    test('[T-0191][AT-0082]should update a treatment plan note and validate the change log', async ({
      page,
    }) => {
      test.setTimeout(50000);
      const notesPane = new NotesPane(page);
      const noteModal = new NoteModal(page);
      const changelogModal = new ChangelogModal(page);
      const originalContent = 'Original treatment plan';
      const updatedContent = 'Updated treatment plan';

      await newNoteToolbarButton(page).click();
      await noteModal.waitForOpen();
      await noteModal.fillAndSubmit(originalContent, NOTE_TYPES.TREATMENT_PLAN);
      await waitForNoteModalClosed(noteModal);
      await notesPane.waitForNotesLoaded();

      await notesPane.editIcon.first().click();
      await noteModal.waitForOpen();
      await noteModal.contentTextarea.fill(updatedContent);
      await noteModal.confirmButton.click();
      await waitForNoteModalClosed(noteModal);
      await notesPane.waitForNotesLoaded();

      await expect(notesPane.noteContents.first()).toContainText(updatedContent, { timeout: 15000 });

      await notesPane.editedButton.first().click();
      await expect(changelogModal.noteTypeLabel).toBeVisible();

      await expect(changelogModal.noteTypeLabel).toHaveText(NOTE_TYPES.TREATMENT_PLAN);

      await expect(changelogModal.changelogTexts.first()).toContainText(updatedContent);
      await expect(changelogModal.changelogTexts.nth(1)).toContainText(originalContent);

      await changelogModal.closeButton.click();
    });

    test('[T-0191][AT-0083]should edit an discharge planning note and validate it is shown in the discharge modal', async ({
      page,
      patientDetailsPage,
    }) => {
      const notesPane = new NotesPane(page);
      const noteModal = new NoteModal(page);
      const originalContent = 'Original note content';
      const updatedContent = 'Updated note content';

      await newNoteToolbarButton(page).click();
      await noteModal.waitForOpen();
      await noteModal.fillAndSubmit(originalContent, NOTE_TYPES.DISCHARGE_PLANNING);
      await waitForNoteModalClosed(noteModal);
      await notesPane.waitForNotesLoaded();

      await notesPane.editIcon.nth(0).click();
      await noteModal.waitForOpen();
      await noteModal.contentTextarea.fill(updatedContent);
      await noteModal.confirmButton.click();
      await waitForNoteModalClosed(noteModal);

      await expect(notesPane.noteContents.first()).toContainText(updatedContent);
      await patientDetailsPage.prepareDischargeButton.click();
      const prepareDischargeModal = new PrepareDischargeModal(page);
      await prepareDischargeModal.waitForModalToLoad();
      await expect(prepareDischargeModal.dischargeNoteTextarea).toHaveText(updatedContent);
    });

    test('[AT-0084]should show edited indicator after editing a note', async ({ page }) => {
      const notesPane = new NotesPane(page);
      const noteModal = new NoteModal(page);
      const originalContent = 'Original note content';
      const updatedContent = 'Updated note content';

      await newNoteToolbarButton(page).click();
      await noteModal.waitForOpen();
      await noteModal.fillAndSubmit(originalContent, NOTE_TYPES.OTHER);
      await waitForNoteModalClosed(noteModal);
      await notesPane.waitForNotesLoaded();

      await notesPane.editIcon.nth(0).click();
      await noteModal.waitForOpen();
      await noteModal.contentTextarea.fill(updatedContent);
      await noteModal.confirmButton.click();
      await waitForNoteModalClosed(noteModal);

      await expect(notesPane.editedButton.first()).toBeVisible();
    });

    test('[T-0191][AT-0085]should allow cancelling note edit', async ({ page }) => {
      const notesPane = new NotesPane(page);
      const noteModal = new NoteModal(page);
      const discardNoteModal = new DiscardNoteModal(page);
      const originalContent = 'Original note content';
      const updatedContent = 'Updated note content';

      await newNoteToolbarButton(page).click();
      await noteModal.waitForOpen();
      await noteModal.fillAndSubmit(originalContent, NOTE_TYPES.OTHER);
      await waitForNoteModalClosed(noteModal);
      await notesPane.waitForNotesLoaded();

      await notesPane.editIcon.nth(0).click();
      await noteModal.waitForOpen();
      await noteModal.contentTextarea.fill(updatedContent);
      await noteModal.cancelButton.click();
      await expect(discardNoteModal.confirmButton).toBeVisible();
      await discardNoteModal.confirmButton.click();
      await expect(discardNoteModal.confirmButton).toBeHidden();

      await expect(notesPane.noteContents.first()).toContainText(originalContent);
    });
  });

  test.describe('Notes Table Tests', () => {
    test.setTimeout(60000);
    test('[T-0189][AT-0086]treatment plan note should appear on top when creating multiple notes', async ({
      page,
    }) => {
      const notesPane = new NotesPane(page);
      const notes = [
        { type: NOTE_TYPES.DISCHARGE_PLANNING, content: 'Discharge planning note' },
        { type: NOTE_TYPES.OTHER, content: 'Other note' },
        { type: NOTE_TYPES.TREATMENT_PLAN, content: 'Treatment plan note' },
      ];

      for (const note of notes) {
        await newNoteToolbarButton(page).click();
        const noteModal = new NoteModal(page);
        await noteModal.waitForOpen();
        await noteModal.fillAndSubmit(note.content, note.type);
        await waitForNoteModalClosed(noteModal);
        await notesPane.waitForNotesLoaded();
      }
      await notesPane.waitForNoteRowsToEqual(3);

      const noteCount = await notesPane.noteRows.count();
      expect(noteCount).toBe(notes.length);

      await expect(notesPane.noteHeaders.first()).toHaveText(NOTE_TYPES.TREATMENT_PLAN);
      await expect(notesPane.noteContents.first()).toHaveText(notes[2].content);

      for (let i = 1; i < notes.length; i++) {
        const noteIndex = notes.length - 1 - i;
        await expect(notesPane.noteHeaders.nth(i)).toHaveText(notes[noteIndex].type);
        await expect(notesPane.noteContents.nth(i)).toContainText(notes[noteIndex].content);
      }
    });

    test('[T-0190][AT-0087]should display read more and show less button when note content is too long', async ({
      page,
    }) => {
      const notesPane = new NotesPane(page);
      const noteContent = seeds.noteContent;
      const noteModal = new NoteModal(page);
      await newNoteToolbarButton(page).click();
      await noteModal.waitForOpen();
      await noteModal.fillAndSubmit(noteContent, NOTE_TYPES.MEDICAL);
      await waitForNoteModalClosed(noteModal);
      await notesPane.waitForNotesLoaded();
      await expect(notesPane.noteContents.first()).toContainText(noteContent);
      await expect(notesPane.readMore.first()).toBeVisible();
      await notesPane.readMore.first().click();
      await expect(notesPane.showLess.first()).toBeVisible();
    });

    test('[T-0188][AT-0088]should be able to filter notes by note type', async ({ page }) => {
      test.setTimeout(50000);
      const notesPane = new NotesPane(page);
      const notes = [
        { type: NOTE_TYPES.DISCHARGE_PLANNING, content: 'Discharge planning note' },
        { type: NOTE_TYPES.OTHER, content: 'Other note' },
        { type: NOTE_TYPES.TREATMENT_PLAN, content: 'Treatment plan note' },
      ];

      for (const note of notes) {
        await newNoteToolbarButton(page).click();
        const noteModal = new NoteModal(page);
        await noteModal.waitForOpen();
        await noteModal.fillAndSubmit(note.content, note.type);
        await waitForNoteModalClosed(noteModal);
      }
      await notesPane.waitForNoteRowsToEqual(3);

      const noteCount = await notesPane.noteRows.count();
      expect(noteCount).toBe(notes.length);

      await notesPane.filterByNoteType(NOTE_TYPES.TREATMENT_PLAN);
      await notesPane.waitForNoteRowsToEqual(1);
      await expect(notesPane.noteRows).toHaveCount(1);
      await expect(notesPane.noteContents.first()).toContainText(notes[2].content);
    });
  });
});
