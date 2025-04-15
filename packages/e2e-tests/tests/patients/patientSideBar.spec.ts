import { test, expect } from '../../fixtures/baseFixture';
import { addNewPatientWithRequiredFields } from '../../utils/generateNewPatient';

//TODO: this is just creating with required fields, we need to test creating with all fields too
//TODO: test editing / resolving sections of the sidebar
//TODO: check for any other specific sidebar test cases in the regression document
//TODO: refactor the expects in each test to somehow also use a test-id once that card is merged in, rather than just getbytext to avoid false positives
//TODO: the getbytext expects here can be flakey, refactor to use test-ids once that card is merged in
//TODO: refactor the "required fields" tests so they test all fields, test "required fields" as integration or unit tests
//TODO: test clicking on ongoing fields, allergies etc to confirm all details are entered correctly once test-id card is merged in?
//TODO: many of these test cases have a date field, should I test this as part of E2E tests or as unit tests?
//TODO: should program registry tests be part of this test file or another? theyre not in the sidebar section of the regression document (but maybe they should be). these require some test data to be imported
//TODO: tests for all the stuff in id forms? seems like it needs investigation on how to do this since its generating pdfs
//TODO: the logged in user doesnt seem to have access to death workflow? i dont see a record death button on patient sidebar
//TODO: check if any other relevant tests from regression document are missing from this file

//move the patient generation to beforeall?
test.describe('Patient Side Bar', () => {

  test.beforeEach(async ({ patientDetailsPage, allPatientsPage }) => {
    await allPatientsPage.goto();    
    await addNewPatientWithRequiredFields(allPatientsPage);
    await patientDetailsPage.checkPatientDetailsPageHasLoaded();

    //this is to replicate the workflow of visiting an existing patient
    const patientData = allPatientsPage.getPatientData();
    await allPatientsPage.navigateToPatientDetailsPage(patientData.nhn);
    await patientDetailsPage.checkPatientDetailsPageHasLoaded();
    await patientDetailsPage.confirmCorrectNHN(patientData.nhn);
  });

  /*TODO: this ongoing condition test can sometimes be flaky and around 20% of the time sometimes seem to try select all 3 different "Sleep apnea" options,
  an even smaller percentage of the time it will select none of the options. the difference with this test and the others is "sleep apnea" has multiple results
  whereas in the other tests there is generally just one result for the test data.
  test-id card may fix this?*/
  test('Add ongoing condition with just the required fields', async ({ patientDetailsPage }) => {
    await patientDetailsPage.addNewOngoingConditionWithJustRequiredFields('Sleep apnea');

    await expect(patientDetailsPage.page.getByText('Sleep apnea')).toBeVisible();
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

    await expect(patientDetailsPage.page.getByText('Dust mites')).toBeVisible();
  });

  test('Add allergy that is not in dropdown list', async ({ patientDetailsPage, allPatientsPage }) => {
    const patientData = allPatientsPage.getPatientData();
    const newAllergy = patientDetailsPage.generateNewAllergy(patientData.nhn);

    await patientDetailsPage.searchNewAllergyNotInDropdown(newAllergy);

    await expect(patientDetailsPage.page.getByText('item not in list')).toBeVisible();

    await patientDetailsPage.addNewAllergyNotInDropdown(newAllergy);

    await expect(patientDetailsPage.page.getByText(newAllergy)).toBeVisible();
  });

  test('Add family history with just the required fields', async ({ patientDetailsPage }) => {
    await patientDetailsPage.addNewFamilyHistoryWithJustRequiredFields('Hair alopecia');

    await expect(patientDetailsPage.page.getByText('Hair alopecia')).toBeVisible();
  });
  

  test('Add other patient issue with default issue and note', async ({ patientDetailsPage }) => {
    await patientDetailsPage.initiateNewOtherPatientIssuesAddButton.click();
    await expect(patientDetailsPage.defaultNewIssue).toBeVisible();
    await patientDetailsPage.addNewOtherPatientIssueNote('New issue note');

    await expect(patientDetailsPage.completedNoteForNewIssue('New issue note')).toBeVisible();
  });

  test('Add other patient issue: warning', async ({ patientDetailsPage }) => {  
    await patientDetailsPage.addNewOtherPatientIssueWarning('Test warning');

    await expect(patientDetailsPage.page.getByText('Patient warnings')).toBeVisible();
    await expect(patientDetailsPage.page.getByRole('listitem')).toContainText('Test warning');
  });

  //TODO: come back to this test once test-id card is merged
  // add a unique warning for this test (different to the warning in the last test
  //  currently this isn't possible because the locator used for clicking the add button in the first step uses xpath
  test('Warning appears when navigating to patient with a warning', async ({ patientDetailsPage, allPatientsPage }) => {
    await patientDetailsPage.addNewOtherPatientIssueWarning('Test warning');

    await allPatientsPage.goto();

    const patientData = allPatientsPage.getPatientData();
    await allPatientsPage.navigateToPatientDetailsPage(patientData.nhn);

    await expect(patientDetailsPage.page.getByText('Patient warnings')).toBeVisible();
    await expect(patientDetailsPage.page.getByRole('listitem')).toContainText('Test warning');
  });
  
  //TODO: add a test case to delete a note (maybe as part of the below case?) once test-id card is merged
  //currently the locator for the kebab menu to delete a specific note doesnt use a great locator
  test('Add care plans', async({ patientDetailsPage }) => {
    const newCarePlanModal = await patientDetailsPage.addNewCarePlan();

    await newCarePlanModal.fillOutCarePlan('Diabetes', 'This is an example of main care plan details');
    await expect(patientDetailsPage.completedCarePlan('Diabetes')).toBeVisible();

    const completedCarePlanModal = await patientDetailsPage.navigateToCarePlan('Diabetes');

    await expect(completedCarePlanModal.page.getByText('Care plan: Diabetes')).toBeVisible();
    //TODO: when test id card is merged see if its possible to detect if this is within the same box as the main care plan red bolded text
    await expect(await completedCarePlanModal.mainCarePlan('This is an example of main care plan details')).toBeVisible();
    
    await expect(await completedCarePlanModal.mainCarePlanClinician('Initial Admin')).toBeVisible();

    await completedCarePlanModal.addAdditionalCarePlanNote('This is an additional care plan note');
    //TODO: when test id card is merged see if its possible to improve this locator so its specific to the completed note section
    await expect(await completedCarePlanModal.page.getByText('This is an additional care plan note')).toBeVisible();
  });

  test.describe('Death workflow', () => {
    test('Record death - Male, 3 months', async ({ page }) => {});
  });
});
