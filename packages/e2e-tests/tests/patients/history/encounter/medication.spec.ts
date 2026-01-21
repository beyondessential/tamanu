import { test, expect } from '../../../../fixtures/baseFixture';
import { format } from 'date-fns';
import { MedicationFormData } from '../../../../pages/patients/MedicationsPage/modals/MedicationModal';


test.describe('Medication Feature ', () => {
  
  test.beforeEach(async ({ patientDetailsPage, newPatientWithHospitalAdmission }) => {
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission);
    await patientDetailsPage.waitForEncounterToBeReady();
  });

  test.describe('Prescribe Medication - Required Fields', () => {
test('should prescribe medication with required fields only', async ({ patientDetailsPage }) => {
      const medicationPane = await patientDetailsPage.navigateToMedicationTab();
      const medicationData: MedicationFormData = {
        medicationName: 'Aciclovir 800mg Tablets',
        doseAmount: '500',
        units: 'g',
        frequency: 'Daily (D)',
        route: 'Oral',
        date: format(new Date(), 'yyyy-MM-dd'),
        startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        prescriberName: 'Initial Admin',
      };

      await medicationPane.prescribeMedication(medicationData);

      await medicationPane.waitForMedicationToAppearInTable();
      const medicationCount = await medicationPane.getMedicationCount();
      expect(medicationCount).toBe(1);

      await medicationPane.validateMedicationInTable('Aciclovir');
      // Note: frequency "Daily (D)" is displayed as "Daily" in table
      await medicationPane.validateMedicationDetails('Aciclovir', '500 g', 'Daily', 'Oral');
    });
   
  });

  test.describe('Prescribe Medication - All Fields', () => {
    test('should prescribe medication with all fields including duration', async ({
      patientDetailsPage,
    }) => {
      const medicationPane = await patientDetailsPage.navigateToMedicationTab();

      const medicationData: MedicationFormData = {
        medicationName: 'Aciclovir 400mg Tablets',
        doseAmount: '250',
        units: 'Disc',
        frequency: 'Daily (D)',
        route: 'Oral',
        date: format(new Date(), 'yyyy-MM-dd'),
        startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        durationValue: '7',
        durationUnit: 'day (s)',
        prescriberName: 'Admin ICT',
        indication: 'Upper respiratory infection',
        notes: 'Take with food',
        isOngoing: false,
        quantity: '10',
      };

      await medicationPane.prescribeMedication(medicationData);

      await medicationPane.waitForMedicationToAppearInTable();
      await medicationPane.validateMedicationInTable('Aciclovir');
      // Note: frequency "Daily (D)" is displayed as "Daily" in table
      await medicationPane.validateMedicationDetails('Aciclovir', '250', 'Daily', 'Oral');
    });

    test('should prescribe ongoing medication with checkbox selected', async ({
      patientDetailsPage,
    }) => {
      const medicationPane = await patientDetailsPage.navigateToMedicationTab();

      const medicationData: MedicationFormData = {
        medicationName: 'Aciclovir 800mg Tablets',
        doseAmount: '100',
        units: 'g',
        frequency: 'Daily (D)',
        route: 'Oral',
        date: format(new Date(), 'yyyy-MM-dd'),
        startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        prescriberName: 'Admin ICT',
        isOngoing: true,
        notes: 'For cardiovascular protection',
      };

      await medicationPane.prescribeMedication(medicationData);
      await medicationPane.waitForMedicationToAppearInTable();

      await medicationPane.validateMedicationInTable('Aciclovir');
      await medicationPane.validateMedicationDetails('Aciclovir', '100 g', 'Daily', 'Oral');
    });

    test('should prescribe PRN (as needed) medication', async ({ patientDetailsPage }) => {
      const medicationPane = await patientDetailsPage.navigateToMedicationTab();

      const medicationData: MedicationFormData = {
        medicationName: 'Aciclovir 800mg Tablets',
        doseAmount: '400',
        units: 'g',
        frequency: 'Daily at night (nocte)',
        route: 'Oral',
        date: format(new Date(), 'yyyy-MM-dd'),
        startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        prescriberName: 'Admin ICT',
        isPrn: true,
        notes: 'Take as needed for pain',
      };

      await medicationPane.prescribeMedication(medicationData);
      await medicationPane.waitForMedicationToAppearInTable();

      await medicationPane.validateMedicationInTable('Aciclovir');
    });

    test('should prescribe medication with variable dose checkbox', async ({ patientDetailsPage }) => {
      const medicationPane = await patientDetailsPage.navigateToMedicationTab();

      const medicationData: MedicationFormData = {
        medicationName: 'Aciclovir 800mg Tablets',
        doseAmount: '10',
        units: 'g',
        frequency: 'Daily (D)',
        route: 'Oral',
        date: format(new Date(), 'yyyy-MM-dd'),
        startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        prescriberName: 'Admin ICT',
        isVariableDose: true,
        notes: 'Dose varies based on INR results',
      };

      await medicationPane.prescribeMedication(medicationData);
      await medicationPane.waitForMedicationToAppearInTable();

      await medicationPane.validateMedicationInTable('Aciclovir');
    });
  });

  test.describe('Medication Modal Interactions', () => {
    test('should cancel medication prescription without saving', async ({ patientDetailsPage }) => {
      const medicationPane = await patientDetailsPage.navigateToMedicationTab();
      const initialCount = await medicationPane.getMedicationCount();

      const modal = await medicationPane.clickNewPrescription();
      await modal.continueButton.click();
      await modal.cancel();

      await medicationPane.waitForPaneToLoad();
      const finalCount = await medicationPane.getMedicationCount();
      expect(finalCount).toBe(initialCount);
    });

    test('should display all medication form fields in modal', async ({ patientDetailsPage }) => {
      const medicationPane = await patientDetailsPage.navigateToMedicationTab();
      const modal = await medicationPane.clickNewPrescription();
      await expect(modal.continueButton).toBeVisible();
      await modal.continueButton.click();

      await expect(modal.medicationInput).toBeVisible();
      await expect(modal.doseAmountInput).toBeVisible();
      await expect(modal.unitsSelect).toBeVisible();
      await expect(modal.frequencyInput).toBeVisible();
      await expect(modal.routeSelect).toBeVisible();
      await expect(modal.dateInput).toBeVisible();
      await expect(modal.startDateInput).toBeVisible();
      await expect(modal.prescriberInput).toBeVisible();
      await expect(modal.finaliseButton).toBeVisible();
      await expect(modal.cancelButton).toBeVisible();
    });

    /**
     * Test: Finalise and print medication
     * Validates print button (data-testid: medication-button-finaliseAndPrint-8v2q)
     */
    test('should finalise and print medication prescription', async ({ patientDetailsPage }) => {
      // Arrange
      const medicationPane = await patientDetailsPage.navigateToMedicationTab();

      const medicationData: MedicationFormData = {
        medicationName: 'Aciclovir 800mg Tablets',
        doseAmount: '500',
        units: 'g',
        frequency: 'Daily (D)',
        route: 'Oral',
        date: format(new Date(), 'yyyy-MM-dd'),
        startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        prescriberName: 'Admin ICT',
      };

 
      // Act: Prescribe with print option
      const modal = await medicationPane.clickNewPrescription();
      await modal.fillMedicationForm(medicationData);
      await modal.submitForm(true); // true = print option

      // Assert: Verify medication was added
      await medicationPane.waitForMedicationToAppearInTable();
      const count = await medicationPane.getMedicationCount();
      expect(count).toBe(1);
        

      // Verify medication appears in table
      await medicationPane.validateMedicationInTable('Aciclovir');

    });
  });

  test.describe('Medication Table Functionality', () => {
    test('should display all medication table headers', async ({ patientDetailsPage }) => {
      const medicationPane = await patientDetailsPage.navigateToMedicationTab();

      await expect(medicationPane.medicationSortHeader).toBeAttached();
      await expect(medicationPane.doseHeader).toBeAttached();
      await expect(medicationPane.frequencyHeader).toBeAttached();
      await expect(medicationPane.routeSortHeader).toBeAttached();
      await expect(medicationPane.dateSortHeader).toBeAttached();
      await expect(medicationPane.prescriberSortHeader).toBeAttached();
      await expect(medicationPane.lastOrderedHeader).toBeAttached();
    });

    test('should sort medications by medication name', async ({ patientDetailsPage }) => {
      const medicationPane = await patientDetailsPage.navigateToMedicationTab();
      await medicationPane.prescribeMedication({
        medicationName: 'Aciclovir 800mg Tablets',
        doseAmount: '10',
        units: 'g',
        frequency: 'Daily (D)',
        route: 'Oral',
        date: format(new Date(), 'yyyy-MM-dd'),
        startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        prescriberName: 'Admin ICT',
      });
      await medicationPane.waitForPaneToLoad();

      await medicationPane.prescribeMedication({
        medicationName: 'Amitriptyline 25mg Tablets',
        doseAmount: '100',
        units: 'Disc',
        frequency: 'Daily (D)',
        route: 'Oral',
        date: format(new Date(), 'yyyy-MM-dd'),
        startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        prescriberName: 'Admin ICT',
      });

      await medicationPane.waitForPaneToLoad();
      await medicationPane.waitForMedicationToAppearInTable();

      await medicationPane.sortByMedication();
      await medicationPane.waitForPaneToLoad();

      const rows = await medicationPane.getMedicationTableRows();
      const firstRow = rows.first();
      const firstMedication = await firstRow.locator('td').first().textContent();
      expect(firstMedication).toContain('Amitriptyline 25mg Tablets');
    });

    test('should sort medications by route', async ({ patientDetailsPage }) => {
      const medicationPane = await patientDetailsPage.navigateToMedicationTab();
      await medicationPane.prescribeMedication({
        medicationName: 'Aciclovir 800mg Tablets',
        doseAmount: '500',
        units: 'g',
        frequency: 'Three times daily (TID)',
        route: 'Oral',
        date: format(new Date(), 'yyyy-MM-dd'),
        startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        prescriberName: 'Admin ICT',
      });

      await medicationPane.prescribeMedication({
        medicationName: 'Amitriptyline 25mg Tablets',
        doseAmount: '10',
        units: '%',
        frequency: 'Daily (D)',
        route: 'Eye',
        date: format(new Date(), 'yyyy-MM-dd'),
        startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        prescriberName: 'Admin ICT',
      });

      await medicationPane.waitForMedicationToAppearInTable();
      await medicationPane.waitForPaneToLoad();

      await medicationPane.sortByRoute();
      await medicationPane.waitForPaneToLoad();

      const rows = await medicationPane.getMedicationTableRows();
      const firstRow = rows.first();
      const firstMedication = await firstRow.locator('td').first().textContent();
      expect(firstMedication).toContain('Aciclovir');
      expect(await rows.count()).toBeGreaterThanOrEqual(2);
    });

    test('should display multiple medications in table', async ({ patientDetailsPage }) => {
      test.setTimeout(60000);
      const medicationPane = await patientDetailsPage.navigateToMedicationTab();
      const medications = [
        {
          medicationName: 'Aciclovir 800mg Tablets',
          doseAmount: '500',
          units: 'g',
          frequency: 'Daily at night (nocte)',
          route: 'Oral',
          prescriberName: 'Initial Admin',
        },
        {
          medicationName: 'Amitriptyline 25mg Tablets',
          doseAmount: '400',
          units: 'g',
          frequency: 'Daily (D)',
          route: 'Oral',
          prescriberName: 'Initial Admin',
        },
        {
          medicationName: 'Anastrozole 1mg Tablets',
          doseAmount: '250',
          units: 'g',
          frequency: 'Daily (D)',
          route: 'Oral',  
          prescriberName: 'Initial Admin',
        },  
      ];

      for (const med of medications) {
        await medicationPane.prescribeMedication({
          ...med,
          date: format(new Date(), 'yyyy-MM-dd'),
          startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
          prescriberName: 'Initial Admin',
        });
        await medicationPane.waitForPaneToLoad();
      }
      await medicationPane.waitForMedicationToAppearInTable();
      await medicationPane.page.waitForTimeout(5000);

      const finalCount = await medicationPane.getMedicationCount();
      expect(finalCount).toBe(medications.length);

      await medicationPane.validateMedicationInTable('Aciclovir');
      await medicationPane.validateMedicationInTable('Amitriptyline');
      await medicationPane.validateMedicationInTable('Anastrozole');
    });
  });

  test.describe('Medication Action Buttons', () => {
    test('should display all medication action buttons', async ({ patientDetailsPage }) => {
      const medicationPane = await patientDetailsPage.navigateToMedicationTab();

      const medicationData: MedicationFormData = {
        medicationName: 'Aciclovir 800mg Tablets',
        doseAmount: '500',
        units: 'g',
        frequency: 'Daily (D)',
        route: 'Oral',
        date: format(new Date(), 'yyyy-MM-dd'),
        startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        prescriberName: 'Initial Admin',
      };
      await medicationPane.prescribeMedication(medicationData);

      await medicationPane.waitForMedicationToAppearInTable();

      await expect(medicationPane.shoppingCartButton).toBeVisible();
      await expect(medicationPane.shoppingCartButton).toBeEnabled();
      await expect(medicationPane.medicationAdminRecordButton).toBeVisible();
      await expect(medicationPane.medicationAdminRecordButton).toBeEnabled();
      await expect(medicationPane.newPrescriptionButton).toBeVisible();
      await expect(medicationPane.newPrescriptionButton).toBeEnabled();
    });

  });

  test.describe('Medication Form Validation', () => {
    test('should have all form fields accessible via data-testid', async ({ patientDetailsPage }) => {
      const medicationPane = await patientDetailsPage.navigateToMedicationTab();
      const modal = await medicationPane.clickNewPrescription();
      await modal.continueButton.click();

      const fieldsToVerify = [
        { locator: modal.medicationInput, name: 'medication' },
        { locator: modal.doseAmountInput, name: 'dose amount' },
        { locator: modal.unitsSelect, name: 'units' },
        { locator: modal.frequencyInput, name: 'frequency' },
        { locator: modal.routeSelect, name: 'route' },
        { locator: modal.dateInput, name: 'date' },
        { locator: modal.startDateInput, name: 'start date' },
        { locator: modal.prescriberInput, name: 'prescriber' },
        { locator: modal.indicationInput, name: 'indication' },
        { locator: modal.notesTextarea, name: 'notes' },
        { locator: modal.isOngoingCheckbox, name: 'ongoing checkbox' },
        { locator: modal.isPrnCheckbox, name: 'PRN checkbox' },
        { locator: modal.isVariableDoseCheckbox, name: 'variable dose checkbox' },
      ];

      for (const field of fieldsToVerify) {
        await expect(field.locator).toBeVisible({ timeout: 5000 });
      }
    });
  });
});

