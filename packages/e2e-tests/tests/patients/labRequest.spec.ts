import { test, expect } from '@fixtures/baseFixture';
import { LabRequestModal } from '../../pages/patients/LabRequestPage/modals/LabRequestModal';
import { LabRequestPane } from '@pages/patients/LabRequestPage/panes/LabRequestPane';
import { selectFieldOption } from '@utils/fieldHelpers';

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
      const panelCategories = await labRequestModal.panelModal.selectPanelsByText(panelsToSelect);
      await labRequestModal.panelModal.validateSelectedPanelsAndCategoriesInTable(panelsToSelect, panelCategories);
      await labRequestModal.nextButton.click();
      await labRequestModal.panelModal.validateSelectedPanelsAndCategoriesInSampleDetailsPage(panelsToSelect, panelCategories);
      await labRequestModal.finaliseButton.click();
      await expect(labRequestModal.panelModal.requestFinalisedHeading).toHaveText('Request finalised');
      await labRequestModal.panelModal.closeButton.click();
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
      await labRequestModal.panelModal.searchPanelAndValidate('Demo Test Panel');
    });

    test('Clear panel selection and validate', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await labRequestModal.nextButton.click();
      const panelsToSelect= ["Others", "Demo Test Panel"]
      const panelCategories = await labRequestModal.panelModal.selectPanelsByText(panelsToSelect);
      await labRequestModal.panelModal.validateSelectedPanelsAndCategoriesInTable(panelsToSelect, panelCategories);
      await labRequestModal.panelModal.clearAllButton.click();
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
      const panelCategories = await labRequestModal.panelModal.selectPanelsByText(panelsToSelect);
      await labRequestModal.panelModal.validateSelectedPanelsAndCategoriesInTable(panelsToSelect, panelCategories);
      const noteToAdd = 'This is a test note';
      await labRequestModal.panelModal.addNotes(noteToAdd);
      await labRequestModal.nextButton.click();
      const currentDateTime = labRequestModal.getCurrentDateTime();
      await labRequestModal.panelModal.setDateTimeCollected(currentDateTime);
      await labRequestModal.panelModal.selectFirstCollectedBy();
      await labRequestModal.panelModal.selectFirstSpecimenType();
      await labRequestModal.panelModal.selectFirstSite();
      await labRequestModal.panelModal.validateSelectedPanelsAndCategoriesInSampleDetailsPage(panelsToSelect, panelCategories);
      await labRequestModal.finaliseButton.click();
      await expect(labRequestModal.panelModal.requestFinalisedHeading).toHaveText('Request finalised');
      await labRequestModal.panelModal.closeButton.click();
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
      await expect(labRequestModal.panelModal.panelSelectionError).toBeVisible();
    });

    test('Pressing Cancel should close the modal and not to create a lab request', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await labRequestModal.nextButton.click();
      const panelsToSelect=["Demo Test Panel"]
      await labRequestModal.panelModal.selectPanelsByText(panelsToSelect);
      await labRequestModal.nextButton.click();
      await labRequestModal.cancelButton.click();
      await expect(labRequestModal.panelModal.sampleDetailsPanels).not.toBeVisible();
      await expect(labRequestPane.tableRows.locator('td')).toHaveText('No lab requests found');
    });
    test('should allow navigating back to the previous page', async () => { 
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await labRequestModal.nextButton.click();
      const panelsToSelect=["Demo Test Panel"]
      await labRequestModal.panelModal.selectPanelsByText(panelsToSelect);
      const noteToAdd = 'This is a test note';
      await labRequestModal.panelModal.addNotes(noteToAdd);
      await labRequestModal.nextButton.click();
      await labRequestModal.backButton.click();
      await expect(labRequestModal.panelModal.selectedPanelLabels.first()).toHaveText(panelsToSelect[0]);
      await expect(labRequestModal.panelModal.notesTextarea).toHaveValue(noteToAdd);
      await labRequestModal.backButton.click();
      await labRequestModal.validateDepartment();
      await labRequestModal.validateRequestingClinician();
    });
  })
  test.describe('Individual Lab Request Tests', () => {
    test.skip('should create an individual lab request with basic details', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await labRequestModal.individualRadioButton.click();
      await labRequestModal.nextButton.click();
      const selectedTests = await labRequestModal.individualModal.selectTestsByIndex([1,2]);
      await labRequestModal.individualModal.validateSelectedTestsInTable(selectedTests);
      await labRequestModal.nextButton.click();
      await labRequestModal.panelModal.validateSelectedPanelsAndCategoriesInSampleDetailsPage(selectedTests, selectedTests);
      await labRequestModal.finaliseButton.click();
      await expect(labRequestModal.panelModal.requestFinalisedHeading).toHaveText('Request finalised');
      await labRequestModal.panelModal.closeButton.click();
      await labRequestPane.waitForTableToLoad();
      await labRequestPane.sortTableByCategory();
    });
  })
});