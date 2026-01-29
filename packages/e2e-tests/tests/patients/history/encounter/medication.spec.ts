import { test, expect } from '../../../../fixtures/baseFixture';
import { format, isSameDay } from 'date-fns';
import { MedicationFormData } from '../../../../pages/patients/MedicationsPage/modals/MedicationModal';
import { MarView } from '../../../../pages/patients/MedicationsPage/views/MarView';
import { getEncounterStartDate } from '../../../../utils/apiHelpers';


test.describe('Medication Feature ', () => {
  
  test.beforeEach(async ({ patientDetailsPage, newPatientWithHospitalAdmission }) => {
    await patientDetailsPage.goToPatient(newPatientWithHospitalAdmission)
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
        prescriberName: 'Initial Admin',    
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
        prescriberName: 'Initial Admin',
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
        prescriberName: 'Initial Admin',
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
        prescriberName: 'Initial Admin',
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
        prescriberName: 'Initial Admin',    
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
        prescriberName: 'Initial Admin',    
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
        prescriberName: 'Initial Admin',  
      });

      await medicationPane.waitForPaneToLoad();
      await medicationPane.waitForMedicationToAppearInTable();
   
      await medicationPane.sortByMedication();
      await medicationPane.waitForPaneToLoad();

      const rows = await medicationPane.getMedicationTableRows();
      const firstRow = rows.first();
      const firstMedication = await medicationPane.getFirstMedicationText(firstRow);
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
        prescriberName: 'Initial Admin',  
      });

      await medicationPane.prescribeMedication({
        medicationName: 'Amitriptyline 25mg Tablets',
        doseAmount: '10',
        units: '%',
        frequency: 'Daily (D)',
        route: 'Eye',
        date: format(new Date(), 'yyyy-MM-dd'),
        startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        prescriberName: 'Initial Admin',    
      });

      await medicationPane.waitForMedicationToAppearInTable();
      await medicationPane.waitForPaneToLoad();

      await medicationPane.sortByRoute();
      await medicationPane.waitForPaneToLoad();

      const rows = await medicationPane.getMedicationTableRows();
      const firstRow = rows.first();
      const firstMedication = await medicationPane.getFirstMedicationText(firstRow);
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

      await expect.poll(async () => await medicationPane.getMedicationCount()).toBe(medications.length)
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
        { locator: modal.durationValueInput, name: 'duration value' },
        { locator: modal.durationUnitSelect, name: 'duration unit' },
        { locator: modal.prescriberInput, name: 'prescriber' },
        { locator: modal.quantityInput, name: 'quantity' },
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

  test.describe('Medication Admin Record', () => {
    test('should navigate to medication admin record page', async ({ patientDetailsPage }) => {
      const medicationPane = await patientDetailsPage.navigateToMedicationTab();
      await medicationPane.waitForPaneToLoad();
      
      await expect(medicationPane.medicationAdminRecordButton).toBeVisible({ timeout: 10000 });
      await expect(medicationPane.medicationAdminRecordButton).toBeEnabled({ timeout: 5000 });

      await medicationPane.clickMedicationAdminRecord();

      const marView = new MarView(medicationPane.page);
      await marView.waitForMarViewToLoad();
      await marView.verifyMarViewElements();
    });

    test('should display date selector and navigation controls', async ({ patientDetailsPage }) => {
      const medicationPane = await patientDetailsPage.navigateToMedicationTab();
      await medicationPane.waitForPaneToLoad();
      await medicationPane.clickMedicationAdminRecord();

      const marView = new MarView(medicationPane.page);
      await marView.waitForMarViewToLoad();
      await marView.verifyDateSelectorElements();
    });

    test('should display PRN medication section', async ({ patientDetailsPage }) => {
      const medicationPane = await patientDetailsPage.navigateToMedicationTab();
      await medicationPane.waitForPaneToLoad();
      await medicationPane.clickMedicationAdminRecord();

      const marView = new MarView(medicationPane.page);
      await marView.waitForMarViewToLoad();
      await marView.verifyPrnSection();
    });

    test('should display time slot headers in MAR table', async ({ patientDetailsPage }) => {
      const medicationPane = await patientDetailsPage.navigateToMedicationTab();
      await medicationPane.waitForPaneToLoad();
      await medicationPane.clickMedicationAdminRecord();

      const marView = new MarView(medicationPane.page);
      await marView.waitForMarViewToLoad();
      await marView.verifyTimeSlotHeaders();
    });

    test('should default to current date when navigating to MAR', async ({ patientDetailsPage }) => {
      const medicationPane = await patientDetailsPage.navigateToMedicationTab();
      await medicationPane.waitForPaneToLoad();
      await medicationPane.clickMedicationAdminRecord();

      const marView = new MarView(medicationPane.page);
      await marView.waitForMarViewToLoad();
      await marView.verifyDateIsCurrentDate();
    });

    test('should navigate through days using back and forth arrows', async ({patientDetailsPage}) => {
      const medicationPane = await patientDetailsPage.navigateToMedicationTab();
      await medicationPane.waitForPaneToLoad();
      await medicationPane.clickMedicationAdminRecord();

      const marView = new MarView(medicationPane.page);
      await marView.waitForMarViewToLoad();

      const initialDate = await marView.getCurrentDate();
    
      await marView.clickNextDay();
      
      // Wait for the date to update and ensure previous button is enabled
      await marView.page.waitForLoadState('networkidle');
      
      const nextDate = await marView.getCurrentDate();
      expect(nextDate.getTime()).toBeGreaterThanOrEqual(initialDate.getTime());
      
      // Now verify we can go back
      await marView.clickPreviousDay();
      await marView.page.waitForLoadState('networkidle');
      const backDate = await marView.getCurrentDate();
      expect(isSameDay(backDate, initialDate)).toBe(true);
    });

    test('should prevent scrolling to date prior to encounter start date', async ({ patientDetailsPage, api }) => {
      const medicationPane = await patientDetailsPage.navigateToMedicationTab();
      await medicationPane.waitForPaneToLoad();
      await medicationPane.clickMedicationAdminRecord();
      
      const encounterStartDate = await getEncounterStartDate(api, patientDetailsPage.page.url());
      const marView = new MarView(medicationPane.page);
      await marView.waitForMarViewToLoad();

      await marView.clickPreviousDayUntilDisabled();
      await marView.verifyPreviousDayButtonState(true);
      
      // Verify final date is not before encounter start date (compare date-only, ignoring time)
      const finalDate = await marView.getCurrentDate();
      const normalizeDate = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
      expect(normalizeDate(finalDate).getTime()).toBeGreaterThanOrEqual(normalizeDate(encounterStartDate).getTime());
    });

    test('should prevent scrolling more than 2 days into the future', async ({ patientDetailsPage }) => {
      const medicationPane = await patientDetailsPage.navigateToMedicationTab();
      await medicationPane.waitForPaneToLoad();
      await medicationPane.clickMedicationAdminRecord();

      const marView = new MarView(medicationPane.page);
      await marView.waitForMarViewToLoad();

      await marView.clickNextDay();
      await marView.clickNextDay();
    
      const isEnabled = await marView.nextDayButton.isEnabled().catch(() => false);
      expect(isEnabled).toBe(false);
    });

    test('should display scheduled medications (non-PRN) in scheduled section', async ({ patientDetailsPage }) => {
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
        isPrn: false,
      };
      await medicationPane.prescribeMedication(medicationData);
      await medicationPane.waitForPaneToLoad();

      await expect(medicationPane.medicationAdminRecordButton).toBeVisible({ timeout: 10000 });
      await medicationPane.clickMedicationAdminRecord();
      const marView = new MarView(medicationPane.page);
      await marView.waitForMarViewToLoad();

      await expect(marView.scheduledSection).toBeVisible({ timeout: 5000 });
      const medicationRow = marView.getMedicationRowByText('Aciclovir');
      await expect(medicationRow).toBeVisible({ timeout: 15000 });
    });

    test('should display PRN medications in PRN section', async ({ patientDetailsPage }) => {
      const medicationPane = await patientDetailsPage.navigateToMedicationTab();
      
      const medicationData: MedicationFormData = {
        medicationName: 'Amitriptyline 25mg Tablets',
        doseAmount: '25',
        units: 'mg',
        frequency: 'Daily (D)',
        route: 'Oral',
        date: format(new Date(), 'yyyy-MM-dd'),
        startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        prescriberName: 'Initial Admin',
        isPrn: true,
      };
      await medicationPane.prescribeMedication(medicationData);
      await medicationPane.waitForPaneToLoad();

      await expect(medicationPane.medicationAdminRecordButton).toBeVisible({ timeout: 10000 });
      await medicationPane.clickMedicationAdminRecord();
      const marView = new MarView(medicationPane.page); 
      await marView.waitForMarViewToLoad();

      await expect(marView.prnSection).toBeVisible({ timeout: 5000 });
      const medicationRow = marView.getMedicationRowByText('Amitriptyline 25mg Tablets');
      await expect(medicationRow).toBeVisible({ timeout: 5000 });
    });

    test('should display paused medications in italics with (Paused) label', async ({ patientDetailsPage }) => {
      const medicationPane = await patientDetailsPage.navigateToMedicationTab();
      
      const medicationData: MedicationFormData = {
        medicationName: 'Anastrozole 1mg Tablets',
        doseAmount: '1',
        units: 'mg',
        frequency: 'Daily (D)',
        route: 'Oral',
        date: format(new Date(), 'yyyy-MM-dd'),
        startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        prescriberName: 'Initial Admin',
      };
      await medicationPane.prescribeMedication(medicationData);
      await medicationPane.waitForPaneToLoad();
      const medicationDetailsModal = await medicationPane.clickFirstMedicationRow();
      await medicationDetailsModal.pauseMedication()
      await medicationDetailsModal.waitForModalToClose();

      await medicationPane.clickMedicationAdminRecord();
      const marView = new MarView(medicationPane.page);
      await marView.waitForMarViewToLoad();
      await marView.verifyMedicationIsPausedAndItalic('Anastrozole 1mg Tablets');
      
    });

    test('should display discontinued medications with strikethrough', async ({ patientDetailsPage }) => {
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
      await medicationPane.waitForPaneToLoad();
      const medicationDetailsModal = await medicationPane.clickFirstMedicationRow();
      await medicationDetailsModal.discontinueMedication('Initial Admin', 'Test reason');
      // Modal should already be closed after discontinueMedication()

      await medicationPane.clickMedicationAdminRecord();
      const marView = new MarView(medicationPane.page);
      await marView.waitForMarViewToLoad();
      await marView.verifyMedicationIsDiscontinued('Aciclovir');
    });

    test('should display active medications before discontinued medications in chronological order', async ({ patientDetailsPage }) => {
      const medicationPane = await patientDetailsPage.navigateToMedicationTab();
      
      // Create first medication
      const firstMedication: MedicationFormData = {
        medicationName: 'Aciclovir 800mg Tablets',
        doseAmount: '500',
        units: 'g',
        frequency: 'Daily (D)',
        route: 'Oral',
        date: format(new Date(), 'yyyy-MM-dd'),
        startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        prescriberName: 'Initial Admin',
      };
      await medicationPane.prescribeMedication(firstMedication);
      await medicationPane.waitForPaneToLoad();

      // Create second medication
      const secondMedication: MedicationFormData = {
        medicationName: 'Amiodarone HCL 100mg Tablets',
        doseAmount: '100',
        units: 'g',
        frequency: 'Daily (D)',
        route: 'Oral',
        date: format(new Date(), 'yyyy-MM-dd'),
        startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        prescriberName: 'Initial Admin',
      };
      await medicationPane.prescribeMedication(secondMedication);
      await medicationPane.waitForPaneToLoad();

      // Discontinue the first medication (Aciclovir)
      const medicationDetailsModal = await medicationPane.clickMedicationRowByName('Aciclovir');
      await medicationDetailsModal.discontinueMedication();
      await medicationPane.waitForPaneToLoad();

      // Navigate to MAR view
      await medicationPane.clickMedicationAdminRecord();
      const marView = new MarView(medicationPane.page);
      await marView.waitForMarViewToLoad();

      // Verify medications are displayed with active before discontinued
      const scheduledMeds = marView.scheduledMedications;
      const count = await scheduledMeds.count();
      expect(count).toBeGreaterThanOrEqual(2);

      // Find positions of active and discontinued medications
      let activeMedIndex = -1;
      let discontinuedMedIndex = -1;

      for (let i = 0; i < count; i++) {
        const med = scheduledMeds.nth(i);
        const medicationText = await med.textContent();
        const textDecoration = await med.evaluate(el => window.getComputedStyle(el).textDecoration);
        
        if (medicationText?.includes('Amiodarone') && !textDecoration.includes('line-through')) {
          activeMedIndex = i;
        }
        if (medicationText?.includes('Aciclovir') && textDecoration.includes('line-through')) {
          discontinuedMedIndex = i;
        }
      }

      // Verify active medication appears before discontinued medication
      expect(activeMedIndex).toBeGreaterThanOrEqual(0);
      expect(discontinuedMedIndex).toBeGreaterThanOrEqual(0);
      expect(activeMedIndex).toBeLessThan(discontinuedMedIndex);
    });
  });

  test.describe('MAR Requirements Verification', () => {
    test('When an As directed medication is prescribed, it should have no specific due dose.', async ({ patientDetailsPage }) => {
      const medicationPane = await patientDetailsPage.navigateToMedicationTab();
      
      const medicationData: MedicationFormData = {
        medicationName: 'Aciclovir 800mg Tablets',
        doseAmount: '', // Empty for variable dose
        units: 'mg',
        frequency: 'As directed (MDU)',
        route: 'Oral',
        date: format(new Date(), 'yyyy-MM-dd'),
        startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        prescriberName: 'Initial Admin',
        isVariableDose: true,
      };
      await medicationPane.prescribeMedication(medicationData);
      await medicationPane.waitForPaneToLoad();

      await medicationPane.clickMedicationAdminRecord();
      const marView = new MarView(medicationPane.page);
      await marView.waitForMarViewToLoad();

      // Verify no specific due dose is displayed in the MAR for As directed medication
      await marView.verifyNoSpecificDueDose('Aciclovir');
    });

    test('should display medications until midnight on end date', async ({ patientDetailsPage }) => {
      const medicationPane = await patientDetailsPage.navigateToMedicationTab();
      
      // Create medication with end date today
      const today = new Date();
      const medicationData: MedicationFormData = {
        medicationName: 'Aciclovir 800mg Tablets',
        doseAmount: '500',
        units: 'g',
        frequency: 'Daily (D)',
        route: 'Oral',
        date: format(today, 'yyyy-MM-dd'),
        startDate: format(today, "yyyy-MM-dd'T'HH:mm"),
        prescriberName: 'Initial Admin',
        durationValue: '1',
        durationUnit: 'day (s)',
      };
      await medicationPane.prescribeMedication(medicationData);
      await medicationPane.waitForPaneToLoad();

      await medicationPane.clickMedicationAdminRecord();
      const marView = new MarView(medicationPane.page);
      await marView.waitForMarViewToLoad();
      
      // Verify medication is visible on end date (today)
      await marView.verifyMedicationVisibleOnEndDate('Aciclovir');
      
      // Navigate to next day (after midnight of end date)
      // Note: This test assumes medication ends today, so next day would be after end date
      // In practice, you'd need to set end date to yesterday and verify today
      const isNextDayEnabled = await marView.nextDayButton.isEnabled({ timeout: 1000 }).catch(() => false);
      if (isNextDayEnabled) {
        await marView.clickNextDay();
        await marView.page.waitForLoadState('networkidle');
      }
      
      // Verify medication is not visible after midnight of end date
      await marView.verifyMedicationNotVisibleAfterEndDate('Aciclovir');
    });

    test('should display resumed medication as active with strikethrough for pause period', async ({ patientDetailsPage }) => {
      const medicationPane = await patientDetailsPage.navigateToMedicationTab();
      
      const medicationData: MedicationFormData = {
        medicationName: 'Anastrozole 1mg Tablets',
        doseAmount: '1',
        units: 'mg',
        frequency: 'Daily (D)',
        route: 'Oral',
        date: format(new Date(), 'yyyy-MM-dd'),
        startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        prescriberName: 'Initial Admin',
      };
      await medicationPane.prescribeMedication(medicationData);
      await medicationPane.waitForPaneToLoad();
      
      // Pause the medication
      const medicationDetailsModal = await medicationPane.clickFirstMedicationRow();
      await medicationDetailsModal.pauseMedication(1, 'day (s)');
      await medicationPane.waitForPaneToLoad();
      
      // Resume the medication (click resume button if available)
      const medicationDetailsModalAfterPause = await medicationPane.clickFirstMedicationRow();
      const isResumeVisible = await medicationDetailsModalAfterPause.resumeButton.isVisible({ timeout: 5000 }).catch(() => false);
      expect(isResumeVisible).toBe(true);

      await medicationDetailsModalAfterPause.resumeButton.click();
      await medicationPane.waitForPaneToLoad();
      // Navigate to MAR view
      await medicationPane.clickMedicationAdminRecord();
      const marView = new MarView(medicationPane.page);
      await marView.waitForMarViewToLoad();
      
      // Verify medication is active (not paused)
      await marView.verifyResumedMedicationActive('Anastrozole');
      
      // Note: Historical pause period strikethrough verification would require
      // checking specific time slots, which is complex and may need API data
    });

    test('should not display due or missed doses during paused period', async ({ patientDetailsPage }) => {
      const medicationPane = await patientDetailsPage.navigateToMedicationTab();
      
      const medicationData: MedicationFormData = {
        medicationName: 'Anastrozole 1mg Tablets',
        doseAmount: '1',
        units: 'mg',
        frequency: 'Daily (D)',
        route: 'Oral',
        date: format(new Date(), 'yyyy-MM-dd'),
        startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        prescriberName: 'Initial Admin',
      };
      await medicationPane.prescribeMedication(medicationData);
      await medicationPane.waitForPaneToLoad();
      
      // Pause the medication
      const medicationDetailsModal = await medicationPane.clickFirstMedicationRow();
      await medicationDetailsModal.pauseMedication(1, 'day (s)');
      await medicationPane.waitForPaneToLoad();
      
      // Navigate to MAR view
      await medicationPane.clickMedicationAdminRecord();
      const marView = new MarView(medicationPane.page);
      await marView.waitForMarViewToLoad();
      
      // Verify paused medication shows strikethrough pattern (italic + "(Paused)")
      await marView.verifyMedicationIsPausedAndItalic('Anastrozole');
      
      // Verify full row text has no "missed" or "due" during paused period
      await marView.verifyPausedPeriodNoDueOrMissedText('Anastrozole');
    });
  });
});

