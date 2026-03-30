import path from 'path';
import { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/test';
import { getUser, createApiContext, generateNHN } from '../../fixtures/api';
import { EmergencyPatientsPage } from '@pages/patients/EmergencyPatientsPage';
import { PatientDetailsPage } from '@pages/patients/PatientDetailsPage/PatientDetailsPage';
import type { PatientDetails } from '@pages/patients/PatientDetailsPage/panes/PatientDetailsTabPage';
import { VitalsPane } from '@pages/patients/VitalsPage';
import { VITALS_FIELD_KEYS } from '@pages/patients/VitalsPage/types';
import { ImagingRequestPane, NewImagingRequestModal } from '@pages/patients/ImagingRequestPage';
import { TasksPane, MarkCompletedModal, DeleteTaskModal } from '@pages/patients/TasksPage';
import { AddTaskModal } from '@pages/patients/TaskPage/modals/AddTaskModal';
import { MarkAsNotCompletedModal as MarkNotCompletedModal } from '@pages/patients/TaskPage/modals/MarkAsNotCompletedModal';
import { CHARTING_FIELD_KEYS } from '@pages/patients/ChartsPage/types';
import { EncounterHistoryPane } from '@pages/patients/EncounterHistoryPane';
import { RecentlyViewedPatients } from '@pages/patients/RecentlyViewedPatients';
import { Sidebar } from '@components/Sidebar';
import { DataTable } from '@components/DataTable';
import { TABLE_CELL_PREFIX } from '@ids';
import {
  toIsoDate,
  toTableDate,
  expectRecentDateTime,
  getBrowserDate,
  toTableDateTime,
} from '@helpers/dates';

async function getLatestVitalFieldValues(page: Page): Promise<Record<string, string>> {
  const firstRowRegex = new RegExp(`^${TABLE_CELL_PREFIX}0-`);
  await page.getByTestId(firstRowRegex).nth(1).waitFor({ state: 'visible', timeout: 30000 });

  const vitalValues: Record<string, string> = {};
  for (let i = 0; i < VITALS_FIELD_KEYS.length; i++) {
    const regex = new RegExp(`^${TABLE_CELL_PREFIX}${i}-`);
    const cell = page.getByTestId(regex).nth(1);
    const text = await cell.textContent();
    let normalizedValue = text?.trim() || '';
    normalizedValue = normalizedValue
      .replace(/cm$|kg$|°C$|%$/g, '')
      .replace(/^—$/, '')
      .trim();
    vitalValues[VITALS_FIELD_KEYS[i]] = normalizedValue;
  }
  return vitalValues;
}

test.describe('Basic tests', () => {
  let currentUserDisplayName: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const api = await createApiContext({ page });
    const currentUser = await getUser(api);
    currentUserDisplayName = currentUser.displayName || '';
    await api.dispose();
    await context.close();
  });

  test('[BT-0003][AT-2001]Admit the patient to Triage without adding vitals', async ({
    newPatient,
    page,
  }) => {
    const patientDetailsPage = new PatientDetailsPage(page);
    test.setTimeout(100000);
    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.admitOrCheckinButton.click();
    const createEncounterModal = patientDetailsPage.getCreateEncounterModal();
    await createEncounterModal.waitForModalToLoad();
    await createEncounterModal.triageButton.click();
    const emergencyTriageModal = patientDetailsPage.getEmergencyTriageModal();
    await emergencyTriageModal.waitForModalToLoad();
    await emergencyTriageModal.selectTriageScore(1);
    const triageFormValues = await emergencyTriageModal.fillTriageForm({
      triageScore: 1,
    });
    await emergencyTriageModal.submitButton.click();
    const emergencyPatientsPage = new EmergencyPatientsPage(patientDetailsPage.page);
    await emergencyPatientsPage.heading.waitFor({ state: 'visible' });
    await emergencyPatientsPage.table.sortBy('arrivalTime');
    await expect
      .poll(async () => (await emergencyPatientsPage.table.cell(0, 'arrivalTime').textContent()) ?? '', {
        timeout: 60000,
      })
      .toContain('0hrs 0mins');
    const chiefComplaintValue =
      (await emergencyPatientsPage.table.cell(0, 'chiefComplaint').textContent())?.trim() ?? '';
    const displayIdValue =
      (await emergencyPatientsPage.table.cell(0, 'displayId').textContent())?.trim() ?? '';
    const patientNameValue =
      (await emergencyPatientsPage.table.cell(0, 'patientName').textContent())?.trim() ?? '';
    const dateOfBirthValue =
      (await emergencyPatientsPage.table.cell(0, 'dateOfBirth').textContent())?.trim() ?? '';
    const sexValue = (await emergencyPatientsPage.table.cell(0, 'sex').textContent())?.trim() ?? '';
    const areaValue =
      (await emergencyPatientsPage.table.cell(0, 'locationGroupName').textContent())?.trim() ?? '';
    const locationValue =
      (await emergencyPatientsPage.table.cell(0, 'locationName').textContent())?.trim() ?? '';
    expect(chiefComplaintValue).toBe(triageFormValues.chiefComplaint);
    expect(displayIdValue).toBe(newPatient.displayId);
    expect(patientNameValue).toBe(`${newPatient.firstName} ${newPatient.lastName}`);
    expect(dateOfBirthValue).toBe(toTableDate(String(newPatient.dateOfBirth ?? '')));
    expect(sexValue.toLowerCase()).toBe(newPatient.sex.toLowerCase());
    expect(areaValue).toBe(triageFormValues.area);
    expect(locationValue).toBe(triageFormValues.location?.split('\n')[0] || '');
    const level1Value = (await emergencyPatientsPage.statValue(1).textContent())?.trim() ?? '';
    expect(parseInt(level1Value)).toBeGreaterThanOrEqual(1);
  });

  test('[BT-0003][AT-2002]Admit the patient to Triage with adding vitals', async ({
    newPatient,
    page,
  }) => {
    const patientDetailsPage = new PatientDetailsPage(page);
    test.setTimeout(100000);
    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.admitOrCheckinButton.click();
    const createEncounterModal = patientDetailsPage.getCreateEncounterModal();
    await createEncounterModal.waitForModalToLoad();
    await createEncounterModal.triageButton.click();
    const emergencyTriageModal = patientDetailsPage.getEmergencyTriageModal();
    await emergencyTriageModal.waitForModalToLoad();
    await emergencyTriageModal.selectTriageScore(1);
    const vitalsFormValues: Record<string, string> = {
      heightCm: '180',
      weightKg: '70',
      sbp: '120',
      dbp: '80',
      heartRate: '70',
      respiratoryRate: '12',
      temperature: '37.5',
      spo2: '95',
      spo2OnOxygen: '100',
      tewScore: '10',
      gcs: '15',
      painScale: '10',
      capillaryRefillTime: '4',
      randomBgl: '100',
      fastingBgl: '100',
      ventilatorFlow: '10',
      fio2: '100',
      pip: '10',
      peep: '10',
      rate: '10',
      inspiratoryTime: '10',
      tidalVolume: '10',
      minuteVentilation: '10',
    };
    await emergencyTriageModal.fillTriageForm({
      triageScore: 1,
      vitalsValues: vitalsFormValues,
    });
    await emergencyTriageModal.submitButton.click();
    const emergencyPatientsPage = new EmergencyPatientsPage(patientDetailsPage.page);
    await emergencyPatientsPage.heading.waitFor({ state: 'visible' });
    await emergencyPatientsPage.table.sortBy('arrivalTime');
    await expect
      .poll(async () => (await emergencyPatientsPage.table.cell(0, 'arrivalTime').textContent()) ?? '', {
        timeout: 100000,
      })
      .toContain('0hrs 0mins');
    await emergencyPatientsPage.table.rows.first().click();
    await patientDetailsPage.navigateToVitalsTab();
    const vitalsPane = new VitalsPane(patientDetailsPage.page);
    await vitalsPane.waitForPaneToLoad();
    const vitalsValues = await getLatestVitalFieldValues(patientDetailsPage.page);
    expect(vitalsValues).toMatchObject(vitalsFormValues);
  });

  test('[BT-0004][AT-2004]Edit patient details', async ({ newPatient, page }) => {
    const patientDetailsPage = new PatientDetailsPage(page);
    test.setTimeout(100000);
    await patientDetailsPage.goToPatient(newPatient);
    const patientDetailsTabPage = await patientDetailsPage.navigateToPatientDetailsTab();
    const nhn = generateNHN();
    const patientDetails: PatientDetails = {
      firstName: 'John',
      middleName: 'Michael',
      lastName: 'Smith',
      culturalName: 'Johnny Smith',
      dateOfBirth: '1990-01-01',
      email: 'john.smith@example.com',
      nationalHealthNumber: nhn,
      birthCertificate: 'BRTH12345',
      drivingLicense: 'DL54321',
      passport: 'PP987654',
      primaryContactNumber: '0123456789',
      secondaryContactNumber: '0987654321',
      emergencyContactName: 'Jane Smith',
      emergencyContactNumber: '0112233445',
      birthLocation: 'Johannesburg',
      cityTown: 'Johannesburg',
      residentialLandmark: '123 Main Street',
      sex: newPatient.sex === 'female' ? 'male' : 'female',
      selectFirstOption: true,
    };
    const formValues = await patientDetailsTabPage.updatePatientDetailsFields(patientDetails);
    await patientDetailsTabPage.saveButton.click();
    const allPatientsPage = await patientDetailsPage.navigateToAllPatientsPage();
    await allPatientsPage.waitForPageToLoad();
    const recentlyViewed = new RecentlyViewedPatients(allPatientsPage.page);
    await expect(recentlyViewed.cardText(0)).toHaveText(nhn);
    await expect(recentlyViewed.cardTitle(0)).toHaveText(
      `${patientDetails.firstName} ${patientDetails.lastName}`,
    );
    const expectedGender = patientDetails.sex ?? newPatient.sex ?? '';
    await expect(recentlyViewed.capitalizedText(0)).toHaveText(
      new RegExp(`^${expectedGender}$`, 'i'),
    );
    const formattedDate = RecentlyViewedPatients.formatDateForRecentlyViewed(
      patientDetails.dateOfBirth as string,
    );
    await expect(recentlyViewed.dateDisplay(0)).toHaveText(formattedDate);
    await recentlyViewed.cardTitle(0).click();
    await expect(patientDetailsPage.healthIdText).toHaveText(nhn);
    const patientDetailsTabPage2 = await patientDetailsPage.navigateToPatientDetailsTab();
    await patientDetailsTabPage2.waitForSectionToLoad();

    await expect(patientDetailsTabPage2.firstNameInput).toHaveValue(
      patientDetails.firstName as string,
    );
    await expect(patientDetailsTabPage2.lastNameInput).toHaveValue(
      patientDetails.lastName as string,
    );
    expect(toIsoDate(await patientDetailsTabPage2.dateOfBirthInput.inputValue())).toBe('1990-01-01');
    if (patientDetails.sex === 'female') {
      await expect(patientDetailsTabPage2.sexFemaleRadio).toBeChecked();
    } else if (patientDetails.sex === 'male') {
      await expect(patientDetailsTabPage2.sexMaleRadio).toBeChecked();
    }
    await expect(patientDetailsTabPage2.emailInput).toHaveValue(patientDetails.email as string);
    await expect(patientDetailsTabPage2.nationalHealthNumberInput).toHaveValue(nhn);
    const patientDetailsTabPage3 = await patientDetailsPage.navigateToPatientDetailsTab();
    await patientDetailsTabPage3.waitForSectionToLoad();
    await expect(patientDetailsTabPage3.birthCertificateInput).toHaveValue(
      patientDetails.birthCertificate as string,
    );
    await expect(patientDetailsTabPage3.drivingLicenseInput).toHaveValue(
      patientDetails.drivingLicense as string,
    );
    await expect(patientDetailsTabPage3.passportInput).toHaveValue(
      patientDetails.passport as string,
    );
    await expect(patientDetailsTabPage3.religionInput.locator('input')).toHaveValue(
      formValues.religion,
    );
    await expect(patientDetailsTabPage3.educationalAttainmentSelect).toHaveText(
      formValues.educationalAttainment,
    );
    await expect(patientDetailsTabPage3.occupationInput.locator('input')).toHaveValue(
      formValues.occupation,
    );
    await expect(patientDetailsTabPage3.socialMediaSelect).toHaveText(formValues.socialMedia);
    await expect(patientDetailsTabPage3.patientTypeSelect).toHaveText(formValues.patientType);
    await expect(patientDetailsTabPage3.motherInput.locator('input')).toHaveValue(
      formValues.mother,
    );
    await expect(patientDetailsTabPage3.fatherInput.locator('input')).toHaveValue(
      formValues.father,
    );
    await expect(patientDetailsTabPage3.medicalAreaInput.locator('input')).toHaveValue(
      formValues.medicalArea,
    );
    await expect(patientDetailsTabPage3.nursingZoneInput.locator('input')).toHaveValue(
      formValues.nursingZone,
    );
    await expect(patientDetailsTabPage3.countryInput.locator('input')).toHaveValue(
      formValues.country,
    );
    await expect(patientDetailsTabPage3.cityTownInput).toHaveValue(
      patientDetails.cityTown as string,
    );
    await expect(patientDetailsTabPage3.residentialLandmarkInput).toHaveValue(
      patientDetails.residentialLandmark as string,
    );
  });

  test('[BT-0008][AT-2005]Create and verify new imaging request in imaging request table', async ({
    newPatientWithHospitalAdmission,
    page,
  }) => {
    const patientDetailsPage = new PatientDetailsPage(page);
    test.setTimeout(100000);
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.navigateToImagingRequestTab();
    const imagingRequestPane = new ImagingRequestPane(patientDetailsPage.page);
    await imagingRequestPane.waitForTableToLoad();
    await imagingRequestPane.newImagingRequestButton.click();
    const newImagingRequestModal = new NewImagingRequestModal(patientDetailsPage.page);
    await newImagingRequestModal.waitForModalToLoad();
    const imagingRequestCode = await newImagingRequestModal.codeInput.inputValue();

    await expectRecentDateTime(newImagingRequestModal.orderDateTimeInput);

    const defaultRequestingClinician =
      await newImagingRequestModal.requestingClinicianInput.inputValue();
    expect(defaultRequestingClinician).toBe(currentUserDisplayName);
    const supervisingClinician = await newImagingRequestModal.supervisingInput.inputValue();
    expect(supervisingClinician).toBe(currentUserDisplayName);

    const formValues = await newImagingRequestModal.fillForm({
      imagingType: 'Angiogram',
      areaToBeImaged: 'Angiogram Imaging Area',
      noteText: 'This is a test note',
    });
    await newImagingRequestModal.submitButton.click();
    await imagingRequestPane.waitForTableToLoad();

    const imagingType = (await imagingRequestPane.table.cell(0, 'imagingType').textContent())?.trim();
    expect(imagingType).toBe(formValues.imagingType);
    const requestId = (await imagingRequestPane.table.cell(0, 'displayId').textContent())?.trim();
    expect(requestId).toBe(imagingRequestCode);
    const requestedAtTime =
      (await imagingRequestPane.table.cell(0, 'requestedDate').textContent())?.trim();
    expect(requestedAtTime).toBe(toTableDate(new Date()));
    const requestedBy =
      (await imagingRequestPane.table.cell(0, 'requestedBy.displayName').textContent())?.trim();
    expect(requestedBy).toBe(currentUserDisplayName);
    const priority = (await imagingRequestPane.table.cell(0, 'priority').textContent())?.trim();
    expect(priority).toBe(formValues.priority);
    const status = (await imagingRequestPane.table.cell(0, 'status').textContent())?.trim();
    expect(status).toBe('Pending');
  });

  test.skip('[BT-0009][AT-2006]Add a new prescription', async () => {});
  test.skip('[BT-0010][AT-2007]add a document and view it', async ({
    newPatient,
    page,
  }) => {
    const patientDetailsPage = new PatientDetailsPage(page);
    await patientDetailsPage.goToPatient(newPatient);
    const documentsPane = await patientDetailsPage.navigateToDocumentsTab();
    const fileName = 'Test Document 2';
    const documentOwnerName = 'Sepideh';
    const note = 'This is a test note 2';
    const filePath = path.resolve(__dirname, '../../fixtures/files/test.pdf');
    const formValues = await documentsPane.addDocument({
      fileName: fileName,
      documentOwner: documentOwnerName,
      note: note,
      filePath: filePath,
    });
    expect(formValues.department).toBe('Cardiology');
    const docTable = new DataTable(documentsPane.page);
    const documentName = (await docTable.cell(0, 'name').textContent())?.trim();
    expect(documentName).toBe(fileName);
    const documentOwnerValue = (await docTable.cell(0, 'documentOwner').textContent())?.trim();
    expect(documentOwnerValue).toBe(documentOwnerName);
    const noteValue = (await docTable.cell(0, 'note').textContent())?.trim();
    expect(noteValue).toBe(note);
    const department = (await docTable.cell(0, 'department.name').textContent())?.trim();
    expect(department).toBe(formValues.department);
    const dateUploaded = (await docTable.cell(0, 'documentUploadedAt').textContent())?.trim();
    expect(dateUploaded).toBe(toTableDate(new Date()));
  });
  test.skip('[BT-0010][AT-2008]add a document and download it', async () => {
    // we can't inspect the download document modal, a blocker to write this test
  });
  test.skip('[BT-0011][AT-2009]check result tab', async () => {});
  test.skip('[BT-0015][AT-2010]add a new referral and view it', async () => {});
  test.skip('[BT-0016][AT-2011]add a new program and view it', async () => {});
  test('[BT-0018][AT-2012]admit the patient to hospital', async ({ newPatient, page }) => {
    const patientDetailsPage = new PatientDetailsPage(page);
    await patientDetailsPage.goToPatient(newPatient);
    const formValues = await patientDetailsPage.admitToHospital();
    const encounterHistoryPane = new EncounterHistoryPane(patientDetailsPage.page);
    await encounterHistoryPane.waitForPaneToLoad();
    const startDateRaw =
      (await encounterHistoryPane.table.cell(0, 'startDate').textContent())?.replace(/\u00A0/g, ' ') ?? '';
    const encounterValues = {
      facilityName:
        (await encounterHistoryPane.table.cell(0, 'facilityName').textContent())?.trim() ?? '',
      area:
        (await encounterHistoryPane.table.cell(0, 'locationGroupName').textContent())?.trim() ?? '',
      startDate: startDateRaw.replace(/\s+/g, ' ').trim(),
    };
    const sidebar = new Sidebar(patientDetailsPage.page);
    expect(encounterValues.facilityName).toBe(await sidebar.getFacilityName());
    expect(encounterValues.area).toBe(formValues.area);
    expect(encounterValues.startDate).toBe(`${toTableDate(new Date())} – Current`);
  });
  test.skip('[BT-0019][AT-2013]Change diet', async ({
    newPatientWithHospitalAdmission,
    page,
  }) => {
    const patientDetailsPage = new PatientDetailsPage(page);
    test.setTimeout(60000);
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    const encounterHistoryPane = new EncounterHistoryPane(patientDetailsPage.page);
    await encounterHistoryPane.waitForPaneToLoad();
    await encounterHistoryPane.table.rows.first().click();
    await patientDetailsPage.waitForEncounterToBeReady();
    const editEncounterModal = await patientDetailsPage.openEditEncounterModal();
    const expectedDiet = 'Clear fluids';
    await editEncounterModal.selectDiet(expectedDiet);
    await editEncounterModal.saveChanges();
    await expect(patientDetailsPage.dietLabel).toContainText(expectedDiet);
  });
  test('[BT-0020][AT-2014]Change Location', async ({
    newPatientWithHospitalAdmission,
    page,
  }) => {
    const patientDetailsPage = new PatientDetailsPage(page);
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    const encounterHistoryPane = new EncounterHistoryPane(patientDetailsPage.page);
    await encounterHistoryPane.waitForPaneToLoad();
    await encounterHistoryPane.table.rows.first().click();
    await patientDetailsPage.waitForEncounterToBeReady();
    await patientDetailsPage.movePatientButton.click();
    const moveFormGrid = patientDetailsPage.page
      .getByTestId('formgrid-wyqp')
      .filter({ hasText: 'Area' });
    await moveFormGrid.waitFor({ state: 'visible' });
    const expectedArea = 'Operating Theatre';
    const expectedLocation = 'Theatre 1';
    const areaInput = moveFormGrid.locator('input').first();
    await areaInput.click();
    await areaInput.fill(expectedArea);
    await patientDetailsPage.page.getByRole('menuitem', { name: expectedArea }).click();
    const locationInput = moveFormGrid.locator('input').nth(1);
    await locationInput.click();
    await patientDetailsPage.page.getByText(expectedLocation, { exact: true }).first().click();
    await patientDetailsPage.page.getByRole('button', { name: 'Confirm' }).click();
    await patientDetailsPage.page.waitForLoadState('networkidle');
    await expect(patientDetailsPage.locationLabel).toHaveText(
      `${expectedArea}, ${expectedLocation}`,
    );
  });
  test('[BT-0021][AT-2015]Add a primary diagnosis', async ({
    newPatientWithHospitalAdmission,
    page,
  }) => {
    const patientDetailsPage = new PatientDetailsPage(page);
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    const encounterHistoryPane = new EncounterHistoryPane(patientDetailsPage.page);
    await encounterHistoryPane.waitForPaneToLoad();
    await encounterHistoryPane.table.rows.first().click();
    await patientDetailsPage.addDiagnosisButton.click();
    const diagnosisModal = patientDetailsPage.getAddDiagnosisModal();
    await diagnosisModal.waitForModalToLoad();
    expect(toIsoDate(await diagnosisModal.dateInput.inputValue())).toBe(await getBrowserDate(page));
    expect(await diagnosisModal.clinicianInput.inputValue()).toBe(currentUserDisplayName);
    const formValues = await diagnosisModal.fillForm(true);
    await diagnosisModal.confirmButton.click();
    await expect(patientDetailsPage.diagnosisCategory.first()).toHaveText('P');
    await expect(patientDetailsPage.diagnosisName.first()).toHaveText(formValues.diagnosis);
  });
  test('[BT-0022][AT-2016]Add a not primary diagnosis', async ({
    newPatientWithHospitalAdmission,
    page,
  }) => {
    const patientDetailsPage = new PatientDetailsPage(page);
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    const encounterHistoryPane = new EncounterHistoryPane(patientDetailsPage.page);
    await encounterHistoryPane.waitForPaneToLoad();
    await encounterHistoryPane.table.rows.first().click();
    await patientDetailsPage.addDiagnosisButton.click();
    const diagnosisModal = patientDetailsPage.getAddDiagnosisModal();
    await diagnosisModal.waitForModalToLoad();
    const formValues = await diagnosisModal.fillForm(false);
    await diagnosisModal.confirmButton.click();
    await expect(patientDetailsPage.diagnosisCategory.first()).toHaveText('S');
    await expect(patientDetailsPage.diagnosisName.first()).toHaveText(formValues.diagnosis);
  });
  test('[BT-0023][AT-2017] Add a new task set', async ({
    newPatientWithHospitalAdmission,
    page,
  }) => {
    const patientDetailsPage = new PatientDetailsPage(page);
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    const encounterHistoryPane = new EncounterHistoryPane(patientDetailsPage.page);
    await encounterHistoryPane.waitForPaneToLoad();
    await encounterHistoryPane.table.rows.first().click();
    await patientDetailsPage.waitForEncounterToBeReady();
    await patientDetailsPage.tasksTab.click();
    const tasksPane = new TasksPane(patientDetailsPage.page);
    await tasksPane.waitForPaneToLoad();
    const taskTable = new DataTable(tasksPane.page);
    const notes = 'This is a test note';
    const taskName = 'Discharge preparation';
    await tasksPane.addButton.click();
    const addTaskModal = new AddTaskModal(tasksPane.page);
    await addTaskModal.waitForModalToLoad();
    const formValues = await addTaskModal.fillForm({
      taskName: taskName,
      notes: notes,
    });
    await addTaskModal.confirmButton.click();
    await tasksPane.noDataContainer.waitFor({ state: 'detached' });
    await tasksPane.page.waitForLoadState('networkidle', { timeout: 10000 });
    const note0 = (await taskTable.cell(0, 'note').textContent())?.trim();
    const note1 = (await taskTable.cell(1, 'note').textContent())?.trim();
    expect(note0).toBe(notes);
    expect(note1).toBe(notes);
    const freq0 = (await taskTable.cell(0, 'frequency').textContent())?.trim();
    const freq1 = (await taskTable.cell(1, 'frequency').textContent())?.trim();
    expect(freq0).toBe('Once');
    expect(freq1).toBe('Once');
    const assigned0 = (await taskTable.cell(0, 'assignedTo').textContent())?.trim();
    const assigned1 = (await taskTable.cell(1, 'assignedTo').textContent())?.trim();
    expect(assigned0).toContain('Nurse');
    expect(assigned0).toContain('Intern');
    expect(assigned1).toBe('-');
    const due0 = (await taskTable.cell(0, 'dueTime').textContent())?.trim();
    const due1 = (await taskTable.cell(1, 'dueTime').textContent())?.trim();
    const expectedDateTime = toTableDateTime(formValues.dateTime);
    expect(due0).toBe(expectedDateTime);
    expect(due1).toBe(expectedDateTime);
    const taskName0 = (await taskTable.cell(0, 'name').textContent())?.trim();
    const taskName1 = (await taskTable.cell(1, 'name').textContent())?.trim();
    expect(taskName0).toBe('Contact patient family/caretaker');
    expect(taskName1).toBe('Patient preparation: Discharge');
  });
  test('[BT-0024][AT-2018] Add a new repeating task', async ({
    newPatientWithHospitalAdmission,
    page,
  }) => {
    const patientDetailsPage = new PatientDetailsPage(page);
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    const encounterHistoryPane = new EncounterHistoryPane(patientDetailsPage.page);
    await encounterHistoryPane.waitForPaneToLoad();
    await encounterHistoryPane.table.rows.first().click();
    await patientDetailsPage.waitForEncounterToBeReady();
    await patientDetailsPage.tasksTab.click();
    const tasksPane = new TasksPane(patientDetailsPage.page);
    await tasksPane.waitForPaneToLoad();
    const taskTable = new DataTable(tasksPane.page);
    const notes = 'This is a test note';
    const taskName = 'Phone order: Labs';
    const frequencyValue = 1;
    const frequencyUnit = 'day (s)';
    const durationValue = 2;
    const durationUnit = 'day (s)';
    const highPriority = true;
    const assignedTo = 'Doctor';
    await tasksPane.addButton.click();
    const addTaskModal = new AddTaskModal(tasksPane.page);
    await addTaskModal.waitForModalToLoad();
    const formValues = await addTaskModal.fillForm({
      taskName: taskName,
      notes: notes,
      frequencyValue: frequencyValue,
      frequencyUnit: frequencyUnit,
      durationValue: durationValue,
      durationUnit: durationUnit,
      highPriority: highPriority,
      assignedTo: assignedTo,
    });
    await addTaskModal.confirmButton.click();
    await tasksPane.noDataContainer.waitFor({ state: 'detached' });
    await tasksPane.page.waitForLoadState('networkidle', { timeout: 10000 });
    const rowCount = await taskTable.getRowCount();
    expect(rowCount).toBe(1);
    const note = (await taskTable.cell(0, 'note').textContent())?.trim();
    expect(note).toBe(notes);
    const frequency = (await taskTable.cell(0, 'frequency').textContent())?.trim();
    expect(frequency).toBe('1 day');
    await expect(tasksPane.highPriorityIcon.first()).toBeVisible();
    const assignedToValue = (await taskTable.cell(0, 'assignedTo').textContent())?.trim();
    expect(assignedToValue).toBe(assignedTo);
    const dueAt = (await taskTable.cell(0, 'dueTime').textContent())?.trim();
    const expectedDateTime = toTableDateTime(formValues.dateTime);
    expect(dueAt).toBe(expectedDateTime);
  });
  test('[BT-0025][AT-2019] Mark a task as completed', async ({
    newPatientWithHospitalAdmission,
    page,
  }) => {
    const patientDetailsPage = new PatientDetailsPage(page);
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    const encounterHistoryPane = new EncounterHistoryPane(patientDetailsPage.page);
    await encounterHistoryPane.waitForPaneToLoad();
    await encounterHistoryPane.table.rows.first().click();
    await patientDetailsPage.waitForEncounterToBeReady();
    await patientDetailsPage.tasksTab.click();
    const tasksPane = new TasksPane(patientDetailsPage.page);
    await tasksPane.waitForPaneToLoad();
    const taskTable = new DataTable(tasksPane.page);
    await tasksPane.addButton.click();
    const addTaskModal = new AddTaskModal(tasksPane.page);
    await addTaskModal.waitForModalToLoad();
    const taskName = 'Contact patient family/caretaker';
    await addTaskModal.fillForm({
      taskName: taskName,
    });
    await addTaskModal.confirmButton.click();
    await tasksPane.noDataContainer.waitFor({ state: 'detached' });
    await tasksPane.page.waitForLoadState('networkidle', { timeout: 10000 });
    const rowCount = await taskTable.getRowCount();
    expect(rowCount).toBe(1);
    const taskNameValue = (await taskTable.cell(0, 'name').textContent())?.trim();
    expect(taskNameValue).toBe(taskName);
    await tasksPane.tableBody.locator('tr').first().hover();
    await tasksPane.completeIcon.click();
    const markAsCompletedModal = new MarkCompletedModal(tasksPane.page);
    await markAsCompletedModal.completedByInput.waitFor({ state: 'visible' });
    const notes = 'Mark as completed test note';
    await markAsCompletedModal.notesInput.fill(notes);
    await markAsCompletedModal.confirmButton.click();
    await tasksPane.completeCheckbox.check();
    expect(await tasksPane.tableBody.locator('tr').count()).toBe(1);
  });
  test('[BT-0026][AT-2020] Mark a task as not completed', async ({
    newPatientWithHospitalAdmission,
    page,
  }) => {
    const patientDetailsPage = new PatientDetailsPage(page);
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    const encounterHistoryPane = new EncounterHistoryPane(patientDetailsPage.page);
    await encounterHistoryPane.waitForPaneToLoad();
    await encounterHistoryPane.table.rows.first().click();
    await patientDetailsPage.waitForEncounterToBeReady();
    await patientDetailsPage.tasksTab.click();
    const tasksPane = new TasksPane(patientDetailsPage.page);
    await tasksPane.waitForPaneToLoad();
    const taskTable = new DataTable(tasksPane.page);
    await tasksPane.addButton.click();
    const addTaskModal = new AddTaskModal(tasksPane.page);
    await addTaskModal.waitForModalToLoad();
    const taskName = 'Contact patient family/caretaker';
    await addTaskModal.fillForm({
      taskName: taskName,
    });
    await addTaskModal.confirmButton.click();
    await tasksPane.noDataContainer.waitFor({ state: 'detached' });
    await tasksPane.page.waitForLoadState('networkidle', { timeout: 10000 });
    const rowCount = await taskTable.getRowCount();
    expect(rowCount).toBe(1);
    const taskNameValue = (await taskTable.cell(0, 'name').textContent())?.trim();
    expect(taskNameValue).toBe(taskName);
    await tasksPane.tableBody.locator('tr').first().hover();
    await tasksPane.cancelIcon.click();
    const markAsNotCompletedModal = new MarkNotCompletedModal(tasksPane.page);
    await markAsNotCompletedModal.waitForModalToLoad();
    const reasonNotCompleted = 'Other';
    await markAsNotCompletedModal.fillForm({
      reasonNotCompleted: reasonNotCompleted,
    });
    await markAsNotCompletedModal.confirmButton.click();
    await tasksPane.notCompleteCheckbox.check();
    expect(await tasksPane.tableBody.locator('tr').count()).toBe(1);
  });
  test('[BT-0027][AT-2021] Delete a task', async ({
    newPatientWithHospitalAdmission,
    page,
  }) => {
    const patientDetailsPage = new PatientDetailsPage(page);
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    const encounterHistoryPane = new EncounterHistoryPane(patientDetailsPage.page);
    await encounterHistoryPane.waitForPaneToLoad();
    await encounterHistoryPane.table.rows.first().click();
    await patientDetailsPage.waitForEncounterToBeReady();
    await patientDetailsPage.tasksTab.click();
    const tasksPane = new TasksPane(patientDetailsPage.page);
    await tasksPane.waitForPaneToLoad();
    await tasksPane.addButton.click();
    const addTaskModal = new AddTaskModal(tasksPane.page);
    await addTaskModal.waitForModalToLoad();
    const taskName = 'Contact patient family/caretaker';
    await addTaskModal.fillForm({
      taskName: taskName,
    });
    await addTaskModal.confirmButton.click();
    await tasksPane.noDataContainer.waitFor({ state: 'detached' });
    await tasksPane.page.waitForLoadState('networkidle', { timeout: 10000 });
    const taskTable = new DataTable(tasksPane.page);
    const rowCount = await taskTable.getRowCount();
    expect(rowCount).toBe(1);
    await tasksPane.tableBody.locator('tr').first().hover();
    await tasksPane.deleteIcon.click();
    const deleteTaskModal = new DeleteTaskModal(tasksPane.page);
    await deleteTaskModal.deletedByInput.waitFor({ state: 'visible' });
    await deleteTaskModal.confirmButton.click();
    await tasksPane.waitForPaneToLoad();
    await expect(tasksPane.noDataContainer).toHaveText(
      'No patient tasks to display. Please try adjusting filters or click ‘+ New task’ to add a task to this patient.',
    );
  });

  test('[BT-0028][AT-2022] Record a simple chart and validate', async ({
    newPatientWithHospitalAdmission,
    page,
  }) => {
    const patientDetailsPage = new PatientDetailsPage(page);
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    const encounterHistoryPane = new EncounterHistoryPane(patientDetailsPage.page);
    await encounterHistoryPane.waitForPaneToLoad();
    await encounterHistoryPane.table.rows.first().click();
    const chartsPane = await patientDetailsPage.navigateToChartsTab();
    await chartsPane.waitForPageToLoad();
    await chartsPane.selectChartType('Neurological Assessment');
    await chartsPane.recordChartButton.click();
    const simpleChartModal = chartsPane.getSimpleChartModal();
    await simpleChartModal.waitForModalToLoad();
    const gcsTotalScore = '15';
    const rightPupilsSize = '3';
    const leftPupilsSize = '3';
    const rightArmLimbMovement = ['Normal power'];
    const rightLegLimbMovement = ['Mild weakness'];
    const leftArmLimbMovement = ['Normal power'];
    const leftLegLimbMovement = ['Mild weakness'];
    const comments = 'This is a test comment';
    const formValues = await simpleChartModal.fillForm({
      gcsTotalScore: gcsTotalScore,
      rightPupilsSize: rightPupilsSize,
      leftPupilsSize: leftPupilsSize,
      rightArmLimbMovement: rightArmLimbMovement,
      rightLegLimbMovement: rightLegLimbMovement,
      leftArmLimbMovement: leftArmLimbMovement,
      leftLegLimbMovement: leftLegLimbMovement,
      comments: comments,
    });
    await simpleChartModal.confirmButton.click();
    await chartsPane.waitForPageToLoad();
    const chartValues = await chartsPane.getLatestValuesFromChartsTable(
      chartsPane.page,
      CHARTING_FIELD_KEYS,
    );
    expect(chartValues).toEqual(formValues);
  });
  test('[BT-0015][AT-2010] Add a new referral', async ({ newPatient, page }) => {
    const patientDetailsPage = new PatientDetailsPage(page);
    await patientDetailsPage.goToPatient(newPatient);
    const referralPane = await patientDetailsPage.navigateToReferralsTab();
    await referralPane.waitForPageToLoad();
    await referralPane.addReferralButton.click();
    const addReferralModal = referralPane.getAddReferralModal();
    await addReferralModal.waitForModalToLoad();
    const referralType = 'CVD Primary Screening Referral';
    await addReferralModal.selectSurvey(referralType);
    await addReferralModal.waitForFormFieldsToBeVisible();
    const referralDateIso = await getBrowserDate(page);
    const formValues = await addReferralModal.fillCVDPrimaryScreeningForm({
      referralDate: referralDateIso,
      referralReason: 'Reason for referral',
      relevantScreeningHistory: false,
    });
    await addReferralModal.nextButton.click();
    await addReferralModal.completeReferralButton.click();
    await referralPane.waitForPageToLoad();
    const referralTable = new DataTable(referralPane.page);
    const referralDateCell = (await referralTable.cell(0, 'date').textContent())?.trim();
    expect(referralDateCell).toBe(toTableDate(formValues.referralDate));
    const referralTypeValue = (await referralTable.cell(0, 'referralType').textContent())?.trim();
    expect(referralTypeValue).toBe(referralType);
    const referralCompletedBy =
      (await referralTable.cell(0, 'referredBy').textContent())?.trim();
    expect(referralCompletedBy).toBe(formValues.referralCompletedBy);
    const referralStatus = (await referralTable.cell(0, 'status').textContent())?.trim();
    expect(referralStatus).toBe('Pending');
  });
});
