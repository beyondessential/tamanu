import config from 'config';
import {
  createDummyEncounter,
  createDummyPatient,
  createDummyTriage,
  randomRecordId,
  randomReferenceId,
} from '@tamanu/database/demoData';
import { fake } from '@tamanu/fake-data/fake';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { createTestContext } from '../utilities';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

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

    const [facilityId] = selectFacilityIds(config);

    facility = await models.Facility.findOne({
      where: { id: facilityId },
    });

    [emergencyDepartment] = await models.Department.upsert({
      id: 'emergency',
      code: 'Emergency',
      name: 'Emergency',
      facilityId: facility.id,
    });
  });

  afterAll(() => ctx.close());

  it('should admit a patient to triage', async () => {
    const encounterPatient = await models.Patient.create(await createDummyPatient(models));
    const response = await app.post('/api/triage').send(
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
    const response = await app.post('/api/triage').send(
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

    const response = await app.post('/api/triage').send(
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

    const response = await app.post('/api/triage').send(
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

    const progressResponse = await app.put(`/api/encounter/${createdEncounter.id}`).send({
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

    const progressResponse = await app.put(`/api/encounter/${createdEncounter.id}`).send({
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
    const progressResponse = await app.put(`/api/encounter/${createdEncounter.id}`).send({
      encounterType: ENCOUNTER_TYPES.EMERGENCY,
      submittedTime: DATE_1,
    });
    expect(progressResponse).toHaveSucceeded();
    const updatedTriage = await models.Triage.findByPk(createdTriage.id);
    expect(updatedTriage.closedTime).toEqual(DATE_1);

    // and again (which should NOT update the triage)
    const progressResponse2 = await app.put(`/api/encounter/${createdEncounter.id}`).send({
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
    const triageBody = await createDummyTriage(models, {
      patientId: encounterPatient.id,
      chiefComplaintId: await randomReferenceId(models, 'triageReason'),
      secondaryComplaintId: await randomReferenceId(models, 'triageReason'),
    });
    const { body: createdTriage } = await app
      .post('/api/triage')
      .send({ ...triageBody, facilityId: facility.id });
    const createdEncounter = await models.Encounter.findByPk(createdTriage.encounterId);
    expect(createdEncounter.departmentId).toEqual(emergencyDepartment.id);
  });

  it('should throw an error when there is no Emergency department for the current facility', async () => {
    const testFacility = await models.Facility.create({
      ...fake(models.Facility, { id: 'testFacility' }),
    });
    await emergencyDepartment.update({ facilityId: testFacility.id });
    const encounterPatient = await models.Patient.create(await createDummyPatient(models));
    const triageBody = await createDummyTriage(models, {
      patientId: encounterPatient.id,
      chiefComplaintId: await randomReferenceId(models, 'triageReason'),
      secondaryComplaintId: await randomReferenceId(models, 'triageReason'),
    });
    const response = await app.post('/api/triage').send({ ...triageBody, facilityId: facility.id });
    expect(response).toHaveStatus(500);
    expect(response.body?.error?.message).toEqual(
      'Cannot find Emergency department for current facility',
    );

    await emergencyDepartment.update({ facilityId: facility.id });
  });

  it('should throw an error when neither departmentId nor facilityId is provided', async () => {
    const encounterPatient = await models.Patient.create(await createDummyPatient(models));
    const triageBody = await createDummyTriage(models, {
      patientId: encounterPatient.id,
      chiefComplaintId: await randomReferenceId(models, 'triageReason'),
      secondaryComplaintId: await randomReferenceId(models, 'triageReason'),
    });
    const response = await app.post('/api/triage').send(triageBody);
    expect(response).toHaveStatus(500);
    expect(response.body?.error?.message).toEqual(
      'Providing facilityId is required to find the emergency department',
    );

    await emergencyDepartment.update({ facilityId: facility.id });
  });

  describe('Listing & filtering', () => {
    let createTestTriage;
    let bulkCreateTestTriage;
    let locationGroupA;
    let locationGroupB;
    let locationA;
    let locationB;
    let departmentId;
    let clinicianA;
    let clinicianB;

    const getTriageList = (query = {}) => {
      const params = new URLSearchParams({ facilityId: facility.id, ...query });
      return app.get(`/api/triage?${params.toString()}`);
    };

    beforeAll(async () => {
      locationGroupA = await models.LocationGroup.create({
        ...fake(models.LocationGroup),
        id: 'triage-filter-area-a',
        name: 'Triage Filter Area A',
        facilityId: facility.id,
      });
      locationGroupB = await models.LocationGroup.create({
        ...fake(models.LocationGroup),
        id: 'triage-filter-area-b',
        name: 'Triage Filter Area B',
        facilityId: facility.id,
      });
      locationA = await models.Location.create({
        ...fake(models.Location),
        id: 'triage-filter-location-a',
        name: 'Triage Filter Location A',
        locationGroupId: locationGroupA.id,
        facilityId: facility.id,
      });
      locationB = await models.Location.create({
        ...fake(models.Location),
        id: 'triage-filter-location-b',
        name: 'Triage Filter Location B',
        locationGroupId: locationGroupB.id,
        facilityId: facility.id,
      });

      ({ id: departmentId } = await models.Department.create({
        ...fake(models.Department),
        facilityId: facility.id,
      }));

      clinicianA = await models.User.create({
        ...fake(models.User),
        id: 'triage-filter-clinician-a',
        displayName: 'Triage Filter Clinician A',
      });
      clinicianB = await models.User.create({
        ...fake(models.User),
        id: 'triage-filter-clinician-b',
        displayName: 'Triage Filter Clinician B',
      });

      createTestTriage = async (overrides = {}) => {
        const { patient: patientOverrides = {}, ...triageOverrides } = overrides;
        const encounterPatient = await models.Patient.create(
          await createDummyPatient(models, patientOverrides),
        );
        return models.Triage.create(
          await createDummyTriage(models, {
            patientId: encounterPatient.id,
            locationId: locationA.id,
            departmentId,
            ...triageOverrides,
          }),
        );
      };

      bulkCreateTestTriage = async (triageConfigs) => {
        const promises = [];
        triageConfigs.forEach((c) => {
          promises.push(createTestTriage(c));
        });
        await Promise.all(promises);
      };
    });

    beforeEach(async () => {
      await models.Triage.truncate({ cascade: true });
      await models.Encounter.truncate({ cascade: true });
      await models.Patient.truncate({ cascade: true });
    });

    it('should get a list of triages ordered by score and arrival time', async () => {
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
      await bulkCreateTestTriage(triageConfigs);

      const response = await app.get(`/api/triage?facilityId=${facility.id}`);
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

    it('should get a list of triages ordered by clinician display name', async () => {
      await createTestTriage({ practitionerId: clinicianB.id });
      await createTestTriage({ practitionerId: clinicianA.id });

      const response = await getTriageList({ orderBy: 'clinician', order: 'asc' });

      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(2);
      expect(response.body.data[0].clinician).toEqual('Triage Filter Clinician A');
      expect(response.body.data[1].clinician).toEqual('Triage Filter Clinician B');
    });

    it('should include short stay patients in the triage list', async () => {
      const triageConfigs = [
        {
          score: 3,
          triageTime: '2022-01-03 06:15:00',
        },
        {
          score: 2,
          arrivalTime: '2022-01-03 06:15:00',
        },
      ];
      await bulkCreateTestTriage(triageConfigs);

      const createdTriage = await createTestTriage();
      const createdEncounter = await models.Encounter.findByPk(createdTriage.encounterId);
      await createdEncounter.update({
        reasonForEncounter: 'Test include short stay',
        encounterType: ENCOUNTER_TYPES.EMERGENCY,
      });
      const response = await app.get(`/api/triage?facilityId=${facility.id}`);

      expect(response.body.data.some((b) => b.encounterId === createdEncounter.id)).toEqual(true);
    });

    it('should include active ED care patients in the triage list', async () => {
      const createdTriage = await createTestTriage();
      const createdEncounter = await models.Encounter.findByPk(createdTriage.encounterId);
      await createdEncounter.update({
        reasonForEncounter: 'Test include active ED care',
        encounterType: ENCOUNTER_TYPES.OBSERVATION,
      });
      const response = await app.get(`/api/triage?facilityId=${facility.id}`);

      expect(response).toHaveSucceeded();
      expect(response.body.data.some((b) => b.encounterId === createdEncounter.id)).toEqual(true);
      expect(
        response.body.data.find((b) => b.encounterId === createdEncounter.id).encounterType,
      ).toEqual(ENCOUNTER_TYPES.OBSERVATION);
    });

    it('should filter triages by patient display ID', async () => {
      await createTestTriage({ patient: { displayId: 'TRIAGE-FILTER-001' } });
      await createTestTriage({ patient: { displayId: 'TRIAGE-FILTER-002' } });

      const response = await getTriageList({ displayId: 'FILTER-001' });

      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(1);
      expect(response.body.data[0].displayId).toEqual('TRIAGE-FILTER-001');
    });

    it('should filter triages by first name', async () => {
      await createTestTriage({ patient: { firstName: 'TriageFilterFirstA' } });
      await createTestTriage({ patient: { firstName: 'TriageFilterFirstB' } });

      const response = await getTriageList({ firstName: 'FilterFirstA' });

      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(1);
      expect(response.body.data[0].firstName).toEqual('TriageFilterFirstA');
    });

    it('should filter triages by last name', async () => {
      await createTestTriage({ patient: { lastName: 'TriageFilterLastA' } });
      await createTestTriage({ patient: { lastName: 'TriageFilterLastB' } });

      const response = await getTriageList({ lastName: 'FilterLastA' });

      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(1);
      expect(response.body.data[0].lastName).toEqual('TriageFilterLastA');
    });

    it('should filter triages by clinician', async () => {
      await createTestTriage({ practitionerId: clinicianA.id });
      await createTestTriage({ practitionerId: clinicianB.id });

      const response = await getTriageList({ clinicianId: clinicianA.id });

      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(1);
      expect(response.body.data[0].clinician).toEqual('Triage Filter Clinician A');
    });

    it('should filter triages by triage category', async () => {
      await createTestTriage({ score: 2 });
      await createTestTriage({ score: 4 });

      const response = await getTriageList({ score: '2' });

      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(1);
      expect(response.body.data[0].score).toEqual('2');
    });

    it('should filter triages by area', async () => {
      await createTestTriage({ locationId: locationA.id });
      await createTestTriage({ locationId: locationB.id });

      const response = await getTriageList({ locationGroupId: locationGroupA.id });

      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(1);
      expect(response.body.data[0].locationId).toEqual(locationA.id);
    });

    it('should filter triages by location', async () => {
      await createTestTriage({ locationId: locationA.id });
      await createTestTriage({ locationId: locationB.id });

      const response = await getTriageList({ locationId: locationB.id });

      expect(response).toHaveSucceeded();
      expect(response.body.count).toEqual(1);
      expect(response.body.data[0].locationId).toEqual(locationB.id);
    });
  });
});
