import { expect, test } from '@fixtures/baseFixture';
import {
  LAB_REQUEST_STATUS,
  LabRequestDetailsPage,
} from '@pages/patients/LabRequestPage/LabRequestDetailsPage';
import {
  LabRequestPane,
  LabRequestTestDetails,
} from '@pages/patients/LabRequestPage/panes/LabRequestPane';
import { selectFieldOption } from '@utils/fieldHelpers';
import { testData } from '@utils/testData';
import {
  fillMuiDateTimeField,
  formatDateTimeForDisplay,
  getTableItems,
  normalizeToIsoDateTimeMinute,
  selectFirstFromDropdown,
} from '@utils/testHelper';
import { format } from 'date-fns';
import { LabRequestModal } from '../../pages/patients/LabRequestPage/modals/LabRequestModal';

test.setTimeout(80_000);

const AGRDT_TESTS = [
  'AgRDT Negative, no further testing needed',
  'AgRDT Positive, no further testing needed',
];
const DEMO_PANEL = 'Demo Test Panel';
const DEMO_PANEL_MEMBERS = ['Potassium', 'Sodium'];

test.describe('Lab Request Tests', () => {
  let labRequestModal: LabRequestModal;
  let labRequestPane: LabRequestPane;

  test.beforeEach(async ({ page, newPatientWithHospitalAdmission, patientDetailsPage }) => {
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.navigateToLabsTab();
    labRequestModal = new LabRequestModal(page);
    labRequestPane = new LabRequestPane(page);
  });

  test.describe('Combined selector', () => {
    test('[T-0207][AT-0057]Next is disabled until a test or panel is selected', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await expect(labRequestModal.nextButton).toBeDisabled();
      await labRequestModal.selectPanel(DEMO_PANEL);
      await expect(labRequestModal.nextButton).toBeEnabled();
    });

    test('[T-0205][AT-0054]should allow searching for panels', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await labRequestModal.searchItemAndValidate(DEMO_PANEL);
    });

    test('[T-0209][AT-0065]should allow searching for individual tests', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await labRequestModal.searchItemAndValidate(AGRDT_TESTS[0]);
    });

    test('[AT-0055]Clear all empties the selection', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await labRequestModal.selectPanel(DEMO_PANEL);
      await labRequestModal.selectIndividualTest(AGRDT_TESTS[0]);
      await labRequestModal.validateSelectedItems([DEMO_PANEL, AGRDT_TESTS[0]]);
      await labRequestModal.clearAll();
      expect(await labRequestModal.getSelectedCount()).toBe(0);
    });

    test('[AT-0062]Removing a selected item updates the selection', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await labRequestModal.selectIndividualTests(AGRDT_TESTS);
      await labRequestModal.validateSelectedItems(AGRDT_TESTS);
      await labRequestModal.removeSelected(AGRDT_TESTS[0]);
      await labRequestModal.validateSelectedItems([AGRDT_TESTS[1]]);
    });
  });

  test.describe('Panel Lab Request Tests', () => {
    test('[AT-0053]should create a panel lab request with basic details', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      const requestedDateTime = await labRequestModal.validateRequestedDateTimeIsToday();
      await labRequestModal.validateDepartment();
      const requestingClinician = await labRequestModal.validateRequestingClinician();

      await labRequestModal.selectPanel(DEMO_PANEL);
      await labRequestModal.validateSelectedItems([DEMO_PANEL]);
      await labRequestModal.proceedToSampleDetails();
      await labRequestModal.validatePanelInSampleDetails(DEMO_PANEL);
      await labRequestModal.finalise();
      const categories = await labRequestModal.getFinalisedCategories(1);
      await labRequestModal.closeButton.click();

      await labRequestPane.waitForTableToLoad();
      await labRequestPane.sortTableByCategory();
      await labRequestPane.validateLabRequestTableContent(
        categories,
        requestedDateTime,
        requestingClinician,
        'Unknown',
        LAB_REQUEST_STATUS.SAMPLE_NOT_COLLECTED,
      );
    });

    test('[T-0207][AT-0056]Create a panel lab request with all fields filled', async () => {
      await labRequestPane.newLabRequestButton.click();
      const { requestedDateTime, priority, categories } =
        await labRequestModal.createPanelLabRequestWithAllFields([DEMO_PANEL]);
      await labRequestPane.waitForTableToLoad();
      await labRequestPane.sortTableByCategory();
      await labRequestPane.validateLabRequestTableContent(
        categories,
        requestedDateTime,
        (await labRequestModal.getCurrentUser()).displayName,
        priority!,
        LAB_REQUEST_STATUS.RECEPTION_PENDING,
      );
    });

    test('[AT-0058]Pressing Cancel should close the modal and not create a lab request', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await labRequestModal.selectPanel(DEMO_PANEL);
      await labRequestModal.proceedToSampleDetails();
      await labRequestModal.cancel();
      await expect(labRequestModal.sampleDetailsPanels).not.toBeVisible();
      await expect(labRequestPane.tableRows.locator('td')).toHaveText('No lab requests found');
    });

    test('[AT-0059]Navigating back preserves the panel selection and notes', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await labRequestModal.selectPanel(DEMO_PANEL);
      const noteToAdd = 'This is a test note';
      await labRequestModal.addNotes(noteToAdd);
      await labRequestModal.proceedToSampleDetails();
      await labRequestModal.goBack();
      await labRequestModal.validateSelectedItems([DEMO_PANEL]);
      await expect(labRequestModal.notesTextarea).toHaveValue(noteToAdd);
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

      await labRequestModal.selectIndividualTests(AGRDT_TESTS);
      await labRequestModal.validateSelectedItems(AGRDT_TESTS);
      await labRequestModal.proceedToSampleDetails();
      await labRequestModal.finalise();

      const categories = await labRequestModal.getFinalisedCategories(AGRDT_TESTS.length);
      const formattedDate = formatDateTimeForDisplay(new Date(requestedDateTime));
      await labRequestModal.validateRequestFinalisedPage({
        requestingClinician,
        requestedDateTime: formattedDate,
        priority: '-',
        department: department || 'Unknown',
        expectedCategories: categories,
        expectedSampleDate: 'Sample not collected',
      });
      await labRequestModal.closeButton.click();

      await labRequestPane.waitForTableToLoad();
      await labRequestPane.sortTableByCategory();
      await labRequestPane.validateLabRequestTableContent(
        categories,
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
      const priority = await labRequestModal.selectedPriority.textContent();

      await labRequestModal.selectIndividualTests(AGRDT_TESTS);
      await labRequestModal.validateSelectedItems(AGRDT_TESTS);
      const noteToAdd = 'This is a test note';
      await labRequestModal.addNotes(noteToAdd);
      await labRequestModal.proceedToSampleDetails();

      const currentDateTime = await labRequestModal.getCurrentDateTime();
      const sampleRowCount = await labRequestModal.dateTimeCollectedInputs.count();
      for (let i = 0; i < sampleRowCount; i++) {
        await labRequestModal.setDateTimeCollected(currentDateTime, i);
        await labRequestModal.selectFirstCollectedBy(i);
        await labRequestModal.selectFirstSpecimenType(i);
        await labRequestModal.selectFirstSite(i);
      }
      await labRequestModal.finalise();

      const categories = await labRequestModal.getFinalisedCategories(sampleRowCount);
      const formattedDate = formatDateTimeForDisplay(new Date(requestedDateTime));
      await labRequestModal.validateRequestFinalisedPage({
        requestingClinician,
        requestedDateTime: formattedDate,
        priority: priority || '-',
        department: department || 'Unknown',
        expectedCategories: categories,
        expectedSampleDate: currentDateTime,
      });
      await labRequestModal.closeButton.click();

      await labRequestPane.waitForTableToLoad();
      await labRequestPane.sortTableByCategory();
      await labRequestPane.validateLabRequestTableContent(
        categories,
        requestedDateTime,
        requestingClinician || 'Unknown',
        priority || 'Unknown',
        LAB_REQUEST_STATUS.RECEPTION_PENDING,
      );
    });

    test('[AT-0063]Navigating back preserves the individual selection and notes', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      const requestedDateTime = normalizeToIsoDateTimeMinute(
        await labRequestModal.requestDateTimeInput.inputValue(),
      );
      await labRequestModal.selectIndividualTests(AGRDT_TESTS);
      await labRequestModal.validateSelectedItems(AGRDT_TESTS);
      const noteToAdd = 'This is a test note';
      await labRequestModal.addNotes(noteToAdd);
      await labRequestModal.proceedToSampleDetails();
      await labRequestModal.goBack();
      await labRequestModal.validateSelectedItems(AGRDT_TESTS);
      await expect(labRequestModal.notesTextarea).toHaveValue(noteToAdd);
      await labRequestModal.validateDepartment();
      await labRequestModal.validateRequestingClinician();
      expect(
        normalizeToIsoDateTimeMinute(await labRequestModal.requestDateTimeInput.inputValue()),
      ).toBe(requestedDateTime);
    });
  });

  test.describe('Mixed and duplicate handling', () => {
    test('[AT-0075]creates a request mixing a panel and a standalone test', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      const requestedDateTime = await labRequestModal.validateRequestedDateTimeIsToday();
      const requestingClinician = await labRequestModal.validateRequestingClinician();

      await labRequestModal.selectPanel(DEMO_PANEL);
      await labRequestModal.selectIndividualTest(AGRDT_TESTS[0]);
      await labRequestModal.validateSelectedItems([DEMO_PANEL, AGRDT_TESTS[0]]);
      await labRequestModal.proceedToSampleDetails();

      // Sample details shows the panel by name plus a category row per selected request
      // (one for the panel's category, one for the standalone test's category).
      await labRequestModal.validatePanelInSampleDetails(DEMO_PANEL);
      await expect(labRequestModal.sampleDetailsCategories).toHaveCount(2);
      await labRequestModal.finalise();

      // The summary lists both the panel request and the standalone test's request.
      const summaryCategories = await getTableItems(labRequestModal.page, 10, 'labTestCategory');
      expect(summaryCategories.length).toBe(2);
      const panelNames = await labRequestModal.getRequestFinalisedTableItems(2, 'panelId');
      expect(panelNames).toContain(DEMO_PANEL);
      const categories = await labRequestModal.getFinalisedCategories(2);
      await labRequestModal.closeButton.click();

      await labRequestPane.waitForTableToLoad();
      await labRequestPane.sortTableByCategory();
      await labRequestPane.validateLabRequestTableContent(
        categories,
        requestedDateTime,
        requestingClinician || 'Unknown',
        'Unknown',
        LAB_REQUEST_STATUS.SAMPLE_NOT_COLLECTED,
      );
    });

    test('[AT-0076]selecting a panel disables its member test and shows the covered tooltip', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();

      const memberTest = DEMO_PANEL_MEMBERS[0];
      // The member test can be ordered on its own before the panel is selected.
      expect(await labRequestModal.isTestDisabled(memberTest)).toBe(false);

      await labRequestModal.selectPanel(DEMO_PANEL);
      // Once the panel is selected its members can no longer be ordered individually.
      expect(await labRequestModal.isTestDisabled(memberTest)).toBe(true);
      await labRequestModal.expectDisabledTestTooltip(memberTest);
    });
  });

  test.describe('Lab request details page', () => {
    test('[AT-0066]Clicking on a basic individual lab request opens the details page', async ({
      page,
    }) => {
      await labRequestPane.newLabRequestButton.click();
      const testsToSelect = await labRequestModal.createBasicIndividualLabRequest();
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
        '—' /* em dash */,
        testDetails.priority === 'Unknown' ? '—' /* em dash */ : testDetails.priority,
        testsToSelect,
        [],
      );
    });

    test('[AT-0067]Clicking on a basic panel lab request opens the details page', async ({
      page,
    }) => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await labRequestModal.selectPanel(DEMO_PANEL);
      await labRequestModal.proceedToSampleDetails();
      await labRequestModal.finalise();
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
        '—' /* em dash */,
        testDetails.priority === 'Unknown' ? '—' /* em dash */ : testDetails.priority,
        DEMO_PANEL_MEMBERS,
        [],
      );
    });

    test('[AT-0068]Clicking on a panel lab request with all fields filled opens the details page', async ({
      page,
    }) => {
      await labRequestPane.newLabRequestButton.click();
      const { requestedDateTime, priority, categories } =
        await labRequestModal.createPanelLabRequestWithAllFields([DEMO_PANEL]);
      await labRequestPane.waitForTableToLoad();
      await labRequestPane.sortTableByCategory();
      await labRequestPane.validateLabRequestTableContent(
        categories,
        requestedDateTime,
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
        '—' /* em dash */,
        testDetails.priority === 'Unknown' ? '—' /* em dash */ : testDetails.priority,
        DEMO_PANEL_MEMBERS,
        ['This is a test note'],
      );
    });

    test('[T-0208][AT-0069]Cancel lab request', async ({ page, patientDetailsPage }) => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.createBasicIndividualLabRequest();
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
      expect(statusAfterCancel).toContain('Cancelled');
      expect(notesAfterCancel).toContain('Request cancelled. Reason: Duplicate.');
      await labRequestDetailsPage.backButton.click();
      await patientDetailsPage.labsTab.click();
      await labRequestPane.waitForTableToLoad();
      await expect(labRequestPane.tableRows.locator('td')).toHaveText('No lab requests found');
    });

    test('[T-0220][AT-0070]You should not be able to change status of lab request without entering sample details', async ({
      page,
    }) => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.createBasicIndividualLabRequest();
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
      await labRequestModal.createBasicIndividualLabRequest();
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
      await fillMuiDateTimeField(
        labRequestDetailsPage.recordSampleModal.dateTimeCollectedInput,
        currentDateTime,
      );
      await labRequestDetailsPage.recordSampleModal.selectFirstFromAllDropdowns();
      await labRequestDetailsPage.recordSampleModal.recordSampleConfirmButton.click();
      await labRequestDetailsPage.recordSampleModal.waitForSampleCollectedModalToClose();
      expect(await labRequestDetailsPage.getSampleCollectedDate()).toBe(expectedDateTime);
      expect(await labRequestDetailsPage.getStatus()).toBe(LAB_REQUEST_STATUS.RECEPTION_PENDING);
      await labRequestDetailsPage.statusThreeDotsbutton.click();
      await labRequestDetailsPage.viewStatusLogsButton.click();
      await labRequestDetailsPage.statusLogModal.waitForModalToLoad();
      await expect
        .poll(async () => await labRequestDetailsPage.statusLogModal.getRowCount())
        .toBeGreaterThan(0);

      const rowCount = await labRequestDetailsPage.statusLogModal.getRowCount();
      const statusLogRows = await Promise.all(
        Array.from({ length: rowCount }, async (_row, index) => ({
          dateTime: (await labRequestDetailsPage.statusLogModal.getDateTime(index)).trim(),
          status: (await labRequestDetailsPage.statusLogModal.getStatus(index)).trim(),
          recordedBy: (await labRequestDetailsPage.statusLogModal.getRecordedBy(index)).trim(),
        })),
      );
      const currentUser = (await labRequestModal.getCurrentUser()).displayName;

      const receptionPendingRow = statusLogRows.find(
        row => row.status === LAB_REQUEST_STATUS.RECEPTION_PENDING,
      );
      expect(receptionPendingRow).toBeTruthy();
      expect(receptionPendingRow?.dateTime).toBe(expectedDateTime);
      expect(receptionPendingRow?.recordedBy).toBe(currentUser);

      const sampleNotCollectedRow = statusLogRows.find(
        row => row.status === LAB_REQUEST_STATUS.SAMPLE_NOT_COLLECTED,
      );
      if (sampleNotCollectedRow) {
        expect(sampleNotCollectedRow.recordedBy).toBe(currentUser);
        expect(sampleNotCollectedRow.dateTime).not.toBe('');
      }
    });

    test('[T-0217][AT-0072]Changing laboratory', async ({ page }) => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.createBasicIndividualLabRequest();
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
      await labRequestModal.createBasicIndividualLabRequest();
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
      await labRequestModal.createBasicIndividualLabRequest();
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
        currentDateTime,
      );
      await labRequestDetailsPage.waitForResultsTableToLoad();
      const tableResultItems = await getTableItems(page, 1, 'result');
      expect(tableResultItems[0]).toBe(result);
      const tableUnitItems = await getTableItems(page, 1, 'labTestType.unit');
      expect(tableUnitItems[0]).toBe('n/a');
      const tableReferenceItems = await getTableItems(page, 1, 'reference');
      expect(tableReferenceItems[0]).toBe('n/a');
      const tableLabTestMethodItems = await getTableItems(page, 1, 'labTestMethod');
      expect(tableLabTestMethodItems[0]).toBe(labTestMethod);
      const tableLaboratoryOfficerItems = await getTableItems(page, 1, 'laboratoryOfficer');
      const currentUser = await labRequestModal.getCurrentUser();
      expect(tableLaboratoryOfficerItems[0]).toBe(currentUser.displayName);
      const tableVerificationItems = await getTableItems(page, 1, 'verification');
      expect(tableVerificationItems[0]).toBe(verification);
      const tableCompletedDateItems = await getTableItems(page, 1, 'completedDate');
      expect(tableCompletedDateItems[0]).toBe(format(new Date(currentDateTime), 'dd/MM/yyyy'));
    });
  });
});
