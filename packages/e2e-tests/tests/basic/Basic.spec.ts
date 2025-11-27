import { EmergencyPatientsPage } from '@pages/patients/EmergencyPatientsPage';
import { test } from '../../fixtures/baseFixture';
import { expect } from '@playwright/test';
import { assertRecentDateTime, convertDateFormat, getTableItems } from '@utils/testHelper';
import { VitalsPage } from '@pages/patients/VitalsPage/panes/VitalsPage';
import { generateNHN } from '@utils/generateNewPatient';
import type { PatientDetails } from '@pages/patients/PatientDetailsPage/panes/PatientDetailsTabPage';
import { RecentlyViewedPatientsList } from '@pages/patients/RecentlyViewedPatientsList';
import { ImagingRequestPane } from '@pages/patients/ImagingRequestPage/panes/ImagingRequestPane';
import { getUser } from '@utils/apiHelpers';
import { format } from 'date-fns';
import { SidebarPage } from '@pages/SidebarPage';

test.setTimeout(100000);

    test.describe('Basic tests', () => {

    test('[BT-0003][AT-2001]Admit the patient to Triage without adding vitals', async ({ newPatient, patientDetailsPage }) => {
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

    test('[BT-0008][AT-2005]Create and verify new imaging request in imaging request table', async ({ newPatientWithHospitalAdmission, patientDetailsPage, api }) => {
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
      const currentUser = await getUser(api);
      const currentUserDisplayName = currentUser.displayName;
      expect(defaultRequestingClinician).toBe(currentUserDisplayName);
      const supervisingClinician = await newImagingRequestModal.supervisingClinicianInput.inputValue();
      expect(supervisingClinician).toBe(currentUserDisplayName);

      const formValues = await newImagingRequestModal.fillForm({
        areasToBeImaged: 'Head',
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
  test.skip('[BT-0010][AT-2007]add a document and view it', async () => {});
  test.skip('[BT-0010][AT-2008]add a document and download it', async () => {});
  test.skip('[BT-0011][AT-2009]check result tab', async () => {});
  test.skip('[BT-0015][AT-2010]add a new referral and view it', async () => {});
  test.skip('[BT-0016][AT-2011]add a new program and view it', async () => {});
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
    await patientDetailsPage.encounterHistoryPane.getLatestEncounter().click();
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
    await patientDetailsPage.encounterHistoryPane.getLatestEncounter().click();
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
});
