import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import config from 'config';
import { fake } from '@tamanu/fake-data/fake';
import { AVPU_TYPES, REFERRAL_STATUSES } from '@tamanu/constants';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { disableHardcodedPermissionsForSuite } from '@tamanu/shared/test-helpers';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

import { createTestContext } from '../utilities';

// Every endpoint below is a simplePut or simplePost mount, so the crud helpers filter its
// body down to the endpoint's allowedFields. Each case checks both halves of that: the
// body real clients send still works (the web sends a whole record back on PUT, id and
// audit timestamps included), and nothing outside allowedFields reaches the database.

const CLIENT_SUPPLIED_CREATED_AT = '2000-01-01 00:00:00';

// Several of these models hold a unique index on code, and each case builds a fresh
// record per test.
let sequence = 0;
const uniqueCode = () => `crud-helpers-${(sequence += 1)}`;

describe('Crud helper field filtering', () => {
  // asNewRole grants exactly the permissions each endpoint needs, which only takes effect
  // once the hardcoded role definitions are out of the way.
  disableHardcodedPermissionsForSuite();

  let ctx;
  let baseApp;
  let models;
  let facilityId;
  let patient;
  let otherPatient;
  let encounter;
  let otherEncounter;
  let clinicianId;
  let allergyId;
  let diagnosisId;
  let carePlanId;
  let locationGroupId;
  let labRequest;
  let noPermsApp;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    [facilityId] = selectFacilityIds(config);

    const clinician = await models.User.create({
      email: 'crud-helpers@tamanu.io',
      displayName: 'Crud Helpers',
      password: 'crud-helpers',
      role: 'practitioner',
    });
    clinicianId = clinician.id;

    noPermsApp = await baseApp.asNewRole([]);

    patient = await models.Patient.create(await createDummyPatient(models));
    otherPatient = await models.Patient.create(await createDummyPatient(models));
    encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });
    otherEncounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: otherPatient.id,
    });

    const reference = async type =>
      (
        await models.ReferenceData.create({
          type,
          code: uniqueCode(),
          name: `Crud helpers ${type}`,
        })
      ).id;
    allergyId = await reference('allergy');
    diagnosisId = await reference('diagnosis');
    carePlanId = await reference('carePlan');

    labRequest = await models.LabRequest.create({
      ...fake(models.LabRequest),
      encounterId: encounter.id,
    });

    const locationGroup = await models.LocationGroup.create({
      code: uniqueCode(),
      name: 'Crud helpers group',
      facilityId,
    });
    locationGroupId = locationGroup.id;
  });

  afterAll(() => ctx.close());

  const permissionsFor = subject => [
    ['read', subject],
    ['write', subject],
    ['create', subject],
    ['list', subject],
  ];

  const storedCreatedAtYear = async (modelName, id) => {
    const record = await models[modelName].findByPk(id, { paranoid: false });
    return new Date(record.createdAt).getFullYear();
  };

  // ---------------------------------------------------------------- simplePost

  const postCases = [
    {
      subject: 'PatientAllergy',
      endpoint: 'allergy',
      body: () => ({ patientId: patient.id, allergyId, note: 'Initial note' }),
      persisted: () => ({ note: 'Initial note' }),
    },
    {
      subject: 'PatientCondition',
      endpoint: 'ongoingCondition',
      body: () => ({ patientId: patient.id, conditionId: diagnosisId, note: 'Initial note' }),
      persisted: () => ({ note: 'Initial note' }),
    },
    {
      subject: 'PatientFamilyHistory',
      endpoint: 'familyHistory',
      body: () => ({ patientId: patient.id, diagnosisId, relationship: 'mother' }),
      persisted: () => ({ relationship: 'mother' }),
    },
    {
      subject: 'PatientIssue',
      endpoint: 'patientIssue',
      body: () => ({ patientId: patient.id, note: 'Initial note' }),
      persisted: () => ({ note: 'Initial note' }),
    },
    {
      subject: 'EncounterDiagnosis',
      endpoint: 'diagnosis',
      body: () => ({ encounterId: encounter.id, diagnosisId, certainty: 'confirmed' }),
      persisted: () => ({ certainty: 'confirmed' }),
    },
    {
      subject: 'Vitals',
      endpoint: 'vitals',
      body: () => ({ encounterId: encounter.id, temperature: 37.2 }),
      persisted: () => ({ temperature: 37.2 }),
    },
    {
      subject: 'ReferenceData',
      endpoint: 'referenceData',
      body: () => ({ code: uniqueCode(), type: 'allergy', name: 'Created' }),
      persisted: () => ({ name: 'Created' }),
      // systemRequired guards reference data the importer refuses to overwrite, so it
      // must not be settable over the API.
      rejected: () => ({ systemRequired: true }),
      unchanged: () => ({ systemRequired: false }),
    },
    {
      subject: 'Location',
      endpoint: 'location',
      body: () => ({
        code: uniqueCode(),
        name: 'Crud helpers location',
        facilityId,
        locationGroupId,
      }),
      persisted: () => ({ name: 'Crud helpers location' }),
    },
    {
      subject: 'LocationGroup',
      endpoint: 'locationGroup',
      body: () => ({
        code: uniqueCode(),
        name: 'Crud helpers created group',
        facilityId,
      }),
      persisted: () => ({ name: 'Crud helpers created group' }),
    },
    {
      subject: 'Program',
      endpoint: 'program',
      body: () => ({ code: uniqueCode(), name: 'Crud helpers program' }),
      persisted: () => ({ name: 'Crud helpers program' }),
    },
    {
      subject: 'CertificateNotification',
      endpoint: 'certificateNotification',
      body: () => ({
        type: 'covid_19_clearance',
        patientId: patient.id,
        forwardAddress: 'someone@tamanu.io',
        createdBy: 'Crud Helpers',
      }),
      persisted: () => ({ forwardAddress: 'someone@tamanu.io', language: 'fr' }),
      headers: { language: 'fr' },
      generatesId: true,
      rejected: () => ({ labRequestId: labRequest.id }),
      unchanged: () => ({ labRequestId: null }),
    },
  ];

  describe.each(postCases)('POST $endpoint', testCase => {
    let app;

    beforeAll(async () => {
      app = await baseApp.asNewRole(permissionsFor(testCase.subject));
    });

    const post = body =>
      app
        .post(`/api/${testCase.endpoint}`)
        .set(testCase.headers ?? {})
        .send(body);

    it('creates a record from the body the client sends', async () => {
      const result = await post(testCase.body());
      expect(result).toHaveSucceeded();
      expect(result.body).toMatchObject(testCase.persisted());
    });

    it('ignores a client-supplied createdAt', async () => {
      const result = await post({ ...testCase.body(), createdAt: CLIENT_SUPPLIED_CREATED_AT });
      expect(result).toHaveSucceeded();
      expect(await storedCreatedAtYear(testCase.subject, result.body.id)).toBeGreaterThan(2000);
    });

    it('refuses a caller without create permission', async () => {
      const result = await noPermsApp
        .post(`/api/${testCase.endpoint}`)
        .set(testCase.headers ?? {})
        .send(testCase.body());
      expect(result).toBeForbidden();
    });

    if (testCase.generatesId) {
      it('generates an id rather than taking the one in the body', async () => {
        const first = await post(testCase.body());
        expect(first).toHaveSucceeded();

        const second = await post({ ...testCase.body(), id: first.body.id });
        expect(second).toHaveSucceeded();
        expect(second.body.id).not.toEqual(first.body.id);
      });
    } else {
      it('refuses to create a record whose id already exists', async () => {
        const first = await post(testCase.body());
        expect(first).toHaveSucceeded();

        const second = await post({ ...testCase.body(), id: first.body.id });
        expect(second).toHaveRequestError();
      });
    }

    if (testCase.rejected) {
      it('ignores fields outside allowedFields', async () => {
        const result = await post({ ...testCase.body(), ...testCase.rejected() });
        expect(result).toHaveSucceeded();
        if (testCase.unchanged) {
          const record = await models[testCase.subject].findByPk(result.body.id);
          expect(record.get({ plain: true })).toMatchObject(testCase.unchanged());
        }
      });
    }
  });

  // ----------------------------------------------------------------- simplePut

  const putCases = [
    {
      subject: 'PatientAllergy',
      endpoint: 'allergy',
      create: () =>
        models.PatientAllergy.create({ patientId: patient.id, allergyId, note: 'Before' }),
      update: () => ({ note: 'After' }),
      // Reassigning the record to another patient is not the endpoint's job.
      rejected: () => ({ patientId: otherPatient.id }),
      unchanged: () => ({ patientId: patient.id }),
    },
    {
      subject: 'PatientCondition',
      endpoint: 'ongoingCondition',
      create: () =>
        models.PatientCondition.create({
          patientId: patient.id,
          conditionId: diagnosisId,
          note: 'Before',
        }),
      update: () => ({ note: 'After', resolved: true }),
      rejected: () => ({ patientId: otherPatient.id }),
      unchanged: () => ({ patientId: patient.id }),
    },
    {
      subject: 'PatientFamilyHistory',
      endpoint: 'familyHistory',
      create: () =>
        models.PatientFamilyHistory.create({
          patientId: patient.id,
          diagnosisId,
          relationship: 'mother',
        }),
      update: () => ({ relationship: 'father' }),
      rejected: () => ({ patientId: otherPatient.id }),
      unchanged: () => ({ patientId: patient.id }),
    },
    {
      subject: 'PatientIssue',
      endpoint: 'patientIssue',
      create: () => models.PatientIssue.create({ patientId: patient.id, note: 'Before' }),
      update: () => ({ note: 'After' }),
      rejected: () => ({ patientId: otherPatient.id }),
      unchanged: () => ({ patientId: patient.id }),
    },
    {
      subject: 'PatientCarePlan',
      endpoint: 'patientCarePlan',
      create: () =>
        models.PatientCarePlan.create({
          patientId: patient.id,
          carePlanId,
          examinerId: clinicianId,
        }),
      update: () => ({ date: '2024-05-06 07:08:09' }),
      rejected: () => ({ patientId: otherPatient.id }),
      unchanged: () => ({ patientId: patient.id }),
    },
    {
      subject: 'EncounterDiagnosis',
      endpoint: 'diagnosis',
      create: () =>
        models.EncounterDiagnosis.create({
          encounterId: encounter.id,
          diagnosisId,
          certainty: 'suspected',
        }),
      update: () => ({ certainty: 'confirmed' }),
      rejected: () => ({ encounterId: otherEncounter.id }),
      unchanged: () => ({ encounterId: encounter.id }),
    },
    {
      subject: 'Vitals',
      endpoint: 'vitals',
      create: () => models.Vitals.create({ encounterId: encounter.id, temperature: 37 }),
      update: () => ({ temperature: 38.5 }),
      rejected: () => ({ encounterId: otherEncounter.id }),
      unchanged: () => ({ encounterId: encounter.id }),
    },
    {
      subject: 'Referral',
      endpoint: 'referral',
      create: () =>
        models.Referral.create({
          initiatingEncounterId: encounter.id,
          status: REFERRAL_STATUSES.PENDING,
        }),
      update: () => ({ status: REFERRAL_STATUSES.COMPLETED }),
      rejected: () => ({ initiatingEncounterId: otherEncounter.id }),
      unchanged: () => ({ initiatingEncounterId: encounter.id }),
    },
    {
      subject: 'ReferenceData',
      endpoint: 'referenceData',
      create: () =>
        models.ReferenceData.create({
          code: uniqueCode(),
          type: 'allergy',
          name: 'Before',
        }),
      update: () => ({ name: 'After' }),
      rejected: () => ({ systemRequired: true }),
      unchanged: () => ({ systemRequired: false }),
    },
    {
      subject: 'Location',
      endpoint: 'location',
      create: () =>
        models.Location.create({
          code: uniqueCode(),
          name: 'Before',
          facilityId,
          locationGroupId,
        }),
      update: () => ({ name: 'After' }),
    },
    {
      subject: 'LocationGroup',
      endpoint: 'locationGroup',
      create: () =>
        models.LocationGroup.create({
          code: uniqueCode(),
          name: 'Before',
          facilityId,
        }),
      update: () => ({ name: 'After' }),
    },
    {
      subject: 'Program',
      endpoint: 'program',
      create: () => models.Program.create({ code: uniqueCode(), name: 'Before' }),
      update: () => ({ name: 'After' }),
    },
  ];

  describe.each(putCases)('PUT $endpoint', testCase => {
    let app;

    beforeAll(async () => {
      app = await baseApp.asNewRole(permissionsFor(testCase.subject));
    });

    // The web reads a record, spreads it into a form, and sends the lot back: the body
    // carries the id, createdAt, updatedAt and any nested association objects.
    it('accepts the whole record the client read back', async () => {
      const record = await testCase.create();
      const roundTripped = {
        ...record.forResponse(),
        // The web spreads the fetched record into its form, associations included.
        someAssociation: { id: 'nested-object-id', name: 'Nested object' },
        ...testCase.update(),
      };

      const result = await app.put(`/api/${testCase.endpoint}/${record.id}`).send(roundTripped);

      expect(result).toHaveSucceeded();
      await record.reload();
      expect(record.get({ plain: true })).toMatchObject(testCase.update());
    });

    it('refuses a caller without write permission', async () => {
      const record = await testCase.create();

      const result = await noPermsApp
        .put(`/api/${testCase.endpoint}/${record.id}`)
        .send(testCase.update());

      expect(result).toBeForbidden();
    });

    it('keeps its own id when the body carries a different one', async () => {
      const record = await testCase.create();
      const other = await testCase.create();

      const result = await app
        .put(`/api/${testCase.endpoint}/${record.id}`)
        .send({ ...testCase.update(), id: other.id });

      expect(result).toHaveSucceeded();
      const stored = await models[testCase.subject].findByPk(record.id);
      expect(stored).not.toBeNull();
      expect(stored.get({ plain: true })).toMatchObject(testCase.update());
      const untouched = await models[testCase.subject].findByPk(other.id);
      expect(untouched).not.toBeNull();
    });

    it.each([null, '2024-01-01 00:00:00'])(
      'ignores a client-supplied deletedAt of %s',
      async deletedAt => {
        const record = await testCase.create();

        const result = await app
          .put(`/api/${testCase.endpoint}/${record.id}`)
          .send({ ...testCase.update(), deletedAt });

        expect(result).toHaveSucceeded();
        const stored = await models[testCase.subject].findByPk(record.id);
        expect(stored).not.toBeNull();
        expect(stored.deletedAt).toBeFalsy();
      },
    );

    it('ignores a client-supplied createdAt', async () => {
      const record = await testCase.create();

      const result = await app
        .put(`/api/${testCase.endpoint}/${record.id}`)
        .send({ ...testCase.update(), createdAt: CLIENT_SUPPLIED_CREATED_AT });

      expect(result).toHaveSucceeded();
      expect(await storedCreatedAtYear(testCase.subject, record.id)).toBeGreaterThan(2000);
    });

    if (testCase.rejected) {
      it('ignores fields outside allowedFields', async () => {
        const record = await testCase.create();

        const result = await app
          .put(`/api/${testCase.endpoint}/${record.id}`)
          .send({ ...testCase.update(), ...testCase.rejected() });

        expect(result).toHaveSucceeded();
        await record.reload();
        expect(record.get({ plain: true })).toMatchObject({
          ...testCase.update(),
          ...testCase.unchanged(),
        });
      });
    }
  });
  // vitals hand-lists 23 observation columns, and the other route files list up to 10. A
  // column left out of one of those lists is filtered out silently, so send every one and
  // check each lands. vitals is the widest, so it is the one worth doing exhaustively.
  describe('vitals with every observation set', () => {
    const OBSERVATIONS = {
      avpu: AVPU_TYPES.ALERT,
      bloodInUrine: 'negative',
      dateRecorded: '2024-03-04 05:06:07',
      dbp: 81.5,
      fastingBloodGlucose: 5.4,
      gcs: 14,
      heartRate: 72.5,
      height: 174.5,
      hemoglobin: 13.2,
      respiratoryRate: 16.5,
      sbp: 121.5,
      spo2: 97.5,
      temperature: 36.8,
      urineBilirubin: 'negative',
      urineGlucose: 1.5,
      urineKetone: 'trace',
      urineLeukocytes: 'negative',
      urineNitrites: 'negative',
      urinePh: 6.5,
      urineProtein: 'negative',
      urineSpecificGravity: 1.02,
      urobilinogen: 0.5,
      weight: 71.25,
    };

    let app;

    beforeAll(async () => {
      app = await baseApp.asNewRole(permissionsFor('Vitals'));
    });

    // If a column is added to the model, this fails until both the payload above and the
    // route's own list are extended, rather than the new column silently never saving.
    it('covers every writable column on the model', () => {
      const owned = [
        'id',
        'encounterId',
        'createdAt',
        'updatedAt',
        'deletedAt',
        'updatedAtSyncTick',
      ];
      const writable = Object.keys(models.Vitals.rawAttributes).filter(
        field => !owned.includes(field),
      );
      expect(Object.keys(OBSERVATIONS).sort()).toEqual(writable.sort());
    });

    it('persists every observation on create', async () => {
      const result = await app
        .post('/api/vitals')
        .send({ ...OBSERVATIONS, encounterId: encounter.id });

      expect(result).toHaveSucceeded();
      const stored = await models.Vitals.findByPk(result.body.id);
      expect(stored.get({ plain: true })).toMatchObject(OBSERVATIONS);
    });

    it('persists every observation on update', async () => {
      const record = await models.Vitals.create({ encounterId: encounter.id });

      const result = await app.put(`/api/vitals/${record.id}`).send(OBSERVATIONS);

      expect(result).toHaveSucceeded();
      await record.reload();
      expect(record.get({ plain: true })).toMatchObject(OBSERVATIONS);
    });
  });
});
