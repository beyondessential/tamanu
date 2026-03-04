import { test, expect } from '@fixtures/baseFixture';
import { LabRequestModal } from '../../pages/patients/LabRequestPage/modals/LabRequestModal';
import {
  LabRequestPane,
  LabRequestTestDetails,
} from '@pages/patients/LabRequestPage/panes/LabRequestPane';
import { selectFieldOption } from '@utils/fieldHelpers';
import { format } from 'date-fns';
import { LabRequestDetailsPage, LAB_REQUEST_STATUS } from '@pages/patients/LabRequestPage/LabRequestDetailsPage';
import { testData } from '@utils/testData';
import { getTableItems, selectFirstFromDropdown, formatDateTimeForDisplay } from '@utils/testHelper';
test.setTimeout(80000);

test.describe('Lab Request Tests', () => {
  let labRequestModal: LabRequestModal;
  let labRequestPane: LabRequestPane;

  test.beforeEach(async ({ page, newPatientWithHospitalAdmission, patientDetailsPage }) => {
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.navigateToLabsTab();
    // Initialize the lab request modal
    labRequestModal = new LabRequestModal(page);
    labRequestPane = new LabRequestPane(page);
  });

  test.describe('Panel Lab Request Tests', () => {
    test('[AT-0053]should create a panel lab request with basic details', async () => {
      await labRequestPane.newLabRequestButton.click();
      const panelsToSelect = ['Others', 'Demo Test Panel'];
      await labRequestModal.waitForModalToLoad();
      const requestedDateTime = await labRequestModal.validateRequestedDateTimeIsToday();
      await labRequestModal.validateDepartment();
      const requestingClinician = await labRequestModal.validateRequestingClinician();
      await labRequestModal.nextButton.click();
      // Create panel lab request
      const panelCategories = await labRequestModal.selectItemsByText(panelsToSelect);
      await labRequestModal.validateSelectedItemsAndCategoriesInTable(
        panelsToSelect,
        panelCategories,
      );
      await labRequestModal.nextButton.click();
      await labRequestModal.panelModal.validateSelectedPanelsAndCategoriesInSampleDetailsPage(
        panelsToSelect,
        panelCategories,
      );
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

    test('[T-0205][AT-0054]should allow searching for panels', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await labRequestModal.nextButton.click();
      await labRequestModal.searchItemAndValidate('Demo Test Panel');
    });

    test('[AT-0055]Clear panel selection and validate', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await labRequestModal.nextButton.click();
      const panelsToSelect = ['Others', 'Demo Test Panel'];
      const panelCategories = await labRequestModal.selectItemsByText(panelsToSelect);
      await labRequestModal.validateSelectedItemsAndCategoriesInTable(
        panelsToSelect,
        panelCategories,
      );
      await labRequestModal.clearAllButton.click();
      const panelCount = await labRequestModal.panelModal.selectedPanelsList.locator('div').count();
      await expect(panelCount).toBe(0);
    });

    test('[T-0207][AT-0056]Create a panel lab request with all fields filled', async () => {
      await labRequestPane.newLabRequestButton.click();
      const panelsToSelect = ['Demo Test Panel'];
      const { requestedDateTime, priority, panelCategories } = await labRequestModal.panelModal.createPanelLabRequestWithAllFields(panelsToSelect);
      await labRequestPane.waitForTableToLoad();
      await labRequestPane.sortTableByCategory();
      await labRequestPane.validateLabRequestTableContent(
        panelCategories,
        requestedDateTime,
        (await labRequestModal.getCurrentUser()).displayName,
        priority!,
        LAB_REQUEST_STATUS.RECEPTION_PENDING,
      );
    });

    test('[T-0207][AT-0057]should not allow creating a lab request without selecting any panels', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await labRequestModal.nextButton.click();
      await labRequestModal.nextButton.click();
      await expect(labRequestModal.testSelectionError).toBeVisible();
    });

    test('[AT-0058]Pressing Cancel should close the modal and not to create a lab request', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await labRequestModal.nextButton.click();
      const panelsToSelect = ['Demo Test Panel'];
      await labRequestModal.selectItemsByText(panelsToSelect);
      await labRequestModal.nextButton.click();
      await labRequestModal.cancelButton.click();
      await expect(labRequestModal.panelModal.sampleDetailsPanels).not.toBeVisible();
      await expect(labRequestPane.tableRows.locator('td')).toHaveText('No lab requests found');
    });
    test('[AT-0059]Should allow navigating back to the previous page for panel lab request', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await labRequestModal.nextButton.click();
      const panelsToSelect = ['Demo Test Panel'];
      await labRequestModal.selectItemsByText(panelsToSelect);
      const noteToAdd = 'This is a test note';
      await labRequestModal.panelModal.addNotes(noteToAdd);
      await labRequestModal.nextButton.click();
      await labRequestModal.backButton.click();
      for (let i = 0; i < panelsToSelect.length; i++) {
        await expect(labRequestModal.panelModal.selectedPanelLabels.nth(i)).toHaveText(
          panelsToSelect[i],
        );
      }
      await expect(labRequestModal.panelModal.notesTextarea).toHaveValue(noteToAdd);
      await labRequestModal.backButton.click();
      await labRequestModal.validateDepartment();
      await labRequestModal.validateRequestingClinician();
    });
  });
  test.describe('Individual Lab Request Tests', () => {
    test('[T-0209][AT-0060]should create an individual lab request with basic details', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      const requestedDateTime = await labRequestModal.validateRequestedDateTimeIsToday();
      const department = await labRequestModal.validateDepartment();
      const requestingClinician = await labRequestModal.validateRequestingClinician();
      await labRequestModal.individualRadioButton.click();
      await labRequestModal.nextButton.click();
      const testsToSelect = [
        'AgRDT Negative, no further testing needed',
        'AgRDT Positive, no further testing needed',
      ];
      const selectedTestsCategories = await labRequestModal.selectItemsByText(testsToSelect);
      const distinctCategories = [...new Set(selectedTestsCategories)];
      await labRequestModal.validateSelectedItemsAndCategoriesInTable(
        testsToSelect,
        selectedTestsCategories,
      );
      await labRequestModal.nextButton.click();
      await labRequestModal.individualModal.validateSelectedCategoriesInSampleDetailsPage(
        distinctCategories,
      );
      await labRequestModal.finaliseButton.click();
      const formattedDate = formatDateTimeForDisplay(new Date(requestedDateTime));
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
    test('[T-0209][AT-0061]should create an individual lab request with all fields filled', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      const requestedDateTime = await labRequestModal.validateRequestedDateTimeIsToday();
      const department = await labRequestModal.validateDepartment();
      const requestingClinician = await labRequestModal.validateRequestingClinician();
      await selectFieldOption(labRequestModal.page, labRequestModal.prioritySelect, {
        selectFirst: true,
      });
      const priority = await labRequestModal.prioritySelect
        .locator('div')
        .locator('div')
        .first()
        .textContent();
      await labRequestModal.individualRadioButton.click();
      await labRequestModal.nextButton.click();
      const testsToSelect = [
        'AgRDT Negative, no further testing needed',
        'AgRDT Positive, no further testing needed',
      ];
      const selectedTestsCategories = await labRequestModal.selectItemsByText(testsToSelect);
      const distinctCategories = [...new Set(selectedTestsCategories)];
      await labRequestModal.validateSelectedItemsAndCategoriesInTable(
        testsToSelect,
        selectedTestsCategories,
      );
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
      await labRequestModal.individualModal.validateSelectedCategoriesInSampleDetailsPage(
        distinctCategories,
      );
      await labRequestModal.finaliseButton.click();
      const formattedDate = formatDateTimeForDisplay(new Date(requestedDateTime));
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
    test('[AT-0062]Clear individual test selection and validate', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await labRequestModal.individualRadioButton.click();
      await labRequestModal.nextButton.click();
      const testsToSelect = [
        'AgRDT Negative, no further testing needed',
        'AgRDT Positive, no further testing needed',
      ];
      const selectedTestsCategories = await labRequestModal.selectItemsByText(testsToSelect);
      await labRequestModal.validateSelectedItemsAndCategoriesInTable(
        testsToSelect,
        selectedTestsCategories,
      );
      await labRequestModal.clearAllButton.click();
      const testCount = await labRequestModal.selectedItems.locator('div').count();
      await expect(testCount).toBe(0);
    });
    test('[AT-0063]Should allow navigating back to the previous page for individual lab request', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      const requestedDateTime = await labRequestModal.requestDateTimeInput.inputValue();
      await labRequestModal.individualRadioButton.click();
      await labRequestModal.nextButton.click();
      const testsToSelect = [
        'AgRDT Negative, no further testing needed',
        'AgRDT Positive, no further testing needed',
      ];
      const selectedTestsCategories = await labRequestModal.selectItemsByText(testsToSelect);
      await labRequestModal.validateSelectedItemsAndCategoriesInTable(
        testsToSelect,
        selectedTestsCategories,
      );
      const noteToAdd = 'This is a test note';
      await labRequestModal.addNotes(noteToAdd);
      await labRequestModal.nextButton.click();
      await labRequestModal.backButton.click();
      for (let i = 0; i < testsToSelect.length; i++) {
        await expect(labRequestModal.individualModal.selectedTestsLabels.nth(i)).toHaveText(
          testsToSelect[i],
        );
      }
      await expect(labRequestModal.individualModal.notesTextarea).toHaveValue(noteToAdd);
      await labRequestModal.backButton.click();
      await labRequestModal.validateDepartment();
      await labRequestModal.validateRequestingClinician();
      await expect(labRequestModal.requestDateTimeInput).toHaveValue(requestedDateTime);
    });
    test('[T-0209][AT-0064]Should not allow creating a lab request without selecting any tests', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await labRequestModal.individualRadioButton.click();
      await labRequestModal.nextButton.click();
      await labRequestModal.nextButton.click();
      await expect(labRequestModal.testSelectionError).toBeVisible();
    });
    test('[T-0209][AT-0065]should allow searching for individual tests', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await labRequestModal.individualRadioButton.click();
      await labRequestModal.nextButton.click();
      await labRequestModal.searchItemAndValidate('AgRDT Negative, no further testing needed');
    });
  });
  test.describe('Lab request details page', () => {
    test('[AT-0066]Clicking on a  basic individual lab request opens the details page', async ({ page }) => {
      await labRequestPane.newLabRequestButton.click();
      const testsToSelect = await labRequestModal.individualModal.createBasicIndividualLabRequest();
      await labRequestPane.waitForTableToLoad();
      await labRequestPane.sortTableByCategory();
      const testDetails: LabRequestTestDetails = await labRequestPane.getFirstRowTestDetails();
      await labRequestPane.tableRows.first().click();

      const labRequestDetailsPage = new LabRequestDetailsPage(page);
      await labRequestDetailsPage.waitForPageToLoad();
      await labRequestDetailsPage.validateLabRequestDetails(
        testDetails.labTestId,
        testDetails.requestedDate,
        testDetails.requestedBy,
        testData.department,
        testDetails.category,
        testDetails.status,
        '-',
        testDetails.priority === 'Unknown' ? '-' : testDetails.priority,
        testsToSelect,
        [],
      );
    });
    test('[AT-0067]Clicking on a  basic panel lab request opens the details page', async ({ page }) => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await labRequestModal.panelRadioButton.click();
      await labRequestModal.nextButton.click();
      const panelsToSelect = ['Demo Test Panel'];
      await labRequestModal.selectItemsByText(panelsToSelect);
      await labRequestModal.nextButton.click();
      await labRequestModal.finaliseButton.click();
      await labRequestModal.closeButton.click();
      await labRequestPane.waitForTableToLoad();
      await labRequestPane.sortTableByCategory();
      const testDetails: LabRequestTestDetails = await labRequestPane.getFirstRowTestDetails();
      await labRequestPane.tableRows.first().click();

      const labRequestDetailsPage = new LabRequestDetailsPage(page);
      await labRequestDetailsPage.waitForPageToLoad();
      await labRequestDetailsPage.validateLabRequestDetails(
        testDetails.labTestId,
        testDetails.requestedDate,
        testDetails.requestedBy,
        testData.department,
        testDetails.category,
        testDetails.status,
        '-',
        testDetails.priority === 'Unknown' ? '-' : testDetails.priority,
        ['Potassium', 'Sodium'],
        [],
      );
    });
    test('[AT-0068]Clicking on a panel lab request with all the fields filled opens the details page', async ({
      page,
    }) => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await selectFieldOption(labRequestModal.page, labRequestModal.prioritySelect, {
        selectFirst: true,
      });
      const priority = await labRequestModal.prioritySelect
        .locator('div')
        .locator('div')
        .first()
        .textContent();
      await labRequestModal.nextButton.click();
      const panelsToSelect = ['Demo Test Panel'];
      const panelCategories = await labRequestModal.selectItemsByText(panelsToSelect);
      await labRequestModal.validateSelectedItemsAndCategoriesInTable(
        panelsToSelect,
        panelCategories,
      );
      const noteToAdd = 'This is a test note';
      await labRequestModal.addNotes(noteToAdd);
      await labRequestModal.nextButton.click();
      const currentDateTime = labRequestModal.getCurrentDateTime();
      await labRequestModal.setDateTimeCollected(currentDateTime);
      await labRequestModal.selectFirstCollectedBy(0);
      await labRequestModal.selectFirstSpecimenType(0);
      await labRequestModal.selectFirstSite(0);
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
      const testDetails: LabRequestTestDetails = await labRequestPane.getFirstRowTestDetails();
      await labRequestPane.tableRows.first().click();
      const labRequestDetailsPage = new LabRequestDetailsPage(page);
      await labRequestDetailsPage.waitForPageToLoad();
      await labRequestDetailsPage.validateLabRequestDetails(
        testDetails.labTestId,
        testDetails.requestedDate,
        testDetails.requestedBy,
        testData.department,
        testDetails.category,
        testDetails.status,
        '-',
        testDetails.priority === 'Unknown' ? '-' : testDetails.priority,
        ['Potassium', 'Sodium'],
        [noteToAdd],
      );
    });
    test('[T-0208][AT-0069]Cancel lab request', async ({ page, patientDetailsPage }) => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.individualModal.createBasicIndividualLabRequest();
      await labRequestPane.waitForTableToLoad();
      await labRequestPane.sortTableByCategory();
      await labRequestPane.tableRows.first().click();
      const labRequestDetailsPage = new LabRequestDetailsPage(page);
      await labRequestDetailsPage.waitForPageToLoad();
      await labRequestDetailsPage.threeDotsButton.click();
      await labRequestDetailsPage.cancelRequestButton.click();
      await labRequestDetailsPage.reasonForCancellationSelect.click();
      await page.getByText('Duplicate').click();
      await labRequestDetailsPage.cancelModalConfirmButton.click();
      const notesAfterCancel = await labRequestDetailsPage.notesList
        .locator('li')
        .first()
        .textContent();
      const statusAfterCancel = await labRequestDetailsPage.getStatus();
      await expect(statusAfterCancel).toContain('Cancelled');
      await expect(notesAfterCancel).toContain('Request cancelled. Reason: Duplicate.');
      await labRequestDetailsPage.backButton.click();
      await patientDetailsPage.labsTab.click();
      await labRequestPane.waitForTableToLoad();
      await expect(labRequestPane.tableRows.locator('td')).toHaveText('No lab requests found');
    });
    test('[T-0220][AT-0070]You should not being able to change status of lab request without entering sample details', async ({
      page,
    }) => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.individualModal.createBasicIndividualLabRequest();
      await labRequestPane.waitForTableToLoad();
      await labRequestPane.sortTableByCategory();
      await labRequestPane.tableRows.first().click();
      const labRequestDetailsPage = new LabRequestDetailsPage(page);
      await labRequestDetailsPage.statusThreeDotsbutton.click();
      await labRequestDetailsPage.changeStatusButton.hover();
      await expect(
        page.getByText(
          'You cannot change the status of lab request without entering the sample details',
        ),
      ).toBeVisible();
    });
    test('[AT-0071]Record sample and validate status and status log', async ({ page }) => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.individualModal.createBasicIndividualLabRequest();
      await labRequestPane.waitForTableToLoad();
      await labRequestPane.sortTableByCategory();
      await labRequestPane.tableRows.first().click();
      const labRequestDetailsPage = new LabRequestDetailsPage(page);
      await labRequestDetailsPage.sampleCollectedThreeDotsbutton.click();
      await labRequestDetailsPage.recordSampleButton.click();
      await labRequestDetailsPage.recordSampleModal.waitForModalToLoad();
      const date = new Date();
      const currentDateTime = format(date, "yyyy-MM-dd'T'HH:mm").toString();
      const expectedDateTime = formatDateTimeForDisplay(date);
      await labRequestDetailsPage.recordSampleModal.dateTimeCollectedInput.fill(currentDateTime);
      await labRequestDetailsPage.recordSampleModal.selectFirstFromAllDropdowns();
      await labRequestDetailsPage.recordSampleModal.recordSampleConfirmButton.click();
      await labRequestDetailsPage.recordSampleModal.waitForSampleCollectedModalToClose();
      expect(await labRequestDetailsPage.getSampleCollectedDate()).toBe(expectedDateTime);
      expect(await labRequestDetailsPage.getStatus()).toBe(LAB_REQUEST_STATUS.RECEPTION_PENDING);
      await labRequestDetailsPage.statusThreeDotsbutton.click();
      await labRequestDetailsPage.viewStatusLogsButton.click();
      await labRequestDetailsPage.statusLogModal.waitForModalToLoad();
      expect(await labRequestDetailsPage.statusLogModal.getDateTime(0)).toBe(
        expectedDateTime,
      );
      expect(await labRequestDetailsPage.statusLogModal.getStatus(0)).toBe(
        LAB_REQUEST_STATUS.RECEPTION_PENDING,
      );
      expect(await labRequestDetailsPage.statusLogModal.getRecordedBy(0)).toBe(
        (await labRequestModal.getCurrentUser()).displayName,
      );
      expect(await labRequestDetailsPage.statusLogModal.getDateTime(1)).toBe(
        expectedDateTime,
      );
      expect(await labRequestDetailsPage.statusLogModal.getStatus(1)).toBe(
        LAB_REQUEST_STATUS.SAMPLE_NOT_COLLECTED,
      );
      expect(await labRequestDetailsPage.statusLogModal.getRecordedBy(1)).toBe(
        (await labRequestModal.getCurrentUser()).displayName,
      );
    });
    test('[T-0217][AT-0072]Changing laboratory', async ({ page }) => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.individualModal.createBasicIndividualLabRequest();
      await labRequestPane.waitForTableToLoad();
      await labRequestPane.sortTableByCategory();
      await labRequestPane.tableRows.first().click();
      const labRequestDetailsPage = new LabRequestDetailsPage(page);
      await labRequestDetailsPage.laboratoryThreeDotsbutton.click();
      await labRequestDetailsPage.changeLaboratoryButton.click();
      const laboratory = await selectFirstFromDropdown(
        page,
        labRequestDetailsPage.changeLaboratoryModal.laboratorySelect,
      );
      await labRequestDetailsPage.changeLaboratoryModal.confirmButton.click();
      await expect(labRequestDetailsPage.laboratoryValue).toHaveText(laboratory);
    });
    test('[AT-0073]Changing priority', async ({ page }) => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.individualModal.createBasicIndividualLabRequest();
      await labRequestPane.waitForTableToLoad();
      await labRequestPane.sortTableByCategory();
      await labRequestPane.tableRows.first().click();
      const labRequestDetailsPage = new LabRequestDetailsPage(page);
      await labRequestDetailsPage.priorityThreeDotsbutton.click();
      await labRequestDetailsPage.changePriorityButton.click();
      const priority = await selectFirstFromDropdown(
        page,
        labRequestDetailsPage.changePriorityModal.prioritySelect,
      );
      await labRequestDetailsPage.changePriorityModal.confirmButton.click();
      await expect(labRequestDetailsPage.priorityValue).toHaveText(priority);
    });
    test('[T-0213][AT-0074]Entering results', async ({ page }) => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.individualModal.createBasicIndividualLabRequest();
      await labRequestPane.waitForTableToLoad();
      await labRequestPane.sortTableByCategory();
      await labRequestPane.tableRows.first().click();
      const labRequestDetailsPage = new LabRequestDetailsPage(page);
      const result = 'Positive';
      const labTestMethod = 'GeneXpert';
      const verification = 'test';
      const currentDateTime = new Date().toISOString().slice(0, 16);
      await labRequestDetailsPage.enterResultForFirstRow(
        result,
        labTestMethod,
        verification,
        currentDateTime
      );
      await labRequestDetailsPage.waitForResultsTableToLoad();
      //validate result table
      const tableResultItems = await getTableItems(page, 1, 'result')
      await expect(tableResultItems[0]).toBe(result);  
      const tableUnitItems = await getTableItems(page, 1, 'labTestType.unit')
      await expect(tableUnitItems[0]).toBe('n/a');  
      const tableReferenceItems = await getTableItems(page, 1, 'reference')
      await expect(tableReferenceItems[0]).toBe('n/a');  
      const tableLabTestMethodItems = await getTableItems(page, 1, 'labTestMethod')
      await expect(tableLabTestMethodItems[0]).toBe(labTestMethod); 
      const tableLaboratoryOfficerItems = await getTableItems(page, 1, 'laboratoryOfficer')
      const currentUser = await labRequestModal.getCurrentUser();
      await expect(tableLaboratoryOfficerItems[0]).toBe(currentUser.displayName); 
      const tableVerificationItems = await getTableItems(page, 1, 'verification')
      await expect(tableVerificationItems[0]).toBe(verification);  
      const tableCompletedDateItems = await getTableItems(page, 1, 'completedDate')
      await expect(tableCompletedDateItems[0]).toBe(format(new Date(currentDateTime), 'MM/dd/yyyy'));  
    });
  });
});
