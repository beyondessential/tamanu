import config from 'config';

import { REFERENCE_TYPES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

import {
  up as backfillUp,
  down as backfillDown,
} from '@tamanu/database/migrations/1783404000001-backfillDispensedDetailsFromPrescriptions';
import { createTestContext } from '../utilities';

// The backfill migration copies the "what was dispensed" detail columns onto historical
// medication_dispenses rows from the prescription they were dispensed against. These tests run
// its up()/down() directly against seeded rows (the columns already exist — the DDL migration
// ran at test-DB setup).
describe('backfillDispensedDetailsFromPrescriptions migration', () => {
  const [facilityId] = selectFacilityIds(config);
  let ctx;
  let models;
  let queryInterface;
  let location;
  let department;
  let examiner;

  const seedDispense = async ({ prescriptionOverrides = {}, dispenseOverrides = {} } = {}) => {
    const medication = await models.ReferenceData.create(
      fake(models.ReferenceData, { type: REFERENCE_TYPES.DRUG }),
    );
    const patient = await models.Patient.create(fake(models.Patient));
    const encounter = await models.Encounter.create(
      fake(models.Encounter, {
        patientId: patient.id,
        locationId: location.id,
        departmentId: department.id,
        examinerId: examiner.id,
        endDate: getCurrentDateTimeString(),
      }),
    );
    const prescription = await models.Prescription.create(
      fake(models.Prescription, {
        medicationId: medication.id,
        prescriberId: examiner.id,
        isVariableDose: false,
        doseAmount: 2,
        dosingUnit: 'mg',
        dispensingUnit: 'Tablet',
        frequency: 'Two times daily',
        route: 'oral',
        durationValue: 5,
        durationUnit: 'days',
        pharmacyNotes: 'Original pharmacy note',
        displayPharmacyNotesInMar: true,
        ...prescriptionOverrides,
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
        orderingClinicianId: examiner.id,
        encounterId: encounter.id,
        date: getCurrentDateTimeString(),
        facilityId,
      }),
    );
    const pop = await models.PharmacyOrderPrescription.create({
      ...fake(models.PharmacyOrderPrescription, {
        pharmacyOrderId: pharmacyOrder.id,
        prescriptionId: prescription.id,
        quantity: 10,
      }),
      id: crypto.randomUUID(),
    });
    // Create the dispense with no dispensed-detail columns — a pre-feature (historical) row.
    const dispense = await models.MedicationDispense.create({
      pharmacyOrderPrescriptionId: pop.id,
      quantity: 10,
      dispensedByUserId: examiner.id,
      dispensedAt: getCurrentDateTimeString(),
      ...dispenseOverrides,
    });
    return { dispense, prescription, medication };
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    queryInterface = ctx.sequelize.getQueryInterface();

    const locationGroup = await models.LocationGroup.create(
      fake(models.LocationGroup, { facilityId }),
    );
    location = await models.Location.create(
      fake(models.Location, { locationGroupId: locationGroup.id, facilityId }),
    );
    department = await models.Department.create(fake(models.Department, { facilityId }));
    examiner = await models.User.create(fake(models.User));
  });

  afterEach(async () => {
    await models.MedicationDispense.truncate({ cascade: true, force: true });
    await models.PharmacyOrderPrescription.truncate({ cascade: true, force: true });
    await models.PharmacyOrder.truncate({ cascade: true, force: true });
    await models.Prescription.truncate({ cascade: true, force: true });
    await models.EncounterPrescription.truncate({ cascade: true, force: true });
    await models.Encounter.truncate({ cascade: true, force: true });
  });

  afterAll(() => ctx.close());

  it('backfills the dispensed detail columns from the linked prescription', async () => {
    const { dispense, prescription } = await seedDispense();
    expect(dispense.medicationId).toBeNull();

    await backfillUp(queryInterface);

    await dispense.reload();
    expect(dispense.medicationId).toBe(prescription.medicationId);
    expect(dispense.isVariableDose).toBe(false);
    expect(Number(dispense.doseAmount)).toBe(2);
    expect(dispense.dosingUnit).toBe('mg');
    expect(dispense.dispensingUnit).toBe('Tablet');
    expect(dispense.frequency).toBe('Two times daily');
    expect(dispense.route).toBe('oral');
    expect(Number(dispense.durationValue)).toBe(5);
    expect(dispense.durationUnit).toBe('days');
    expect(dispense.pharmacyNotes).toBe('Original pharmacy note');
    expect(dispense.displayPharmacyNotesInMar).toBe(true);
    // Historical dispenses were dispensed as prescribed — never marked modified
    expect(dispense.modifiedAt).toBeNull();
    expect(dispense.modifiedById).toBeNull();
  });

  it('does not overwrite a dispense that already has a dispensed medication (a modification)', async () => {
    const substitute = await models.ReferenceData.create(
      fake(models.ReferenceData, { type: REFERENCE_TYPES.DRUG }),
    );
    const { dispense } = await seedDispense({
      dispenseOverrides: {
        medicationId: substitute.id,
        doseAmount: 999,
        frequency: 'Daily',
        modifiedAt: getCurrentDateTimeString(),
      },
    });

    await backfillUp(queryInterface);

    await dispense.reload();
    // The modified values are preserved (WHERE medication_id IS NULL excludes this row)
    expect(dispense.medicationId).toBe(substitute.id);
    expect(Number(dispense.doseAmount)).toBe(999);
    expect(dispense.frequency).toBe('Daily');
  });

  it('copies nulls for prescription fields that are unset', async () => {
    const { dispense } = await seedDispense({
      prescriptionOverrides: {
        durationValue: null,
        durationUnit: null,
        pharmacyNotes: null,
      },
    });

    await backfillUp(queryInterface);

    await dispense.reload();
    expect(dispense.durationValue).toBeNull();
    expect(dispense.durationUnit).toBeNull();
    expect(dispense.pharmacyNotes).toBeNull();
    // Still backfills the fields that are set
    expect(dispense.frequency).toBe('Two times daily');
  });

  it('down() clears the backfilled columns for unmodified dispenses only', async () => {
    const { dispense: unmodified } = await seedDispense();
    const substitute = await models.ReferenceData.create(
      fake(models.ReferenceData, { type: REFERENCE_TYPES.DRUG }),
    );
    const { dispense: modified } = await seedDispense({
      dispenseOverrides: {
        medicationId: substitute.id,
        frequency: 'Daily',
        modifiedAt: getCurrentDateTimeString(),
      },
    });

    await backfillUp(queryInterface);
    await backfillDown(queryInterface);

    await unmodified.reload();
    expect(unmodified.medicationId).toBeNull();
    expect(unmodified.frequency).toBeNull();

    await modified.reload();
    // A modified dispense (modifiedAt set) is left untouched by down()
    expect(modified.medicationId).toBe(substitute.id);
    expect(modified.frequency).toBe('Daily');
  });
});
