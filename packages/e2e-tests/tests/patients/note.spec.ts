import { test, expect } from '@fixtures/baseFixture';
import { getUser } from '@utils/apiHelpers';
import { testData } from '@utils/testData';

test.describe('Notes Tests', () => {
  let user: any;

  // Note Types Constants
  const NOTE_TYPES = {
    TREATMENT_PLAN: 'Treatment plan',
    DISCHARGE_PLANNING: 'Discharge planning',
    OTHER: 'Other',
    MEDICAL: 'Medical',
  } as const;

  test.beforeAll(async ({ api }) => {
    user = await getUser(api);
  });

  test.beforeEach(async ({ newPatientWithHospitalAdmission, patientDetailsPage }) => {
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.navigateToNotesTab();
  });

  test.describe('Create Note Tests', () => {
    test('should create a treatment plan note with basic details', async ({ patientDetailsPage }) => {
      const noteContent = 'This is a test treatment plan note';
      const newNoteModal = patientDetailsPage.notesPane?.getNewNoteModal();
      await patientDetailsPage.notesPane?.newNoteButton.click();
      await newNoteModal?.createBasicNote(NOTE_TYPES.TREATMENT_PLAN, noteContent, user.displayName);
      await patientDetailsPage.notesPane?.waitForNotesPaneToLoad();

      // Validate note appears in the table
      expect(patientDetailsPage.notesPane).toBeDefined();
      await expect(patientDetailsPage.notesPane!.noteHeaderTexts.first()).toHaveText(NOTE_TYPES.TREATMENT_PLAN);
      await expect(patientDetailsPage.notesPane!.noteContents.first()).toContainText(noteContent);
    });

    test('should create a discharge planning note and validate it is shown in the discharge modal', async ({ patientDetailsPage }) => {
      const noteContent = 'This is a discharge planning note';
      const newNoteModal = patientDetailsPage.notesPane?.getNewNoteModal();
      await patientDetailsPage.notesPane?.newNoteButton.click();
      await newNoteModal?.createBasicNote(
        NOTE_TYPES.DISCHARGE_PLANNING,
        noteContent,
        user.displayName,
      );
      await patientDetailsPage.notesPane?.waitForNotesPaneToLoad();

      // Validate note appears in the table
      expect(patientDetailsPage.notesPane).toBeDefined();
      await expect(patientDetailsPage.notesPane!.noteHeaderTexts.first()).toHaveText(NOTE_TYPES.DISCHARGE_PLANNING);
      await expect(patientDetailsPage.notesPane!.noteContents.first()).toContainText(noteContent);

      // Validate note appears in prepare discharge modal
      await patientDetailsPage.prepareDischargeButton.click();
      if (patientDetailsPage.prepareDischargeModal) {
        await patientDetailsPage.prepareDischargeModal.waitForModalToLoad();
        await expect(
          patientDetailsPage.prepareDischargeModal.dischargeNoteTextarea,
        ).toContainText(noteContent);
        await patientDetailsPage.prepareDischargeModal.cancelButton.click();
      }
    });

    test('should create an other note with basic details', async ({ patientDetailsPage }) => {
      const noteContent = 'This is a test other note';
      const newNoteModal = patientDetailsPage.notesPane?.getNewNoteModal();
      await patientDetailsPage.notesPane?.newNoteButton.click();
      await newNoteModal?.createBasicNote(NOTE_TYPES.OTHER, noteContent, user.displayName);
      await patientDetailsPage.notesPane?.waitForNotesPaneToLoad();

      // Validate note appears in the table
      expect(patientDetailsPage.notesPane).toBeDefined();
      await expect(patientDetailsPage.notesPane!.noteHeaderTexts.first()).toHaveText(NOTE_TYPES.OTHER);
      await expect(patientDetailsPage.notesPane!.noteContents.first()).toContainText(noteContent);
    });

    test('should not allow creating a note without required fields', async ({ patientDetailsPage }) => {
      const newNoteModal = patientDetailsPage.notesPane?.getNewNoteModal();
      await patientDetailsPage.notesPane?.newNoteButton.click();
      await newNoteModal?.waitForModalToLoad();

      // Try to submit without filling required fields
      await newNoteModal?.confirmButton.click();

      // Modal should still be visible (validation should prevent submission)
      expect(patientDetailsPage.notesPane).toBeDefined();
      await expect(patientDetailsPage.notesPane!.getNewNoteModal().noteTypeRequiredIndicator).toBeVisible();
      await expect(patientDetailsPage.notesPane!.getNewNoteModal().noteContentRequiredIndicator).toBeVisible();
    });

    test('should allow cancelling note creation', async ({ patientDetailsPage }) => {
      const newNoteModal = patientDetailsPage.notesPane?.getNewNoteModal();
      await patientDetailsPage.notesPane?.newNoteButton.click();
      await newNoteModal?.waitForModalToLoad();
      await newNoteModal?.selectType(NOTE_TYPES.OTHER);
      await newNoteModal?.noteContentTextarea.fill('this is test note');
      await newNoteModal?.cancelButton.click();
      await newNoteModal?.discardNoteModal.waitForModalToLoad();
      await newNoteModal?.discardNoteModal.confirmButton.click();
      await newNoteModal?.discardNoteModal.waitForModalToClose();
      await newNoteModal?.waitForModalToClose();
      await patientDetailsPage.notesPane?.waitForNotesPaneToLoad();

      // No new note should be created
      expect(patientDetailsPage.notesPane).toBeDefined();
      const noteContent = await patientDetailsPage.notesPane!.noDataMessage.textContent();
      expect(noteContent).toBe(
        "This patient has no notes to display. Click ‘New note’ to add a note.",
      );
    });
  });

  test.describe('Edit Note Tests', () => {
    test('should edit an existing note and view the change log', async ({ patientDetailsPage }) => {
      const originalContent = 'Original note content';
      const updatedContent = 'Updated note content';
      const noteType = NOTE_TYPES.OTHER;
      const newNoteModal = patientDetailsPage.notesPane?.getNewNoteModal();
      const editNoteModal = patientDetailsPage.notesPane?.getEditNoteModal();
      const changeLogModal = patientDetailsPage.notesPane?.getChangeLogModal();

      // Create a note first
      await patientDetailsPage.notesPane?.newNoteButton.click();
      const firstDateTime = await newNoteModal?.createBasicNote(
        noteType,
        originalContent,
        user.displayName,
      );
      await patientDetailsPage.notesPane?.waitForNotesPaneToLoad();

      // Edit the note
      await patientDetailsPage.notesPane?.editIcons.nth(0).click();
      const secondDateTime = await editNoteModal?.editNote(updatedContent);

      // Validate the note was updated
      expect(patientDetailsPage.notesPane).toBeDefined();
      await expect(patientDetailsPage.notesPane!.noteContents.first()).toContainText(updatedContent);

      //validate change log
      await patientDetailsPage.notesPane!.editedButtons.first().click();
      await changeLogModal?.validateChangeLog(
        noteType,
        updatedContent,
        originalContent,
        firstDateTime!,
        secondDateTime!,
        user.displayName
      );
    });
    test('should update a treatment plan note and validate the change log', async ({ patientDetailsPage }) => {
      const originalContent = 'Original treatment plan';
      const updatedContent = 'Updated treatment plan';
      const updatedBy = 'Coder';
      const newNoteModal = patientDetailsPage.notesPane?.getNewNoteModal();
      const updateTreatmentPlanModal = patientDetailsPage.notesPane?.getUpdateTreatmentPlanModal();
      const changeLogTreatmentPlanModal = patientDetailsPage.notesPane?.getChangeLogTreatmentPlanModal();

      // Create a treatment plan note first
      await patientDetailsPage.notesPane?.newNoteButton.click();
      const firstDateTime = await newNoteModal?.createBasicNote(
        NOTE_TYPES.TREATMENT_PLAN,
        originalContent,
        user.displayName,
      );
      await patientDetailsPage.notesPane?.waitForNotesPaneToLoad();

      // Update the treatment plan
      await patientDetailsPage.notesPane?.editIcons.first().click();
      const secondDateTime = await updateTreatmentPlanModal?.updateTreatmentPlan(updatedBy, updatedContent);

      // Validate the note was updated
      expect(patientDetailsPage.notesPane).toBeDefined();
      await expect(patientDetailsPage.notesPane!.noteContents.first()).toContainText(updatedContent);
      
      // Validate change log
      await patientDetailsPage.notesPane!.editedButtons.first().click();
      const lastUpdatedBy = `${user.displayName} on behalf of ${updatedBy}`;
      await changeLogTreatmentPlanModal?.validateTreatmentPlanChangeLog(
        NOTE_TYPES.TREATMENT_PLAN,
        lastUpdatedBy,
        secondDateTime!,
        updatedContent,
        originalContent,
        firstDateTime!,
        secondDateTime!,
        user.displayName
      );
    });
    test('should edit an discharge planning note and validate it is shown in the discharge modal', async ({ patientDetailsPage }) => {
      const originalContent = 'Original note content';
      const updatedContent = 'Updated note content';
      const newNoteModal = patientDetailsPage.notesPane?.getNewNoteModal();
      const editNoteModal = patientDetailsPage.notesPane?.getEditNoteModal();

      // Create a note first
      await patientDetailsPage.notesPane?.newNoteButton.click();
      await newNoteModal?.createBasicNote(
        NOTE_TYPES.DISCHARGE_PLANNING,
        originalContent,
        user.displayName,
      );
      await patientDetailsPage.notesPane?.waitForNotesPaneToLoad();

      // Edit the note
      await patientDetailsPage.notesPane?.editIcons.nth(0).click();
      await editNoteModal?.editNote(updatedContent);

      // Validate the note was updated
      expect(patientDetailsPage.notesPane).toBeDefined();
      await expect(patientDetailsPage.notesPane!.noteContents.first()).toContainText(updatedContent);
      await patientDetailsPage.prepareDischargeButton.click();
      if (patientDetailsPage.prepareDischargeModal) {
        await patientDetailsPage.prepareDischargeModal.waitForModalToLoad();
        await expect(
          patientDetailsPage.prepareDischargeModal.dischargeNoteTextarea,
        ).toHaveText(updatedContent);
      }
    });

    test('should show edited indicator after editing a note', async ({ patientDetailsPage }) => {
      const originalContent = 'Original note content';
      const updatedContent = 'Updated note content';
      const newNoteModal = patientDetailsPage.notesPane?.getNewNoteModal();
      const editNoteModal = patientDetailsPage.notesPane?.getEditNoteModal();

      // Create a note first
      await patientDetailsPage.notesPane?.newNoteButton.click();
      await newNoteModal?.createBasicNote(NOTE_TYPES.OTHER, originalContent, user.displayName);
      await patientDetailsPage.notesPane?.waitForNotesPaneToLoad();

      // Edit the note
      await patientDetailsPage.notesPane?.editIcons.nth(0).click();
      await editNoteModal?.editNote(updatedContent);

      // Validate edited indicator appears
      expect(patientDetailsPage.notesPane).toBeDefined();
      await expect(patientDetailsPage.notesPane!.editedButtons.first()).toBeVisible();
    });

    test('should allow cancelling note edit', async ({ patientDetailsPage }) => {
      const originalContent = 'Original note content';
      const updatedContent = 'Updated note content';
      const newNoteModal = patientDetailsPage.notesPane?.getNewNoteModal();
      const editNoteModal = patientDetailsPage.notesPane?.getEditNoteModal();
      const discardNoteModal = patientDetailsPage.notesPane?.getDiscardNoteModal();

      // Create a note first
      await patientDetailsPage.notesPane?.newNoteButton.click();
      await newNoteModal?.createBasicNote(NOTE_TYPES.OTHER, originalContent, user.displayName);
      await patientDetailsPage.notesPane?.waitForNotesPaneToLoad();

      // Start editing but cancel
      await patientDetailsPage.notesPane?.editIcons.nth(0).click();
      await editNoteModal?.waitForModalToLoad();
      await editNoteModal?.noteContentTextarea.fill(updatedContent);
      await editNoteModal?.cancelButton.click();
      await discardNoteModal?.waitForModalToLoad();
      await discardNoteModal?.confirmButton.click();
      await discardNoteModal?.waitForModalToClose();

      // Validate the note content remains unchanged
      expect(patientDetailsPage.notesPane).toBeDefined();
      await expect(patientDetailsPage.notesPane!.noteContents.first()).toContainText(originalContent);
    });
  });

  test.describe('Notes Table Tests', () => {
    test('treatment plan note should appear on top when creating multiple notes', async ({ patientDetailsPage }) => {
      const notes = [
        { type: NOTE_TYPES.DISCHARGE_PLANNING, content: 'Discharge planning note' },
        { type: NOTE_TYPES.OTHER, content: 'Other note' },
        { type: NOTE_TYPES.TREATMENT_PLAN, content: 'Treatment plan note' }
      ];
      const newNoteModal = patientDetailsPage.notesPane?.getNewNoteModal();

      // Create multiple notes
      for (const note of notes) {
        await patientDetailsPage.notesPane?.newNoteButton.click();
        await newNoteModal?.createBasicNote(note.type, note.content, user.displayName);
      }
      await patientDetailsPage.notesPane?.waitForNoteRowsToEqual(3);
      // Validate all notes appear in the table
      expect(patientDetailsPage.notesPane).toBeDefined();
      const noteCount = await patientDetailsPage.notesPane!.noteRows.count();
      expect(noteCount).toBe(notes.length);

      //validate treatment plan note appears on top
      await expect(patientDetailsPage.notesPane!.noteHeaderTexts.first()).toHaveText(NOTE_TYPES.TREATMENT_PLAN);
      await expect(patientDetailsPage.notesPane!.noteContents.first()).toHaveText(notes[2].content);

      // Validate notes appear in reverse order (last created on top)
      for (let i = 1; i < notes.length; i++) {
        const noteIndex = notes.length - 1 - i; // Reverse the index
        await expect(patientDetailsPage.notesPane!.noteHeaderTexts.nth(i)).toHaveText(notes[noteIndex].type);
        await expect(patientDetailsPage.notesPane!.noteContents.nth(i)).toContainText(notes[noteIndex].content);
      }
    });
    test('should display read more and show less button when note content is too long', async ({ patientDetailsPage }) => {
      const noteContent = testData.noteContent;
      const newNoteModal = patientDetailsPage.notesPane?.getNewNoteModal();
      await patientDetailsPage.notesPane?.newNoteButton.click();
      await newNoteModal?.createBasicNote(NOTE_TYPES.MEDICAL, noteContent, user.displayName);
      await patientDetailsPage.notesPane?.waitForNotesPaneToLoad();
      await expect(patientDetailsPage.notesPane!.noteContents.first()).toContainText(noteContent);
      await expect(patientDetailsPage.notesPane!.readMoreButton.first()).toBeVisible();
      await patientDetailsPage.notesPane!.readMoreButton.first().click();
      await expect(patientDetailsPage.notesPane!.showLessButton.first()).toBeVisible();
    });

    test('should be able to filter notes by note type', async ({ patientDetailsPage }) => {
      test.setTimeout(50000);
      const notes = [
        { type: NOTE_TYPES.DISCHARGE_PLANNING, content: 'Discharge planning note' },
        { type: NOTE_TYPES.OTHER, content: 'Other note' },
        { type: NOTE_TYPES.TREATMENT_PLAN, content: 'Treatment plan note' }
      ];
      const newNoteModal = patientDetailsPage.notesPane?.getNewNoteModal();

      // Create multiple notes
      for (const note of notes) {
        await patientDetailsPage.notesPane?.newNoteButton.click();
        await newNoteModal?.createBasicNote(note.type, note.content, user.displayName);
      }
      await patientDetailsPage.notesPane?.waitForNoteRowsToEqual(3);
      // Validate all notes appear in the table
      expect(patientDetailsPage.notesPane).toBeDefined();
      const noteCount = await patientDetailsPage.notesPane!.noteRows.count();
      expect(noteCount).toBe(notes.length);

      // Filter notes by note type
      await patientDetailsPage.notesPane?.noteTypeSelect.click();
      await patientDetailsPage.notesPane?.noteTypeOptions.getByText(NOTE_TYPES.TREATMENT_PLAN).click();
      await patientDetailsPage.notesPane?.waitForNoteRowsToEqual(1);
      await expect(patientDetailsPage.notesPane!.noteRows).toHaveCount(1);
      await expect(patientDetailsPage.notesPane!.noteContents.first()).toContainText(notes[2].content);
    });
  });
});
