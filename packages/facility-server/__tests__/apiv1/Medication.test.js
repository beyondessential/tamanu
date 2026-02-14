import config from 'config';

import { DRUG_STOCK_STATUSES, INVOICE_STATUSES, REFERENCE_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

import { createTestContext } from '../utilities';

describe('Medication', () => {
  describe('Approved column', () => {
    const [facilityId] = selectFacilityIds(config);
    let app = null;
    let baseApp = null;
    let models = null;
    let ctx;
    let patient;
    let testEncounter;
    let testInvoice;
    let testLocation;
    let user;
    let referenceDrug;
    let medication;

    beforeAll(async () => {
      ctx = await createTestContext();
      baseApp = ctx.baseApp;
      models = ctx.models;
      user = await models.User.create({
        ...fakeUser(),
        role: 'practitioner',
      });
      app = await baseApp.asUser(user);

      patient = await models.Patient.create(await createDummyPatient(models));

      // Create location group first
      const locationGroup = await models.LocationGroup.create({
        name: 'Test Location Group',
        code: 'MED-TEST-LG',
        facilityId,
      });

      testLocation = await models.Location.create({
        name: 'Test Location for Medication',
        code: 'MED-TEST-LOC',
        facilityId,
        locationGroupId: locationGroup.id,
      });

      testEncounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        encounterType: 'admission',
        startDate: getCurrentDateTimeString(),
        reasonForEncounter: 'Test medication request',
        locationId: testLocation.id,
        patientId: patient.id,
      });

      testInvoice = await models.Invoice.create({
        encounterId: testEncounter.id,
        displayId: 'INV-MED-APPROVED-TEST',
        status: INVOICE_STATUSES.IN_PROGRESS,
        date: getCurrentDateTimeString(),
      });
      
      // Create medication reference data (drug)
      medication = await models.ReferenceData.create({
        name: 'Test Drug for Medication',
        code: 'TEST-DRUG',
        type: REFERENCE_TYPES.DRUG,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      });

      // Create reference drug linked to medication (don't use fake to avoid referenceDataId conflict)
      referenceDrug = await models.ReferenceDrug.create({
        referenceDataId: medication.id,
        isSensitive: false,
        route: 'oral',
        units: 'mg',
      });

      // Create facility stock entry - must be IN_STOCK or AVAILABLE (not UNAVAILABLE)
      await models.ReferenceDrugFacility.create({
        referenceDrugId: referenceDrug.id,
        facilityId,
        quantity: 100,
        stockStatus: DRUG_STOCK_STATUSES.IN_STOCK,
      });
    });

    afterAll(() => ctx.close());

    const createMedicationRequest = async () => {
      const prescription = await models.Prescription.create({
        ...fake(models.Prescription),
        encounterId: testEncounter.id,
        medicationId: medication.id,
        prescriberId: user.id,
        doseAmount: 1,
        route: 'oral',
        date: getCurrentDateTimeString(),
      });

      const pharmacyOrder = await models.PharmacyOrder.create({
        encounterId: testEncounter.id,
        facilityId,
        date: getCurrentDateTimeString(),
        isDischargePrescription: false,
        orderingClinicianId: user.id,
      });

      const pharmacyOrderPrescription = await models.PharmacyOrderPrescription.create({
        pharmacyOrderId: pharmacyOrder.id,
        prescriptionId: prescription.id,
        isCompleted: false,
        quantity: 1,
      });

      return { prescription, pharmacyOrder, pharmacyOrderPrescription };
    };

    it('should return null for approved when no invoice item exists', async () => {
      const { prescription } = await createMedicationRequest();

      const result = await app.get(`/api/medication/medication-requests?facilityId=${facilityId}`);
      expect(result).toHaveSucceeded();

      // Find the created record
      const found = result.body.data.find(item => item.prescription?.id === prescription.id);
      expect(found).toBeDefined();
      expect(found.prescription.invoiceItem).toBeNull();
    });

    it('should return approved true when invoice item is approved', async () => {
      const { prescription } = await createMedicationRequest();

      await models.InvoiceItem.create({
        invoiceId: testInvoice.id,
        sourceRecordId: prescription.id,
        sourceRecordType: 'Prescription',
        approved: true,
        orderDate: getCurrentDateTimeString(),
        quantity: 1,
        orderedByUserId: user.id,
      });

      const result = await app.get(`/api/medication/medication-requests?facilityId=${facilityId}`);
      expect(result).toHaveSucceeded();

      const found = result.body.data.find(item => item.prescription?.id === prescription.id);
      expect(found).toBeDefined();
      expect(found.prescription.invoiceItem).toBeDefined();
      expect(found.prescription.invoiceItem.approved).toBe(true);
    });

    it('should return approved false when invoice item is not approved', async () => {
      const { prescription } = await createMedicationRequest();

      await models.InvoiceItem.create({
        invoiceId: testInvoice.id,
        sourceRecordId: prescription.id,
        sourceRecordType: 'Prescription',
        approved: false,
        orderDate: getCurrentDateTimeString(),
        quantity: 1,
        orderedByUserId: user.id,
      });

      const result = await app.get(`/api/medication/medication-requests?facilityId=${facilityId}`);
      expect(result).toHaveSucceeded();

      const found = result.body.data.find(item => item.prescription?.id === prescription.id);
      expect(found).toBeDefined();
      expect(found.prescription.invoiceItem).toBeDefined();
      expect(found.prescription.invoiceItem.approved).toBe(false);
    });
  });
});
