import config from 'config';

import {
  ADMINISTRATION_FREQUENCIES,
  DRUG_ROUTES,
  ADMINISTRATION_STATUS,
  DRUG_STOCK_STATUSES,
  INVOICE_STATUSES,
  NOTIFICATION_TYPES,
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

  const createDrug = async ({ isSensitive = false, dosingUnit = 'mg', dispensingUnit = 'Tablet' } = {}) => {
    const medication = await models.ReferenceData.create(
      fake(models.ReferenceData, { type: REFERENCE_TYPES.DRUG }),
    );
    const referenceDrug = await models.ReferenceDrug.create(
      fake(models.ReferenceDrug, {
        referenceDataId: medication.id,
        isSensitive,
        dosingUnit,
        dispensingUnit,
      }),
    );
    return { medication, referenceDrug };
  };

  const createPharmacyOrderWithPrescription = async ({ patientId, repeats = 1 }) => {
    const { medication } = await createDrug();
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
      id: crypto.randomUUID(),
    });
    return { pharmacyOrderPrescription, encounter, prescription, medication };
  };

  // A second dispense request for the same prescription, so a prescription can accumulate
  // multiple fills (the helper above allows only one dispense per request).
  const createAdditionalPharmacyOrderPrescription = async ({ prescription, encounter }) => {
    const pharmacyOrder = await models.PharmacyOrder.create(
      fake(models.PharmacyOrder, {
        orderingClinicianId: app.user.id,
        encounterId: encounter.id,
        isDischargePrescription: true,
        date: getCurrentDateTimeString(),
        facilityId,
      }),
    );
    return models.PharmacyOrderPrescription.create({
      ...fake(models.PharmacyOrderPrescription, {
        pharmacyOrderId: pharmacyOrder.id,
        prescriptionId: prescription.id,
        quantity: 10,
        repeats: 1,
      }),
      id: crypto.randomUUID(),
    });
  };

  const buildModification = ({ medicationId, modifiedReasonId, modifiedById }) => ({
    medicationId,
    isVariableDose: false,
    doseAmount: 250,
    frequency: ADMINISTRATION_FREQUENCIES.TWO_TIMES_DAILY,
    route: DRUG_ROUTES.oral,
    pharmacyNotes: 'This prescription has been modified by pharmacy when dispensing.',
    modifiedReasonId,
    modifiedById,
  });

  const createModifyReason = () =>
    models.ReferenceData.create(
      fake(models.ReferenceData, { type: REFERENCE_TYPES.MEDICATION_DISPENSE_MODIFY_REASON }),
    );

  const dispenseItems = (items, overrides = {}) =>
    app.post('/api/medication/dispense').send({
      dispensedByUserId: app.user.id,
      facilityId,
      items,
      ...overrides,
    });

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

    it('should persist medicationPresetLabelId on the created dispense', async () => {
      const presetLabel = await models.ReferenceData.create(
        fake(models.ReferenceData, { type: REFERENCE_TYPES.MEDICATION_PRESET_LABEL }),
      );
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
            instructions: presetLabel.name,
            medicationPresetLabelId: presetLabel.id,
          },
        ],
      });

      expect(result).toHaveSucceeded();
      expect(result.body).toHaveLength(1);
      expect(result.body[0].medicationPresetLabelId).toBe(presetLabel.id);

      const persisted = await models.MedicationDispense.findByPk(result.body[0].id);
      expect(persisted.medicationPresetLabelId).toBe(presetLabel.id);
    });

    it('should reject medicationPresetLabelId as an empty string', async () => {
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
            instructions: 'whatever',
            medicationPresetLabelId: '',
          },
        ],
      });

      expect(result).toHaveRequestError();
    });

    it('should snapshot the prescription details onto the dispense', async () => {
      const { pharmacyOrderPrescription, prescription } =
        await createPharmacyOrderWithPrescription({ patientId: patient.id });

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
      const persisted = await models.MedicationDispense.findByPk(result.body[0].id);
      expect(persisted.medicationId).toBe(prescription.medicationId);
      expect(persisted.dosingUnit).toBe(prescription.dosingUnit);
      expect(persisted.frequency).toBe(prescription.frequency);
      expect(persisted.route).toBe(prescription.route);
      expect(persisted.modifiedAt).toBeNull();
      expect(persisted.modifiedById).toBeNull();
    });

    it('should record a modification on the dispense without altering the original prescription', async () => {
      const { pharmacyOrderPrescription, prescription } =
        await createPharmacyOrderWithPrescription({ patientId: patient.id });
      const substituteMedication = await models.ReferenceData.create(
        fake(models.ReferenceData, { type: REFERENCE_TYPES.DRUG }),
      );
      const modifyReason = await models.ReferenceData.create(
        fake(models.ReferenceData, { type: REFERENCE_TYPES.MEDICATION_DISPENSE_MODIFY_REASON }),
      );
      const originalValues = prescription.toJSON();

      const result = await app.post('/api/medication/dispense').send({
        dispensedByUserId: app.user.id,
        facilityId,
        items: [
          {
            pharmacyOrderPrescriptionId: pharmacyOrderPrescription.id,
            quantity: 16,
            instructions: 'Ensure taken with food in morning',
            modification: buildModification({
              medicationId: substituteMedication.id,
              modifiedReasonId: modifyReason.id,
              modifiedById: app.user.id,
            }),
          },
        ],
      });

      expect(result).toHaveSucceeded();
      const persisted = await models.MedicationDispense.findByPk(result.body[0].id);
      expect(persisted.medicationId).toBe(substituteMedication.id);
      expect(Number(persisted.doseAmount)).toBe(250);
      expect(persisted.frequency).toBe(ADMINISTRATION_FREQUENCIES.TWO_TIMES_DAILY);
      expect(persisted.displayPharmacyNotesInMar).toBe(true);
      expect(persisted.modifiedAt).toBeTruthy();
      expect(persisted.modifiedById).toBe(app.user.id);
      expect(persisted.modifiedReasonId).toBe(modifyReason.id);

      // The original prescription must be untouched
      const reloaded = await models.Prescription.findByPk(prescription.id);
      expect(reloaded.medicationId).toBe(originalValues.medicationId);
      expect(reloaded.doseAmount).toBe(originalValues.doseAmount);
      expect(reloaded.frequency).toBe(originalValues.frequency);
      expect(reloaded.route).toBe(originalValues.route);
      expect(reloaded.pharmacyNotes ?? null).toBe(originalValues.pharmacyNotes ?? null);
    });

    it('should reject a modification without a dose amount when the dose is not variable', async () => {
      const { pharmacyOrderPrescription, prescription } =
        await createPharmacyOrderWithPrescription({ patientId: patient.id });
      const modifyReason = await models.ReferenceData.create(
        fake(models.ReferenceData, { type: REFERENCE_TYPES.MEDICATION_DISPENSE_MODIFY_REASON }),
      );

      const result = await app.post('/api/medication/dispense').send({
        dispensedByUserId: app.user.id,
        facilityId,
        items: [
          {
            pharmacyOrderPrescriptionId: pharmacyOrderPrescription.id,
            quantity: 10,
            instructions: 'whatever',
            modification: {
              ...buildModification({
                medicationId: prescription.medicationId,
                modifiedReasonId: modifyReason.id,
                modifiedById: app.user.id,
              }),
              doseAmount: null,
              isVariableDose: false,
            },
          },
        ],
      });

      expect(result).toHaveRequestError();
    });

    it('should return original and current details from the modify-history endpoint', async () => {
      const { pharmacyOrderPrescription, prescription } =
        await createPharmacyOrderWithPrescription({ patientId: patient.id });
      const modifyReason = await models.ReferenceData.create(
        fake(models.ReferenceData, { type: REFERENCE_TYPES.MEDICATION_DISPENSE_MODIFY_REASON }),
      );

      const dispenseResult = await app.post('/api/medication/dispense').send({
        dispensedByUserId: app.user.id,
        facilityId,
        items: [
          {
            pharmacyOrderPrescriptionId: pharmacyOrderPrescription.id,
            quantity: 16,
            instructions: 'Modified label',
            modification: buildModification({
              medicationId: prescription.medicationId,
              modifiedReasonId: modifyReason.id,
              modifiedById: app.user.id,
            }),
          },
        ],
      });
      expect(dispenseResult).toHaveSucceeded();
      const dispenseId = dispenseResult.body[0].id;

      const result = await app.get(
        `/api/medication/medication-dispenses/${dispenseId}/modify-history`,
      );
      expect(result).toHaveSucceeded();

      expect(result.body.original.medication.id).toBe(prescription.medicationId);
      expect(result.body.original.frequency).toBe(prescription.frequency);
      // Original dispensing quantity is the requested quantity on the pharmacy order prescription
      expect(result.body.original.quantity).toBe(10);

      expect(result.body.current.frequency).toBe(ADMINISTRATION_FREQUENCIES.TWO_TIMES_DAILY);
      expect(Number(result.body.current.doseAmount)).toBe(250);
      expect(result.body.current.quantity).toBe(16);
      expect(result.body.current.modifiedBy.id).toBe(app.user.id);
      expect(result.body.current.modifiedReason.id).toBe(modifyReason.id);
    });

    it('should expose the latest modified fill on the encounter medications list for the MAR', async () => {
      const { pharmacyOrderPrescription, prescription, encounter } =
        await createPharmacyOrderWithPrescription({ patientId: patient.id });
      const modifyReason = await models.ReferenceData.create(
        fake(models.ReferenceData, { type: REFERENCE_TYPES.MEDICATION_DISPENSE_MODIFY_REASON }),
      );

      const before = await app.get(`/api/encounter/${encounter.id}/medications`);
      expect(before).toHaveSucceeded();
      const beforeRow = before.body.data.find(p => p.id === prescription.id);
      expect(beforeRow.latestModifiedDispense).toBeNull();

      const dispenseResult = await app.post('/api/medication/dispense').send({
        dispensedByUserId: app.user.id,
        facilityId,
        items: [
          {
            pharmacyOrderPrescriptionId: pharmacyOrderPrescription.id,
            quantity: 10,
            instructions: 'Modified label',
            modification: buildModification({
              medicationId: prescription.medicationId,
              modifiedReasonId: modifyReason.id,
              modifiedById: app.user.id,
            }),
          },
        ],
      });
      expect(dispenseResult).toHaveSucceeded();

      const after = await app.get(`/api/encounter/${encounter.id}/medications`);
      expect(after).toHaveSucceeded();
      const afterRow = after.body.data.find(p => p.id === prescription.id);
      expect(afterRow.latestModifiedDispense.id).toBe(dispenseResult.body[0].id);
      expect(afterRow.latestModifiedDispense.modifiedAt).toBeTruthy();
      expect(afterRow.latestModifiedDispense.displayPharmacyNotesInMar).toBe(true);
    });

    it('should reject a modification with a duration value but no unit', async () => {
      const { pharmacyOrderPrescription, prescription } =
        await createPharmacyOrderWithPrescription({ patientId: patient.id });
      const modifyReason = await createModifyReason();

      const result = await dispenseItems([
        {
          pharmacyOrderPrescriptionId: pharmacyOrderPrescription.id,
          quantity: 10,
          instructions: 'whatever',
          modification: {
            ...buildModification({
              medicationId: prescription.medicationId,
              modifiedReasonId: modifyReason.id,
              modifiedById: app.user.id,
            }),
            durationValue: 5,
            durationUnit: null,
          },
        },
      ]);

      expect(result).toHaveRequestError();
    });

    it('should store a variable dose modification with no dose amount', async () => {
      const { pharmacyOrderPrescription, prescription } =
        await createPharmacyOrderWithPrescription({ patientId: patient.id });
      const modifyReason = await createModifyReason();

      const result = await dispenseItems([
        {
          pharmacyOrderPrescriptionId: pharmacyOrderPrescription.id,
          quantity: 10,
          instructions: 'whatever',
          modification: {
            ...buildModification({
              medicationId: prescription.medicationId,
              modifiedReasonId: modifyReason.id,
              modifiedById: app.user.id,
            }),
            isVariableDose: true,
            doseAmount: null,
          },
        },
      ]);

      expect(result).toHaveSucceeded();
      const persisted = await models.MedicationDispense.findByPk(result.body[0].id);
      expect(persisted.isVariableDose).toBe(true);
      expect(persisted.doseAmount).toBeNull();
      expect(persisted.modifiedAt).toBeTruthy();
    });

    it('should resolve dosing and dispensing units from the substituted drug', async () => {
      const { pharmacyOrderPrescription, prescription } =
        await createPharmacyOrderWithPrescription({ patientId: patient.id });
      const { medication: substitute } = await createDrug({
        dosingUnit: 'mL',
        dispensingUnit: 'Bottle',
      });
      const modifyReason = await createModifyReason();

      const result = await dispenseItems([
        {
          pharmacyOrderPrescriptionId: pharmacyOrderPrescription.id,
          quantity: 1,
          instructions: 'whatever',
          modification: buildModification({
            medicationId: substitute.id,
            modifiedReasonId: modifyReason.id,
            modifiedById: app.user.id,
          }),
        },
      ]);

      expect(result).toHaveSucceeded();
      const persisted = await models.MedicationDispense.findByPk(result.body[0].id);
      expect(persisted.dosingUnit).toBe('mL');
      expect(persisted.dispensingUnit).toBe('Bottle');
      expect(persisted.dosingUnit).not.toBe(prescription.dosingUnit);
    });

    it('should reject a modification substituting an out-of-stock drug', async () => {
      const { pharmacyOrderPrescription } = await createPharmacyOrderWithPrescription({
        patientId: patient.id,
      });
      const { medication: substitute, referenceDrug } = await createDrug();
      await models.ReferenceDrugFacility.create(
        fake(models.ReferenceDrugFacility, {
          referenceDrugId: referenceDrug.id,
          facilityId,
          stockStatus: DRUG_STOCK_STATUSES.UNAVAILABLE,
          // An unavailable drug cannot carry a stock quantity (check_quantity_stock_consistency)
          quantity: null,
        }),
      );
      const modifyReason = await createModifyReason();

      const result = await dispenseItems([
        {
          pharmacyOrderPrescriptionId: pharmacyOrderPrescription.id,
          quantity: 1,
          instructions: 'whatever',
          modification: buildModification({
            medicationId: substitute.id,
            modifiedReasonId: modifyReason.id,
            modifiedById: app.user.id,
          }),
        },
      ]);

      expect(result).toHaveRequestError();
    });

    it('should notify the prescriber with a pharmacy note on a modified dispense', async () => {
      const localPatient = await models.Patient.create(fake(models.Patient));
      const { pharmacyOrderPrescription, prescription } =
        await createPharmacyOrderWithPrescription({ patientId: localPatient.id });
      const modifyReason = await createModifyReason();

      const result = await dispenseItems([
        {
          pharmacyOrderPrescriptionId: pharmacyOrderPrescription.id,
          quantity: 10,
          instructions: 'whatever',
          modification: buildModification({
            medicationId: prescription.medicationId,
            modifiedReasonId: modifyReason.id,
            modifiedById: app.user.id,
          }),
        },
      ]);
      expect(result).toHaveSucceeded();

      const notifications = await models.Notification.findAll({
        where: { type: NOTIFICATION_TYPES.PHARMACY_NOTE, patientId: localPatient.id },
      });
      expect(notifications).toHaveLength(1);
      // Addressed to the original prescriber
      expect(notifications[0].userId).toBe(app.user.id);
    });

    it('should not notify the prescriber when dispensing unmodified', async () => {
      const localPatient = await models.Patient.create(fake(models.Patient));
      const { pharmacyOrderPrescription } = await createPharmacyOrderWithPrescription({
        patientId: localPatient.id,
      });

      const result = await dispenseItems([
        {
          pharmacyOrderPrescriptionId: pharmacyOrderPrescription.id,
          quantity: 10,
          instructions: 'whatever',
        },
      ]);
      expect(result).toHaveSucceeded();

      const notifications = await models.Notification.findAll({
        where: { type: NOTIFICATION_TYPES.PHARMACY_NOTE, patientId: localPatient.id },
      });
      expect(notifications).toHaveLength(0);
    });

    it('should surface the most recently dispensed modified fill on the encounter medications list', async () => {
      const { pharmacyOrderPrescription: firstRequest, prescription, encounter } =
        await createPharmacyOrderWithPrescription({ patientId: patient.id });
      const modifyReason = await createModifyReason();
      const modification = popId => [
        {
          pharmacyOrderPrescriptionId: popId,
          quantity: 10,
          instructions: 'whatever',
          modification: buildModification({
            medicationId: prescription.medicationId,
            modifiedReasonId: modifyReason.id,
            modifiedById: app.user.id,
          }),
        },
      ];

      const firstFill = await dispenseItems(modification(firstRequest.id));
      expect(firstFill).toHaveSucceeded();
      // Backdate the first fill so the two fills have distinct dispense times
      await models.MedicationDispense.update(
        { dispensedAt: '2020-01-01 00:00:00' },
        { where: { id: firstFill.body[0].id } },
      );

      const secondRequest = await createAdditionalPharmacyOrderPrescription({
        prescription,
        encounter,
      });
      const secondFill = await dispenseItems(modification(secondRequest.id));
      expect(secondFill).toHaveSucceeded();

      const result = await app.get(`/api/encounter/${encounter.id}/medications`);
      expect(result).toHaveSucceeded();
      const row = result.body.data.find(p => p.id === prescription.id);
      expect(row.latestModifiedDispense.id).toBe(secondFill.body[0].id);
    });

    it('should keep showing the last modified fill when a later fill is unmodified', async () => {
      const { pharmacyOrderPrescription: firstRequest, prescription, encounter } =
        await createPharmacyOrderWithPrescription({ patientId: patient.id });
      const modifyReason = await createModifyReason();

      const firstFill = await dispenseItems([
        {
          pharmacyOrderPrescriptionId: firstRequest.id,
          quantity: 10,
          instructions: 'whatever',
          modification: buildModification({
            medicationId: prescription.medicationId,
            modifiedReasonId: modifyReason.id,
            modifiedById: app.user.id,
          }),
        },
      ]);
      expect(firstFill).toHaveSucceeded();
      await models.MedicationDispense.update(
        { dispensedAt: '2020-01-01 00:00:00' },
        { where: { id: firstFill.body[0].id } },
      );

      const secondRequest = await createAdditionalPharmacyOrderPrescription({
        prescription,
        encounter,
      });
      const secondFill = await dispenseItems([
        {
          pharmacyOrderPrescriptionId: secondRequest.id,
          quantity: 10,
          instructions: 'whatever',
        },
      ]);
      expect(secondFill).toHaveSucceeded();

      const result = await app.get(`/api/encounter/${encounter.id}/medications`);
      expect(result).toHaveSucceeded();
      const row = result.body.data.find(p => p.id === prescription.id);
      expect(row.latestModifiedDispense.id).toBe(firstFill.body[0].id);
    });

    it('should return a request error for modify-history of an unknown dispense', async () => {
      const result = await app.get(
        `/api/medication/medication-dispenses/${crypto.randomUUID()}/modify-history`,
      );
      expect(result).toHaveRequestError();
    });

    describe('permissions', () => {
      disableHardcodedPermissionsForSuite();

      it('should reject a modification without write MedicationDispense permission', async () => {
        const createOnlyApp = await baseApp.asNewRole([['create', 'MedicationDispense']]);
        const { pharmacyOrderPrescription, prescription } =
          await createPharmacyOrderWithPrescription({ patientId: patient.id });
        const modifyReason = await createModifyReason();

        const result = await createOnlyApp.post('/api/medication/dispense').send({
          dispensedByUserId: createOnlyApp.user.id,
          facilityId,
          items: [
            {
              pharmacyOrderPrescriptionId: pharmacyOrderPrescription.id,
              quantity: 1,
              instructions: 'whatever',
              modification: buildModification({
                medicationId: prescription.medicationId,
                modifiedReasonId: modifyReason.id,
                modifiedById: createOnlyApp.user.id,
              }),
            },
          ],
        });

        expect(result).toBeForbidden();
      });

      it('should allow dispensing as prescribed with only create MedicationDispense permission', async () => {
        const createOnlyApp = await baseApp.asNewRole([['create', 'MedicationDispense']]);
        const { pharmacyOrderPrescription } = await createPharmacyOrderWithPrescription({
          patientId: patient.id,
        });

        const result = await createOnlyApp.post('/api/medication/dispense').send({
          dispensedByUserId: createOnlyApp.user.id,
          facilityId,
          items: [
            {
              pharmacyOrderPrescriptionId: pharmacyOrderPrescription.id,
              quantity: 1,
              instructions: 'whatever',
            },
          ],
        });

        expect(result).toHaveSucceeded();
      });

      it('should reject a modification substituting a sensitive drug without the permission', async () => {
        const limitedApp = await baseApp.asNewRole([
          ['create', 'MedicationDispense'],
          ['write', 'MedicationDispense'],
        ]);
        const { pharmacyOrderPrescription } = await createPharmacyOrderWithPrescription({
          patientId: patient.id,
        });
        const { medication: sensitiveDrug } = await createDrug({ isSensitive: true });
        const modifyReason = await createModifyReason();

        const result = await limitedApp.post('/api/medication/dispense').send({
          dispensedByUserId: limitedApp.user.id,
          facilityId,
          items: [
            {
              pharmacyOrderPrescriptionId: pharmacyOrderPrescription.id,
              quantity: 1,
              instructions: 'whatever',
              modification: buildModification({
                medicationId: sensitiveDrug.id,
                modifiedReasonId: modifyReason.id,
                modifiedById: limitedApp.user.id,
              }),
            },
          ],
        });

        expect(result).toBeForbidden();
      });

      it('should allow a modification substituting a sensitive drug with the permission', async () => {
        const sensitiveApp = await baseApp.asNewRole([
          ['create', 'MedicationDispense'],
          ['write', 'MedicationDispense'],
          ['read', 'SensitiveMedication'],
        ]);
        const { pharmacyOrderPrescription } = await createPharmacyOrderWithPrescription({
          patientId: patient.id,
        });
        const { medication: sensitiveDrug } = await createDrug({ isSensitive: true });
        const modifyReason = await createModifyReason();

        const result = await sensitiveApp.post('/api/medication/dispense').send({
          dispensedByUserId: sensitiveApp.user.id,
          facilityId,
          items: [
            {
              pharmacyOrderPrescriptionId: pharmacyOrderPrescription.id,
              quantity: 1,
              instructions: 'whatever',
              modification: buildModification({
                medicationId: sensitiveDrug.id,
                modifiedReasonId: modifyReason.id,
                modifiedById: sensitiveApp.user.id,
              }),
            },
          ],
        });

        expect(result).toHaveSucceeded();
        const persisted = await models.MedicationDispense.findByPk(result.body[0].id);
        expect(persisted.medicationId).toBe(sensitiveDrug.id);
      });
    });
  });

  describe('GET /api/medication/medication-dispenses/:id/modify-history', () => {
    // Creates a fill whose dispensed (substituted) medication is sensitive, while the original
    // prescription's drug is not — so the sensitive-drug gate on the endpoint depends solely on
    // the substitution. The dispense row is created directly (not via the endpoint) so it can be
    // arranged without granting the write/sensitive permissions under test.
    const arrangeSensitiveModifiedDispense = async () => {
      const { pharmacyOrderPrescription } = await createPharmacyOrderWithPrescription({
        patientId: patient.id,
      });
      const { medication: sensitiveDrug } = await createDrug({ isSensitive: true });
      const modifyReason = await createModifyReason();
      const dispense = await models.MedicationDispense.create({
        pharmacyOrderPrescriptionId: pharmacyOrderPrescription.id,
        quantity: 5,
        instructions: 'whatever',
        dispensedByUserId: app.user.id,
        dispensedAt: getCurrentDateTimeString(),
        medicationId: sensitiveDrug.id,
        modifiedById: app.user.id,
        modifiedReasonId: modifyReason.id,
        modifiedAt: getCurrentDateTimeString(),
      });
      return { dispenseId: dispense.id, sensitiveDrugId: sensitiveDrug.id };
    };

    describe('permissions', () => {
      disableHardcodedPermissionsForSuite();

      it('should reject a role with no permissions', async () => {
        const noPermsApp = await baseApp.asNewRole([]);
        const result = await noPermsApp.get(
          `/api/medication/medication-dispenses/${crypto.randomUUID()}/modify-history`,
        );
        expect(result).toBeForbidden();
      });

      it('should reject read MedicationDispense without read SensitiveMedication for a sensitive dispense', async () => {
        const { dispenseId } = await arrangeSensitiveModifiedDispense();
        const limitedApp = await baseApp.asNewRole([['read', 'MedicationDispense']]);

        const result = await limitedApp.get(
          `/api/medication/medication-dispenses/${dispenseId}/modify-history`,
        );

        expect(result).toBeForbidden();
      });

      it('should allow read MedicationDispense with read SensitiveMedication for a sensitive dispense', async () => {
        const { dispenseId, sensitiveDrugId } = await arrangeSensitiveModifiedDispense();
        const sensitiveApp = await baseApp.asNewRole([
          ['read', 'MedicationDispense'],
          ['read', 'SensitiveMedication'],
        ]);

        const result = await sensitiveApp.get(
          `/api/medication/medication-dispenses/${dispenseId}/modify-history`,
        );

        expect(result).toHaveSucceeded();
        expect(result.body.current.medication.id).toBe(sensitiveDrugId);
      });
    });
  });

  describe('GET /api/medication/medication-dispenses', () => {
    const arrangeModifiedDispense = async () => {
      const { pharmacyOrderPrescription, prescription, medication } =
        await createPharmacyOrderWithPrescription({ patientId: patient.id });
      const { medication: substitute } = await createDrug();
      const modifyReason = await createModifyReason();

      const result = await dispenseItems([
        {
          pharmacyOrderPrescriptionId: pharmacyOrderPrescription.id,
          quantity: 16,
          instructions: 'Modified label',
          modification: buildModification({
            medicationId: substitute.id,
            modifiedReasonId: modifyReason.id,
            modifiedById: app.user.id,
          }),
        },
      ]);
      expect(result).toHaveSucceeded();
      return { dispenseId: result.body[0].id, prescription, medication, substitute };
    };

    it('should return dispensed details with isModified and the substituted medication', async () => {
      const { dispenseId, substitute } = await arrangeModifiedDispense();

      const result = await app.get(`/api/medication/medication-dispenses?facilityId=${facilityId}`);
      expect(result).toHaveSucceeded();

      const row = result.body.data.find(d => d.id === dispenseId);
      expect(row).toBeDefined();
      expect(row.isModified).toBe(true);
      expect(row.medication.id).toBe(substitute.id);
      expect(Number(row.doseAmount)).toBe(250);
    });

    it('should filter by the dispensed medication rather than the prescribed one', async () => {
      const { dispenseId, medication, substitute } = await arrangeModifiedDispense();

      const bySubstitute = await app.get(
        `/api/medication/medication-dispenses?facilityId=${facilityId}&medicationId=${substitute.id}`,
      );
      expect(bySubstitute).toHaveSucceeded();
      expect(bySubstitute.body.data.find(d => d.id === dispenseId)).toBeDefined();

      const byOriginal = await app.get(
        `/api/medication/medication-dispenses?facilityId=${facilityId}&medicationId=${medication.id}`,
      );
      expect(byOriginal).toHaveSucceeded();
      expect(byOriginal.body.data.find(d => d.id === dispenseId)).toBeUndefined();
    });

    describe('permissions', () => {
      disableHardcodedPermissionsForSuite();

      it('should hide fills dispensed with a sensitive substitution from users without the permission', async () => {
        const { pharmacyOrderPrescription } = await createPharmacyOrderWithPrescription({
          patientId: patient.id,
        });
        const { medication: sensitiveDrug } = await createDrug({ isSensitive: true });
        const dispense = await models.MedicationDispense.create({
          pharmacyOrderPrescriptionId: pharmacyOrderPrescription.id,
          quantity: 5,
          instructions: 'whatever',
          dispensedByUserId: app.user.id,
          dispensedAt: getCurrentDateTimeString(),
          medicationId: sensitiveDrug.id,
          modifiedById: app.user.id,
          modifiedAt: getCurrentDateTimeString(),
        });

        const limitedApp = await baseApp.asNewRole([['read', 'MedicationDispense']]);
        const hidden = await limitedApp.get(
          `/api/medication/medication-dispenses?facilityId=${facilityId}`,
        );
        expect(hidden).toHaveSucceeded();
        expect(hidden.body.data.find(d => d.id === dispense.id)).toBeUndefined();

        const sensitiveApp = await baseApp.asNewRole([
          ['read', 'MedicationDispense'],
          ['read', 'SensitiveMedication'],
        ]);
        const visible = await sensitiveApp.get(
          `/api/medication/medication-dispenses?facilityId=${facilityId}`,
        );
        expect(visible).toHaveSucceeded();
        expect(visible.body.data.find(d => d.id === dispense.id)).toBeDefined();
      });
    });
  });

  describe('GET /api/patient/:id/dispensed-medications', () => {
    it('should return dispensed details with isModified for the patient', async () => {
      const localPatient = await models.Patient.create(fake(models.Patient));
      const { pharmacyOrderPrescription } = await createPharmacyOrderWithPrescription({
        patientId: localPatient.id,
      });
      const { medication: substitute } = await createDrug();
      const modifyReason = await createModifyReason();

      const dispenseResult = await dispenseItems([
        {
          pharmacyOrderPrescriptionId: pharmacyOrderPrescription.id,
          quantity: 16,
          instructions: 'Modified label',
          modification: buildModification({
            medicationId: substitute.id,
            modifiedReasonId: modifyReason.id,
            modifiedById: app.user.id,
          }),
        },
      ]);
      expect(dispenseResult).toHaveSucceeded();

      const result = await app.get(`/api/patient/${localPatient.id}/dispensed-medications`);
      expect(result).toHaveSucceeded();

      const row = result.body.data.find(d => d.id === dispenseResult.body[0].id);
      expect(row).toBeDefined();
      expect(row.isModified).toBe(true);
      expect(row.medicationId).toBe(substitute.id);
      expect(row.frequency).toBe(ADMINISTRATION_FREQUENCIES.TWO_TIMES_DAILY);
    });

    describe('permissions', () => {
      disableHardcodedPermissionsForSuite();

      // A fill whose original prescription drug is not sensitive but whose dispensed (substituted)
      // medication is — so only the substitution filter can hide the row. Created directly so the
      // arrange needs no write/sensitive permissions. The listing gates sensitive visibility on
      // `list SensitiveMedication` (not `read`).
      const arrangeSensitiveSubstitutedDispense = async patientId => {
        const { pharmacyOrderPrescription } = await createPharmacyOrderWithPrescription({
          patientId,
        });
        const { medication: sensitiveDrug } = await createDrug({ isSensitive: true });
        const modifyReason = await createModifyReason();
        const dispense = await models.MedicationDispense.create({
          pharmacyOrderPrescriptionId: pharmacyOrderPrescription.id,
          quantity: 5,
          instructions: 'whatever',
          dispensedByUserId: app.user.id,
          dispensedAt: getCurrentDateTimeString(),
          medicationId: sensitiveDrug.id,
          modifiedById: app.user.id,
          modifiedReasonId: modifyReason.id,
          modifiedAt: getCurrentDateTimeString(),
        });
        return { dispenseId: dispense.id, sensitiveDrugId: sensitiveDrug.id };
      };

      it('should hide a sensitive substitution from a user without list SensitiveMedication', async () => {
        const localPatient = await models.Patient.create(fake(models.Patient));
        const { dispenseId } = await arrangeSensitiveSubstitutedDispense(localPatient.id);
        const limitedApp = await baseApp.asNewRole([['read', 'MedicationDispense']]);

        const result = await limitedApp.get(
          `/api/patient/${localPatient.id}/dispensed-medications`,
        );

        expect(result).toHaveSucceeded();
        expect(result.body.data.find(d => d.id === dispenseId)).toBeUndefined();
      });

      it('should show a sensitive substitution to a user with list SensitiveMedication', async () => {
        const localPatient = await models.Patient.create(fake(models.Patient));
        const { dispenseId, sensitiveDrugId } = await arrangeSensitiveSubstitutedDispense(
          localPatient.id,
        );
        const sensitiveApp = await baseApp.asNewRole([
          ['read', 'MedicationDispense'],
          ['list', 'SensitiveMedication'],
        ]);

        const result = await sensitiveApp.get(
          `/api/patient/${localPatient.id}/dispensed-medications`,
        );

        expect(result).toHaveSucceeded();
        const row = result.body.data.find(d => d.id === dispenseId);
        expect(row).toBeDefined();
        expect(row.isModified).toBe(true);
        expect(row.medicationId).toBe(sensitiveDrugId);
      });
    });
  });

  describe('GET /api/medication/dispensable-medications', () => {
    // Builds an outstanding (not-yet-dispensed) pharmacy order prescription for the patient, with
    // the prescription fields the dispensing autocalculation relies on set to known values.
    const createDispensablePrescription = async ({
      patientId,
      unitConversion = 250,
      isOngoing = true,
    }) => {
      const { medication } = await createDrug();
      const encounter = await models.Encounter.create(
        fake(models.Encounter, {
          patientId,
          locationId: location.id,
          departmentId: department.id,
          examinerId: app.user.id,
        }),
      );
      const prescription = await models.Prescription.create(
        fake(models.Prescription, {
          medicationId: medication.id,
          prescriberId: app.user.id,
          startDate: getCurrentDateTimeString(),
          unitConversion,
          isOngoing,
        }),
      );
      const pharmacyOrder = await models.PharmacyOrder.create(
        fake(models.PharmacyOrder, {
          orderingClinicianId: app.user.id,
          encounterId: encounter.id,
          date: getCurrentDateTimeString(),
          facilityId,
        }),
      );
      const pharmacyOrderPrescription = await models.PharmacyOrderPrescription.create({
        ...fake(models.PharmacyOrderPrescription, {
          pharmacyOrderId: pharmacyOrder.id,
          prescriptionId: prescription.id,
          quantity: 10,
          repeats: 1,
        }),
        id: crypto.randomUUID(),
      });
      return { pharmacyOrderPrescription, prescription, medication };
    };

    it('should return unitConversion and isOngoing on the dispensable prescriptions', async () => {
      const localPatient = await models.Patient.create(fake(models.Patient));
      const { pharmacyOrderPrescription, prescription } = await createDispensablePrescription({
        patientId: localPatient.id,
        unitConversion: 250,
        isOngoing: true,
      });

      const result = await app.get(
        `/api/medication/dispensable-medications?patientId=${localPatient.id}&facilityId=${facilityId}`,
      );
      expect(result).toHaveSucceeded();

      const row = result.body.data.find(item => item.id === pharmacyOrderPrescription.id);
      expect(row).toBeDefined();
      expect(row.prescription).toMatchObject({
        id: prescription.id,
        isOngoing: true,
      });
      // unitConversion is a DECIMAL, serialised as a string.
      expect(Number(row.prescription.unitConversion)).toBe(250);
    });
  });

  describe('PUT /api/medication/dispense/:id', () => {
    const createDispensedMedication = async ({ patientId } = {}) => {
      const medication = await models.ReferenceData.create(
        fake(models.ReferenceData, { type: REFERENCE_TYPES.DRUG }),
      );
      const encounter = await models.Encounter.create(
        fake(models.Encounter, {
          patientId: patientId ?? patient.id,
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
          repeats: 1,
        }),
        id: crypto.randomUUID(),
      });
      const dispense = await models.MedicationDispense.create(
        fake(models.MedicationDispense, {
          pharmacyOrderPrescriptionId: pharmacyOrderPrescription.id,
          quantity: 5,
          instructions: 'Original instructions',
          dispensedByUserId: app.user.id,
          dispensedAt: getCurrentDateTimeString(),
        }),
      );
      return { dispense };
    };

    it('should update an existing dispense and round-trip medicationPresetLabelId', async () => {
      const presetLabel = await models.ReferenceData.create(
        fake(models.ReferenceData, { type: REFERENCE_TYPES.MEDICATION_PRESET_LABEL }),
      );
      const { dispense } = await createDispensedMedication();

      const result = await app.put(`/api/medication/dispense/${dispense.id}`).send({
        dispensedByUserId: app.user.id,
        quantity: 7,
        instructions: presetLabel.name,
        medicationPresetLabelId: presetLabel.id,
      });

      expect(result).toHaveSucceeded();
      const reloaded = await models.MedicationDispense.findByPk(dispense.id);
      expect(reloaded.quantity).toBe(7);
      expect(reloaded.instructions).toBe(presetLabel.name);
      expect(reloaded.medicationPresetLabelId).toBe(presetLabel.id);
    });

    it('should return 404 when the dispense does not exist', async () => {
      const result = await app.put(`/api/medication/dispense/${crypto.randomUUID()}`).send({
        dispensedByUserId: app.user.id,
        quantity: 1,
        instructions: 'whatever',
      });

      expect(result).toHaveStatus(404);
    });

    describe('permissions', () => {
      disableHardcodedPermissionsForSuite();

      it('should reject a user without write MedicationDispense permission', async () => {
        const noPermsApp = await baseApp.asNewRole([]);
        const { dispense } = await createDispensedMedication();

        const result = await noPermsApp.put(`/api/medication/dispense/${dispense.id}`).send({
          dispensedByUserId: noPermsApp.user.id,
          quantity: 1,
          instructions: 'whatever',
        });

        expect(result).toBeForbidden();
      });
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
      await models.Setting.set('features.invoicing.enabled', true);

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
        dosingUnit: 'mg',
        dispensingUnit: 'mg',
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

    it('should not include invoiceItem when invoicing is disabled', async () => {
      await models.Setting.set('features.invoicing.enabled', false);

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
      expect(found.prescription.invoiceItem).not.toBeDefined();
    });

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

  describe('PUT /api/medication/medication-administration-record/:id', () => {
    const createMar = async () => {
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
        }),
      );
      await models.EncounterPrescription.create(
        fake(models.EncounterPrescription, {
          encounterId: encounter.id,
          prescriptionId: prescription.id,
        }),
      );
      const mar = await models.MedicationAdministrationRecord.create(
        fake(models.MedicationAdministrationRecord, {
          prescriptionId: prescription.id,
          status: ADMINISTRATION_STATUS.GIVEN,
          recordedByUserId: app.user.id,
        }),
      );
      return mar;
    };

    it('should update the error flag when no doses are provided', async () => {
      const mar = await createMar();

      const result = await app.put(`/api/medication/medication-administration-record/${mar.id}`).send({
        isError: true,
        errorNotes: 'Recorded against the wrong patient',
      });

      expect(result).toHaveSucceeded();

      const reloadedMar = await models.MedicationAdministrationRecord.findByPk(mar.id);
      expect(reloadedMar.isError).toBe(true);
      expect(reloadedMar.errorNotes).toBe('Recorded against the wrong patient');
    });
  });
});
