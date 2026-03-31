import { test, expect } from '@fixtures/baseFixture';
import { fillMuiDateField, fillMuiDateTimeField, normalizeToIsoDate } from '@utils/testHelper';

test.describe('Patient Side Bar', () => {
  test.beforeEach(async ({ patientDetailsPage, newPatient }) => {
    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.confirmPatientDetailsPageHasLoaded();
  });

  test('[T-0040][AT-0096]Add ongoing condition with just the required fields', async ({ patientDetailsPage }) => {
    const currentBrowserDate = patientDetailsPage.getCurrentBrowserDateISOFormat();

    await patientDetailsPage.sidebarLists.addNewOngoingConditionWithJustRequiredFields('Sleep apnea');

    await expect(patientDetailsPage.sidebarLists.firstListItem).toContainText('Sleep apnea');

    await patientDetailsPage.sidebarLists.firstListItem.click();

    await expect(patientDetailsPage.sidebarLists.savedOnGoingConditionName).toHaveValue('Sleep apnea');
    expect(
      normalizeToIsoDate(await patientDetailsPage.sidebarLists.savedOnGoingConditionDate.inputValue()),
    ).toBe(currentBrowserDate);
  });

  test('[T-0040][AT-0097]Add ongoing condition with all fields', async ({ patientDetailsPage }) => {
    await patientDetailsPage.sidebarLists.addNewOngoingConditionWithAllFields(
      'Jaw dislocation',
      '2024-06-20',
      'Initial Admin',
      'This is a note',
    );

    await expect(patientDetailsPage.sidebarLists.firstListItem).toContainText('Jaw dislocation');

    await patientDetailsPage.sidebarLists.firstListItem.click();

    await expect(patientDetailsPage.sidebarLists.savedOnGoingConditionName).toHaveValue('Jaw dislocation');
    expect(
      normalizeToIsoDate(await patientDetailsPage.sidebarLists.savedOnGoingConditionDate.inputValue()),
    ).toBe('2024-06-20');
    await expect(patientDetailsPage.sidebarLists.savedOnGoingConditionClinician).toHaveValue('Initial Admin');
    await expect(patientDetailsPage.sidebarLists.savedOnGoingConditionNote).toHaveValue('This is a note');
  });

  test('[T-0040][AT-0098]Skipping mandatory field should throw error', async ({ patientDetailsPage }) => {
    await patientDetailsPage.sidebarLists.initiateNewOngoingConditionAddButton.click();

    await patientDetailsPage.clickAddButtonToConfirm(
      patientDetailsPage.sidebarLists.submitNewOngoingConditionAddButton,
    );

    await expect(
      patientDetailsPage.sidebarLists.ongoingConditionNameWrapper.filter({
        hasText: 'Required',
      }),
    ).toBeVisible();
  });

  test('[AT-0099]Edit ongoing condition', async ({ patientDetailsPage }) => {
    await patientDetailsPage.sidebarLists.addNewOngoingConditionWithAllFields(
      'Eating habits inadequate',
      '2024-07-13',
      'Initial Admin',
      'Temporary note',
    );

    await patientDetailsPage.sidebarLists.firstListItem.click();

    await patientDetailsPage.sidebarLists.savedOnGoingConditionNote.fill('Edited note');

    await patientDetailsPage.clickAddButtonToConfirm(
      patientDetailsPage.sidebarLists.getOngoingConditionEditSubmitButton(),
    );

    await patientDetailsPage.sidebarLists.firstListItem.click();

    await expect(patientDetailsPage.sidebarLists.savedOnGoingConditionName).toHaveValue(
      'Eating habits inadequate',
    );
    expect(
      normalizeToIsoDate(await patientDetailsPage.sidebarLists.savedOnGoingConditionDate.inputValue()),
    ).toBe('2024-07-13');
    await expect(patientDetailsPage.sidebarLists.savedOnGoingConditionClinician).toHaveValue('Initial Admin');
    await expect(patientDetailsPage.sidebarLists.savedOnGoingConditionNote).toHaveValue('Edited note');
    await expect(patientDetailsPage.page.getByText('Temporary note')).toBeHidden();
  });

  test('[AT-0100]Mark ongoing condition as resolved', async ({ patientDetailsPage }) => {
    await patientDetailsPage.sidebarLists.addNewOngoingConditionWithAllFields(
      'Pain in hand',
      '2024-08-14',
      'Initial Admin',
      'This is to test resolving a note',
    );

    await patientDetailsPage.sidebarLists.firstListItem.click();

    await expect(patientDetailsPage.sidebarLists.resolvedCheckbox).not.toBeChecked();

    await patientDetailsPage.sidebarLists.resolveOngoingCondition('Initial Admin', 'Resolved note');

    await expect(patientDetailsPage.sidebarLists.firstListItem).toContainText('Pain in hand (resolved)');

    await patientDetailsPage.sidebarLists.firstListItem.click();

    await expect(patientDetailsPage.sidebarLists.savedOnGoingConditionName).toHaveValue('Pain in hand');
    expect(
      normalizeToIsoDate(await patientDetailsPage.sidebarLists.savedOnGoingConditionDate.inputValue()),
    ).toBe('2024-08-14');
    await expect(patientDetailsPage.sidebarLists.savedOnGoingConditionClinician).toHaveValue('Initial Admin');
    await expect(patientDetailsPage.sidebarLists.savedOnGoingConditionNote).toHaveValue(
      'This is to test resolving a note',
    );

    await expect(patientDetailsPage.sidebarLists.resolvedCheckbox).toBeChecked();
    await expect(patientDetailsPage.sidebarLists.resolvedClinician).toHaveValue('Initial Admin');
    await expect(patientDetailsPage.sidebarLists.resolvedNote).toHaveValue('Resolved note');
  });

  test('[T-0042][AT-0101]Add allergy with just the required fields', async ({ patientDetailsPage }) => {
    const currentBrowserDate = patientDetailsPage.getCurrentBrowserDateISOFormat();

    await patientDetailsPage.sidebarLists.addNewAllergyWithJustRequiredFields('Dust mites');

    await expect(patientDetailsPage.sidebarLists.firstListItem).toContainText('Dust mites');

    await patientDetailsPage.sidebarLists.firstListItem.click();

    await expect(patientDetailsPage.sidebarLists.savedAllergyName).toHaveValue('Dust mites');
    expect(normalizeToIsoDate(await patientDetailsPage.sidebarLists.savedAllergyDate.inputValue())).toBe(
      currentBrowserDate,
    );
  });

  test('[T-0042][AT-0102]Add allergy with all fields', async () => {
    //TODO: can't do this until figured out how to import reference data for reaction
  });

  test('[AT-0103]Edit allergy', async ({ patientDetailsPage }) => {
    await patientDetailsPage.sidebarLists.addNewAllergyWithJustRequiredFields('Eggs');

    await patientDetailsPage.sidebarLists.firstListItem.click();

    await patientDetailsPage.sidebarLists.savedAllergyNote.fill('Edited to add a note');
    await patientDetailsPage.sidebarLists.getAllergyEditSubmitButton().click();

    await patientDetailsPage.sidebarLists.firstListItem.click();

    await expect(patientDetailsPage.sidebarLists.savedAllergyName).toHaveValue('Eggs');
    await expect(patientDetailsPage.sidebarLists.savedAllergyNote).toHaveValue('Edited to add a note');

    await patientDetailsPage.sidebarLists.savedAllergyNote.fill('Second edit');
    await patientDetailsPage.sidebarLists.getAllergyEditSubmitButton().click();

    await patientDetailsPage.sidebarLists.firstListItem.click();

    await expect(patientDetailsPage.sidebarLists.savedAllergyName).toHaveValue('Eggs');
    await expect(patientDetailsPage.sidebarLists.savedAllergyNote).toHaveValue('Second edit');
    await expect(patientDetailsPage.page.getByText('Edited to add a note')).toBeHidden();
  });

  test('[T-0043][AT-0104]Add allergy that is not in dropdown list', async ({
    patientDetailsPage,
    newPatient,
  }) => {
    const newAllergy = patientDetailsPage.sidebarLists.generateNewAllergy(newPatient.displayId);

    await patientDetailsPage.sidebarLists.searchNewAllergyNotInDropdown(newAllergy);

    await expect(patientDetailsPage.page.getByText('item not in list')).toBeVisible();

    await patientDetailsPage.sidebarLists.addNewAllergyNotInDropdown(newAllergy);

    await expect(patientDetailsPage.sidebarLists.firstListItem).toContainText(newAllergy);

    await patientDetailsPage.sidebarLists.firstListItem.click();

    await expect(patientDetailsPage.sidebarLists.savedAllergyName).toHaveValue(newAllergy);
  });

  test('[T-0044][AT-0105]Add family history with just the required fields', async ({ patientDetailsPage }) => {
    const currentBrowserDate = patientDetailsPage.getCurrentBrowserDateISOFormat();

    await patientDetailsPage.sidebarLists.addNewFamilyHistoryWithJustRequiredFields('Hair alopecia');

    await expect(patientDetailsPage.sidebarLists.firstListItem).toContainText('Hair alopecia');

    await patientDetailsPage.sidebarLists.firstListItem.click();

    await expect(patientDetailsPage.sidebarLists.savedFamilyHistoryName).toHaveValue('Hair alopecia');
    expect(
      normalizeToIsoDate(await patientDetailsPage.sidebarLists.savedFamilyHistoryDateRecorded.inputValue()),
    ).toBe(currentBrowserDate);
  });

  test('[T-0044][AT-0106]Add family history with all fields', async ({ patientDetailsPage }) => {
    await patientDetailsPage.sidebarLists.addNewFamilyHistoryWithAllFields(
      'Ear burn',
      '2025-05-26',
      'Mother',
      'Initial Admin',
      'Family history note',
    );

    await expect(patientDetailsPage.sidebarLists.firstListItem).toContainText('Ear burn (Mother)');

    await patientDetailsPage.sidebarLists.firstListItem.click();

    await expect(patientDetailsPage.sidebarLists.savedFamilyHistoryName).toHaveValue('Ear burn');
    expect(
      normalizeToIsoDate(await patientDetailsPage.sidebarLists.savedFamilyHistoryDateRecorded.inputValue()),
    ).toBe('2025-05-26');
    await expect(patientDetailsPage.sidebarLists.savedFamilyHistoryRelationship).toHaveValue('Mother');
    await expect(patientDetailsPage.sidebarLists.savedFamilyClinician).toHaveValue('Initial Admin');
    await expect(patientDetailsPage.sidebarLists.savedFamilyHistoryNote).toHaveValue('Family history note');
  });

  test('[AT-0107]Edit family history', async ({ patientDetailsPage }) => {
    await patientDetailsPage.sidebarLists.addNewFamilyHistoryWithJustRequiredFields('Hair alopecia');

    await patientDetailsPage.sidebarLists.firstListItem.click();

    await fillMuiDateField(patientDetailsPage.sidebarLists.savedFamilyHistoryDateRecorded, '2025-05-25');
    await patientDetailsPage.sidebarLists.savedFamilyHistoryRelationship.fill('Mother');
    await patientDetailsPage.sidebarLists.savedFamilyClinician.click();
    await patientDetailsPage.page.getByRole('menuitem', { name: 'Initial Admin' }).click();
    await patientDetailsPage.sidebarLists.savedFamilyHistoryNote.fill('First edit to note');
    await patientDetailsPage.sidebarLists.getFamilyHistoryEditSubmitButton().click();

    await patientDetailsPage.sidebarLists.firstListItem.click();

    await expect(patientDetailsPage.sidebarLists.savedFamilyHistoryName).toHaveValue('Hair alopecia');
    expect(
      normalizeToIsoDate(await patientDetailsPage.sidebarLists.savedFamilyHistoryDateRecorded.inputValue()),
    ).toBe('2025-05-25');
    await expect(patientDetailsPage.sidebarLists.savedFamilyHistoryRelationship).toHaveValue('Mother');
    await expect(patientDetailsPage.sidebarLists.savedFamilyClinician).toHaveValue('Initial Admin');
    await expect(patientDetailsPage.sidebarLists.savedFamilyHistoryNote).toHaveValue('First edit to note');

    await patientDetailsPage.sidebarLists.savedFamilyHistoryNote.fill('Second edit to note');
    await patientDetailsPage.sidebarLists.getFamilyHistoryEditSubmitButton().click();

    await patientDetailsPage.sidebarLists.firstListItem.click();

    await expect(patientDetailsPage.sidebarLists.savedFamilyHistoryName).toHaveValue('Hair alopecia');
    expect(
      normalizeToIsoDate(await patientDetailsPage.sidebarLists.savedFamilyHistoryDateRecorded.inputValue()),
    ).toBe('2025-05-25');
    await expect(patientDetailsPage.sidebarLists.savedFamilyHistoryRelationship).toHaveValue('Mother');
    await expect(patientDetailsPage.sidebarLists.savedFamilyClinician).toHaveValue('Initial Admin');
    await expect(patientDetailsPage.sidebarLists.savedFamilyHistoryNote).toHaveValue('Second edit to note');

    await expect(patientDetailsPage.page.getByText('First edit to note')).toBeHidden();
  });

  test('[T-0045][AT-0108]Add other patient issue with default issue and note', async ({ patientDetailsPage }) => {
    await patientDetailsPage.sidebarLists.initiateNewOtherPatientIssuesAddButton.click();
    await expect(patientDetailsPage.sidebarLists.defaultNewIssue).toBeVisible();

    const currentBrowserDate = patientDetailsPage.getCurrentBrowserDateISOFormat();

    await patientDetailsPage.sidebarLists.addNewOtherPatientIssueNote('New issue note');

    await expect(patientDetailsPage.sidebarLists.firstListItem).toContainText('New issue note');

    await patientDetailsPage.sidebarLists.firstListItem.click();

    await expect(patientDetailsPage.sidebarLists.savedIssueType).toContainText('Issue');
    await expect(patientDetailsPage.sidebarLists.savedOtherPatientIssueNote).toHaveValue('New issue note');
    expect(
      normalizeToIsoDate(await patientDetailsPage.sidebarLists.savedOtherPatientIssueDate.inputValue()),
    ).toBe(currentBrowserDate);
  });

  test('[T-0045][AT-0109]Add other patient issue: warning', async ({ patientDetailsPage }) => {
    await patientDetailsPage.sidebarLists.addNewOtherPatientIssueWarning('Test warning');

    await expect(
      patientDetailsPage.sidebarLists.warningModalTitle.filter({ hasText: 'Patient warnings' }),
    ).toBeVisible();
    await expect(patientDetailsPage.sidebarLists.warningModalContent).toContainText('Test warning');
  });

  test('[AT-0110]Warning appears when navigating to patient with a warning', async ({
    patientDetailsPage,
    allPatientsPage,
    newPatient,
  }) => {
    await patientDetailsPage.sidebarLists.addNewOtherPatientIssueWarning(
      'A warning appears when navigating to a patient with a warning',
    );

    await allPatientsPage.goto();

    await allPatientsPage.navigateToPatientDetailsPage(newPatient.displayId);

    await expect(
      patientDetailsPage.sidebarLists.warningModalTitle.filter({ hasText: 'Patient warnings' }),
    ).toBeVisible();
    await expect(patientDetailsPage.sidebarLists.warningModalContent).toContainText(
      'A warning appears when navigating to a patient with a warning',
    );
  });

  test('[AT-0111]Edit patient warning', async ({ patientDetailsPage, allPatientsPage, newPatient }) => {
    await patientDetailsPage.sidebarLists.addNewOtherPatientIssueWarning('Test warning');
    await patientDetailsPage.sidebarLists.warningModalOkayButton.click();

    await patientDetailsPage.sidebarLists.firstListItem.click();

    await expect(patientDetailsPage.sidebarLists.savedOtherPatientIssueNote).toHaveValue('Test warning');

    await patientDetailsPage.sidebarLists.savedOtherPatientIssueNote.fill('Edited warning');
    await fillMuiDateField(patientDetailsPage.sidebarLists.savedOtherPatientIssueDate, '2025-09-17');
    await patientDetailsPage.sidebarLists.getOtherPatientIssuesEditSubmitButton().click();

    await patientDetailsPage.sidebarLists.firstListItem.click();

    await expect(patientDetailsPage.sidebarLists.savedOtherPatientIssueNote).toHaveValue('Edited warning');

    await allPatientsPage.goto();

    await allPatientsPage.navigateToPatientDetailsPage(newPatient.displayId);

    await expect(
      patientDetailsPage.sidebarLists.warningModalTitle.filter({ hasText: 'Patient warnings' }),
    ).toBeVisible();
    await expect(patientDetailsPage.sidebarLists.warningModalContent).toContainText('Edited warning');

    await patientDetailsPage.sidebarLists.warningModalOkayButton.click();

    await patientDetailsPage.sidebarLists.firstListItem.click();

    await expect(patientDetailsPage.sidebarLists.savedOtherPatientIssueNote).toHaveValue('Edited warning');
    expect(
      normalizeToIsoDate(await patientDetailsPage.sidebarLists.savedOtherPatientIssueDate.inputValue()),
    ).toBe('2025-09-17');
    await expect(patientDetailsPage.page.getByText('Test warning')).toBeHidden();
  });

  test('[T-0047][AT-0112]Add care plans', async ({ patientDetailsPage }) => {
    const newCarePlanModal = await patientDetailsPage.sidebarLists.addNewCarePlan();

    const currentBrowserDate = patientDetailsPage.getCurrentBrowserDateISOFormat();
    const defaultDate = await newCarePlanModal.carePlanDate.inputValue();
    expect(normalizeToIsoDate(defaultDate)).toBe(currentBrowserDate);

    await newCarePlanModal.fillOutCarePlan(
      'Diabetes',
      'This is an example of main care plan details',
    );
    await expect(patientDetailsPage.sidebarLists.firstCarePlanListItem).toContainText('Diabetes');

    const completedCarePlanModal = await patientDetailsPage.sidebarLists.navigateToCarePlan('Diabetes');

    await expect(completedCarePlanModal.carePlanHeader).toContainText('Care plan: Diabetes');
    await expect(completedCarePlanModal.completedMainCarePlan).toContainText(
      /This is an example of main care plan details/,
    );
    await expect(completedCarePlanModal.completedMainCarePlan).toContainText(
      'on behalf of Initial Admin',
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

  test('[AT-0113]Edit main care plan', async ({ patientDetailsPage }) => {
    const newCarePlanModal = await patientDetailsPage.sidebarLists.addNewCarePlan();

    await newCarePlanModal.fillOutCarePlan(
      'Mental health',
      'This is the main care plan which we will edit',
    );

    const completedCarePlanModal = await patientDetailsPage.sidebarLists.navigateToCarePlan('Mental health');

    await completedCarePlanModal.completedMainCarePlanKebabMenu.click();
    await completedCarePlanModal.completedCarePlanEditButton.click();

    await completedCarePlanModal.editableNoteContent.fill('Edited note');
    await completedCarePlanModal.getSaveButton().click();

    await expect(completedCarePlanModal.completedMainCarePlan).toContainText('Edited note');
    await expect(
      completedCarePlanModal.page.getByText('This is the main care plan which we will edit'),
    ).toBeHidden();
  });

  test('[AT-0114]Edit additional care plan note', async ({ patientDetailsPage }) => {
    const newCarePlanModal = await patientDetailsPage.sidebarLists.addNewCarePlan();

    await newCarePlanModal.fillOutCarePlan(
      'Cardiovascular disease',
      'This is the main care plan note which should not be edited',
    );

    const completedCarePlanModal =
      await patientDetailsPage.sidebarLists.navigateToCarePlan('Cardiovascular disease');

    await completedCarePlanModal.addAdditionalCarePlanNote(
      'This is the additional care plan note which should be edited',
      'System',
    );

    const additionalNoteKebabMenu = completedCarePlanModal.getAdditionalNoteKebabMenu('System');
    await additionalNoteKebabMenu.click();
    await completedCarePlanModal.additionalNoteEditButton.click();

    await fillMuiDateTimeField(completedCarePlanModal.additionalNoteSavedDate, '2025-04-26T15:40');
    await completedCarePlanModal.editableNoteContent.fill('Edited note');
    await completedCarePlanModal.getSaveButton().click();

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

  test('[T-0048][AT-0115]Delete care plan note', async ({ patientDetailsPage }) => {
    const newCarePlanModal = await patientDetailsPage.sidebarLists.addNewCarePlan();

    await newCarePlanModal.fillOutCarePlan(
      'Tuberculosis',
      'This is the main care plan which we will keep',
    );

    const completedCarePlanModal = await patientDetailsPage.sidebarLists.navigateToCarePlan('Tuberculosis');
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
