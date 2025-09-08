import { test, expect } from '@fixtures/baseFixture';
import { LabRequestModal } from '../../pages/patients/LabRequestPage/modals/LabRequestModal';
import { LabRequestPane } from '@pages/patients/LabRequestPage/panes/LabRequestPane';
import { selectFieldOption } from '@utils/fieldHelpers';
import { format } from 'date-fns';

test.setTimeout(80000);

test.describe('Lab Request Tests', () => {
  let labRequestModal: LabRequestModal;
  let labRequestPane: LabRequestPane;
  
  // Lab Request Status Constants
  const LAB_REQUEST_STATUS = {
    RECEPTION_PENDING: 'Reception pending',
    SAMPLE_NOT_COLLECTED: 'Sample not collected',
  } as const;

  test.beforeEach(async ({ page, newPatientWithHospitalAdmission, patientDetailsPage }) => {
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.navigateToLabsTab(); 
    // Initialize the lab request modal
    labRequestModal = new LabRequestModal(page);
    labRequestPane = new LabRequestPane(page);
  });

  test.describe('Panel Lab Request Tests', () => {
    test('should create a panel lab request with basic details', async () => {
      await labRequestPane.newLabRequestButton.click();
      const panelsToSelect= ["Others", "Demo Test Panel"]
      await labRequestModal.waitForModalToLoad();
      const requestedDateTime = await labRequestModal.validateRequestedDateTimeIsToday();
      await labRequestModal.validateDepartment();
      const requestingClinician = await labRequestModal.validateRequestingClinician();
      await labRequestModal.nextButton.click();
      // Create panel lab request
      const panelCategories = await labRequestModal.selectItemsByText(panelsToSelect);
      await labRequestModal.validateSelectedItemsAndCategoriesInTable(panelsToSelect, panelCategories);
      await labRequestModal.nextButton.click();
      await labRequestModal.panelModal.validateSelectedPanelsAndCategoriesInSampleDetailsPage(panelsToSelect, panelCategories);
      await labRequestModal.finaliseButton.click();
      await labRequestModal.closeButton.click();
      await labRequestPane.waitForTableToLoad();
      await labRequestPane.sortTableByCategory();
      await labRequestPane.validateLabRequestTableContent(
        panelCategories,
        requestedDateTime,
        requestingClinician,
        'Unknown',
        LAB_REQUEST_STATUS.SAMPLE_NOT_COLLECTED,
      );
    });
    
    test('should allow searching for panels', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await labRequestModal.nextButton.click();
      await labRequestModal.searchItemAndValidate('Demo Test Panel');
    });

    test('Clear panel selection and validate', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await labRequestModal.nextButton.click();
      const panelsToSelect= ["Others", "Demo Test Panel"]
      const panelCategories = await labRequestModal.selectItemsByText(panelsToSelect);
      await labRequestModal.validateSelectedItemsAndCategoriesInTable(panelsToSelect, panelCategories);
      await labRequestModal.clearAllButton.click();
      const panelCount = await labRequestModal.panelModal.selectedPanelsList.locator('div').count();
      await expect(panelCount).toBe(0);
    });
    
    test('Create a lab request with all fields filled', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await selectFieldOption(labRequestModal.page, labRequestModal.prioritySelect, {
        selectFirst: true,
      });
      const priority = await labRequestModal.prioritySelect.locator('div').locator('div').first().textContent();
      await labRequestModal.nextButton.click();
      const panelsToSelect= ["Demo Test Panel"]
      const panelCategories = await labRequestModal.selectItemsByText(panelsToSelect);
      await labRequestModal.validateSelectedItemsAndCategoriesInTable(panelsToSelect, panelCategories);
      const noteToAdd = 'This is a test note';
      await labRequestModal.addNotes(noteToAdd);
      await labRequestModal.nextButton.click();
      const currentDateTime = labRequestModal.getCurrentDateTime();
      await labRequestModal.setDateTimeCollected(currentDateTime);
      await labRequestModal.selectFirstCollectedBy(0);
      await labRequestModal.selectFirstSpecimenType(0);
      await labRequestModal.selectFirstSite(0);
      await labRequestModal.panelModal.validateSelectedPanelsAndCategoriesInSampleDetailsPage(panelsToSelect, panelCategories);
      await labRequestModal.finaliseButton.click();
      await labRequestModal.closeButton.click();
      await labRequestPane.waitForTableToLoad();  
      await labRequestPane.sortTableByCategory();
      await labRequestPane.validateLabRequestTableContent(
        panelCategories,
        currentDateTime,
        (await labRequestModal.getCurrentUser()).displayName,
        priority!,
        LAB_REQUEST_STATUS.RECEPTION_PENDING,
      );
    });

    test('should not allow creating a lab request without selecting any panels', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await labRequestModal.nextButton.click();
      await labRequestModal.nextButton.click();
      await expect(labRequestModal.testSelectionError).toBeVisible();
    });

    test('Pressing Cancel should close the modal and not to create a lab request', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await labRequestModal.nextButton.click();
      const panelsToSelect=["Demo Test Panel"]
      await labRequestModal.selectItemsByText(panelsToSelect);
      await labRequestModal.nextButton.click();
      await labRequestModal.cancelButton.click();
      await expect(labRequestModal.panelModal.sampleDetailsPanels).not.toBeVisible();
      await expect(labRequestPane.tableRows.locator('td')).toHaveText('No lab requests found');
    });
    test('Should allow navigating back to the previous page for panel lab request', async () => { 
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await labRequestModal.nextButton.click();
      const panelsToSelect=["Demo Test Panel"]
      await labRequestModal.selectItemsByText(panelsToSelect);
      const noteToAdd = 'This is a test note';
      await labRequestModal.panelModal.addNotes(noteToAdd);
      await labRequestModal.nextButton.click();
      await labRequestModal.backButton.click();
      for (let i = 0; i < panelsToSelect.length; i++) {
        await expect(labRequestModal.panelModal.selectedPanelLabels.nth(i)).toHaveText(panelsToSelect[i]);
      }
      await expect(labRequestModal.panelModal.notesTextarea).toHaveValue(noteToAdd);
      await labRequestModal.backButton.click();
      await labRequestModal.validateDepartment();
      await labRequestModal.validateRequestingClinician();
    });
  })
  test.describe('Individual Lab Request Tests', () => {
    test('should create an individual lab request with basic details', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      const requestedDateTime = await labRequestModal.validateRequestedDateTimeIsToday();
      const department = await labRequestModal.validateDepartment();
      const requestingClinician = await labRequestModal.validateRequestingClinician();
      await labRequestModal.individualRadioButton.click();
      await labRequestModal.nextButton.click();
      const testsToSelect = ["AgRDT Negative, no further testing needed", "AgRDT Positive, no further testing needed"]
      const selectedTestsCategories = await labRequestModal.selectItemsByText(testsToSelect);
      const distinctCategories = [...new Set(selectedTestsCategories)];
      await labRequestModal.validateSelectedItemsAndCategoriesInTable(testsToSelect, selectedTestsCategories);
      await labRequestModal.nextButton.click();
      await labRequestModal.individualModal.validateSelectedCategoriesInSampleDetailsPage(distinctCategories);
      await labRequestModal.finaliseButton.click();
      const formattedDate = format(new Date(requestedDateTime), 'MM/dd/yyyy h:mm a');
      await labRequestModal.individualModal.validateRequestFinalisedPage({
        requestingClinician,
        requestedDateTime: formattedDate,
        priority: '-',
        department: department || 'Unknown',
        expectedCategories: distinctCategories,
        expectedSampleDate: 'Sample not collected',
      });
      await labRequestModal.closeButton.click();
      await labRequestPane.waitForTableToLoad();
      await labRequestPane.sortTableByCategory();
      await labRequestPane.validateLabRequestTableContent(
        distinctCategories,
        requestedDateTime,
        requestingClinician || 'Unknown',
        'Unknown',
        LAB_REQUEST_STATUS.SAMPLE_NOT_COLLECTED,
      );
    });
    test('should create an individual lab request with all fields filled', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      const requestedDateTime = await labRequestModal.validateRequestedDateTimeIsToday();
      const department = await labRequestModal.validateDepartment();
      const requestingClinician = await labRequestModal.validateRequestingClinician();
      await selectFieldOption(labRequestModal.page, labRequestModal.prioritySelect, {
        selectFirst: true,
      });
      const priority = await labRequestModal.prioritySelect.locator('div').locator('div').first().textContent();
      await labRequestModal.individualRadioButton.click();
      await labRequestModal.nextButton.click();
      const testsToSelect = ["AgRDT Negative, no further testing needed", "AgRDT Positive, no further testing needed"]
      const selectedTestsCategories = await labRequestModal.selectItemsByText(testsToSelect);
      const distinctCategories = [...new Set(selectedTestsCategories)];
      await labRequestModal.validateSelectedItemsAndCategoriesInTable(testsToSelect, selectedTestsCategories);
      const noteToAdd = 'This is a test note';
      await labRequestModal.addNotes(noteToAdd);
      await labRequestModal.nextButton.click();
      const currentDateTime = labRequestModal.getCurrentDateTime();
      for (let i = 0; i < distinctCategories.length; i++) {
        await labRequestModal.individualModal.setDateTimeCollected(currentDateTime, i);
        await labRequestModal.individualModal.selectFirstCollectedBy(i);
        await labRequestModal.individualModal.selectFirstSpecimenType(i);
        await labRequestModal.individualModal.selectFirstSite(i);
      }
      await labRequestModal.individualModal.validateSelectedCategoriesInSampleDetailsPage(distinctCategories);
      await labRequestModal.finaliseButton.click();
      const formattedDate = format(new Date(requestedDateTime), 'MM/dd/yyyy h:mm a');
      await labRequestModal.individualModal.validateRequestFinalisedPage({
        requestingClinician,
        requestedDateTime: formattedDate,
        priority: priority || '-',
        department: department || 'Unknown',
        expectedCategories: distinctCategories,
        expectedSampleDate: currentDateTime,
      });
      await labRequestModal.individualModal.closeButton.click();
      await labRequestPane.waitForTableToLoad();
      await labRequestPane.sortTableByCategory();
      await labRequestPane.validateLabRequestTableContent(
        distinctCategories,
        requestedDateTime,
        requestingClinician || 'Unknown',
        priority || 'Unknown',
        LAB_REQUEST_STATUS.RECEPTION_PENDING,
      );
    });
    test('Clear individual test selection and validate', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await labRequestModal.individualRadioButton.click();
      await labRequestModal.nextButton.click();
      const testsToSelect = ["AgRDT Negative, no further testing needed", "AgRDT Positive, no further testing needed"]
      const selectedTestsCategories = await labRequestModal.selectItemsByText(testsToSelect);
      await labRequestModal.validateSelectedItemsAndCategoriesInTable(testsToSelect, selectedTestsCategories);
      await labRequestModal.clearAllButton.click();
      const testCount = await labRequestModal.selectedItems.locator('div').count();
      await expect(testCount).toBe(0);
    });
    test('Should allow navigating back to the previous page for individual lab request', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      const requestedDateTime = await labRequestModal.requestDateTimeInput.inputValue();
      await labRequestModal.individualRadioButton.click();
      await labRequestModal.nextButton.click();
      const testsToSelect = ["AgRDT Negative, no further testing needed", "AgRDT Positive, no further testing needed"]
      const selectedTestsCategories = await labRequestModal.selectItemsByText(testsToSelect);
      await labRequestModal.validateSelectedItemsAndCategoriesInTable(testsToSelect, selectedTestsCategories);
      const noteToAdd = 'This is a test note';
      await labRequestModal.addNotes(noteToAdd);
      await labRequestModal.nextButton.click();
      await labRequestModal.backButton.click();
      for (let i = 0; i < testsToSelect.length; i++) {
        await expect(labRequestModal.individualModal.selectedTestsLabels.nth(i)).toHaveText(testsToSelect[i]);
      }
      await expect(labRequestModal.individualModal.notesTextarea).toHaveValue(noteToAdd);
      await labRequestModal.backButton.click();
      await labRequestModal.validateDepartment();
      await labRequestModal.validateRequestingClinician();
      await expect(labRequestModal.requestDateTimeInput).toHaveValue(requestedDateTime);
    });
    test('Should not allow creating a lab request without selecting any tests', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await labRequestModal.individualRadioButton.click();
      await labRequestModal.nextButton.click();
      await labRequestModal.nextButton.click();
      await expect(labRequestModal.testSelectionError).toBeVisible();
    });
    test('should allow searching for individual tests', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await labRequestModal.individualRadioButton.click();
      await labRequestModal.nextButton.click();
      await labRequestModal.searchItemAndValidate('AgRDT Negative, no further testing needed');
    });
    //Skipping the test because we need to add proper locator for test category drop down
    test.skip('Should be able to filter by test category dropdown', async () => {       
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await labRequestModal.individualRadioButton.click();
      await labRequestModal.nextButton.click();
      const categoryToSelect='FBC';
      await labRequestModal.individualModal.selectCategory(categoryToSelect);
      await labRequestModal.individualModal.validateTestsCategory(categoryToSelect);
    });
  }); 
});