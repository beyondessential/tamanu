import { test, expect } from '../../fixtures/baseFixture';
import { createPatientViaApi } from '../../utils/generateNewPatient';

test.describe('Patient Side Bar', () => {
  test.beforeEach(async ({ patientDetailsPage, allPatientsPage }) => {
    await allPatientsPage.goto();
    await createPatientViaApi(allPatientsPage);

    //this is to replicate the workflow of visiting an existing patient
    const patientData = allPatientsPage.getPatientData();
    await allPatientsPage.navigateToPatientDetailsPage(patientData.nhn);
    await patientDetailsPage.confirmPatientDetailsPageHasLoaded();
    await expect(patientDetailsPage.patientNHN).toContainText(patientData.nhn);
  });

  test('Add ongoing condition with just the required fields', async ({ patientDetailsPage }) => {
    const currentBrowserDate = await patientDetailsPage.getCurrentBrowserDateISOFormat(
      patientDetailsPage.page,
    );

    await patientDetailsPage.addNewOngoingConditionWithJustRequiredFields('Sleep apnea');

    await expect(patientDetailsPage.firstListItem).toContainText('Sleep apnea');

    await patientDetailsPage.firstListItem.click();

    await expect(patientDetailsPage.savedOnGoingConditionName).toHaveValue('Sleep apnea');
    await expect(patientDetailsPage.savedOnGoingConditionDate).toHaveValue(currentBrowserDate);
  });

  test('Add ongoing condition with all fields', async ({ patientDetailsPage }) => {
    await patientDetailsPage.addNewOngoingConditionWithAllFields(
      'Jaw dislocation',
      '2024-06-20',
      'Initial Admin',
      'This is a note',
    );

    await expect(patientDetailsPage.firstListItem).toContainText('Jaw dislocation');

    await patientDetailsPage.firstListItem.click();

    await expect(patientDetailsPage.savedOnGoingConditionName).toHaveValue('Jaw dislocation');
    await expect(patientDetailsPage.savedOnGoingConditionDate).toHaveValue('2024-06-20');
    await expect(patientDetailsPage.savedOnGoingConditionClinician).toHaveValue('Initial Admin');
    await expect(patientDetailsPage.savedOnGoingConditionNote).toHaveValue('This is a note');
  });

  test('Skipping mandatory field should throw error', async ({ patientDetailsPage }) => {
    await patientDetailsPage.initiateNewOngoingConditionAddButton.click();

    await patientDetailsPage.clickAddButtonToConfirm(
      patientDetailsPage.submitNewOngoingConditionAddButton,
    );

    await expect(patientDetailsPage.warningModalTitle).toContainText(
      'Please fix below errors to continue',
    );
    await expect(patientDetailsPage.warningModalContent).toContainText(
      'The Condition field is required',
    );

    await patientDetailsPage.warningModalDismissButton.click();

    await expect(
      patientDetailsPage.onGoingConditionForm.filter({
        hasText: 'The Condition field is required',
      }),
    ).toBeVisible();
  });

  test('Edit ongoing condition', async ({ patientDetailsPage }) => {
    await patientDetailsPage.addNewOngoingConditionWithAllFields(
      'Eating habits inadequate',
      '2024-07-13',
      'Initial Admin',
      'Temporary note',
    );

    await patientDetailsPage.firstListItem.click();

    await patientDetailsPage.savedOnGoingConditionNote.fill('Edited note');

    await patientDetailsPage.clickAddButtonToConfirm(patientDetailsPage.submitEditsButton);

    await patientDetailsPage.firstListItem.click();

    await expect(patientDetailsPage.savedOnGoingConditionName).toHaveValue(
      'Eating habits inadequate',
    );
    await expect(patientDetailsPage.savedOnGoingConditionDate).toHaveValue('2024-07-13');
    await expect(patientDetailsPage.savedOnGoingConditionClinician).toHaveValue('Initial Admin');
    await expect(patientDetailsPage.savedOnGoingConditionNote).toHaveValue('Edited note');
    await expect(patientDetailsPage.page.getByText('Temporary note')).toBeHidden();
  });

  test('Mark ongoing condition as resolved', async ({ patientDetailsPage }) => {
    await patientDetailsPage.addNewOngoingConditionWithAllFields(
      'Pain in hand',
      '2024-08-14',
      'Initial Admin',
      'This is to test resolving a note',
    );

    await patientDetailsPage.firstListItem.click();

    await expect(patientDetailsPage.resolvedCheckbox).not.toBeChecked();

    await patientDetailsPage.resolveOngoingCondition('Initial Admin', 'Resolved note');

    await expect(patientDetailsPage.firstListItem).toContainText('Pain in hand (resolved)');

    await patientDetailsPage.firstListItem.click();

    await expect(patientDetailsPage.savedOnGoingConditionName).toHaveValue('Pain in hand');
    await expect(patientDetailsPage.savedOnGoingConditionDate).toHaveValue('2024-08-14');
    await expect(patientDetailsPage.savedOnGoingConditionClinician).toHaveValue('Initial Admin');
    await expect(patientDetailsPage.savedOnGoingConditionNote).toHaveValue(
      'This is to test resolving a note',
    );

    await expect(patientDetailsPage.resolvedCheckbox).toBeChecked();
    await expect(patientDetailsPage.resolvedClinician).toHaveValue('Initial Admin');
    await expect(patientDetailsPage.resolvedNote).toHaveValue('Resolved note');
  });

  test('Add allergy with just the required fields', async ({ patientDetailsPage }) => {
    const currentBrowserDate = await patientDetailsPage.getCurrentBrowserDateISOFormat(
      patientDetailsPage.page,
    );
    await patientDetailsPage.addNewAllergyWithJustRequiredFields('Dust mites');

    await expect(patientDetailsPage.firstListItem).toContainText('Dust mites');

    await patientDetailsPage.firstListItem.click();

    await expect(patientDetailsPage.savedAllergyName).toHaveValue('Dust mites');
    await expect(patientDetailsPage.savedAllergyDate).toHaveValue(currentBrowserDate);
  });

  test('Add allergy with all fields', async () => {
    //TODO: can't do this until figured out how to import reference data for reaction
  });

  test('Edit allergy', async ({ patientDetailsPage }) => {
    await patientDetailsPage.addNewAllergyWithJustRequiredFields('Eggs');

    await patientDetailsPage.firstListItem.click();

    await patientDetailsPage.savedAllergyNote.fill('Edited to add a note');
    await patientDetailsPage.submitEditsButton.click();

    await patientDetailsPage.firstListItem.click();

    await expect(patientDetailsPage.savedAllergyName).toHaveValue('Eggs');
    await expect(patientDetailsPage.savedAllergyNote).toHaveValue('Edited to add a note');

    await patientDetailsPage.savedAllergyNote.fill('Second edit');
    await patientDetailsPage.submitEditsButton.click();

    await patientDetailsPage.firstListItem.click();

    await expect(patientDetailsPage.savedAllergyName).toHaveValue('Eggs');
    await expect(patientDetailsPage.savedAllergyNote).toHaveValue('Second edit');
    await expect(patientDetailsPage.page.getByText('Edited to add a note')).toBeHidden();
  });

  test('Add allergy that is not in dropdown list', async ({
    patientDetailsPage,
    allPatientsPage,
  }) => {
    const patientData = allPatientsPage.getPatientData();
    const newAllergy = patientDetailsPage.generateNewAllergy(patientData.nhn);

    await patientDetailsPage.searchNewAllergyNotInDropdown(newAllergy);

    await expect(patientDetailsPage.page.getByText('item not in list')).toBeVisible();

    await patientDetailsPage.addNewAllergyNotInDropdown(newAllergy);

    await expect(patientDetailsPage.firstListItem).toContainText(newAllergy);

    await patientDetailsPage.firstListItem.click();

    await expect(patientDetailsPage.savedAllergyName).toHaveValue(newAllergy);
  });

  test('Add family history with just the required fields', async ({ patientDetailsPage }) => {
    const currentBrowserDate = await patientDetailsPage.getCurrentBrowserDateISOFormat(
      patientDetailsPage.page,
    );
    await patientDetailsPage.addNewFamilyHistoryWithJustRequiredFields('Hair alopecia');

    await expect(patientDetailsPage.firstListItem).toContainText('Hair alopecia');

    await patientDetailsPage.firstListItem.click();

    await expect(patientDetailsPage.savedFamilyHistoryName).toHaveValue('Hair alopecia');
    await expect(patientDetailsPage.savedFamilyHistoryDateRecorded).toHaveValue(currentBrowserDate);
  });

  test('Add family history with all fields', async ({ patientDetailsPage }) => {
    await patientDetailsPage.addNewFamilyHistoryWithAllFields(
      'Ear burn',
      '2025-05-26',
      'Mother',
      'Initial Admin',
      'Family history note',
    );

    await expect(patientDetailsPage.firstListItem).toContainText('Ear burn (Mother)');

    await patientDetailsPage.firstListItem.click();

    await expect(patientDetailsPage.savedFamilyHistoryName).toHaveValue('Ear burn');
    await expect(patientDetailsPage.savedFamilyHistoryDateRecorded).toHaveValue('2025-05-26');
    await expect(patientDetailsPage.savedFamilyHistoryRelationship).toHaveValue('Mother');
    await expect(patientDetailsPage.savedFamilyClinician).toHaveValue('Initial Admin');
    await expect(patientDetailsPage.savedFamilyHistoryNote).toHaveValue('Family history note');
  });

  test('Edit family history', async ({ patientDetailsPage }) => {
    await patientDetailsPage.addNewFamilyHistoryWithJustRequiredFields('Hair alopecia');

    await patientDetailsPage.firstListItem.click();

    await patientDetailsPage.savedFamilyHistoryDateRecorded.fill('2025-05-25');
    await patientDetailsPage.savedFamilyHistoryRelationship.fill('Mother');
    await patientDetailsPage.savedFamilyClinician.click();
    await patientDetailsPage.page.getByRole('menuitem', { name: 'Initial Admin' }).click();
    await patientDetailsPage.savedFamilyHistoryNote.fill('First edit to note');
    await patientDetailsPage.submitEditsButton.click();

    await patientDetailsPage.firstListItem.click();

    await expect(patientDetailsPage.savedFamilyHistoryName).toHaveValue('Hair alopecia');
    await expect(patientDetailsPage.savedFamilyHistoryDateRecorded).toHaveValue('2025-05-25');
    await expect(patientDetailsPage.savedFamilyHistoryRelationship).toHaveValue('Mother');
    await expect(patientDetailsPage.savedFamilyClinician).toHaveValue('Initial Admin');
    await expect(patientDetailsPage.savedFamilyHistoryNote).toHaveValue('First edit to note');

    await patientDetailsPage.savedFamilyHistoryNote.fill('Second edit to note');
    await patientDetailsPage.submitEditsButton.click();

    await patientDetailsPage.firstListItem.click();

    await expect(patientDetailsPage.savedFamilyHistoryName).toHaveValue('Hair alopecia');
    await expect(patientDetailsPage.savedFamilyHistoryDateRecorded).toHaveValue('2025-05-25');
    await expect(patientDetailsPage.savedFamilyHistoryRelationship).toHaveValue('Mother');
    await expect(patientDetailsPage.savedFamilyClinician).toHaveValue('Initial Admin');
    await expect(patientDetailsPage.savedFamilyHistoryNote).toHaveValue('Second edit to note');

    await expect(patientDetailsPage.page.getByText('First edit to note')).toBeHidden();
  });

  test('Add other patient issue with default issue and note', async ({ patientDetailsPage }) => {
    await patientDetailsPage.initiateNewOtherPatientIssuesAddButton.click();
    await expect(patientDetailsPage.defaultNewIssue).toBeVisible();

    const currentBrowserDate = await patientDetailsPage.getCurrentBrowserDateISOFormat(
      patientDetailsPage.page,
    );
    await patientDetailsPage.addNewOtherPatientIssueNote('New issue note');

    await expect(patientDetailsPage.firstListItem).toContainText('New issue note');

    await patientDetailsPage.firstListItem.click();

    await expect(patientDetailsPage.savedIssueType).toContainText('Issue');
    await expect(patientDetailsPage.savedOtherPatientIssueNote).toHaveValue('New issue note');
    await expect(patientDetailsPage.savedOtherPatientIssueDate).toHaveValue(currentBrowserDate);
  });

  test('Add other patient issue: warning', async ({ patientDetailsPage }) => {
    await patientDetailsPage.addNewOtherPatientIssueWarning('Test warning');

    await expect(
      patientDetailsPage.warningModalTitle.filter({ hasText: 'Patient warnings' }),
    ).toBeVisible();
    await expect(patientDetailsPage.warningModalContent).toContainText('Test warning');
  });

  test('Warning appears when navigating to patient with a warning', async ({
    patientDetailsPage,
    allPatientsPage,
  }) => {
    await patientDetailsPage.addNewOtherPatientIssueWarning(
      'A warning appears when navigating to a patient with a warning',
    );

    await allPatientsPage.goto();

    const patientData = allPatientsPage.getPatientData();
    await allPatientsPage.navigateToPatientDetailsPage(patientData.nhn);

    await expect(
      patientDetailsPage.warningModalTitle.filter({ hasText: 'Patient warnings' }),
    ).toBeVisible();
    await expect(patientDetailsPage.warningModalContent).toContainText(
      'A warning appears when navigating to a patient with a warning',
    );
  });

  test('Edit patient warning', async ({ patientDetailsPage, allPatientsPage }) => {
    await patientDetailsPage.addNewOtherPatientIssueWarning('Test warning');
    await patientDetailsPage.warningModalOkayButton.click();

    await patientDetailsPage.firstListItem.click();

    await expect(patientDetailsPage.savedOtherPatientIssueNote).toHaveValue('Test warning');

    await patientDetailsPage.savedOtherPatientIssueNote.fill('Edited warning');
    await patientDetailsPage.savedOtherPatientIssueDate.fill('2025-09-17');
    await patientDetailsPage.submitEditsButton.click();

    await patientDetailsPage.firstListItem.click();

    await expect(patientDetailsPage.savedOtherPatientIssueNote).toHaveValue('Edited warning');

    await allPatientsPage.goto();

    const patientData = allPatientsPage.getPatientData();
    await allPatientsPage.navigateToPatientDetailsPage(patientData.nhn);

    await expect(
      patientDetailsPage.warningModalTitle.filter({ hasText: 'Patient warnings' }),
    ).toBeVisible();
    await expect(patientDetailsPage.warningModalContent).toContainText('Edited warning');

    await patientDetailsPage.warningModalOkayButton.click();

    await patientDetailsPage.firstListItem.click();

    await expect(patientDetailsPage.savedOtherPatientIssueNote).toHaveValue('Edited warning');
    await expect(patientDetailsPage.savedOtherPatientIssueDate).toHaveValue('2025-09-17');
    await expect(patientDetailsPage.page.getByText('Test warning')).toBeHidden();
  });

  test('Add care plans', async ({ patientDetailsPage }) => {
    const newCarePlanModal = await patientDetailsPage.addNewCarePlan();

    const currentBrowserDate = await patientDetailsPage.getCurrentBrowserDateISOFormat(
      patientDetailsPage.page,
    );
    const defaultDate = await newCarePlanModal.carePlanDate.inputValue();
    await expect(defaultDate).toContain(currentBrowserDate);

    await newCarePlanModal.fillOutCarePlan(
      'Diabetes',
      'This is an example of main care plan details',
    );
    await expect(patientDetailsPage.firstCarePlanListItem).toContainText('Diabetes');

    const completedCarePlanModal = await patientDetailsPage.navigateToCarePlan('Diabetes');

    await expect(completedCarePlanModal.carePlanHeader).toContainText('Care plan: Diabetes');
    await expect(completedCarePlanModal.completedMainCarePlan).toContainText(
      'This is an example of main care plan details',
    );
    await expect(completedCarePlanModal.completedMainCarePlan).toContainText(
      'On behalf of Initial Admin',
    );

    await completedCarePlanModal.addAdditionalCarePlanNote(
      'This is an additional care plan note',
      'System',
    );

    await expect(
      completedCarePlanModal.completedCarePlan.filter({ hasText: 'System' }),
    ).toContainText('This is an additional care plan note');
    await expect(completedCarePlanModal.completedMainCarePlan).toContainText(
      'This is an example of main care plan details',
    );
  });

  test('Edit main care plan', async ({ patientDetailsPage }) => {
    const newCarePlanModal = await patientDetailsPage.addNewCarePlan();

    await newCarePlanModal.fillOutCarePlan(
      'Mental health',
      'This is the main care plan which we will edit',
    );

    const completedCarePlanModal = await patientDetailsPage.navigateToCarePlan('Mental health');

    await completedCarePlanModal.completedMainCarePlanKebabMenu.click();
    await completedCarePlanModal.completedCarePlanEditButton.click();

    await completedCarePlanModal.editableNoteContent.fill('Edited note');
    await completedCarePlanModal.saveEditedNoteButton.click();

    await expect(completedCarePlanModal.completedMainCarePlan).toContainText('Edited note');
    await expect(
      completedCarePlanModal.page.getByText('This is the main care plan which we will edit'),
    ).toBeHidden();
  });

  test('Edit additional care plan note', async ({ patientDetailsPage }) => {
    const newCarePlanModal = await patientDetailsPage.addNewCarePlan();

    await newCarePlanModal.fillOutCarePlan(
      'Cardiovascular disease',
      'This is the main care plan note which should not be edited',
    );

    const completedCarePlanModal =
      await patientDetailsPage.navigateToCarePlan('Cardiovascular disease');

    await completedCarePlanModal.addAdditionalCarePlanNote(
      'This is the additional care plan note which should be edited',
      'System',
    );

    const additionalNoteKebabMenu = completedCarePlanModal.getAdditionalNoteKebabMenu('System');
    await additionalNoteKebabMenu.click();
    await completedCarePlanModal.additionalNoteEditButton.click();

    await completedCarePlanModal.additionalNoteSavedDate.fill('2025-04-26T15:40');
    await completedCarePlanModal.editableNoteContent.fill('Edited note');
    await completedCarePlanModal.saveEditedNoteButton.click();

    await expect(completedCarePlanModal.completedSystemAdditionalCarePlan).toContainText(
      'Edited note',
    );
    await expect(completedCarePlanModal.completedSystemAdditionalCarePlan).toContainText(
      '04/26/2025',
    );
    await expect(completedCarePlanModal.completedMainCarePlan).toContainText(
      'This is the main care plan note which should not be edited',
    );
    await expect(
      completedCarePlanModal.page.getByText(
        'This is the additional care plan note which should be edited',
      ),
    ).toBeHidden();
  });

  test('Delete care plan note', async ({ patientDetailsPage }) => {
    const newCarePlanModal = await patientDetailsPage.addNewCarePlan();

    await newCarePlanModal.fillOutCarePlan(
      'Tuberculosis',
      'This is the main care plan which we will keep',
    );

    const completedCarePlanModal = await patientDetailsPage.navigateToCarePlan('Tuberculosis');
    await completedCarePlanModal.addAdditionalCarePlanNote(
      'This is a note which will be deleted',
      'System',
    );

    await expect(
      completedCarePlanModal.completedCarePlan.filter({
        hasText: 'This is a note which will be deleted',
      }),
    ).toBeVisible();

    const additionalNoteKebabMenu = completedCarePlanModal.getAdditionalNoteKebabMenu('System');
    await additionalNoteKebabMenu.click();
    await completedCarePlanModal.additionalNoteDeleteButton.click();

    await expect(
      completedCarePlanModal.completedCarePlan.filter({
        hasText: 'This is a note which will be deleted',
      }),
    ).toBeHidden();
    await expect(
      completedCarePlanModal.completedCarePlan.filter({
        hasText: 'This is the main care plan which we will keep',
      }),
    ).toBeVisible();
  });
});
