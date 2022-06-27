import {
  createDummyPatient,
  createDummyEncounter,
  createDummyTriage,
  randomRecordId,
  randomReferenceId,
} from 'shared/demoData';
import { ENCOUNTER_TYPES } from 'shared/constants';
import { createTestContext } from '../utilities';

describe('Triage', () => {
  let app = null;
  let baseApp = null;
  let models = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

  it('should admit a patient to triage', async () => {
    const encounterPatient = await models.Patient.create(await createDummyPatient(models));
    const response = await app.post('/v1/triage').send(
      await createDummyTriage(models, {
        patientId: encounterPatient.id,
        departmentId: await randomRecordId(models, 'Department'),
      }),
    );
    expect(response).toHaveSucceeded();

    const createdTriage = await models.Triage.findByPk(response.body.id);
    expect(createdTriage).toBeTruthy();
    const createdEncounter = await models.Encounter.findByPk(createdTriage.encounterId);
    expect(createdEncounter).toBeTruthy();
  });

  it('should fail to triage if an encounter is already open', async () => {
    const encounterPatient = await models.Patient.create(await createDummyPatient(models));
    const encounter = await models.Encounter.create(
      await createDummyEncounter(models, {
        current: true,
        patientId: encounterPatient.id,
      }),
    );

    expect(encounter.endDate).toBeFalsy();

    const response = await app.post('/v1/triage').send(
      await createDummyTriage(models, {
        patientId: encounterPatient.id,
        departmentId: await randomRecordId(models, 'Department'),
      }),
    );
    expect(response).toHaveRequestError();
  });

  it('should successfully triage if the existing encounter is closed', async () => {
    const encounterPatient = await models.Patient.create(await createDummyPatient(models));
    const encounter = await models.Encounter.create(
      await createDummyEncounter(models, {
        current: false,
        patientId: encounterPatient.id,
      }),
    );

    expect(encounter.endDate).toBeTruthy();

    const response = await app.post('/v1/triage').send(
      await createDummyTriage(models, {
        patientId: encounterPatient.id,
        departmentId: await randomRecordId(models, 'Department'),
      }),
    );
    expect(response).toHaveSucceeded();
  });

  it('should close a triage by progressing an encounter', async () => {
    const encounterPatient = await models.Patient.create(await createDummyPatient(models));
    const createdTriage = await models.Triage.create(
      await createDummyTriage(models, {
        patientId: encounterPatient.id,
        departmentId: await randomRecordId(models, 'Department'),
      }),
    );
    const createdEncounter = await models.Encounter.findByPk(createdTriage.encounterId);
    expect(createdEncounter).toBeTruthy();

    const progressResponse = await app.put(`/v1/encounter/${createdEncounter.id}`).send({
      encounterType: ENCOUNTER_TYPES.EMERGENCY,
    });
    expect(progressResponse).toHaveSucceeded();
    const updatedTriage = await models.Triage.findByPk(createdTriage.id);
    expect(updatedTriage.closedTime).toBeTruthy();
  });

  it('should close a triage by discharging an encounter', async () => {
    const encounterPatient = await models.Patient.create(await createDummyPatient(models));
    const createdTriage = await models.Triage.create(
      await createDummyTriage(models, {
        patientId: encounterPatient.id,
        departmentId: await randomRecordId(models, 'Department'),
      }),
    );
    const createdEncounter = await models.Encounter.findByPk(createdTriage.encounterId);
    expect(createdEncounter).toBeTruthy();

    const progressResponse = await app.put(`/v1/encounter/${createdEncounter.id}`).send({
      endDate: Date.now(),
    });
    expect(progressResponse).toHaveSucceeded();
    const updatedTriage = await models.Triage.findByPk(createdTriage.id);
    expect(updatedTriage.closedTime).toBeTruthy();
  });

  it('should set the encounter reason to the text of the chief complaints', async () => {
    const encounterPatient = await models.Patient.create(await createDummyPatient(models));
    const createdTriage = await models.Triage.create(
      await createDummyTriage(models, {
        patientId: encounterPatient.id,
        chiefComplaintId: await randomReferenceId(models, 'triageReason'),
        secondaryComplaintId: null,
        departmentId: await randomRecordId(models, 'Department'),
      }),
    );
    const reason = await models.ReferenceData.findByPk(createdTriage.chiefComplaintId);
    const createdEncounter = await models.Encounter.findByPk(createdTriage.encounterId);
    expect(createdEncounter).toBeTruthy();
    expect(createdEncounter.reasonForEncounter).toContain(reason.name);
  });

  it('should concatenate multiple encounter reasons', async () => {
    const encounterPatient = await models.Patient.create(await createDummyPatient(models));
    const createdTriage = await models.Triage.create(
      await createDummyTriage(models, {
        patientId: encounterPatient.id,
        chiefComplaintId: await randomReferenceId(models, 'triageReason'),
        secondaryComplaintId: await randomReferenceId(models, 'triageReason'),
        departmentId: await randomRecordId(models, 'Department'),
      }),
    );
    const chiefReason = await models.ReferenceData.findByPk(createdTriage.chiefComplaintId);
    const secondaryReason = await models.ReferenceData.findByPk(createdTriage.secondaryComplaintId);
    const createdEncounter = await models.Encounter.findByPk(createdTriage.encounterId);
    expect(createdEncounter).toBeTruthy();
    expect(createdEncounter.reasonForEncounter).toContain(chiefReason.name);
    expect(createdEncounter.reasonForEncounter).toContain(secondaryReason.name);
  });

  describe('listing & filtering', () => {
    beforeAll(() => {
      // create a few test triages
    });

    test.todo('should get a list of all triages with relevant attached data');
    test.todo('should filter triages by location');
    test.todo('should filter triages by age range');
    test.todo('should filter triages by chief complaint');
  });
});
