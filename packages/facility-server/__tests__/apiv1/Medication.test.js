import config from 'config';
import { v4 as uuidv4 } from 'uuid';

import {
  DRUG_STOCK_STATUSES,
  INVOICE_STATUSES,
  REFERENCE_TYPES,
  VISIBILITY_STATUSES,
  SETTINGS_SCOPES,
} from '@tamanu/constants';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { disableHardcodedPermissionsForSuite } from '@tamanu/shared/test-helpers';

import { createTestContext } from '../utilities';

describe('Medication', () => {
  const [facilityId] = selectFacilityIds(config);

  let app = null;
  let baseApp = null;
  let models = null;
  let patient = null;
  let location = null;
  let department = null;
  let ctx = null;

  const createOngoingPrescription = async ({ patientId, prescriberId, repeats = 3 }) => {
    const medication = await models.ReferenceData.create(
      fake(models.ReferenceData, { type: REFERENCE_TYPES.DRUG }),
    );
    const prescription = await models.Prescription.create(
      fake(models.Prescription, {
        medicationId: medication.id,
        prescriberId,
        startDate: getCurrentDateTimeString(),
        isOngoing: true,
        repeats,
      }),
    );
    await models.PatientOngoingPrescription.create(
      fake(models.PatientOngoingPrescription, {
        patientId,
        prescriptionId: prescription.id,
      }),
    );
    return prescription;
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
    patient = await models.Patient.create(fake(models.Patient));

    // Create location and department for the facility (required for send-ongoing-to-pharmacy)
    const locationGroup = await models.LocationGroup.create(
      fake(models.LocationGroup, { facilityId }),
    );
    location = await models.Location.create(
      fake(models.Location, { locationGroupId: locationGroup.id, facilityId }),
    );
    department = await models.Department.create(fake(models.Department, { facilityId }));

    await models.Setting.set(
      'medications.medicationDispensing.automaticEncounterLocationId',
      location.id,
      SETTINGS_SCOPES.FACILITY,
      facilityId,
    );
    await models.Setting.set(
      'medications.medicationDispensing.automaticEncounterDepartmentId',
      department.id,
      SETTINGS_SCOPES.FACILITY,
      facilityId,
    );
  });

  afterEach(async () => {
    await models.Prescription.truncate({ cascade: true, force: true });
    await models.PatientOngoingPrescription.truncate({ cascade: true, force: true });
    await models.EncounterPrescription.truncate({ cascade: true, force: true });
    await models.Encounter.truncate({ cascade: true, force: true });
    await models.PharmacyOrderPrescription.truncate({ cascade: true, force: true });
    await models.PharmacyOrder.truncate({ cascade: true, force: true });
  });

  afterAll(() => ctx.close());

  describe('POST /api/medication/send-ongoing-to-pharmacy', () => {
    describe('repeats', () => {
      it('should not decrement on the first send to pharmacy', async () => {
        const ongoingPrescription = await createOngoingPrescription({
          patientId: patient.id,
          prescriberId: app.user.id,
        });

        const result = await app.post('/api/medication/send-ongoing-to-pharmacy').send({
          patientId: patient.id,
          orderingClinicianId: app.user.id,
          facilityId,
          prescriptions: [{ prescriptionId: ongoingPrescription.id, quantity: 10 }],
        });

        expect(result).toHaveSucceeded();

        const reloadedPrescription = await models.Prescription.findByPk(ongoingPrescription.id);
        expect(reloadedPrescription.repeats).toBe(3);
      });

      it('should store the correct amount of repeats on pharmacy order', async () => {
        const ongoingPrescription = await createOngoingPrescription({
          patientId: patient.id,
          prescriberId: app.user.id,
        });

        const firstResult = await app.post('/api/medication/send-ongoing-to-pharmacy').send({
          patientId: patient.id,
          orderingClinicianId: app.user.id,
          facilityId,
          prescriptions: [{ prescriptionId: ongoingPrescription.id, quantity: 10 }],
        });
        expect(firstResult).toHaveSucceeded();

        const firstOrderPrescriptions = await models.PharmacyOrderPrescription.findAll({
          where: { pharmacyOrderId: firstResult.body.pharmacyOrderId },
        });
        expect(firstOrderPrescriptions).toHaveLength(1);
        expect(firstOrderPrescriptions[0].repeats).toBe(3);

        const secondResult = await app.post('/api/medication/send-ongoing-to-pharmacy').send({
          patientId: patient.id,
          orderingClinicianId: app.user.id,
          facilityId,
          prescriptions: [{ prescriptionId: ongoingPrescription.id, quantity: 10 }],
        });
        expect(secondResult).toHaveSucceeded();

        const secondOrderPrescriptions = await models.PharmacyOrderPrescription.findAll({
          where: { pharmacyOrderId: secondResult.body.pharmacyOrderId },
        });
        expect(secondOrderPrescriptions).toHaveLength(1);
        expect(secondOrderPrescriptions[0].repeats).toBe(2);
      });

      it('should decrement on the second send to pharmacy', async () => {
        const ongoingPrescription = await createOngoingPrescription({
          patientId: patient.id,
          prescriberId: app.user.id,
        });

        // First send - should not decrement
        const firstResult = await app.post('/api/medication/send-ongoing-to-pharmacy').send({
          patientId: patient.id,
          orderingClinicianId: app.user.id,
          facilityId,
          prescriptions: [{ prescriptionId: ongoingPrescription.id, quantity: 10 }],
        });

        expect(firstResult).toHaveSucceeded();

        const afterFirst = await models.Prescription.findByPk(ongoingPrescription.id);
        expect(afterFirst.repeats).toBe(3);

        // Second send - should decrement
        const secondResult = await app.post('/api/medication/send-ongoing-to-pharmacy').send({
          patientId: patient.id,
          orderingClinicianId: app.user.id,
          facilityId,
          prescriptions: [{ prescriptionId: ongoingPrescription.id, quantity: 10 }],
        });

        expect(secondResult).toHaveSucceeded();

        const afterSecond = await models.Prescription.findByPk(ongoingPrescription.id);
        expect(afterSecond.repeats).toBe(2);
      });

      it('should throw error if the prescription is linked to an active encounter', async () => {
        const ongoingPrescription = await createOngoingPrescription({
          patientId: patient.id,
          prescriberId: app.user.id,
        });

        // Create an active encounter for the patient (endDate: null)
        await models.Encounter.create(
          fake(models.Encounter, {
            patientId: patient.id,
            locationId: location.id,
            departmentId: department.id,
            examinerId: app.user.id,
            endDate: null,
          }),
        );

        const result = await app.post('/api/medication/send-ongoing-to-pharmacy').send({
          patientId: patient.id,
          orderingClinicianId: app.user.id,
          facilityId,
          prescriptions: [{ prescriptionId: ongoingPrescription.id, quantity: 10 }],
        });

        expect(result).toHaveRequestError();

        // Prescription repeats should be unchanged since we never got to the decrement logic
        const reloadedPrescription = await models.Prescription.findByPk(ongoingPrescription.id);
        expect(reloadedPrescription.repeats).toBe(3);
      });
    });
    describe('permissions', () => {
      const sendToPharmacyPermissions = [
        ['create', 'Encounter'],
        ['create', 'Medication'],
        ['create', 'MedicationRequest'],
        ['read', 'Medication'],
      ];

      const sendToPharmacyWithWriteRepeatsPermissions = [
        ...sendToPharmacyPermissions,
        ['write', 'Medication'],
      ];

      disableHardcodedPermissionsForSuite();

      it('should allow a user with write permission to send ongoing prescriptions to pharmacy if repeats are 0', async () => {
        const practitionerApp = await baseApp.asNewRole(sendToPharmacyWithWriteRepeatsPermissions);

        const ongoingPrescription = await createOngoingPrescription({
          patientId: patient.id,
          prescriberId: practitionerApp.user.id,
          repeats: 0,
        });

        const result = await practitionerApp.post('/api/medication/send-ongoing-to-pharmacy').send({
          patientId: patient.id,
          orderingClinicianId: practitionerApp.user.id,
          facilityId,
          prescriptions: [{ prescriptionId: ongoingPrescription.id, quantity: 10 }],
        });

        expect(result).toHaveSucceeded();

        const reloadedPrescription = await models.Prescription.findByPk(ongoingPrescription.id);
        expect(reloadedPrescription.repeats).toBe(0);
      });

      it('should allow a user without write permission to send ongoing prescriptions when repeats are 0 and never ordered (first send free)', async () => {
        const limitedApp = await baseApp.asNewRole(sendToPharmacyPermissions);

        const ongoingPrescription = await createOngoingPrescription({
          patientId: patient.id,
          prescriberId: limitedApp.user.id,
          repeats: 0,
        });

        const result = await limitedApp.post('/api/medication/send-ongoing-to-pharmacy').send({
          patientId: patient.id,
          orderingClinicianId: limitedApp.user.id,
          facilityId,
          prescriptions: [{ prescriptionId: ongoingPrescription.id, quantity: 10 }],
        });

        expect(result).toHaveSucceeded();

        const reloadedPrescription = await models.Prescription.findByPk(ongoingPrescription.id);
        expect(reloadedPrescription.repeats).toBe(0);
      });

      it('should reject a user without write permission when repeats are 0 and already ordered', async () => {
        const practitionerApp = await baseApp.asNewRole(sendToPharmacyWithWriteRepeatsPermissions);
        const limitedApp = await baseApp.asNewRole(sendToPharmacyPermissions);

        const ongoingPrescription = await createOngoingPrescription({
          patientId: patient.id,
          prescriberId: practitionerApp.user.id,
          repeats: 0,
        });

        const firstResult = await practitionerApp
          .post('/api/medication/send-ongoing-to-pharmacy')
          .send({
            patientId: patient.id,
            orderingClinicianId: practitionerApp.user.id,
            facilityId,
            prescriptions: [{ prescriptionId: ongoingPrescription.id, quantity: 10 }],
          });
        expect(firstResult).toHaveSucceeded();

        const secondResult = await limitedApp
          .post('/api/medication/send-ongoing-to-pharmacy')
          .send({
            patientId: patient.id,
            orderingClinicianId: limitedApp.user.id,
            facilityId,
            prescriptions: [{ prescriptionId: ongoingPrescription.id, quantity: 10 }],
          });

        expect(secondResult).toHaveRequestError();
      });
    });
  });

  describe('POST /api/encounter/:id/pharmacyOrder', () => {
    describe('repeats', () => {
      it('should not decrement prescription repeats when sending from encounter', async () => {
        const medication = await models.ReferenceData.create(
          fake(models.ReferenceData, { type: REFERENCE_TYPES.DRUG }),
        );

        const encounter = await models.Encounter.create(
          fake(models.Encounter, {
            patientId: patient.id,
            locationId: location.id,
            departmentId: department.id,
            examinerId: app.user.id,
            endDate: null,
          }),
        );

        const prescription = await models.Prescription.create(
          fake(models.Prescription, {
            medicationId: medication.id,
            prescriberId: app.user.id,
            startDate: getCurrentDateTimeString(),
            repeats: 3,
          }),
        );

        await models.EncounterPrescription.create(
          fake(models.EncounterPrescription, {
            encounterId: encounter.id,
            prescriptionId: prescription.id,
          }),
        );

        const result = await app.post(`/api/encounter/${encounter.id}/pharmacyOrder`).send({
          orderingClinicianId: app.user.id,
          isDischargePrescription: true,
          facilityId,
          pharmacyOrderPrescriptions: [
            { prescriptionId: prescription.id, quantity: 10, repeats: 3 },
          ],
        });

        expect(result).toHaveSucceeded();

        const reloadedPrescription = await models.Prescription.findByPk(prescription.id);
        expect(reloadedPrescription.repeats).toBe(3);
      });
    });
  });

  describe('POST /api/medication/dispense', () => {
    const createPharmacyOrderWithPrescription = async ({ patientId, repeats = 1 }) => {
      const medication = await models.ReferenceData.create(
        fake(models.ReferenceData, { type: REFERENCE_TYPES.DRUG }),
      );
      const encounter = await models.Encounter.create(
        fake(models.Encounter, {
          patientId,
          locationId: location.id,
          departmentId: department.id,
          examinerId: app.user.id,
          endDate: getCurrentDateTimeString(),
        }),
      );
      const prescription = await models.Prescription.create(
        fake(models.Prescription, {
          medicationId: medication.id,
          prescriberId: app.user.id,
          startDate: getCurrentDateTimeString(),
        }),
      );
      await models.EncounterPrescription.create(
        fake(models.EncounterPrescription, {
          encounterId: encounter.id,
          prescriptionId: prescription.id,
        }),
      );
      const pharmacyOrder = await models.PharmacyOrder.create(
        fake(models.PharmacyOrder, {
          orderingClinicianId: app.user.id,
          encounterId: encounter.id,
          isDischargePrescription: true,
          date: getCurrentDateTimeString(),
          facilityId,
        }),
      );
      const pharmacyOrderPrescription = await models.PharmacyOrderPrescription.create({
        ...fake(models.PharmacyOrderPrescription, {
          pharmacyOrderId: pharmacyOrder.id,
          prescriptionId: prescription.id,
          quantity: 10,
          repeats,
        }),
        id: uuidv4(),
      });
      return { pharmacyOrderPrescription, encounter, prescription };
    };

    it('should dispense medication successfully', async () => {
      const { pharmacyOrderPrescription } = await createPharmacyOrderWithPrescription({
        patientId: patient.id,
      });

      const result = await app.post('/api/medication/dispense').send({
        dispensedByUserId: app.user.id,
        facilityId,
        items: [
          {
            pharmacyOrderPrescriptionId: pharmacyOrderPrescription.id,
            quantity: 10,
            instructions: 'Take as directed',
          },
        ],
      });

      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(1);
      expect(result.body[0].pharmacyOrderPrescriptionId).toBe(pharmacyOrderPrescription.id);
    });

    it('should only be able to dispensed once', async () => {
      const { pharmacyOrderPrescription } = await createPharmacyOrderWithPrescription({
        patientId: patient.id,
        repeats: 0,
      });

      const firstResult = await app.post('/api/medication/dispense').send({
        dispensedByUserId: app.user.id,
        facilityId,
        items: [
          {
            pharmacyOrderPrescriptionId: pharmacyOrderPrescription.id,
            quantity: 10,
            instructions: 'Initial dispense',
          },
        ],
      });
      expect(firstResult).toHaveSucceeded();

      const secondResult = await app.post('/api/medication/dispense').send({
        dispensedByUserId: app.user.id,
        facilityId,
        items: [
          {
            pharmacyOrderPrescriptionId: pharmacyOrderPrescription.id,
            quantity: 10,
            instructions: 'Second dispense',
          },
        ],
      });
      expect(secondResult).toHaveRequestError();
    });

    it('should reject dispense when prescriptions are from different patients', async () => {
      const otherPatient = await models.Patient.create(fake(models.Patient));
      const { pharmacyOrderPrescription: pop1 } = await createPharmacyOrderWithPrescription({
        patientId: patient.id,
      });
      const { pharmacyOrderPrescription: pop2 } = await createPharmacyOrderWithPrescription({
        patientId: otherPatient.id,
      });

      const result = await app.post('/api/medication/dispense').send({
        dispensedByUserId: app.user.id,
        facilityId,
        items: [
          {
            pharmacyOrderPrescriptionId: pop1.id,
            quantity: 10,
            instructions: 'Dispense 1',
          },
          {
            pharmacyOrderPrescriptionId: pop2.id,
            quantity: 10,
            instructions: 'Dispense 2',
          },
        ],
      });

      expect(result).toHaveRequestError();
    });
  });

  describe('Approved column', () => {
    let patient;
    let testEncounter;
    let testInvoice;
    let user;
    let referenceDrug;
    let medication;

    beforeEach(async () => {
      user = await models.User.create({
        ...fakeUser(),
        role: 'practitioner',
      });
      patient = await models.Patient.create(await createDummyPatient(models));

      testEncounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        encounterType: 'admission',
        startDate: getCurrentDateTimeString(),
        reasonForEncounter: 'Test medication request',
        locationId: location.id,
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
