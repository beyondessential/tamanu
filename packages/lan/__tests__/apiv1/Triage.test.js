import config from 'config';
import {
  createDummyPatient,
  createDummyEncounter,
  createDummyTriage,
  randomRecordId,
  randomReferenceId,
} from 'shared/demoData';
import { fake } from 'shared/test-helpers';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import { getCurrentDateTimeString } from 'shared/utils/dateTime';
import { createTestContext } from '../utilities';

describe('Triage', () => {
  let app = null;
  let baseApp = null;
  let models = null;
  let facility = null;
  let emergencyDepartment = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');

    facility = await models.Facility.findOne({
      where: { id: config.serverFacilityId },
    });

    [emergencyDepartment] = await models.Department.upsert({
      id: 'emergency',
      code: 'Emergency',
      name: 'Emergency',
      facilityId: config.serverFacilityId,
    });
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

  it('should record arrival mode when admit a patient to triage', async () => {
    const arrivalMode = await models.ReferenceData.create({
      id: 'test-arrival-mode-id',
      type: 'arrivalMode',
      code: 'test-arrival-mode-id',
      name: 'Test arrival mode',
    });
    const encounterPatient = await models.Patient.create(await createDummyPatient(models));
    const response = await app.post('/v1/triage').send(
      await createDummyTriage(models, {
        patientId: encounterPatient.id,
        departmentId: await randomRecordId(models, 'Department'),
        arrivalModeId: arrivalMode.id,
      }),
    );
    expect(response).toHaveSucceeded();

    const createdTriage = await models.Triage.findByPk(response.body.id);
    expect(createdTriage).toBeTruthy();
    expect(createdTriage.arrivalModeId).toEqual(arrivalMode.id);

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
      submittedTime: getCurrentDateTimeString(),
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

  it('should not update the closed time of an already-closed triage', async () => {
    const encounterPatient = await models.Patient.create(await createDummyPatient(models));
    const createdTriage = await models.Triage.create(
      await createDummyTriage(models, {
        patientId: encounterPatient.id,
        departmentId: await randomRecordId(models, 'Department'),
      }),
    );
    const createdEncounter = await models.Encounter.findByPk(createdTriage.encounterId);
    expect(createdEncounter).toBeTruthy();

    const DATE_1 = '2023-01-01 10:00:00';
    const DATE_2 = '2023-01-01 10:30:00';

    // progress encounter once (which should update the triage)
    const progressResponse = await app.put(`/v1/encounter/${createdEncounter.id}`).send({
      encounterType: ENCOUNTER_TYPES.EMERGENCY,
      submittedTime: DATE_1,
    });
    expect(progressResponse).toHaveSucceeded();
    const updatedTriage = await models.Triage.findByPk(createdTriage.id);
    expect(updatedTriage.closedTime).toEqual(DATE_1);

    // and again (which should NOT update the triage)
    const progressResponse2 = await app.put(`/v1/encounter/${createdEncounter.id}`).send({
      encounterType: ENCOUNTER_TYPES.ADMISSION,
      submittedTime: DATE_2,
    });
    expect(progressResponse2).toHaveSucceeded();
    const updatedTriage2 = await models.Triage.findByPk(createdTriage.id);
    expect(updatedTriage2.closedTime).toEqual(DATE_1);
    
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

  it("should use Emergency department for encounter's department", async () => {
    const encounterPatient = await models.Patient.create(await createDummyPatient(models));
    const createdTriage = await models.Triage.create(
      await createDummyTriage(models, {
        patientId: encounterPatient.id,
        chiefComplaintId: await randomReferenceId(models, 'triageReason'),
        secondaryComplaintId: await randomReferenceId(models, 'triageReason'),
      }),
    );
    const createdEncounter = await models.Encounter.findByPk(createdTriage.encounterId);
    expect(createdEncounter.departmentId).toEqual(emergencyDepartment.id);
  });

  it('should throw error when there is no Emergency department for the current facility', async () => {
    const testFacility = await models.Facility.create({
      ...fake(models.Facility, { id: 'testFacility' }),
    });
    await emergencyDepartment.update({ facilityId: testFacility.id });
    const encounterPatient = await models.Patient.create(await createDummyPatient(models));
    await expect(
      models.Triage.create(
        await createDummyTriage(models, {
          patientId: encounterPatient.id,
          chiefComplaintId: await randomReferenceId(models, 'triageReason'),
          secondaryComplaintId: await randomReferenceId(models, 'triageReason'),
        }),
      ),
    ).rejects.toThrow('Cannot find Emergency department for current facility');

    await emergencyDepartment.update({ facilityId: config.serverFacilityId });
  });

  describe('Listing & filtering', () => {
    let createTestTriage;

    beforeAll(async () => {
      await models.Triage.truncate({ cascade: true });

      // create a few test triages
      const { id: locationId } = await models.Location.create({
        ...fake(models.Location),
        facilityId: facility.id,
      });
      const triageConfigs = [
        {
          score: 1,
          triageTime: '2022-01-03 06:15:00',
        },
        {
          score: 2,
          arrivalTime: '2022-01-03 06:15:00',
        },
        {
          score: 3,
          arrivalTime: '2022-01-03 10:15:00',
        },
        {
          score: 3,
          arrivalTime: '2022-01-03 09:15:00',
        },
        {
          score: 3,
          arrivalTime: '2022-01-03 08:15:00',
        },
      ];

      createTestTriage = async overrides => {
        const { Patient, Triage } = models;
        const encounterPatient = await Patient.create(await createDummyPatient(models));
        return Triage.create(
          await createDummyTriage(models, {
            patientId: encounterPatient.id,
            locationId,
            ...overrides,
          }),
        );
      };

      const promises = [];
      triageConfigs.forEach(c => {
        promises.push(createTestTriage(c));
      });
      await Promise.all(promises);
    });

    it('should get a list of triages ordered by score and arrival time', async () => {
      const response = await app.get('/v1/triage');
      const results = response.body;
      expect(results.count).toEqual(5);
      // Test Score
      expect(results.data[0]).toHaveProperty('score', '1');
      expect(results.data[1]).toHaveProperty('score', '2');
      expect(results.data[2]).toHaveProperty('score', '3');

      // Test Arrival Time
      expect(results.data[2]).toHaveProperty('arrivalTime', '2022-01-03 08:15:00');
      expect(results.data[3]).toHaveProperty('arrivalTime', '2022-01-03 09:15:00');
      expect(results.data[4]).toHaveProperty('arrivalTime', '2022-01-03 10:15:00');
    });

    it('should include short stay patients in the triage list', async () => {
      const createdTriage = await createTestTriage();
      const createdEncounter = await models.Encounter.findByPk(createdTriage.encounterId);
      await createdEncounter.update({
        reasonForEncounter: 'Test include short stay',
        encounterType: ENCOUNTER_TYPES.EMERGENCY,
      });
      const response = await app.get('/v1/triage');

      expect(response.body.data.some(b => b.encounterId === createdEncounter.id)).toEqual(true);
    });

    test.todo('should get a list of all triages with relevant attached data');
    test.todo('should filter triages by location');
    test.todo('should filter triages by age range');
    test.todo('should filter triages by chief complaint');
  });
});
