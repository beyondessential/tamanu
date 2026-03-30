import { format } from 'date-fns';
import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/test';
import { getUser } from '../../fixtures/api';
import {
  LabRequestPane,
  LabRequestModal,
  type LabRequestTestDetails,
} from '@pages/patients/LabRequestPage';
import { LabRequestDetailsPage, LAB_REQUEST_STATUS } from '@pages/patients/LabRequestDetailsPage';
import { seeds } from '@data/seeds';
import { fillDateTime, toIsoDateTime, toTableDate, toDisplayDateTime } from '@helpers/dates';
import { selectOption, selectFirstFromListbox, selectAutocomplete } from '@helpers/fields';
import { ids, TABLE_CELL_PREFIX } from '@ids';
import { DataTable } from '@components/DataTable';

test.setTimeout(80000);

/** Create a basic individual lab request (two default AgRDT tests) and return the selected test names. */
async function createBasicIndividualLabRequest(
  labRequestModal: LabRequestModal,
  testsToSelect?: string[],
): Promise<string[]> {
  const selectedTests = testsToSelect ?? [
    'AgRDT Negative, no further testing needed',
    'AgRDT Positive, no further testing needed',
  ];
  await labRequestModal.waitForModalToLoad();
  await labRequestModal.individualRadioButton.click();
  await labRequestModal.nextButton.click();
  await labRequestModal.selectItemsByText(selectedTests);
  await labRequestModal.nextButton.click();
  await labRequestModal.finaliseButton.click();
  await labRequestModal.closeButton.click();
  return selectedTests;
}

function finalisedCardValue(page: Page, label: string) {
  return page
    .getByTestId(ids.labModal.requestingClinicianLabel)
    .filter({ hasText: label })
    .locator('..')
    .getByTestId('cardvalue-lcni');
}

async function assertIndividualRequestFinalisedPage(
  page: Page,
  params: {
    requestingClinician: string;
    requestedDateTimeDisplay: string;
    department: string;
    priority: string;
    expectedCategories: string[];
    expectedSampleDateRaw: string;
  },
): Promise<void> {
  await expect(finalisedCardValue(page, 'Requesting clinician')).toHaveText(
    params.requestingClinician || 'Unknown',
  );
  await expect(finalisedCardValue(page, 'Request date & time')).toHaveText(params.requestedDateTimeDisplay);
  await expect(finalisedCardValue(page, 'Department')).toHaveText(params.department || 'Unknown');
  await expect(finalisedCardValue(page, 'Priority')).toHaveText(params.priority || '-');

  const rowCount = params.expectedCategories.length;
  for (let i = 0; i < rowCount; i++) {
    await expect(page.getByTestId(`${TABLE_CELL_PREFIX}${i}-labTestCategory`)).toHaveText(
      params.expectedCategories[i],
    );
  }
  let sampleDisplay: string;
  if (params.expectedSampleDateRaw && !Number.isNaN(Date.parse(params.expectedSampleDateRaw))) {
    sampleDisplay = toDisplayDateTime(params.expectedSampleDateRaw);
  } else {
    sampleDisplay = params.expectedSampleDateRaw || 'Sample not collected';
  }
  for (let i = 0; i < rowCount; i++) {
    await expect(page.getByTestId(`${TABLE_CELL_PREFIX}${i}-sampleDate`)).toHaveText(sampleDisplay);
  }
}

async function assertSampleDetailsPanelsAndCategories(
  page: Page,
  expectedPanels: string[],
  expectedCategories: string[],
): Promise<void> {
  await page.getByTestId(ids.labModal.dateTimeCollectedInputs).first().waitFor({ state: 'visible' });
  const panelTypography = page.getByTestId('typography-ex0x');
  const allPanelElements = await panelTypography.all();
  await expect(allPanelElements.length).toBe(expectedPanels.length);
  for (let i = 0; i < expectedPanels.length; i++) {
    const text = await allPanelElements[i].textContent();
    await expect(text).toContain(expectedPanels[i]);
    await expect(page.getByTestId('typography-772r').filter({ hasText: expectedCategories[i] })).toBeVisible();
  }
}

function statusLogCell(page: Page, row: number, suffix: string) {
  return page
    .getByTestId(ids.statusLog.content)
    .getByTestId(ids.table.body)
    .locator('tr')
    .nth(row)
    .locator(`[data-testid*="-${suffix}"]`);
}

test.describe('Lab Request Tests', () => {
  let labRequestModal: LabRequestModal;
  let labRequestPane: LabRequestPane;

  test.beforeEach(async ({ page, newPatientWithHospitalAdmission, patientDetailsPage }) => {
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.navigateToLabsTab();
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
      const panelCategories = await labRequestModal.selectItemsByText(panelsToSelect);
      await labRequestModal.validateSelectedItemsAndCategoriesInTable(panelsToSelect, panelCategories);
      await labRequestModal.nextButton.click();
      await assertSampleDetailsPanelsAndCategories(labRequestModal.page, panelsToSelect, panelCategories);
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
      await labRequestModal.searchInput.fill('Demo Test Panel');
      await labRequestModal.listItems.first().waitFor({ state: 'visible' });
      await expect(labRequestModal.listItems).toHaveCount(1);
      await expect(labRequestModal.listItems.first()).toHaveText('Demo Test Panel');
    });

    test('[AT-0055]Clear panel selection and validate', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await labRequestModal.nextButton.click();
      const panelsToSelect = ['Others', 'Demo Test Panel'];
      const panelCategories = await labRequestModal.selectItemsByText(panelsToSelect);
      await labRequestModal.validateSelectedItemsAndCategoriesInTable(panelsToSelect, panelCategories);
      await labRequestModal.clearAllButton.click();
      const panelCount = await labRequestModal.panelTestSelector.getByTestId(ids.labModal.labelText).count();
      await expect(panelCount).toBe(0);
    });

    test('[T-0207][AT-0056]Create a panel lab request with all fields filled', async ({ page, api }) => {
      await labRequestPane.newLabRequestButton.click();
      const panelsToSelect = ['Demo Test Panel'];
      await labRequestModal.waitForModalToLoad();
      const requestedDateTime = await labRequestModal.validateRequestedDateTimeIsToday();
      const priority = await selectOption(page, labRequestModal.prioritySelect);
      await labRequestModal.nextButton.click();
      const panelCategories = await labRequestModal.selectItemsByText(panelsToSelect);
      await labRequestModal.validateSelectedItemsAndCategoriesInTable(panelsToSelect, panelCategories);
      await labRequestModal.addNotes('This is a test note');
      await labRequestModal.nextButton.click();
      const currentDateTime = await labRequestModal.getCurrentDateTime();
      await labRequestModal.setDateTimeCollected(currentDateTime);
      await labRequestModal.selectFirstCollectedBy(0);
      await labRequestModal.selectFirstSpecimenType(0);
      await selectFirstFromListbox(page, labRequestModal.siteInputs.nth(0));
      await assertSampleDetailsPanelsAndCategories(page, panelsToSelect, panelCategories);
      await labRequestModal.finaliseButton.click();
      await labRequestModal.closeButton.click();
      await labRequestPane.waitForTableToLoad();
      await labRequestPane.sortTableByCategory();
      const user = await getUser(api);
      await labRequestPane.validateLabRequestTableContent(
        panelCategories,
        requestedDateTime,
        user.displayName,
        priority,
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
      await expect(labRequestModal.dateTimeCollectedInputs.first()).not.toBeVisible();
      await expect(labRequestPane.table.rows.locator('td')).toHaveText('No lab requests found');
    });

    test('[AT-0059]Should allow navigating back to the previous page for panel lab request', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      await labRequestModal.nextButton.click();
      const panelsToSelect = ['Demo Test Panel'];
      await labRequestModal.selectItemsByText(panelsToSelect);
      const noteToAdd = 'This is a test note';
      await labRequestModal.addNotes(noteToAdd);
      await labRequestModal.nextButton.click();
      await labRequestModal.backButton.click();
      for (let i = 0; i < panelsToSelect.length; i++) {
        await expect(labRequestModal.selectedItemsList.nth(i)).toHaveText(panelsToSelect[i]);
      }
      await expect(labRequestModal.notesInput).toHaveValue(noteToAdd);
      await labRequestModal.backButton.click();
      await labRequestModal.validateDepartment();
      await labRequestModal.validateRequestingClinician();
    });
  });

  test.describe('Individual Lab Request Tests', () => {
    test('[T-0209][AT-0060]should create an individual lab request with basic details', async ({
      page,
      api,
    }) => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      const requestedDateTime = await labRequestModal.validateRequestedDateTimeIsToday();
      await labRequestModal.validateDepartment();
      const requestingClinician = await labRequestModal.validateRequestingClinician();
      const user = await getUser(api);
      expect(requestingClinician).toBe(user.displayName);
      await labRequestModal.individualRadioButton.click();
      await labRequestModal.nextButton.click();
      const testsToSelect = [
        'AgRDT Negative, no further testing needed',
        'AgRDT Positive, no further testing needed',
      ];
      const selectedTestsCategories = await labRequestModal.selectItemsByText(testsToSelect);
      const distinctCategories = [...new Set(selectedTestsCategories)];
      await labRequestModal.validateSelectedItemsAndCategoriesInTable(testsToSelect, selectedTestsCategories);
      await labRequestModal.nextButton.click();
      for (let i = 0; i < distinctCategories.length; i++) {
        await expect(labRequestModal.page.getByTestId('typography-772r').nth(i)).toHaveText(distinctCategories[i]);
      }
      await labRequestModal.finaliseButton.click();
      const formattedDate = toDisplayDateTime(new Date(requestedDateTime));
      await assertIndividualRequestFinalisedPage(page, {
        requestingClinician,
        requestedDateTimeDisplay: formattedDate,
        priority: '-',
        department: seeds.department,
        expectedCategories: distinctCategories,
        expectedSampleDateRaw: 'Sample not collected',
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

    test('[T-0209][AT-0061]should create an individual lab request with all fields filled', async ({ page }) => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      const requestedDateTime = await labRequestModal.validateRequestedDateTimeIsToday();
      await labRequestModal.validateDepartment();
      const requestingClinician = await labRequestModal.validateRequestingClinician();
      const priority = await selectOption(page, labRequestModal.prioritySelect);
      await labRequestModal.individualRadioButton.click();
      await labRequestModal.nextButton.click();
      const testsToSelect = [
        'AgRDT Negative, no further testing needed',
        'AgRDT Positive, no further testing needed',
      ];
      const selectedTestsCategories = await labRequestModal.selectItemsByText(testsToSelect);
      const distinctCategories = [...new Set(selectedTestsCategories)];
      await labRequestModal.validateSelectedItemsAndCategoriesInTable(testsToSelect, selectedTestsCategories);
      const noteToAdd = 'This is a test note';
      await labRequestModal.addNotes(noteToAdd);
      await labRequestModal.nextButton.click();
      const currentDateTime = await labRequestModal.getCurrentDateTime();
      for (let i = 0; i < distinctCategories.length; i++) {
        await labRequestModal.setDateTimeCollected(currentDateTime, i);
        await labRequestModal.selectFirstCollectedBy(i);
        await labRequestModal.selectFirstSpecimenType(i);
        await selectFirstFromListbox(page, labRequestModal.siteInputs.nth(i));
      }
      for (let i = 0; i < distinctCategories.length; i++) {
        await expect(labRequestModal.page.getByTestId('typography-772r').nth(i)).toHaveText(distinctCategories[i]);
      }
      await labRequestModal.finaliseButton.click();
      const formattedDate = toDisplayDateTime(new Date(requestedDateTime));
      await assertIndividualRequestFinalisedPage(page, {
        requestingClinician,
        requestedDateTimeDisplay: formattedDate,
        priority: priority || '-',
        department: seeds.department,
        expectedCategories: distinctCategories,
        expectedSampleDateRaw: currentDateTime,
      });
      await labRequestModal.closeButton.click();
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
      await labRequestModal.validateSelectedItemsAndCategoriesInTable(testsToSelect, selectedTestsCategories);
      await labRequestModal.clearAllButton.click();
      const testCount = await labRequestModal.panelTestSelector.getByTestId(ids.labModal.labelText).count();
      await expect(testCount).toBe(0);
    });

    test('[AT-0063]Should allow navigating back to the previous page for individual lab request', async () => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      const requestedDateTime = toIsoDateTime(await labRequestModal.requestDateTimeInput.inputValue());
      await labRequestModal.individualRadioButton.click();
      await labRequestModal.nextButton.click();
      const testsToSelect = [
        'AgRDT Negative, no further testing needed',
        'AgRDT Positive, no further testing needed',
      ];
      const selectedTestsCategories = await labRequestModal.selectItemsByText(testsToSelect);
      await labRequestModal.validateSelectedItemsAndCategoriesInTable(testsToSelect, selectedTestsCategories);
      const noteToAdd = 'This is a test note';
      await labRequestModal.addNotes(noteToAdd);
      await labRequestModal.nextButton.click();
      await labRequestModal.backButton.click();
      for (let i = 0; i < testsToSelect.length; i++) {
        await expect(labRequestModal.panelTestSelector.getByTestId(ids.labModal.labelText).nth(i)).toHaveText(
          testsToSelect[i],
        );
      }
      await expect(labRequestModal.notesInput).toHaveValue(noteToAdd);
      await labRequestModal.backButton.click();
      await labRequestModal.validateDepartment();
      await labRequestModal.validateRequestingClinician();
      expect(toIsoDateTime(await labRequestModal.requestDateTimeInput.inputValue())).toBe(requestedDateTime);
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
      await labRequestModal.searchInput.fill('AgRDT Negative, no further testing needed');
      await labRequestModal.listItems.first().waitFor({ state: 'visible' });
      await expect(labRequestModal.listItems).toHaveCount(1);
      await expect(labRequestModal.listItems.first()).toHaveText('AgRDT Negative, no further testing needed');
    });
  });

  test.describe('Lab request details page', () => {
    test('[AT-0066]Clicking on a  basic individual lab request opens the details page', async ({ page }) => {
      await labRequestPane.newLabRequestButton.click();
      const testsToSelect = await createBasicIndividualLabRequest(labRequestModal);
      await labRequestPane.waitForTableToLoad();
      await labRequestPane.sortTableByCategory();
      const testDetails: LabRequestTestDetails = await labRequestPane.getFirstRowDetails();
      await labRequestPane.table.rows.first().click();

      const labRequestDetailsPage = new LabRequestDetailsPage(page);
      await labRequestDetailsPage.waitForPageToLoad();
      await labRequestDetailsPage.validateLabRequestDetails(
        testDetails.category,
        testDetails.status,
        seeds.department,
        testDetails.priority === 'Unknown' ? '-' : testDetails.priority,
      );
      await expect(page.getByTestId('cardvalue-wpiy')).toHaveText(testDetails.labTestId);
      await expect(page.getByTestId('cardvalue-tin5')).toHaveText(testDetails.requestedBy);
      await expect(page.getByTestId('cardvalue-l8vk')).toHaveText(seeds.department);
      await expect(page.getByTestId(ids.table.table)).toBeVisible();
      for (const testType of testsToSelect) {
        await expect(
          page
            .getByTestId(ids.table.body)
            .locator('[data-testid*="styledtablecell"][data-test-class*="labTestType.name"]')
            .filter({ hasText: testType }),
        ).toBeVisible();
      }
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
      const testDetails: LabRequestTestDetails = await labRequestPane.getFirstRowDetails();
      await labRequestPane.table.rows.first().click();

      const labRequestDetailsPage = new LabRequestDetailsPage(page);
      await labRequestDetailsPage.waitForPageToLoad();
      await labRequestDetailsPage.validateLabRequestDetails(
        testDetails.category,
        testDetails.status,
        seeds.department,
        testDetails.priority === 'Unknown' ? '-' : testDetails.priority,
      );
      await expect(page.getByTestId('cardvalue-wpiy')).toHaveText(testDetails.labTestId);
      await expect(page.getByTestId('cardvalue-tin5')).toHaveText(testDetails.requestedBy);
      await expect(page.getByTestId('cardvalue-l8vk')).toHaveText(seeds.department);
      await expect(page.getByTestId(ids.table.table)).toBeVisible();
      for (const testType of ['Potassium', 'Sodium']) {
        await expect(
          page
            .getByTestId(ids.table.body)
            .locator('[data-testid*="styledtablecell"][data-test-class*="labTestType.name"]')
            .filter({ hasText: testType }),
        ).toBeVisible();
      }
    });

    test('[AT-0068]Clicking on a panel lab request with all the fields filled opens the details page', async ({
      page,
      api,
    }) => {
      await labRequestPane.newLabRequestButton.click();
      await labRequestModal.waitForModalToLoad();
      const priority = await selectOption(page, labRequestModal.prioritySelect);
      await labRequestModal.nextButton.click();
      const panelsToSelect = ['Demo Test Panel'];
      const panelCategories = await labRequestModal.selectItemsByText(panelsToSelect);
      await labRequestModal.validateSelectedItemsAndCategoriesInTable(panelsToSelect, panelCategories);
      const noteToAdd = 'This is a test note';
      await labRequestModal.addNotes(noteToAdd);
      await labRequestModal.nextButton.click();
      const currentDateTime = await labRequestModal.getCurrentDateTime();
      await labRequestModal.setDateTimeCollected(currentDateTime);
      await labRequestModal.selectFirstCollectedBy(0);
      await labRequestModal.selectFirstSpecimenType(0);
      await selectFirstFromListbox(page, labRequestModal.siteInputs.nth(0));
      await labRequestModal.finaliseButton.click();
      await labRequestModal.closeButton.click();
      await labRequestPane.waitForTableToLoad();
      await labRequestPane.sortTableByCategory();
      const user = await getUser(api);
      await labRequestPane.validateLabRequestTableContent(
        panelCategories,
        currentDateTime,
        user.displayName,
        priority,
        LAB_REQUEST_STATUS.RECEPTION_PENDING,
      );
      const testDetails: LabRequestTestDetails = await labRequestPane.getFirstRowDetails();
      await labRequestPane.table.rows.first().click();
      const labRequestDetailsPage = new LabRequestDetailsPage(page);
      await labRequestDetailsPage.waitForPageToLoad();
      await labRequestDetailsPage.validateLabRequestDetails(
        testDetails.category,
        testDetails.status,
        seeds.department,
        testDetails.priority === 'Unknown' ? '-' : testDetails.priority,
      );
      await expect(page.getByTestId('cardvalue-wpiy')).toHaveText(testDetails.labTestId);
      await expect(page.getByTestId('cardvalue-tin5')).toHaveText(testDetails.requestedBy);
      await expect(page.getByTestId('cardvalue-l8vk')).toHaveText(seeds.department);
      for (const testType of ['Potassium', 'Sodium']) {
        await expect(
          page
            .getByTestId(ids.table.body)
            .locator('[data-testid*="styledtablecell"][data-test-class*="labTestType.name"]')
            .filter({ hasText: testType }),
        ).toBeVisible();
      }
      await expect(page.getByTestId('list-19gk').locator('li').filter({ hasText: noteToAdd })).toContainText(
        noteToAdd,
      );
    });

    test('[T-0208][AT-0069]Cancel lab request', async ({ page, patientDetailsPage }) => {
      await labRequestPane.newLabRequestButton.click();
      await createBasicIndividualLabRequest(labRequestModal);
      await labRequestPane.waitForTableToLoad();
      await labRequestPane.sortTableByCategory();
      await labRequestPane.table.rows.first().click();
      const labRequestDetailsPage = new LabRequestDetailsPage(page);
      await labRequestDetailsPage.waitForPageToLoad();
      await page.getByTestId('box-qy3e').getByTestId(ids.labDetails.expandButton).click();
      await page.getByTestId('item-8ybn-1').getByText('Cancel request').click();
      await page.getByTestId('field-c7rc-select').click();
      await page.getByText('Duplicate').click();
      await page.getByTestId('formsubmitcancelrow-1ync-confirmButton').click();
      const notesAfterCancel = await page.getByTestId('list-19gk').locator('li').first().textContent();
      const statusAfterCancel = await labRequestDetailsPage.statusValue.textContent();
      await expect(statusAfterCancel).toContain('Cancelled');
      await expect(notesAfterCancel).toContain('Request cancelled. Reason: Duplicate.');
      await labRequestDetailsPage.backButton.click();
      await patientDetailsPage.labsTab.click();
      await labRequestPane.waitForTableToLoad();
      await expect(labRequestPane.table.rows.locator('td')).toHaveText('No lab requests found');
    });

    test('[T-0220][AT-0070]You should not being able to change status of lab request without entering sample details', async ({
      page,
    }) => {
      await labRequestPane.newLabRequestButton.click();
      await createBasicIndividualLabRequest(labRequestModal);
      await labRequestPane.waitForTableToLoad();
      await labRequestPane.sortTableByCategory();
      await labRequestPane.table.rows.first().click();
      const labRequestDetailsPage = new LabRequestDetailsPage(page);
      await labRequestDetailsPage.waitForPageToLoad();
      await page
        .getByTestId(ids.labDetails.resultText)
        .filter({ hasText: 'Status' })
        .locator('..')
        .getByTestId(ids.labDetails.header)
        .getByTestId(ids.labDetails.expandButton)
        .click();
      await page.getByTestId('labelcontainer-mjji').hover();
      await expect(
        page.getByText('You cannot change the status of lab request without entering the sample details'),
      ).toBeVisible();
    });

    test('[AT-0071]Record sample and validate status and status log', async ({ page, api }) => {
      await labRequestPane.newLabRequestButton.click();
      await createBasicIndividualLabRequest(labRequestModal);
      await labRequestPane.waitForTableToLoad();
      await labRequestPane.sortTableByCategory();
      await labRequestPane.table.rows.first().click();
      const labRequestDetailsPage = new LabRequestDetailsPage(page);
      await labRequestDetailsPage.waitForPageToLoad();
      await page
        .getByTestId(ids.labDetails.resultText)
        .filter({ hasText: 'Sample collected' })
        .locator('..')
        .getByTestId(ids.labDetails.header)
        .getByTestId(ids.labDetails.expandButton)
        .click();
      await page.getByTestId('item-8ybn-0').getByText('Record sample').click();
      await labRequestDetailsPage.recordSampleForm.waitFor({ state: 'visible' });
      const date = new Date();
      const currentDateTime = format(date, "yyyy-MM-dd'T'HH:mm").toString();
      const expectedDateTime = toDisplayDateTime(date);
      await fillDateTime(labRequestDetailsPage.sampleDateTimeInput, currentDateTime);
      await selectFirstFromListbox(page, labRequestDetailsPage.sampleCollectedByInput);
      await selectFirstFromListbox(page, labRequestDetailsPage.sampleSpecimenTypeInput);
      await labRequestDetailsPage.sampleSiteDropdownIcon.click();
      await page.keyboard.press('Enter');
      await labRequestDetailsPage.sampleConfirmButton.click();
      await labRequestDetailsPage.recordSampleForm.waitFor({ state: 'detached' });
      expect(await labRequestDetailsPage.sampleCollectedValue.textContent()).toBe(expectedDateTime);
      expect(await labRequestDetailsPage.statusValue.textContent()).toBe(LAB_REQUEST_STATUS.RECEPTION_PENDING);
      await page
        .getByTestId(ids.labDetails.resultText)
        .filter({ hasText: 'Status' })
        .locator('..')
        .getByTestId(ids.labDetails.header)
        .getByTestId(ids.labDetails.expandButton)
        .click();
      await page.getByTestId('item-8ybn-1').getByText('View status log').click();
      await labRequestDetailsPage.statusLogContent.waitFor({ state: 'visible' });
      expect(await statusLogCell(page, 0, 'createdAt').textContent()).toBe(expectedDateTime);
      expect(await statusLogCell(page, 0, 'status').textContent()).toBe(LAB_REQUEST_STATUS.RECEPTION_PENDING);
      const user = await getUser(api);
      expect(await statusLogCell(page, 0, 'updatedByDisplayName').textContent()).toBe(user.displayName);
      expect(await statusLogCell(page, 1, 'createdAt').textContent()).toBe(expectedDateTime);
      expect(await statusLogCell(page, 1, 'status').textContent()).toBe(LAB_REQUEST_STATUS.SAMPLE_NOT_COLLECTED);
      expect(await statusLogCell(page, 1, 'updatedByDisplayName').textContent()).toBe(user.displayName);
    });

    test('[T-0217][AT-0072]Changing laboratory', async ({ page }) => {
      await labRequestPane.newLabRequestButton.click();
      await createBasicIndividualLabRequest(labRequestModal);
      await labRequestPane.waitForTableToLoad();
      await labRequestPane.sortTableByCategory();
      await labRequestPane.table.rows.first().click();
      const labRequestDetailsPage = new LabRequestDetailsPage(page);
      await labRequestDetailsPage.waitForPageToLoad();
      await labRequestDetailsPage.changeLaboratoryButton.click();
      await labRequestDetailsPage.changeLabForm.waitFor({ state: 'visible' });
      const laboratory = await selectAutocomplete(page, page.getByTestId(ids.changeLab.laboratoryInput));
      await labRequestDetailsPage.changeLabConfirm.click();
      await labRequestDetailsPage.changeLabForm.waitFor({ state: 'detached' });
      await expect(labRequestDetailsPage.laboratoryValue).toHaveText(laboratory);
    });

    test('[AT-0073]Changing priority', async ({ page }) => {
      await labRequestPane.newLabRequestButton.click();
      await createBasicIndividualLabRequest(labRequestModal);
      await labRequestPane.waitForTableToLoad();
      await labRequestPane.sortTableByCategory();
      await labRequestPane.table.rows.first().click();
      const labRequestDetailsPage = new LabRequestDetailsPage(page);
      await labRequestDetailsPage.waitForPageToLoad();
      const priority = await labRequestDetailsPage.changePriority();
      await expect(labRequestDetailsPage.priorityValue).toHaveText(priority);
    });

    test('[T-0213][AT-0074]Entering results', async ({ page, api }) => {
      await labRequestPane.newLabRequestButton.click();
      await createBasicIndividualLabRequest(labRequestModal);
      await labRequestPane.waitForTableToLoad();
      await labRequestPane.sortTableByCategory();
      await labRequestPane.table.rows.first().click();
      const labRequestDetailsPage = new LabRequestDetailsPage(page);
      await labRequestDetailsPage.waitForPageToLoad();
      const result = 'Positive';
      const verification = 'test';
      const currentDateTime = new Date().toISOString().slice(0, 16);
      await page.getByTestId('button-oep6').click();
      await labRequestDetailsPage.enterResultsContainer.waitFor({ state: 'visible' });
      await labRequestDetailsPage.enterResults(result, verification, currentDateTime);
      await labRequestDetailsPage.enterResultsContainer.waitFor({ state: 'detached' });
      await page.getByTestId(ids.table.table).waitFor({ state: 'visible' });
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      const resultsTable = new DataTable(page);
      await expect(resultsTable.cell(0, 'result')).toHaveText(result);
      await expect(resultsTable.cell(0, 'labTestType.unit')).toHaveText('n/a');
      await expect(resultsTable.cell(0, 'reference')).toHaveText('n/a');
      await expect(resultsTable.cell(0, 'labTestMethod')).toHaveText('GeneXpert');
      const user = await getUser(api);
      await expect(resultsTable.cell(0, 'laboratoryOfficer')).toHaveText(user.displayName);
      await expect(resultsTable.cell(0, 'verification')).toHaveText(verification);
      await expect(resultsTable.cell(0, 'completedDate')).toHaveText(toTableDate(currentDateTime));
    });
  });
});
