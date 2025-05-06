import { test, expect } from '../../fixtures/baseFixture';
import { addNewPatientWithRequiredFields } from '../../utils/generateNewPatient';

//TODO: this is just creating with required fields, we need to test creating with all fields too
//TODO: test editing / resolving sections of the sidebar
//TODO: check for any other specific sidebar test cases in the regression document
//TODO: refactor the "required fields" tests so they test all fields, test "required fields" as integration or unit tests
//TODO: test clicking on ongoing fields, allergies etc to confirm all details are entered correctly once test-id card is merged in?
//TODO: many of these test cases have a date field, should I test this as part of E2E tests or as unit tests?
//TODO: should program registry tests be part of this test file or another? theyre not in the sidebar section of the regression document (but maybe they should be). these require some test data to be imported
//TODO: tests for all the stuff in id forms? seems like it needs investigation on how to do this since its generating pdfs
//TODO: the logged in user doesnt seem to have access to death workflow? i dont see a record death button on patient sidebar
//TODO: check if any other relevant tests from regression document are missing from this file

//TODO: is it necessary to replicate the workflow of visiting an existing patient in each test?
test.describe('Patient Side Bar', () => {
  test.beforeEach(async ({ patientDetailsPage, allPatientsPage }) => {
    await allPatientsPage.goto();
    await addNewPatientWithRequiredFields(allPatientsPage);
    await patientDetailsPage.checkPatientDetailsPageHasLoaded();

    //this is to replicate the workflow of visiting an existing patient
    const patientData = allPatientsPage.getPatientData();
    await allPatientsPage.navigateToPatientDetailsPage(patientData.nhn);
    await patientDetailsPage.checkPatientDetailsPageHasLoaded();
    await expect(patientDetailsPage.patientNHN).toContainText(patientData.nhn);
  });

  test('Add ongoing condition with just the required fields', async ({ patientDetailsPage }) => {
    await patientDetailsPage.addNewOngoingConditionWithJustRequiredFields('Sleep apnea');

    await expect(patientDetailsPage.firstListItem).toContainText('Sleep apnea');
  });

  test('Add ongoing condition with all fields', async ({ patientDetailsPage }) => {
    //TODO:
  });

  test('Skipping mandatory field should throw error', async ({ patientDetailsPage }) => {
    //TODO:
  });

  test('Mark ongoing condition as resolved', async ({ patientDetailsPage }) => {
    //TODO:
  });

  test('Add allergy with just the required fields', async ({ patientDetailsPage }) => {
    await patientDetailsPage.addNewAllergyWithJustRequiredFields('Dust mites');

    await expect(patientDetailsPage.firstListItem).toContainText('Dust mites');
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
  });

  test('Add family history with just the required fields', async ({ patientDetailsPage }) => {
    await patientDetailsPage.addNewFamilyHistoryWithJustRequiredFields('Hair alopecia');

    await expect(patientDetailsPage.firstListItem).toContainText('Hair alopecia');
  });

  test('Add other patient issue with default issue and note', async ({ patientDetailsPage }) => {
    await patientDetailsPage.initiateNewOtherPatientIssuesAddButton.click();
    await expect(patientDetailsPage.defaultNewIssue).toBeVisible();
    await patientDetailsPage.addNewOtherPatientIssueNote('New issue note');

    await expect(patientDetailsPage.firstListItem).toContainText('New issue note');
  });

  test('Add other patient issue: warning', async ({ patientDetailsPage }) => {
    await patientDetailsPage.addNewOtherPatientIssueWarning('Test warning');

    await expect(patientDetailsPage.patientWarningHeader.filter({ hasText: 'Patient warnings' })).toBeVisible();
    await expect(patientDetailsPage.patientWarningModalContent).toContainText('Test warning');
  });

  test('Warning appears when navigating to patient with a warning', async ({
    patientDetailsPage,
    allPatientsPage,
  }) => {
    await patientDetailsPage.addNewOtherPatientIssueWarning('A warning appears when navigating to a patient with a warning');

    await allPatientsPage.goto();

    const patientData = allPatientsPage.getPatientData();
    await allPatientsPage.navigateToPatientDetailsPage(patientData.nhn);

    await expect(patientDetailsPage.patientWarningHeader.filter({ hasText: 'Patient warnings' })).toBeVisible();
    await expect(patientDetailsPage.patientWarningModalContent).toContainText('A warning appears when navigating to a patient with a warning');
  });

  test('Add care plans', async ({ patientDetailsPage }) => {
    const newCarePlanModal = await patientDetailsPage.addNewCarePlan();

    await newCarePlanModal.fillOutCarePlan(
      'Diabetes',
      'This is an example of main care plan details',
    );
    await expect(patientDetailsPage.firstCarePlanListItem).toContainText('Diabetes');

    const completedCarePlanModal = await patientDetailsPage.navigateToCarePlan('Diabetes');

    await expect(completedCarePlanModal.carePlanHeader).toContainText('Care plan: Diabetes');
    await expect(completedCarePlanModal.completedMainCarePlan).toContainText('This is an example of main care plan details');
    await expect(completedCarePlanModal.completedMainCarePlan).toContainText('On behalf of Initial Admin');

    await completedCarePlanModal.addAdditionalCarePlanNote('This is an additional care plan note', 'System');
    await expect(completedCarePlanModal.completedCarePlan.filter({hasText: 'System'})).toContainText('This is an additional care plan note');
    await expect(completedCarePlanModal.completedMainCarePlan).toContainText('This is an example of main care plan details');
  });

  test('Edit care plan', async ({ patientDetailsPage}) => {
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
    await expect(completedCarePlanModal.page.getByText('This is the main care plan which we will edit')).toBeHidden();
  })

  test('Delete care plan note', async ({ patientDetailsPage}) => {
    const newCarePlanModal = await patientDetailsPage.addNewCarePlan();

    await newCarePlanModal.fillOutCarePlan(
      'Tuberculosis',
      'This is the main care plan which we will keep',
    );

    const completedCarePlanModal = await patientDetailsPage.navigateToCarePlan('Tuberculosis');
    await completedCarePlanModal.addAdditionalCarePlanNote('This is a note which will be deleted', 'System');

    await expect(completedCarePlanModal.completedCarePlan.filter({ hasText: 'This is a note which will be deleted' })).toBeVisible();

    const additionalNoteKebabMenu = completedCarePlanModal.getAdditionalNoteKebabMenu('System');
    await additionalNoteKebabMenu.click();
    await completedCarePlanModal.additionalNoteDeleteButton.click();

    await expect(completedCarePlanModal.completedCarePlan.filter({ hasText: 'This is a note which will be deleted' })).toBeHidden();
    await expect(completedCarePlanModal.completedCarePlan.filter({ hasText: 'This is the main care plan which we will keep' })).toBeVisible();
  })
});
