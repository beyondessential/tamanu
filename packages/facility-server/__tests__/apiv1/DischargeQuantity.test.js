import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import config from 'config';

import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

import { createTestContext } from '../utilities';

// A dispensing quantity left blank on the discharge form has to reach the prescription as zero. The
// column is an integer, so an empty string would fail Sequelize's validation and roll the discharge
// back; and a null would leave the discharge summary's Quantity column empty rather than reading 0.
describe('Discharge dispensing quantity', () => {
  const [facilityId] = selectFacilityIds(config);
  let ctx;
  let models;
  let app;
  let patient;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    patient = await models.Patient.create(await createDummyPatient(models));
    const user = await models.User.create({ ...fakeUser(), role: 'practitioner' });
    app = await ctx.baseApp.asUser(user);
  });

  afterAll(() => ctx.close());

  /** An open encounter with one prescription that has no dispensing quantity recorded. */
  const createEncounterWithPrescription = async () => {
    const encounter = await models.Encounter.create(
      await createDummyEncounter(models, { patientId: patient.id, endDate: null }),
    );
    const drug = await models.ReferenceData.create(fake(models.ReferenceData, { type: 'drug' }));
    const prescription = await models.Prescription.create(
      fake(models.Prescription, { medicationId: drug.id, quantity: null, repeats: null }),
    );
    await models.EncounterPrescription.create({
      encounterId: encounter.id,
      prescriptionId: prescription.id,
    });
    return { encounter, prescription };
  };

  const discharge = (encounter, medications) =>
    app.put(`/api/encounter/${encounter.id}`).send({
      endDate: getCurrentDateTimeString(),
      discharge: { dischargerId: app.user.id },
      medications,
      facilityId,
    });

  it.each([
    ['an empty string', ''],
    ['null', null],
  ])('records a quantity of %s as zero', async (_label, quantity) => {
    const { encounter, prescription } = await createEncounterWithPrescription();

    const result = await discharge(encounter, {
      [prescription.id]: { quantity, repeats: '', sendToPharmacy: false },
    });

    expect(result).toHaveSucceeded();
    await prescription.reload();
    expect(prescription.quantity).toBe(0);
    expect(prescription.repeats).toBe(0);
  });

  it('records an omitted quantity as zero', async () => {
    const { encounter, prescription } = await createEncounterWithPrescription();

    const result = await discharge(encounter, {
      [prescription.id]: { sendToPharmacy: false },
    });

    expect(result).toHaveSucceeded();
    await prescription.reload();
    expect(prescription.quantity).toBe(0);
  });

  it('keeps a quantity that was entered', async () => {
    const { encounter, prescription } = await createEncounterWithPrescription();

    const result = await discharge(encounter, {
      [prescription.id]: { quantity: 7, repeats: '0', sendToPharmacy: false },
    });

    expect(result).toHaveSucceeded();
    await prescription.reload();
    expect(prescription.quantity).toBe(7);
  });

  // The discharge summary reads the quantity back off this endpoint, so a blank row has to surface
  // as zero there too rather than as null.
  it('serves the normalised quantity to the encounter medications endpoint', async () => {
    const { encounter, prescription } = await createEncounterWithPrescription();

    await discharge(encounter, {
      [prescription.id]: { quantity: '', repeats: '', sendToPharmacy: false },
    });

    const result = await app.get(`/api/encounter/${encounter.id}/medications`);

    expect(result).toHaveSucceeded();
    const row = result.body.data.find(medication => medication.id === prescription.id);
    expect(row.encounterPrescription.isSelectedForDischarge).toBe(true);
    expect(row.quantity).toBe(0);
  });
});
