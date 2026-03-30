import { test, expect } from '../../fixtures/test';
import { getUser } from '../../fixtures/api';
import { CarePlanModal } from '@pages/patients/PatientDetailsPage/modals/CarePlanModal';
import { fillDate, fillDateTime, toIsoDate, getBrowserDate, toTableDate } from '@helpers/dates';

test.describe('Patient Side Bar', () => {
  test.beforeEach(async ({ api, patientDetailsPage, newPatient }) => {
    await getUser(api);
    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.confirmPageLoaded();
  });

  test('[T-0040][AT-0096]Add ongoing condition with just the required fields', async ({
    patientDetailsPage,
  }) => {
    const currentBrowserDate = await getBrowserDate(patientDetailsPage.page);

    await patientDetailsPage.addOngoingCondition('Sleep apnea');

    await expect(patientDetailsPage.firstListItem).toContainText('Sleep apnea');

    await patientDetailsPage.firstListItem.click();

    await expect(patientDetailsPage.savedOngoingName).toHaveValue('Sleep apnea');
    expect(toIsoDate(await patientDetailsPage.savedOngoingDate.inputValue())).toBe(
      currentBrowserDate,
    );
  });

  test('[T-0040][AT-0097]Add ongoing condition with all fields', async ({ patientDetailsPage }) => {
    await patientDetailsPage.addOngoingConditionWithAllFields(
      'Jaw dislocation',
      '2024-06-20',
      'Initial Admin',
      'This is a note',
    );

    await expect(patientDetailsPage.firstListItem).toContainText('Jaw dislocation');

    await patientDetailsPage.firstListItem.click();

    await expect(patientDetailsPage.savedOngoingName).toHaveValue('Jaw dislocation');
    expect(toIsoDate(await patientDetailsPage.savedOngoingDate.inputValue())).toBe('2024-06-20');
    await expect(patientDetailsPage.savedOngoingClinician).toHaveValue('Initial Admin');
    await expect(patientDetailsPage.savedOngoingNote).toHaveValue('This is a note');
  });

  test('[T-0040][AT-0098]Skipping mandatory field should throw error', async ({
    patientDetailsPage,
  }) => {
    await patientDetailsPage.addOngoingConditionButton.click();

    await patientDetailsPage.page.waitForLoadState('networkidle');
    await patientDetailsPage.ongoingConditionSubmitButton.click();
    await patientDetailsPage.page.waitForLoadState('networkidle');

    await expect(
      patientDetailsPage.ongoingConditionNameWrapper.filter({
        hasText: 'Required',
      }),
    ).toBeVisible();
  });

  test('[AT-0099]Edit ongoing condition', async ({ patientDetailsPage }) => {
    await patientDetailsPage.addOngoingConditionWithAllFields(
      'Eating habits inadequate',
      '2024-07-13',
      'Initial Admin',
      'Temporary note',
    );

    await patientDetailsPage.firstListItem.click();

    await patientDetailsPage.savedOngoingNote.fill('Edited note');

    await patientDetailsPage.page.waitForLoadState('networkidle');
    await patientDetailsPage.getOngoingConditionEditSubmitButton().click();
    await patientDetailsPage.page.waitForLoadState('networkidle');

    await patientDetailsPage.firstListItem.click();

    await expect(patientDetailsPage.savedOngoingName).toHaveValue('Eating habits inadequate');
    expect(toIsoDate(await patientDetailsPage.savedOngoingDate.inputValue())).toBe('2024-07-13');
    await expect(patientDetailsPage.savedOngoingClinician).toHaveValue('Initial Admin');
    await expect(patientDetailsPage.savedOngoingNote).toHaveValue('Edited note');
    await expect(patientDetailsPage.page.getByText('Temporary note')).toBeHidden();
  });

  test('[AT-0100]Mark ongoing condition as resolved', async ({ patientDetailsPage }) => {
    await patientDetailsPage.addOngoingConditionWithAllFields(
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

    await expect(patientDetailsPage.savedOngoingName).toHaveValue('Pain in hand');
    expect(toIsoDate(await patientDetailsPage.savedOngoingDate.inputValue())).toBe('2024-08-14');
    await expect(patientDetailsPage.savedOngoingClinician).toHaveValue('Initial Admin');
    await expect(patientDetailsPage.savedOngoingNote).toHaveValue(
      'This is to test resolving a note',
    );

    await expect(patientDetailsPage.resolvedCheckbox).toBeChecked();
    await expect(patientDetailsPage.resolvedClinician).toHaveValue('Initial Admin');
    await expect(patientDetailsPage.resolvedNote).toHaveValue('Resolved note');
  });

  test('[T-0042][AT-0101]Add allergy with just the required fields', async ({
    patientDetailsPage,
  }) => {
    const currentBrowserDate = await getBrowserDate(patientDetailsPage.page);

    await patientDetailsPage.addAllergy('Dust mites');

    await expect(patientDetailsPage.firstListItem).toContainText('Dust mites');

    await patientDetailsPage.firstListItem.click();

    await expect(patientDetailsPage.savedAllergyName).toHaveValue('Dust mites');
    expect(toIsoDate(await patientDetailsPage.savedAllergyDate.inputValue())).toBe(
      currentBrowserDate,
    );
  });

  test('[T-0042][AT-0102]Add allergy with all fields', async () => {
    //TODO: can't do this until figured out how to import reference data for reaction
  });

  test('[AT-0103]Edit allergy', async ({ patientDetailsPage }) => {
    await patientDetailsPage.addAllergy('Eggs');

    await patientDetailsPage.firstListItem.click();

    await patientDetailsPage.savedAllergyNote.fill('Edited to add a note');
    await patientDetailsPage.getAllergyEditSubmitButton().click();

    await patientDetailsPage.firstListItem.click();

    await expect(patientDetailsPage.savedAllergyName).toHaveValue('Eggs');
    await expect(patientDetailsPage.savedAllergyNote).toHaveValue('Edited to add a note');

    await patientDetailsPage.savedAllergyNote.fill('Second edit');
    await patientDetailsPage.getAllergyEditSubmitButton().click();

    await patientDetailsPage.firstListItem.click();

    await expect(patientDetailsPage.savedAllergyName).toHaveValue('Eggs');
    await expect(patientDetailsPage.savedAllergyNote).toHaveValue('Second edit');
    await expect(patientDetailsPage.page.getByText('Edited to add a note')).toBeHidden();
  });

  test('[T-0043][AT-0104]Add allergy that is not in dropdown list', async ({
    patientDetailsPage,
    newPatient,
  }) => {
    const newAllergy = patientDetailsPage.generateUniqueAllergy(newPatient.displayId);

    await patientDetailsPage.searchAllergyNotInDropdown(newAllergy);

    await expect(patientDetailsPage.page.getByText('item not in list')).toBeVisible();

    await patientDetailsPage.addAllergyNotInDropdown(newAllergy);

    await expect(patientDetailsPage.firstListItem).toContainText(newAllergy);

    await patientDetailsPage.firstListItem.click();

    await expect(patientDetailsPage.savedAllergyName).toHaveValue(newAllergy);
  });

  test('[T-0044][AT-0105]Add family history with just the required fields', async ({
    patientDetailsPage,
  }) => {
    const currentBrowserDate = await getBrowserDate(patientDetailsPage.page);

    await patientDetailsPage.addFamilyHistory('Hair alopecia');

    await expect(patientDetailsPage.firstListItem).toContainText('Hair alopecia');

    await patientDetailsPage.firstListItem.click();

    await expect(patientDetailsPage.savedFamilyHistoryName).toHaveValue('Hair alopecia');
    expect(toIsoDate(await patientDetailsPage.savedFamilyHistoryDate.inputValue())).toBe(
      currentBrowserDate,
    );
  });

  test('[T-0044][AT-0106]Add family history with all fields', async ({ patientDetailsPage }) => {
    await patientDetailsPage.addFamilyHistoryWithAllFields(
      'Ear burn',
      '2025-05-26',
      'Mother',
      'Initial Admin',
      'Family history note',
    );

    await expect(patientDetailsPage.firstListItem).toContainText('Ear burn (Mother)');

    await patientDetailsPage.firstListItem.click();

    await expect(patientDetailsPage.savedFamilyHistoryName).toHaveValue('Ear burn');
    expect(toIsoDate(await patientDetailsPage.savedFamilyHistoryDate.inputValue())).toBe(
      '2025-05-26',
    );
    await expect(patientDetailsPage.savedFamilyHistoryRelationship).toHaveValue('Mother');
    await expect(patientDetailsPage.savedFamilyClinician).toHaveValue('Initial Admin');
    await expect(patientDetailsPage.savedFamilyHistoryNote).toHaveValue('Family history note');
  });

  test('[AT-0107]Edit family history', async ({ patientDetailsPage }) => {
    await patientDetailsPage.addFamilyHistory('Hair alopecia');

    await patientDetailsPage.firstListItem.click();

    await fillDate(patientDetailsPage.savedFamilyHistoryDate, '2025-05-25');
    await patientDetailsPage.savedFamilyHistoryRelationship.fill('Mother');
    await patientDetailsPage.savedFamilyClinician.click();
    await patientDetailsPage.page.getByRole('menuitem', { name: 'Initial Admin' }).click();
    await patientDetailsPage.savedFamilyHistoryNote.fill('First edit to note');
    await patientDetailsPage.getFamilyHistoryEditSubmitButton().click();

    await patientDetailsPage.firstListItem.click();

    await expect(patientDetailsPage.savedFamilyHistoryName).toHaveValue('Hair alopecia');
    expect(toIsoDate(await patientDetailsPage.savedFamilyHistoryDate.inputValue())).toBe(
      '2025-05-25',
    );
    await expect(patientDetailsPage.savedFamilyHistoryRelationship).toHaveValue('Mother');
    await expect(patientDetailsPage.savedFamilyClinician).toHaveValue('Initial Admin');
    await expect(patientDetailsPage.savedFamilyHistoryNote).toHaveValue('First edit to note');

    await patientDetailsPage.savedFamilyHistoryNote.fill('Second edit to note');
    await patientDetailsPage.getFamilyHistoryEditSubmitButton().click();

    await patientDetailsPage.firstListItem.click();

    await expect(patientDetailsPage.savedFamilyHistoryName).toHaveValue('Hair alopecia');
    expect(toIsoDate(await patientDetailsPage.savedFamilyHistoryDate.inputValue())).toBe(
      '2025-05-25',
    );
    await expect(patientDetailsPage.savedFamilyHistoryRelationship).toHaveValue('Mother');
    await expect(patientDetailsPage.savedFamilyClinician).toHaveValue('Initial Admin');
    await expect(patientDetailsPage.savedFamilyHistoryNote).toHaveValue('Second edit to note');

    await expect(patientDetailsPage.page.getByText('First edit to note')).toBeHidden();
  });

  test('[T-0045][AT-0108]Add other patient issue with default issue and note', async ({
    patientDetailsPage,
  }) => {
    await patientDetailsPage.addOtherIssuesButton.click();
    await expect(patientDetailsPage.defaultNewIssue).toBeVisible();

    const currentBrowserDate = await getBrowserDate(patientDetailsPage.page);

    await patientDetailsPage.addOtherIssueNote('New issue note');

    await expect(patientDetailsPage.firstListItem).toContainText('New issue note');

    await patientDetailsPage.firstListItem.click();

    await expect(patientDetailsPage.savedIssueType).toContainText('Issue');
    await expect(patientDetailsPage.savedOtherIssueNote).toHaveValue('New issue note');
    expect(toIsoDate(await patientDetailsPage.savedOtherIssueDate.inputValue())).toBe(
      currentBrowserDate,
    );
  });

  test('[T-0045][AT-0109]Add other patient issue: warning', async ({ patientDetailsPage }) => {
    await patientDetailsPage.addOtherIssueWarning('Test warning');

    await expect(
      patientDetailsPage.warningTitle.filter({ hasText: 'Patient warnings' }),
    ).toBeVisible();
    await expect(patientDetailsPage.warningContent).toContainText('Test warning');
  });

  test('[AT-0110]Warning appears when navigating to patient with a warning', async ({
    patientDetailsPage,
    allPatientsPage,
    newPatient,
  }) => {
    await patientDetailsPage.addOtherIssueWarning(
      'A warning appears when navigating to a patient with a warning',
    );

    await allPatientsPage.goto();
    await allPatientsPage.searchAndSelectByNHN(newPatient.displayId);

    await expect(
      patientDetailsPage.warningTitle.filter({ hasText: 'Patient warnings' }),
    ).toBeVisible();
    await expect(patientDetailsPage.warningContent).toContainText(
      'A warning appears when navigating to a patient with a warning',
    );
  });

  test('[AT-0111]Edit patient warning', async ({ patientDetailsPage, allPatientsPage, newPatient }) => {
    await patientDetailsPage.addOtherIssueWarning('Test warning');
    await patientDetailsPage.warningOkayButton.click();

    await patientDetailsPage.firstListItem.click();

    await expect(patientDetailsPage.savedOtherIssueNote).toHaveValue('Test warning');

    await patientDetailsPage.savedOtherIssueNote.fill('Edited warning');
    await fillDate(patientDetailsPage.savedOtherIssueDate, '2025-09-17');
    await patientDetailsPage.getOtherIssuesEditSubmitButton().click();

    await patientDetailsPage.firstListItem.click();

    await expect(patientDetailsPage.savedOtherIssueNote).toHaveValue('Edited warning');

    await allPatientsPage.goto();
    await allPatientsPage.searchAndSelectByNHN(newPatient.displayId);

    await expect(
      patientDetailsPage.warningTitle.filter({ hasText: 'Patient warnings' }),
    ).toBeVisible();
    await expect(patientDetailsPage.warningContent).toContainText('Edited warning');

    await patientDetailsPage.warningOkayButton.click();

    await patientDetailsPage.firstListItem.click();

    await expect(patientDetailsPage.savedOtherIssueNote).toHaveValue('Edited warning');
    expect(toIsoDate(await patientDetailsPage.savedOtherIssueDate.inputValue())).toBe('2025-09-17');
    await expect(patientDetailsPage.page.getByText('Test warning')).toBeHidden();
  });

  test('[T-0047][AT-0112]Add care plans', async ({ patientDetailsPage }) => {
    await patientDetailsPage.addCarePlanButton.click();
    const newCarePlanModal = new CarePlanModal(patientDetailsPage.page);

    const currentBrowserDate = await getBrowserDate(patientDetailsPage.page);
    const defaultDate = await newCarePlanModal.carePlanDate.inputValue();
    expect(toIsoDate(defaultDate)).toBe(currentBrowserDate);

    await newCarePlanModal.fillOutCarePlan(
      'Diabetes',
      'This is an example of main care plan details',
    );
    await expect(patientDetailsPage.firstCarePlanItem).toContainText('Diabetes');

    await patientDetailsPage.completedCarePlan('Diabetes').click();
    const completedCarePlanModal = new CarePlanModal(patientDetailsPage.page);

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
    await patientDetailsPage.addCarePlanButton.click();
    const newCarePlanModal = new CarePlanModal(patientDetailsPage.page);

    await newCarePlanModal.fillOutCarePlan(
      'Mental health',
      'This is the main care plan which we will edit',
    );

    await patientDetailsPage.completedCarePlan('Mental health').click();
    const completedCarePlanModal = new CarePlanModal(patientDetailsPage.page);

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
    await patientDetailsPage.addCarePlanButton.click();
    const newCarePlanModal = new CarePlanModal(patientDetailsPage.page);

    await newCarePlanModal.fillOutCarePlan(
      'Cardiovascular disease',
      'This is the main care plan note which should not be edited',
    );

    await patientDetailsPage.completedCarePlan('Cardiovascular disease').click();
    const completedCarePlanModal = new CarePlanModal(patientDetailsPage.page);

    await completedCarePlanModal.addAdditionalCarePlanNote(
      'This is the additional care plan note which should be edited',
      'System',
    );

    const additionalNoteKebabMenu = completedCarePlanModal.getAdditionalNoteKebabMenu('System');
    await additionalNoteKebabMenu.click();
    await completedCarePlanModal.additionalNoteEditButton.click();

    await fillDateTime(completedCarePlanModal.additionalNoteSavedDate, '2025-04-26T15:40');
    await completedCarePlanModal.editableNoteContent.fill('Edited note');
    await completedCarePlanModal.getSaveButton().click();

    await expect(completedCarePlanModal.completedSystemAdditionalCarePlan).toContainText(
      'Edited note',
    );
    await expect(completedCarePlanModal.completedSystemAdditionalCarePlan).toContainText(
      toTableDate('2025-04-26'),
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
    await patientDetailsPage.addCarePlanButton.click();
    const newCarePlanModal = new CarePlanModal(patientDetailsPage.page);

    await newCarePlanModal.fillOutCarePlan(
      'Tuberculosis',
      'This is the main care plan which we will keep',
    );

    await patientDetailsPage.completedCarePlan('Tuberculosis').click();
    const completedCarePlanModal = new CarePlanModal(patientDetailsPage.page);
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
