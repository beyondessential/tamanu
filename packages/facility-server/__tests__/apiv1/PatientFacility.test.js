import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import { FACT_CURRENT_SYNC_TICK } from '@tamanu/constants';

describe('PatientFacility', () => {
  let app = null;
  let baseApp = null;
  let models = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    app = await baseApp.asRole('practitioner');
    models = ctx.models;
  });
  afterAll(() => ctx.close());

  it('should create a patient facility when none exists', async () => {
    const { Patient, Facility, PatientFacility, } = models;
    const { id: patientId } = await Patient.create(fake(Patient));
    const { id: facilityId } = await Facility.create(fake(Facility));

    ctx.syncConnection.runSync = jest.fn().mockResolvedValueOnce({});

    const result = await app.post(`/api/patientFacility`).send({ patientId, facilityId });
    expect(result).toHaveSucceeded();

    const patientFacility = await PatientFacility.findOne({ where: { patientId, facilityId } });
    expect(patientFacility).toBeDefined();
  });

  it('should update a patient facility when it already exists', async () => {
    const { Patient, Facility, PatientFacility } = models;
    const { id: patientId } = await Patient.create(fake(Patient));
    const { id: facilityId } = await Facility.create(fake(Facility));
    
    ctx.syncConnection.runSync = jest.fn().mockResolvedValue({});

    await app.post(`/api/patientFacility`).send({ patientId, facilityId });

    const patientFacilityAfterCreate = await PatientFacility.findOne({
      where: { patientId, facilityId },
    });
    const lastInteractedTime = patientFacilityAfterCreate.lastInteractedTime;
    const createdAtSyncTick = patientFacilityAfterCreate.createdAtSyncTick;

    const result = await app.post(`/api/patientFacility`).send({ patientId, facilityId });
    expect(result).toHaveSucceeded();

    const patientFacility = await PatientFacility.findOne({ where: { patientId, facilityId } });
    expect(patientFacility.lastInteractedTime.getTime()).toBeGreaterThan(
      lastInteractedTime.getTime(),
    );
    expect(patientFacility.createdAtSyncTick).toBe(createdAtSyncTick);
  });
});
