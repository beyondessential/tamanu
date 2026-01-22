import { EmergencyPatientsPage } from '@pages/patients/EmergencyPatientsPage';
import { test } from '../../fixtures/baseFixture';
import { expect } from '@playwright/test';
import { assertRecentDateTime, convertDateFormat, getTableItems, formatDateTimeForTable } from '@utils/testHelper';
import { VitalsPage } from '@pages/patients/VitalsPage/panes/VitalsPage';
import { generateNHN } from '@utils/generateNewPatient';
import type { PatientDetails } from '@pages/patients/PatientDetailsPage/panes/PatientDetailsTabPage';
import { RecentlyViewedPatientsList } from '@pages/patients/RecentlyViewedPatientsList';
import { ImagingRequestPane } from '@pages/patients/ImagingRequestPage/panes/ImagingRequestPane';
import { getUser, createApiContext } from '@utils/apiHelpers';
import { format } from 'date-fns';
import path from 'path';
import { SidebarPage } from '@pages/SidebarPage'; 
import { CHARTING_FIELD_KEYS } from '@pages/patients/ChartsPage/types';
import { SelectFormPage } from '@pages/patients/PatientDetailsPage/pages/SelectFormPage';
import { FormPage } from '@pages/patients/PatientDetailsPage/pages/FormPage';
import { FormResponseModal } from '@pages/patients/PatientDetailsPage/modals/FormResponseModal';
import { DeleteProgramResponseModal } from '@pages/patients/PatientDetailsPage/modals/DeleteProgramResponseModal';



    test.describe('Basic tests', () => {
  let currentUserDisplayName: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    // Get current user info
    const api = await createApiContext({ page });
    const currentUser = await getUser(api);
    currentUserDisplayName = currentUser.displayName || '';
    await api.dispose();
    await context.close();
  });

    test('[BT-0003][AT-2001]Admit the patient to Triage without adding vitals', async ({ newPatient, patientDetailsPage }) => {
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
        triageScore: 1
      });
      await emergencyTriageModal.submitButton.click();
      const emergencyPatientsPage = new EmergencyPatientsPage(patientDetailsPage.page);
      await emergencyPatientsPage.waitForPageToLoad();
      await emergencyPatientsPage.arrivalTimeSortButton.click();
      // Wait for the first patient's arrival time to be 0hrs 0mins
      await expect
        .poll(async () => await emergencyPatientsPage.getTableItemValue(0, 'arrivalTime'), { timeout: 60000 })
        .toContain('0hrs 0mins');
      const chiefComplaintValue = await emergencyPatientsPage.getTableItemValue(0, 'chiefComplaint');
      const displayIdValue = await emergencyPatientsPage.getTableItemValue(0, 'displayId');
      const patientNameValue = await emergencyPatientsPage.getTableItemValue(0, 'patientName');
      const dateOfBirthValue = await emergencyPatientsPage.getTableItemValue(0, 'dateOfBirth');
      const sexValue = await emergencyPatientsPage.getTableItemValue(0, 'sex');
      const areaValue = await emergencyPatientsPage.getTableItemValue(0, 'locationGroupName');
      const locationValue = await emergencyPatientsPage.getTableItemValue(0, 'locationName');
      expect(chiefComplaintValue).toBe(triageFormValues.chiefComplaint);
      expect(displayIdValue).toBe(newPatient.displayId);
      expect(patientNameValue).toBe(`${newPatient.firstName} ${newPatient.lastName}`);
      expect(dateOfBirthValue).toBe(convertDateFormat(newPatient.dateOfBirth));
      expect(sexValue.toLowerCase()).toBe(newPatient.sex.toLowerCase());
      expect(areaValue).toBe(triageFormValues.area);
      expect(locationValue).toBe(triageFormValues.location?.split('\n')[0] || '');
      const level1Value = await emergencyPatientsPage.getLevelCardValue(1);
      expect(parseInt(level1Value)).toBeGreaterThanOrEqual(1);
    });
    test('[BT-0003][AT-2002]Admit the patient to Triage with adding vitals', async ({ newPatient, patientDetailsPage }) => {
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
      await emergencyPatientsPage.waitForPageToLoad();
      await emergencyPatientsPage.arrivalTimeSortButton.click();
      // Wait for the first patient's arrival time to be 0hrs 0mins
      await expect
        .poll(async () => await emergencyPatientsPage.getTableItemValue(0, 'arrivalTime'), { timeout: 100000 })
        .toContain('0hrs 0mins');
      await emergencyPatientsPage.tableRows.first().click();
      await patientDetailsPage.navigateToVitalsTab();
      const vitalsPageSection = new VitalsPage(patientDetailsPage.page);
      await vitalsPageSection.waitForSectionToLoad();
      const vitalsValues = await vitalsPageSection.getLatestVitalValues();
      expect(vitalsValues).toMatchObject(vitalsFormValues);
    });
    /**
     * Test to edit patient details and verify the changes
     * @param newPatient - The new patient object
     * @param patientDetailsPage - The patient details page object
     */
    test('[BT-0004][AT-2004]Edit patient details', async ({ newPatient, patientDetailsPage }) => {
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
     const allPatientsPage=await patientDetailsPage.navigateToAllPatientsPage();
     await allPatientsPage.waitForPageToLoad();
     await expect(allPatientsPage.recentlyViewedPatientsList.firstRecentlyViewedNHN).toHaveText(nhn);
     await expect(allPatientsPage.recentlyViewedPatientsList.firstRecentlyViewedName).toHaveText(`${patientDetails.firstName} ${patientDetails.lastName}`);
     const expectedGender = (patientDetails.sex ?? newPatient.sex) ?? '';
     await expect(allPatientsPage.recentlyViewedPatientsList.firstRecentlyViewedGender).toHaveText(
       new RegExp(`^${expectedGender}$`, 'i'),
     );
    const formattedDate = RecentlyViewedPatientsList.formatDateForRecentlyViewed(patientDetails.dateOfBirth as string);
     await expect(allPatientsPage.recentlyViewedPatientsList.firstRecentlyViewedBirthDate).toHaveText(formattedDate);
     await allPatientsPage.recentlyViewedPatientsList.firstRecentlyViewedName.click();
     await expect(patientDetailsPage.healthIdText).toHaveText(nhn);
     const patientDetailsTabPage2 = await patientDetailsPage.navigateToPatientDetailsTab();
     await patientDetailsTabPage2.waitForSectionToLoad();

     await expect(patientDetailsTabPage2.firstNameInput).toHaveValue(patientDetails.firstName as string);
     await expect(patientDetailsTabPage2.lastNameInput).toHaveValue(patientDetails.lastName as string);
     await expect(patientDetailsTabPage2.dateOfBirthInput.locator('input')).toHaveValue('1990-01-01');
     if ((patientDetails.sex) === 'female') {
       await expect(patientDetailsTabPage2.sexFemaleRadio).toBeChecked();
     } else if ((patientDetails.sex ) === 'male') {
       await expect(patientDetailsTabPage2.sexMaleRadio).toBeChecked();
     }
     await expect(patientDetailsTabPage2.emailInput).toHaveValue(patientDetails.email as string);
     await expect(patientDetailsTabPage2.nationalHealthNumberInput).toHaveValue(nhn);
     const patientDetailsTabPage3 = await patientDetailsPage.navigateToPatientDetailsTab();
     await patientDetailsTabPage3.waitForSectionToLoad();
     await expect(patientDetailsTabPage3.birthCertificateInput).toHaveValue(patientDetails.birthCertificate as string);
     await expect(patientDetailsTabPage3.drivingLicenseInput).toHaveValue(patientDetails.drivingLicense as string);
     await expect(patientDetailsTabPage3.passportInput).toHaveValue(patientDetails.passport as string);
     await expect(patientDetailsTabPage3.religionInput.locator('input')).toHaveValue(formValues.religion);
     await expect(patientDetailsTabPage3.educationalAttainmentSelect).toHaveText(formValues.educationalAttainment);
     await expect(patientDetailsTabPage3.occupationInput.locator('input')).toHaveValue(formValues.occupation);
     await expect(patientDetailsTabPage3.socialMediaSelect).toHaveText(formValues.socialMedia);
     await expect(patientDetailsTabPage3.patientTypeSelect).toHaveText(formValues.patientType);
     await expect(patientDetailsTabPage3.motherInput.locator('input')).toHaveValue(formValues.mother);
     await expect(patientDetailsTabPage3.fatherInput.locator('input')).toHaveValue(formValues.father);
     await expect(patientDetailsTabPage3.medicalAreaInput.locator('input')).toHaveValue(formValues.medicalArea);
     await expect(patientDetailsTabPage3.nursingZoneInput.locator('input')).toHaveValue(formValues.nursingZone);
     await expect(patientDetailsTabPage3.countryInput.locator('input')).toHaveValue(formValues.country);
     await expect(patientDetailsTabPage3.cityTownInput).toHaveValue(patientDetails.cityTown as string);
     await expect(patientDetailsTabPage3.residentialLandmarkInput).toHaveValue(patientDetails.residentialLandmark as string);
    });

    test('[BT-0008][AT-2005]Create and verify new imaging request in imaging request table', async ({ newPatientWithHospitalAdmission, patientDetailsPage }) => {
      test.setTimeout(100000);
      await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
      await patientDetailsPage.navigateToImagingRequestTab();
      const imagingRequestPane = new ImagingRequestPane(patientDetailsPage.page);
      await imagingRequestPane.waitForPageToLoad();
      await imagingRequestPane.createImagingRequestButton.click();
      const newImagingRequestModal = imagingRequestPane.getNewImagingRequestModal();
      await newImagingRequestModal.waitForModalToLoad();
      const imagingRequestCode= await newImagingRequestModal.imagingRequestCodeInput.inputValue();

      await assertRecentDateTime(newImagingRequestModal.orderDateTimeInput, 'yyyy-MM-dd\'T\'HH:mm');

      const defaultRequestingClinician = await newImagingRequestModal.requestingClinicianInput.inputValue();
      expect(defaultRequestingClinician).toBe(currentUserDisplayName);
      const supervisingClinician = await newImagingRequestModal.supervisingClinicianInput.inputValue();
      expect(supervisingClinician).toBe(currentUserDisplayName);

      const formValues = await newImagingRequestModal.fillForm({
        imagingRequestType: 'Angiogram',
        areasToBeImaged: 'Angiogram Imaging Area',
        notes: 'This is a test note',
      });
      await newImagingRequestModal.finaliseButton.click();
      await imagingRequestPane.waitForPageToLoad();
      
       const imagingType = await getTableItems(imagingRequestPane.page, 1, 'imagingType');
       expect(imagingType[0]).toBe(formValues.imagingRequestType);
       const requestId = await getTableItems(imagingRequestPane.page, 1, 'displayId');
       expect(requestId[0]).toBe(imagingRequestCode);
       const requestedAtTime = await getTableItems(imagingRequestPane.page, 1, 'requestedDate');
       expect(requestedAtTime[0]).toBe(format(new Date(), 'MM/dd/yyyy'));
       const requestedBy = await getTableItems(imagingRequestPane.page, 1, 'requestedBy.displayName');
       expect(requestedBy[0]).toBe(formValues.requestingClinician);
       const priority = await getTableItems(imagingRequestPane.page, 1, 'priority');
       expect(priority[0]).toBe(formValues.priority);
       const status = await getTableItems(imagingRequestPane.page, 1, 'status');
       expect(status[0]).toBe('Pending');
    })
  test.skip('[BT-0009][AT-2006]Add a new prescription', async () => {});
  test.skip('[BT-0010][AT-2007]add a document and view it', async ({ newPatient, patientDetailsPage }) => {
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
    const documentName = await getTableItems(documentsPane.page, 1, 'name');
    expect(documentName[0]).toBe(fileName);
    const documentOwnerValue = await getTableItems(documentsPane.page, 1, 'documentOwner');
    expect(documentOwnerValue[0]).toBe(documentOwnerName);
    const noteValue = await getTableItems(documentsPane.page, 1, 'note');
    expect(noteValue[0]).toBe(note);
    const department = await getTableItems(documentsPane.page, 1, 'department.name')
    expect(department[0]).toBe(formValues.department);
    const dateUploaded = await getTableItems(documentsPane.page, 1, 'documentUploadedAt');
    expect(dateUploaded[0]).toBe(format(new Date(), 'MM/dd/yyyy'));
  });
  test.skip('[BT-0010][AT-2008]add a document and download it', async () => {
    // we can't inspect the download document modal, a blocker to write this test
  });
  test.skip('[BT-0011][AT-2009]check result tab', async () => {

  });
  test('[BT-0016][AT-2011]add a new program and view it', async ({ newPatient, patientDetailsPage }) => {
    await patientDetailsPage.goToPatient(newPatient);
    const formPane = await patientDetailsPage.navigateToFormsTab();
    await formPane.waitForPageToLoad();
    await formPane.newFormButton.click();
    // Wait for navigation to select form page
    await patientDetailsPage.page.waitForLoadState('networkidle');
    
    // Get the select form page and wait for it to load
    const selectFormPage = new SelectFormPage(patientDetailsPage.page);
    await selectFormPage.waitForPageToLoad();
    
    // Select program and survey
    await selectFormPage.selectProgram('NCD Primary Screening');
    await selectFormPage.selectSurvey('CVD Primary Screening Form');
    await selectFormPage.clickBeginSurvey();
    
    // Wait for the form to load after beginning survey
    await patientDetailsPage.page.waitForLoadState('networkidle');
    
    // Fill the form by selecting first option for all questions and navigating through screens
    // Save the values that were entered
    const formPage = new FormPage(patientDetailsPage.page);
    const enteredValues = await formPage.fillFormWithFirstOptions();
    
    // Verify the form was submitted and we're back to the forms tab
    await patientDetailsPage.page.waitForLoadState('networkidle');
    await formPane.waitForPageToLoad();
    
    // Verify the form appears in the forms list
    const formsList = await getTableItems(formPane.page, 1, 'programName');
    expect(formsList[0]).toBe('NCD Primary Screening');
    
    // Click on the submitted form to view its response
    await formPane.tableRows.first().click();
    
    // Wait for the form response modal to open
    const formResponseModal = new FormResponseModal(patientDetailsPage.page);
    await formResponseModal.waitForModalToLoad();
    
    // Get the form response values from the modal
    const formResponseValues = await formResponseModal.getFormResponseValues();
    
    // Verify that the modal contains form response data
    expect(formResponseValues.length).toBeGreaterThan(0);
    
    // Validate entered values against form response values
    // Strategy 3: Match by answer value only (question labels may differ)
    const responseValues = new Set<string>();
    
    for (const row of formResponseValues) {
      if (row.value) {
        responseValues.add(row.value.trim().toLowerCase());
      }
    }
    
    // Check that entered answer values appear in the response
    let matchedCount = 0;
    for (const entered of enteredValues) {
      if (entered.answer) {
        const answerKey = entered.answer.trim().toLowerCase();
        
        // Match by answer value only - check if answer exists in response values
        const found = Array.from(responseValues).some(v => v.includes(answerKey) || answerKey.includes(v));
        if (found) {
          matchedCount++;
        }
      }
    }
    
    // Verify that at least some of our entered values were found in the response
    expect(enteredValues.length).toBeGreaterThan(0);
    expect(formResponseValues.length).toBeGreaterThan(0);
    expect(matchedCount).toBe(enteredValues.length);
    
    // Close the modal
    await formResponseModal.close();
  });
  test('[BT-0018][AT-2012]admit the patient to hospital', async ({ newPatient, patientDetailsPage }) => {
    await patientDetailsPage.goToPatient(newPatient);
    const formValues = await patientDetailsPage.admitToHospital();
    const encounterValues = await patientDetailsPage.encounterHistoryPane.getLatestEncounterValues();
    const sidebarPage = new SidebarPage(patientDetailsPage.page);
    expect(encounterValues.facilityName).toBe(await sidebarPage.getFacilityName());
    expect(encounterValues.area).toBe(formValues.area);
    expect(encounterValues.startDate).toBe(`${format(new Date(), 'MM/dd/yyyy')} – Current`);
  });
  test('[BT-0019][AT-2013]Change diet', async ({ newPatientWithHospitalAdmission, patientDetailsPage }) => { 
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.encounterHistoryPane.waitForSectionToLoad();
    const latestEncounter = await patientDetailsPage.encounterHistoryPane.getLatestEncounter();
    await latestEncounter.click();
    await patientDetailsPage.arrowDownIconMenuButton.click();
    await patientDetailsPage.changeEncounterDetailsMenu.changeDietMenuItem.click();
    const changeDietModal = patientDetailsPage.changeEncounterDetailsMenu.getChangeDietModal();
    await changeDietModal.waitForModalToLoad();
    const expectedDiet = 'Clear fluids';
    await changeDietModal.changeDiet(expectedDiet);
    await expect(patientDetailsPage.dietLabel).toContainText(expectedDiet);
  });
  test('[BT-0020][AT-2014]Change Location', async ({ newPatientWithHospitalAdmission, patientDetailsPage }) => {
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.encounterHistoryPane.waitForSectionToLoad();
    const latestEncounter = await patientDetailsPage.encounterHistoryPane.getLatestEncounter();
    await latestEncounter.click();
    await patientDetailsPage.arrowDownIconMenuButton.click();
    await patientDetailsPage.changeEncounterDetailsMenu.changeLocationMenuItem.click();
    const changeLocationModal = patientDetailsPage.changeEncounterDetailsMenu.getChangeLocationModal();
    await changeLocationModal.waitForModalToLoad();
    const expectedArea = 'Operating Theatre';
    const expectedLocation = 'Theatre 1';
    await changeLocationModal.changeArea(expectedArea);
    await changeLocationModal.changeLocation(expectedLocation);
    await changeLocationModal.confirmButton.click();
    await expect(patientDetailsPage.locationLabel).toHaveText(`${expectedArea}, ${expectedLocation}`);
  });
  test('[BT-0021][AT-2015]Add a primary diagnosis', async ({ newPatientWithHospitalAdmission, patientDetailsPage }) => {
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.encounterHistoryPane.waitForSectionToLoad();
    const latestEncounter = await patientDetailsPage.encounterHistoryPane.getLatestEncounter();
    await latestEncounter.click();
    await patientDetailsPage.addDiagnosisButton.click();
    const diagnosisModal = patientDetailsPage.getAddDiagnosisModal();
    await diagnosisModal.waitForModalToLoad();  
    expect(await diagnosisModal.dateInput.inputValue()).toBe(format(new Date(), 'yyyy-MM-dd'));
    expect(await diagnosisModal.clinicianInput.inputValue()).toBe(currentUserDisplayName);
    const formValues = await diagnosisModal.fillForm(true);
    await diagnosisModal.confirmButton.click();
    await expect(patientDetailsPage.diagnosisCategory.first()).toHaveText('P');
    await expect(patientDetailsPage.diagnosisName.first()).toHaveText(formValues.diagnosis);
  });
  test('[BT-0022][AT-2016]Add a not primary diagnosis', async ({ newPatientWithHospitalAdmission, patientDetailsPage }) => {
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.encounterHistoryPane.waitForSectionToLoad();
    const latestEncounter = await patientDetailsPage.encounterHistoryPane.getLatestEncounter();
    await latestEncounter.click();
    await patientDetailsPage.addDiagnosisButton.click();
    const diagnosisModal = patientDetailsPage.getAddDiagnosisModal();
    await diagnosisModal.waitForModalToLoad();
    const formValues = await diagnosisModal.fillForm(false);
    await diagnosisModal.confirmButton.click();
    await expect(patientDetailsPage.diagnosisCategory.first()).toHaveText('S');
    await expect(patientDetailsPage.diagnosisName.first()).toHaveText(formValues.diagnosis);
  });
  test('[BT-0023][AT-2017] Add a new task set', async ({newPatientWithHospitalAdmission, patientDetailsPage}) => {
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.encounterHistoryPane.waitForSectionToLoad();
    const latestEncounter = await patientDetailsPage.encounterHistoryPane.getLatestEncounter();
    await latestEncounter.click();
    await patientDetailsPage.waitForEncounterToBeReady();
    const tasksPane = await patientDetailsPage.navigateToTasksTab();
    await tasksPane.waitForPageToLoad();
    const notes = 'This is a test note';
    const taskName = 'Discharge preparation';
    await tasksPane.addTaskButton.click();
    const addTaskModal = tasksPane.getAddTaskModal();
    await addTaskModal.waitForModalToLoad();
    const formValues = await addTaskModal.fillForm({
      taskName: taskName,
      notes: notes,
    });
    await addTaskModal.confirmButton.click();
    await tasksPane.waitForNoDataContainerToDisappear();
    const note = await getTableItems(tasksPane.page, 2, 'note');
    expect(note[0]).toBe(notes);
    expect(note[1]).toBe(notes);
    const frequency = await getTableItems(tasksPane.page, 2, 'frequency');
    expect(frequency[0]).toBe('Once');
    expect(frequency[1]).toBe('Once');
    const assignedTo = await getTableItems(tasksPane.page, 2, 'assignedTo');
    expect(assignedTo[0]).toContain('Nurse');
    expect(assignedTo[0]).toContain('Intern');
    expect(assignedTo[1]).toBe('-');
    const dueAt = await getTableItems(tasksPane.page, 2, 'dueTime');
    const expectedDateTime = formatDateTimeForTable(formValues.dateTime);
    expect(dueAt[0]).toBe(expectedDateTime);
    expect(dueAt[1]).toBe(expectedDateTime);
    const taskNameValue = await getTableItems(tasksPane.page, 2, 'name');
    expect(taskNameValue[0]).toBe('Contact patient family/caretaker');
    expect(taskNameValue[1]).toBe('Patient preparation: Discharge');
  }); 
  test('[BT-0024][AT-2018] Add a new repeating task', async ({newPatientWithHospitalAdmission, patientDetailsPage}) => {
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.encounterHistoryPane.waitForSectionToLoad();
    const latestEncounter = await patientDetailsPage.encounterHistoryPane.getLatestEncounter();
    await latestEncounter.click();
    await patientDetailsPage.waitForEncounterToBeReady();
    const tasksPane = await patientDetailsPage.navigateToTasksTab();
    await tasksPane.waitForPageToLoad();
    const notes = 'This is a test note';
    const taskName = 'Phone order: Labs';
    const frequencyValue = 1;
    const frequencyUnit = 'day (s)';
    const durationValue = 2;
    const durationUnit = 'day (s)';
    const highPriority = true;
    const assignedTo = 'Doctor';
    await tasksPane.addTaskButton.click();
    const addTaskModal = tasksPane.getAddTaskModal();
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
    await tasksPane.waitForNoDataContainerToDisappear();
    const rowCount = await tasksPane.getRowCount();
    expect(rowCount).toBe(1);
    const note = await getTableItems(tasksPane.page, 1, 'note');
    expect(note[0]).toBe(notes);
    const frequency = await getTableItems(tasksPane.page, 1, 'frequency');
    expect(frequency[0]).toBe('1 day');
    await expect(tasksPane.priorityIcon.first()).toBeVisible();
    const assignedToValue = await getTableItems(tasksPane.page, 1, 'assignedTo');
    expect(assignedToValue[0]).toBe(assignedTo);
    const dueAt = await getTableItems(tasksPane.page, 1, 'dueTime');
    const expectedDateTime = formatDateTimeForTable(formValues.dateTime);
    expect(dueAt[0]).toBe(expectedDateTime);
  });
  test('[BT-0025][AT-2019] Mark a task as completed', async ({newPatientWithHospitalAdmission, patientDetailsPage}) => {
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.encounterHistoryPane.waitForSectionToLoad();
    const latestEncounter = await patientDetailsPage.encounterHistoryPane.getLatestEncounter();
    await latestEncounter.click();
    await patientDetailsPage.waitForEncounterToBeReady();
    const tasksPane = await patientDetailsPage.navigateToTasksTab();
    await tasksPane.waitForPageToLoad();
    await tasksPane.addTaskButton.click();
    const addTaskModal = tasksPane.getAddTaskModal();
    await addTaskModal.waitForModalToLoad();
    const taskName = 'Contact patient family/caretaker';
    await addTaskModal.fillForm({
      taskName: taskName,
    });
    await addTaskModal.confirmButton.click();
    await tasksPane.waitForNoDataContainerToDisappear();
    const rowCount = await tasksPane.getRowCount();
    expect(rowCount).toBe(1);
    const taskNameValue = await getTableItems(tasksPane.page, 1, 'name');
    expect(taskNameValue[0]).toBe(taskName);
    await tasksPane.tableRows.first().hover();
    await tasksPane.markAsCompletedButton.click();
    const markAsCompletedModal = tasksPane.getMarkAsCompletedModal();
    await markAsCompletedModal.waitForModalToLoad();
    const notes = 'Mark as completed test note';
    await markAsCompletedModal.fillForm({
      notes: notes,
    });
    await markAsCompletedModal.confirmButton.click();
    await tasksPane.showCompletedTasksCheck.check();
    expect(await tasksPane.tableRows.count()).toBe(1);
  });
  test('[BT-0026][AT-2020] Mark a task as not completed', async ({newPatientWithHospitalAdmission, patientDetailsPage}) => {
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.encounterHistoryPane.waitForSectionToLoad();
    const latestEncounter = await patientDetailsPage.encounterHistoryPane.getLatestEncounter();
    await latestEncounter.click();
    await patientDetailsPage.waitForEncounterToBeReady();
    const tasksPane = await patientDetailsPage.navigateToTasksTab();
    await tasksPane.waitForPageToLoad();
    await tasksPane.addTaskButton.click();
    const addTaskModal = tasksPane.getAddTaskModal();
    await addTaskModal.waitForModalToLoad();
    const taskName = 'Contact patient family/caretaker';
    await addTaskModal.fillForm({
      taskName: taskName,
    });
    await addTaskModal.confirmButton.click();
    await tasksPane.waitForNoDataContainerToDisappear();
    const rowCount = await tasksPane.getRowCount();
    expect(rowCount).toBe(1);
    const taskNameValue = await getTableItems(tasksPane.page, 1, 'name');
    expect(taskNameValue[0]).toBe(taskName);
    await tasksPane.tableRows.first().hover();
    await tasksPane.markAsNotCompletedButton.click();
    const markAsNotCompletedModal = tasksPane.getMarkAsNotCompletedModal();
    await markAsNotCompletedModal.waitForModalToLoad();
    const reasonNotCompleted = 'Other';
    await markAsNotCompletedModal.fillForm({
      reasonNotCompleted: reasonNotCompleted,
    });
    await markAsNotCompletedModal.confirmButton.click();
    await tasksPane.showNotCompletedTasksCheck.check();
    expect(await tasksPane.tableRows.count()).toBe(1);

  });
  test('[BT-0027][AT-2021] Delete a task', async ({newPatientWithHospitalAdmission, patientDetailsPage}) => {
      await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.encounterHistoryPane.waitForSectionToLoad();
    const latestEncounter = await patientDetailsPage.encounterHistoryPane.getLatestEncounter();
    await latestEncounter.click();
    await patientDetailsPage.waitForEncounterToBeReady();
    const tasksPane = await patientDetailsPage.navigateToTasksTab();
    await tasksPane.waitForPageToLoad();
    await tasksPane.addTaskButton.click();
    const addTaskModal = tasksPane.getAddTaskModal();
    await addTaskModal.waitForModalToLoad();
    const taskName = 'Contact patient family/caretaker';
    await addTaskModal.fillForm({
      taskName: taskName,
    });
    await addTaskModal.confirmButton.click();
    await tasksPane.waitForNoDataContainerToDisappear();
    const rowCount = await tasksPane.getRowCount();
    expect(rowCount).toBe(1);
    await tasksPane.tableRows.first().hover();
    await tasksPane.deleteTaskButton.click();
    const deleteTaskModal = tasksPane.getDeleteTaskModal();
    await deleteTaskModal.waitForModalToLoad();
    await deleteTaskModal.confirmButton.click();
    await tasksPane.waitForPageToLoad();
    await expect( tasksPane.noDataContainer).toHaveText('No patient tasks to display. Please try adjusting filters or click ‘+ New task’ to add a task to this patient.');
  });
  
  test('[BT-0028][AT-2022] Record a simple chart and validate', async ({newPatientWithHospitalAdmission, patientDetailsPage}) => {
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.encounterHistoryPane.waitForSectionToLoad();
    const latestEncounter = await patientDetailsPage.encounterHistoryPane.getLatestEncounter();
    await latestEncounter.click();
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
    const chartValues = await chartsPane.getLatestValuesFromChartsTable(chartsPane.page, CHARTING_FIELD_KEYS);
    expect(chartValues).toEqual(formValues);
  });
  test('[BT-0030][AT-2023] Record death on patient via UI', async ({
    newPatient,
    patientDetailsPage,
  }) => {
    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.page.waitForLoadState('networkidle');

    // Step 1: Click "Record death" link
    await patientDetailsPage.clickRecordDeath();

    // Step 2: Get death modal page object and wait for it to load
    const deathModal = patientDetailsPage.getDeathModal();
    await deathModal.waitForModalToLoad();
    await expect(deathModal.deathForm).toBeVisible();

    // Step 3: Use "Save and close" for partial workflow (only requires timeOfDeath and clinicianId)
    // These fields are typically pre-filled, so we can proceed directly
    await deathModal.clickSaveAndClose();
    await deathModal.confirmOnSummaryScreen();

    // Step 5: Wait for modal to close and page to reload
    await deathModal.waitForModalToClose();
    await expect(deathModal.deathForm).not.toBeVisible();
    await patientDetailsPage.page.waitForLoadState('networkidle');

    // Step 6: Verify "Revert death record" link appears
    await patientDetailsPage.waitForRevertDeathLink();
    await expect(patientDetailsPage.revertDeathLink).toBeVisible();
  });
  test('[BT-0026][AT-2024] Discharge a patient', async ({
    newPatientWithHospitalAdmission,
    patientDetailsPage,
  }) => {
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.encounterHistoryPane.waitForSectionToLoad();
    const latestEncounter = await patientDetailsPage.encounterHistoryPane.getLatestEncounter();
    await latestEncounter.click();

    // Step 1: Click "Prepare discharge" button
    await expect(patientDetailsPage.prepareDischargeButton).toBeVisible();
    await patientDetailsPage.prepareDischargeButton.click();

    // Step 2: Get prepare discharge modal and wait for it to load
    const prepareDischargeModal = patientDetailsPage.getPrepareDischargeModal();
    await prepareDischargeModal.waitForModalToLoad();

    // Step 3: Fill discharge note
    const dischargeNote = 'Patient discharged after successful treatment. Follow-up appointment scheduled.';
    await prepareDischargeModal.dischargeNoteTextarea.fill(dischargeNote);

    // Step 4: Confirm discharge
    await prepareDischargeModal.finaliseDischargeButton.click();
    prepareDischargeModal.confirmButton.click();


    // Step 5: Wait for modal to close and page to reload
    await prepareDischargeModal.waitForModalToClose();
    
    const encounterValues = await patientDetailsPage.encounterHistoryPane.getLatestEncounterValues();
    expect(encounterValues.startDate).not.toContain('Current');
    expect(encounterValues.startDate).toMatch(/\d{2}\/\d{2}\/\d{4} – \d{2}\/\d{2}\/\d{4}/);
    const latestEncounter2 = await patientDetailsPage.encounterHistoryPane.getLatestEncounter();
    await latestEncounter2.click();
    await expect(patientDetailsPage.prepareDischargeButton).not.toBeVisible();
  });
  test('[BT-0015][AT-2010] Add a new referral', async ({newPatient, patientDetailsPage}) => {
    await patientDetailsPage.goToPatient(newPatient);
    const referralPane = await patientDetailsPage.navigateToReferralsTab();
    await referralPane.waitForPageToLoad();
    await referralPane.addReferralButton.click();
    const addReferralModal = referralPane.getAddReferralModal();
    await addReferralModal.waitForModalToLoad();
    const referralType = 'CVD Primary Screening Referral';
    await addReferralModal.selectSurvey(referralType);
    await addReferralModal.waitForFormFieldsToBeVisible();
    const formValues = await addReferralModal.fillCVDPrimaryScreeningForm({
      referralDate: format(new Date(), 'yyyy-MM-dd'),
      referralReason: 'Reason for referral',
      relevantScreeningHistory: false
    });
    await addReferralModal.nextButton.click();
    await addReferralModal.completeReferralButton.click();
    await referralPane.waitForPageToLoad();
    const referralDate = await getTableItems(referralPane.page, 1, 'date');
    expect(referralDate[0]).toBe(format(new Date(formValues.referralDate), 'MM/dd/yyyy'));
    const referralTypeValue = await getTableItems(referralPane.page, 1, 'referralType');
    expect(referralTypeValue[0]).toBe(referralType);
    const referralCompletedBy = await getTableItems(referralPane.page, 1, 'referredBy');
    expect(referralCompletedBy[0]).toBe(formValues.referralCompletedBy);
    const referralStatus = await getTableItems(referralPane.page, 1, 'status');
    expect(referralStatus[0]).toBe('Pending');
  });
  test('[BT-0034][AT-2025] delete a added program response', async ({newPatient, patientDetailsPage}) => {
    await patientDetailsPage.goToPatient(newPatient);
    const programPane = await patientDetailsPage.navigateToFormsTab();
    await programPane.waitForPageToLoad();
    await programPane.newFormButton.click();
    const selectFormPage = new SelectFormPage(patientDetailsPage.page);
    await selectFormPage.waitForPageToLoad();
    await selectFormPage.selectProgram('CVD Primary Screening');
    await selectFormPage.selectSurvey('CVD Primary Screening Form');
    await selectFormPage.clickBeginSurvey();
    const formPage = new FormPage(patientDetailsPage.page);
     await formPage.fillFormWithFirstOptions();
    await programPane.waitForPageToLoad();
    await programPane.getActionMenuButton(0).click();
    await programPane.deleteButton.click();
    const deleteProgramResponseModal = new DeleteProgramResponseModal(patientDetailsPage.page);
    await deleteProgramResponseModal.waitForModalToLoad();
    await deleteProgramResponseModal.confirmButton.click();
    await programPane.waitForPageToLoad();
    await expect(programPane.tableRows.first()).toHaveText('No program responses found');
  });
    });
