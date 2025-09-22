import { test, expect } from '@fixtures/baseFixture';
import { getUser } from '@utils/apiHelpers';
import { testData } from '@utils/testData';
import { format } from 'date-fns';

test.describe('Notes Tests', () => {
  let user: { displayName: string; [key: string]: any };

  // Note Types Constants
  const NOTE_TYPES = {
    TREATMENT_PLAN: 'Treatment plan',
    DISCHARGE_PLANNING: 'Discharge planning',
    OTHER: 'Other',
    MEDICAL: 'Medical',
  } as const;

  test.beforeEach(async ({ newPatientWithHospitalAdmission, patientDetailsPage, api }) => {
    user = await getUser(api);
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.navigateToNotesTab();
  });

  test.describe('Create Note Tests', () => {
    test('should create a treatment plan note with basic details', async ({ patientDetailsPage }) => {
      const noteContent = 'This is a test treatment plan note';
      const newNoteModal = patientDetailsPage.notesPane?.getNewNoteModal();
      await patientDetailsPage.notesPane?.newNoteButton.click();
      await newNoteModal?.createBasicNote(NOTE_TYPES.TREATMENT_PLAN, noteContent);
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
        noteContent
      );
      await patientDetailsPage.notesPane?.waitForNotesPaneToLoad();

      // Validate note appears in the table
      expect(patientDetailsPage.notesPane).toBeDefined();
      await expect(patientDetailsPage.notesPane!.noteHeaderTexts.first()).toHaveText(NOTE_TYPES.DISCHARGE_PLANNING);
      await expect(patientDetailsPage.notesPane!.noteContents.first()).toContainText(noteContent);

      // Validate note appears in prepare discharge modal
      await patientDetailsPage.prepareDischargeButton.click();
      const prepareDischargeModal = patientDetailsPage.getPrepareDischargeModal();
      await prepareDischargeModal.waitForModalToLoad();
      await expect(
        prepareDischargeModal.dischargeNoteTextarea,
      ).toContainText(noteContent);
      await prepareDischargeModal.cancelButton.click();
    });

    test('should create an other note with basic details', async ({ patientDetailsPage }) => {
      const noteContent = 'This is a test other note';
      const newNoteModal = patientDetailsPage.notesPane?.getNewNoteModal();
      await patientDetailsPage.notesPane?.newNoteButton.click();
      await newNoteModal?.createBasicNote(NOTE_TYPES.OTHER, noteContent);
      await patientDetailsPage.notesPane?.waitForNotesPaneToLoad();

      // Validate note appears in the table
      expect(patientDetailsPage.notesPane).toBeDefined();
      await expect(patientDetailsPage.notesPane!.noteHeaderTexts.first()).toHaveText(NOTE_TYPES.OTHER);
      await expect(patientDetailsPage.notesPane!.noteContents.first()).toContainText(noteContent);
    });

    test('should validate form field values when creating a note', async ({ patientDetailsPage }) => {
      const noteContent = 'This is a test note for validation';
      const newNoteModal = patientDetailsPage.notesPane?.getNewNoteModal();
      await patientDetailsPage.notesPane?.newNoteButton.click();
      await newNoteModal?.waitForModalToLoad();
      
      // Set up the form
      await newNoteModal?.selectType(NOTE_TYPES.OTHER);
      await newNoteModal?.noteContentTextarea.fill(noteContent);
      
      // Validate form field values
      await expect(newNoteModal?.getWrittenByValue()).resolves.toBe(user.displayName);
      await expect(newNoteModal?.getDateTimeValue()).resolves.toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
      
      // Complete the note creation
      await newNoteModal?.confirmButton.click();
      await newNoteModal?.waitForModalToClose();
      await patientDetailsPage.notesPane?.waitForNotesPaneToLoad();
      
      // Validate note appears in the table
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
      expect(changeLogModal).toBeDefined();
      await changeLogModal!.waitForModalToLoad();
    
      // Validate note type
      await expect(changeLogModal!.noteTypeLabel).toHaveText(noteType);
      
      // Validate content entries
      await expect(changeLogModal!.changelogTextContents.first()).toContainText(updatedContent);
      await expect(changeLogModal!.changelogTextContents.nth(1)).toContainText(originalContent);
      
      // Format dates for validation
      const firstNoteFormattedDateTime = format(new Date(firstDateTime!), 'MM/dd/yyyy h:mm a');
      const secondNoteFormattedDateTime = format(new Date(secondDateTime!), 'MM/dd/yyyy h:mm a');
      
      // Validate date and user information
      await expect(changeLogModal!.dateLabel).toHaveText(firstNoteFormattedDateTime);
      await expect(changeLogModal!.changeLogInfoWrappers.first()).toContainText(user.displayName);
      await expect(changeLogModal!.changelogInfoDates.first()).toHaveText(firstNoteFormattedDateTime);
      await expect(changeLogModal!.changelogInfoDates.nth(1)).toHaveText(secondNoteFormattedDateTime);
      await changeLogModal!.closeButton.click();
    });
    test('should update a treatment plan note and validate the change log', async ({ patientDetailsPage }) => {
      test.setTimeout(50000);
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
      expect(changeLogTreatmentPlanModal).toBeDefined();
      await changeLogTreatmentPlanModal!.waitForModalToLoad();
      
      const lastUpdatedBy = `${user.displayName} on behalf of ${updatedBy}`;
      
      // Validate note type
      await expect(changeLogTreatmentPlanModal!.noteTypeLabel).toHaveText(NOTE_TYPES.TREATMENT_PLAN);
      
      // Validate last updated by information
      await expect(changeLogTreatmentPlanModal!.lastUpdatedByValue).toHaveText(lastUpdatedBy);
      
      // Validate last updated at information
      const formattedLastUpdatedAt = format(new Date(secondDateTime!), 'MM/dd/yyyy h:mm a');
      await expect(changeLogTreatmentPlanModal!.lastUpdatedAtValue).toHaveText(formattedLastUpdatedAt);
  
      // Validate content entries
      await expect(changeLogTreatmentPlanModal!.changelogTextContents.first()).toContainText(updatedContent);
      await expect(changeLogTreatmentPlanModal!.changelogTextContents.nth(1)).toContainText(originalContent);
      
      // Format dates for validation
      const firstNoteFormattedDateTime = format(new Date(firstDateTime!), 'MM/dd/yyyy h:mm a');
      const secondNoteFormattedDateTime = format(new Date(secondDateTime!), 'MM/dd/yyyy h:mm a');
      
      // Validate change log user and date information
      await expect(changeLogTreatmentPlanModal!.changeLogInfoWrappers.first()).toContainText(lastUpdatedBy);
      await expect(changeLogTreatmentPlanModal!.changeLogInfoWrappers.nth(1)).toContainText(user.displayName);
      await expect(changeLogTreatmentPlanModal!.changelogInfoDates.first()).toHaveText(secondNoteFormattedDateTime);
      await expect(changeLogTreatmentPlanModal!.changelogInfoDates.nth(1)).toHaveText(firstNoteFormattedDateTime);
      
      // Close the modal
      await changeLogTreatmentPlanModal!.closeButton.click();
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
      );
      await patientDetailsPage.notesPane?.waitForNotesPaneToLoad();

      // Edit the note
      await patientDetailsPage.notesPane?.editIcons.nth(0).click();
      await editNoteModal?.editNote(updatedContent);

      // Validate the note was updated
      expect(patientDetailsPage.notesPane).toBeDefined();
      await expect(patientDetailsPage.notesPane!.noteContents.first()).toContainText(updatedContent);
      await patientDetailsPage.prepareDischargeButton.click();
      const prepareDischargeModal = patientDetailsPage.getPrepareDischargeModal();
      await prepareDischargeModal.waitForModalToLoad();
      await expect(
        prepareDischargeModal.dischargeNoteTextarea,
      ).toHaveText(updatedContent);
    });

    test('should show edited indicator after editing a note', async ({ patientDetailsPage }) => {
      const originalContent = 'Original note content';
      const updatedContent = 'Updated note content';
      const newNoteModal = patientDetailsPage.notesPane?.getNewNoteModal();
      const editNoteModal = patientDetailsPage.notesPane?.getEditNoteModal();

      // Create a note first
      await patientDetailsPage.notesPane?.newNoteButton.click();
      await newNoteModal?.createBasicNote(NOTE_TYPES.OTHER, originalContent);
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
      await newNoteModal?.createBasicNote(NOTE_TYPES.OTHER, originalContent);
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
    test.setTimeout(50000);
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
        await newNoteModal?.createBasicNote(note.type, note.content);
      }
      await patientDetailsPage.notesPane?.waitForNoteRowsToEqual(3);
      await patientDetailsPage.notesPane?.newNoteModal?.waitForModalToClose();
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
      await newNoteModal?.createBasicNote(NOTE_TYPES.MEDICAL, noteContent);
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
        await newNoteModal?.createBasicNote(note.type, note.content);
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
