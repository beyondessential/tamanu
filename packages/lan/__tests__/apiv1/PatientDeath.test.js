import { VISIBILITY_STATUSES } from 'shared/constants/importable';
import { fake } from 'shared/test-helpers/fake';
import { toDateString } from 'shared/utils/dateTime';
import { createTestContext } from '../utilities';

describe('PatientDeath', () => {
  let app = null;
  let baseApp = null;
  let models = null;
  let ctx;
  let commons;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');

    const { User, Facility, Department, Location, ReferenceData } = models;
    const { id: clinicianId } = await User.create({ ...fake(User), role: 'practitioner' });
    const { id: facilityId } = await Facility.create(fake(Facility));
    const { id: departmentId } = await Department.create({
      ...fake(Department),
      facilityId,
    });
    const { id: locationId } = await Location.create({
      ...fake(Location),
      facilityId,
    });
    const cond1 = await ReferenceData.create({
      id: 'ref/icd10/K07.9',
      type: 'icd10',
      code: 'K07.9',
      name: 'Dentofacial anomaly',
    });
    const cond2 = await ReferenceData.create({
      id: 'ref/icd10/A51.3',
      type: 'icd10',
      code: 'A51.3',
      name: 'Secondary syphilis of skin',
    });
    const cond3 = await ReferenceData.create({
      id: 'ref/icd10/R41.0',
      type: 'icd10',
      code: 'R41.0',
      name: 'Confusion',
    });

    const makeCommon = condition => {
      const { deletedAt, ...dataValues } = condition.dataValues;
      return {
        ...dataValues,
        createdAt: condition.createdAt.toISOString(),
        updatedAt: condition.updatedAt.toISOString(),
      };
    };

    commons = {
      clinicianId,
      facilityId,
      departmentId,
      locationId,
      cond1Id: cond1.id,
      cond2Id: cond2.id,
      cond3Id: cond3.id,
      cond1: makeCommon(cond1),
      cond2: makeCommon(cond2),
      cond3: makeCommon(cond3),
    };
  });
  afterAll(() => ctx.close());

  it('should mark a patient as dead', async () => {
    const { Patient } = models;
    const { id } = await Patient.create({ ...fake(Patient), dateOfDeath: null });
    const { clinicianId, facilityId, cond1Id, cond2Id, cond3Id } = commons;

    const dod = '2021-09-01 00:00:00';
    const result = await app.post(`/v1/patient/${id}/death`).send({
      clinicianId,
      facilityId,
      outsideHealthFacility: false,
      timeOfDeath: dod,
      causeOfDeath: cond1Id,
      causeOfDeathInterval: 100,
      antecedentCause1: cond2Id,
      antecedentCause1Interval: 120,
      antecedentCause2: cond3Id,
      antecedentCause2Interval: 150,
      otherContributingConditions: [{ cause: cond2Id, interval: 400 }],
      surgeryInLast4Weeks: 'yes',
      lastSurgeryDate: '2021-08-02',
      lastSurgeryReason: cond1Id,
      pregnant: 'no',
      mannerOfDeath: 'Accident',
      mannerOfDeathDate: '2021-08-31',
      fetalOrInfant: 'yes',
      stillborn: 'unknown',
      birthWeight: 120,
      numberOfCompletedPregnancyWeeks: 30,
      ageOfMother: 21,
      motherExistingCondition: cond1Id,
      deathWithin24HoursOfBirth: 'yes',
      numberOfHoursSurvivedSinceBirth: 12,
    });
    expect(result).toHaveSucceeded();

    const foundPatient = await Patient.findByPk(id);
    expect(foundPatient.dateOfDeath).toEqual(dod);
  });

  it('should reject with no data', async () => {
    const { Patient } = models;
    const { id } = await Patient.create({ ...fake(Patient), dateOfDeath: null });

    const result = await app.post(`/v1/patient/${id}/death`).send({});
    expect(result).not.toHaveSucceeded();
  });

  it('should reject with invalid data', async () => {
    const { Patient } = models;
    const { id } = await Patient.create({ ...fake(Patient), dateOfDeath: null });

    const result = await app.post(`/v1/patient/${id}/death`).send({
      timeOfDeath: 'this is not a date',
    });
    expect(result).not.toHaveSucceeded();
  });

  it('should mark active encounters as discharged', async () => {
    const { Encounter, Patient } = models;
    const { clinicianId, facilityId, departmentId, locationId, cond1Id } = commons;
    const { id } = await Patient.create({ ...fake(Patient), dateOfDeath: null });
    const { id: encId } = await Encounter.create({
      ...fake(Encounter),
      departmentId,
      locationId,
      patientId: id,
      examinerId: clinicianId,
      endDate: null,
    });

    const result = await app.post(`/v1/patient/${id}/death`).send({
      clinicianId,
      facilityId,
      timeOfDeath: '2021-09-01 00:00:00',
      causeOfDeath: cond1Id,
      causeOfDeathInterval: 100,
      mannerOfDeath: 'Disease',
    });

    expect(result).toHaveSucceeded();

    const encounter = await Encounter.findByPk(encId);
    expect(encounter.endDate).toBeTruthy();

    const discharge = await encounter.getDischarge();
    expect(discharge).toBeTruthy();
    expect(discharge.dischargerId).toEqual(clinicianId);

    const notePages = await encounter.getNotePages();
    const noteItems = (await Promise.all(notePages.map(np => np.getNoteItems()))).flat();
    expect(noteItems[0].content).toEqual('Automatically discharged');
  });

  it('should return no death data for alive patient', async () => {
    const { Patient } = models;
    const { id, dateOfBirth } = await Patient.create({ ...fake(Patient), dateOfDeath: null });

    const result = await app.get(`/v1/patient/${id}/death`);

    expect(result).toHaveStatus(404);
    expect(result.body).toMatchObject({
      patientId: id,
      dateOfBirth: toDateString(dateOfBirth),
      dateOfDeath: null,
    });
  });

  it('should return death data for deceased patient', async () => {
    const { Patient } = models;
    const { id, dateOfBirth } = await Patient.create({ ...fake(Patient), dateOfDeath: null });
    const { clinicianId, facilityId, cond1, cond2, cond3, cond1Id, cond2Id, cond3Id } = commons;

    const dod = '2021-09-01 12:30:25';
    await app.post(`/v1/patient/${id}/death`).send({
      clinicianId,
      facilityId,
      outsideHealthFacility: false,
      timeOfDeath: dod,
      causeOfDeath: cond1Id,
      causeOfDeathInterval: 100,
      antecedentCause1: cond2Id,
      antecedentCause1Interval: 120,
      antecedentCause2: cond3Id,
      antecedentCause2Interval: 150,
      otherContributingConditions: [{ cause: cond2Id, interval: 400 }],
      surgeryInLast4Weeks: 'yes',
      lastSurgeryDate: '2021-08-02',
      lastSurgeryReason: cond1Id,
      pregnant: 'no',
      mannerOfDeath: 'Accident',
      mannerOfDeathDate: '2021-08-31',
      fetalOrInfant: 'yes',
      stillborn: 'unknown',
      birthWeight: 120,
      numberOfCompletedPregnancyWeeks: 30,
      ageOfMother: 21,
      motherExistingCondition: cond1Id,
      deathWithin24HoursOfBirth: 'yes',
      numberOfHoursSurvivedSinceBirth: 12,
    });

    const result = await app.get(`/v1/patient/${id}/death`);

    expect(result).toHaveSucceeded();
    expect(result.body.dateOfDeath).toEqual(dod);
    expect(result.body).toMatchObject({
      patientId: id,
      dateOfBirth: toDateString(dateOfBirth),
      dateOfDeath: dod,
      manner: 'Accident',
      causes: {
        primary: {
          condition: cond1,
          timeAfterOnset: 100,
        },
        antecedent1: {
          condition: cond2,
          timeAfterOnset: 120,
        },
        antecedent2: {
          condition: cond3,
          timeAfterOnset: 150,
        },
        contributing: [
          {
            condition: cond2,
            timeAfterOnset: 400,
          },
        ],
        external: {
          date: '2021-08-31',
        },
      },

      recentSurgery: {
        date: '2021-08-02',
        reasonId: cond1Id,
      },

      pregnancy: 'no',
      fetalOrInfant: {
        birthWeight: 120,
        carrier: {
          age: 21,
          existingConditionId: cond1Id,
          weeksPregnant: 30,
        },
        hoursSurvivedSinceBirth: 12,
        stillborn: 'unknown',
        withinDayOfBirth: true,
      },
    });
  });

  describe('Partial workflow', () => {
    it('should mark a patient as dead with minimal info', async () => {
      const { Patient } = models;
      const { id } = await Patient.create({ ...fake(Patient), dateOfDeath: null });
      const { clinicianId } = commons;

      const dod = '2021-09-01 00:00:00';
      const result = await app.post(`/v1/patient/${id}/death`).send({
        clinicianId,
        timeOfDeath: dod,
        isPartialWorkflow: true,
      });
      expect(result).toHaveSucceeded();

      const foundPatient = await Patient.findByPk(id);
      expect(foundPatient.dateOfDeath).toEqual(dod);
    });

    it('should allow completing partially saved patient death data', async () => {
      const { Patient, PatientDeathData } = models;
      const { id } = await Patient.create({ ...fake(Patient), dateOfDeath: null });
      const { clinicianId, facilityId, cond1Id, cond2Id, cond3Id } = commons;
      const dod = '2021-09-01 00:00:00';
      const formerDeathData = await PatientDeathData.create({
        patientId: id,
        clinicianId,
        timeOfDeath: dod,
        isPartialWorkflow: true,
      });

      const mod = 'Accident';
      const result = await app.post(`/v1/patient/${id}/death`).send({
        clinicianId,
        facilityId,
        outsideHealthFacility: false,
        timeOfDeath: dod,
        causeOfDeath: cond1Id,
        causeOfDeathInterval: 100,
        antecedentCause1: cond2Id,
        antecedentCause1Interval: 120,
        antecedentCause2: cond3Id,
        antecedentCause2Interval: 150,
        otherContributingConditions: [{ cause: cond2Id, interval: 400 }],
        surgeryInLast4Weeks: 'yes',
        lastSurgeryDate: '2021-08-02',
        lastSurgeryReason: cond1Id,
        pregnant: 'no',
        mannerOfDeath: mod,
        mannerOfDeathDate: '2021-08-31',
        fetalOrInfant: 'yes',
        stillborn: 'unknown',
        birthWeight: 120,
        numberOfCompletedPregnancyWeeks: 30,
        ageOfMother: 21,
        motherExistingCondition: cond1Id,
        deathWithin24HoursOfBirth: 'yes',
        numberOfHoursSurvivedSinceBirth: 12,
      });
      expect(result).toHaveSucceeded();

      const deathData = await PatientDeathData.findByPk(formerDeathData.id);
      expect(deathData.manner).toEqual(mod);
    });
  });

  describe('Revert death', () => {
    it('should revert patient death', async () => {
      const { Patient, PatientDeathData } = models;
      const { clinicianId } = commons;
      const { id } = await Patient.create({ ...fake(Patient), dateOfDeath: null });
      await PatientDeathData.create({
        patientId: id,
        clinicianId,
        timeOfDeath: '2021-01-01 00:01:00',
        isFinal: false,
      });

      const result = await app.post(`/v1/patient/${id}/revertDeath`).send({});
      expect(result).toHaveSucceeded();
      const deathData = await PatientDeathData.findAll({
        where: { patientId: id, visibilityStatus: VISIBILITY_STATUSES.CURRENT },
      });
      expect(deathData.length).toBe(0);
    });

    it('should not revert patient death when its final', async () => {
      const { Patient, PatientDeathData } = models;
      const { clinicianId, cond1Id } = commons;
      const { id } = await Patient.create({ ...fake(Patient), dateOfDeath: null });
      await PatientDeathData.create({
        patientId: id,
        clinicianId,
        timeOfDeath: '2021-01-01 00:01:00',
        primaryCauseConditionId: cond1Id,
        manner: 'Accident',
        isFinal: true,
      });

      const result = await app.post(`/v1/patient/${id}/revertDeath`).send({});
      expect(result).not.toHaveSucceeded();
      const deathData = await PatientDeathData.findAll({
        where: { patientId: id, visibilityStatus: VISIBILITY_STATUSES.CURRENT },
      });
      expect(deathData.length).toBe(1);
    });

    it('should create a death revert log', async () => {
      const { Patient, PatientDeathData, DeathRevertLog } = models;
      const { clinicianId } = commons;
      const { id } = await Patient.create({ ...fake(Patient), dateOfDeath: null });
      await PatientDeathData.create({
        patientId: id,
        clinicianId,
        timeOfDeath: '2021-01-01 00:01:00',
        isFinal: false,
      });

      const result = await app.post(`/v1/patient/${id}/revertDeath`).send({});
      expect(result).toHaveSucceeded();
      const revertLog = await DeathRevertLog.findOne({ where: { patientId: id } });
      expect(revertLog).toBeTruthy();
    });
  });
});
