import { EmergencyPatientsPage } from '@pages/patients/EmergencyPatientsPage';
import { test } from '../../fixtures/baseFixture';
import { expect } from '@playwright/test';
import { convertDateFormat, getTableItems } from '@utils/testHelper';
import { VitalsPage } from '@pages/patients/VitalsPage/panes/VitalsPage';
import { generateNHN } from '@utils/generateNewPatient';
import type { PatientDetails } from '@pages/patients/PatientDetailsPage/panes/PatientDetailsTabPage';
import { RecentlyViewedPatientsList } from '@pages/patients/RecentlyViewedPatientsList';
import { ImagingRequestPane } from '@pages/patients/ImagingRequestPage/panes/ImagingRequestPane';
import { getUser } from '@utils/apiHelpers';
import { format } from 'date-fns';

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
        // ventilatorMode: '10', // Skipped - not filled properly or displays empty
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
        selectFirstOption: true,
      };
    const formValues = await patientDetailsTabPage.updatePatientDetailsFields(patientDetails, newPatient);
    await patientDetailsTabPage.saveButton.click();
     const allPatientsPage=await patientDetailsPage.navigateToAllPatientsPage();
     await allPatientsPage.waitForPageToLoad();
     await allPatientsPage.recentlyViewedPatientsList.waitForFirstRecentlyViewedPatientToHaveNHN(nhn);
     await expect(allPatientsPage.recentlyViewedPatientsList.firstRecentlyViewedNHN).toHaveText(nhn);
     await expect(allPatientsPage.recentlyViewedPatientsList.firstRecentlyViewedName).toHaveText(`${patientDetails.firstName} ${patientDetails.lastName}`);
    if (newPatient.sex === 'male') {
      await expect(allPatientsPage.recentlyViewedPatientsList.firstRecentlyViewedGender).toHaveText('Female');
    } else {
      await expect(allPatientsPage.recentlyViewedPatientsList.firstRecentlyViewedGender).toHaveText('Male');
    }
     await expect(allPatientsPage.recentlyViewedPatientsList.firstRecentlyViewedBirthDate).toHaveText(
       RecentlyViewedPatientsList.formatDateForRecentlyViewed(patientDetails.dateOfBirth as string),
     );
     await allPatientsPage.recentlyViewedPatientsList.firstRecentlyViewedName.click();
     await expect(patientDetailsPage.healthIdText).toHaveText(nhn);
     const patientDetailsTabPage2 = await patientDetailsPage.navigateToPatientDetailsTab();
     await patientDetailsTabPage2.waitForSectionToLoad();
     expect(patientDetails.firstName).toBeDefined();
     expect(patientDetails.lastName).toBeDefined();
     expect(patientDetails.dateOfBirth).toBeDefined();
     expect(patientDetails.email).toBeDefined();
     expect(patientDetails.birthCertificate).toBeDefined();
     expect(patientDetails.drivingLicense).toBeDefined();
     expect(patientDetails.passport).toBeDefined();

     await expect(patientDetailsTabPage2.firstNameInput).toHaveValue(patientDetails.firstName as string);
     await expect(patientDetailsTabPage2.lastNameInput).toHaveValue(patientDetails.lastName as string);
     await expect(patientDetailsTabPage2.dateOfBirthInput.locator('input')).toHaveValue('1990-01-01');
     if (newPatient.sex === 'male') {
      await expect(patientDetailsTabPage2.sexFemaleRadio).toBeChecked();
    } else {
      await expect(patientDetailsTabPage2.sexMaleRadio).toBeChecked();
    }
     await expect(patientDetailsTabPage2.emailInput).toHaveValue(patientDetails.email as string);
     await expect(patientDetailsTabPage2.nationalHealthNumberInput).toHaveValue(nhn);
     await patientDetailsTabPage2.page.reload();
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

      const currentDateTime = format(new Date(), 'yyyy-MM-dd\'T\'HH:mm');
      await expect(newImagingRequestModal.orderDateTimeInput).toHaveValue(currentDateTime);

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
       expect(imagingType).toContain(formValues.imagingRequestType);
       const requestId = await getTableItems(imagingRequestPane.page, 1, 'displayId');
       expect(requestId).toContain(imagingRequestCode);
       const requestedAtTime = await getTableItems(imagingRequestPane.page, 1, 'requestedDate');
       expect(requestedAtTime).toContain(format(new Date(), 'MM/dd/yyyy'));
       const requestedBy = await getTableItems(imagingRequestPane.page, 1, 'requestedBy.displayName');
       expect(requestedBy).toContain(formValues.requestingClinician);
       const priority = await getTableItems(imagingRequestPane.page, 1, 'priority');
       expect(priority).toContain(formValues.priority);
       const status = await getTableItems(imagingRequestPane.page, 1, 'status');
       expect(status).toContain('Pending');
    })

    });
