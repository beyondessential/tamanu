import { VISIBILITY_STATUSES, REGISTRATION_STATUSES } from '@tamanu/constants';
import { fake } from '@tamanu/shared/test-helpers';
import { createTestContext } from '../utilities';

describe('ProgramRegistry', () => {
  let models;
  let app;
  let testProgram;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    app = await ctx.baseApp.asRole('practitioner');

    testProgram = await models.Program.create(fake(models.Program));
  });
  afterAll(() => ctx.close());
  afterEach(async () => {
    await models.PatientProgramRegistration.truncate();
    await models.ProgramRegistry.truncate();
    await models.Patient.truncate({ cascade: true });
  });

  describe('Getting (GET /v1/programRegistry/:id)', () => {
    it('should fetch a survey', async () => {
      const { id } = await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, {
          name: 'Hepatitis Registry',
          programId: testProgram.id,
        }),
      );

      const result = await app.get(`/v1/programRegistry/${id}`);
      expect(result).toHaveSucceeded();

      expect(result.body).toHaveProperty('name', 'Hepatitis Registry');
    });
  });

  describe('Listing (GET /v1/programRegistry)', () => {
    it('should list available program registries', async () => {
      await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: testProgram.id }),
      );
      await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, {
          programId: testProgram.id,
          visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
        }),
      );
      await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: testProgram.id }),
      );

      const result = await app.get('/v1/programRegistry');
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body.count).toEqual(2);
      expect(body.data.length).toEqual(2);
    });

    it('should filter by excludePatientId', async () => {
      const testPatient = await models.Patient.create(fake(models.Patient));

      // Should show:
      await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: testProgram.id }),
      );
      await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: testProgram.id }),
      );

      // Should not show (historical):
      await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, {
          programId: testProgram.id,
          visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
        }),
      );
      // Should not show (patient already has registration):
      const { id: registryId1 } = await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: testProgram.id }),
      );
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          patientId: testPatient.id,
          programRegistryId: registryId1,
        }),
      );

      // Should show (patient already has registration but it's deleted):
      const { id: registryId2 } = await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: testProgram.id }),
      );
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          patientId: testPatient.id,
          registrationStatus: REGISTRATION_STATUSES.RECORDED_IN_ERROR,
          programRegistryId: registryId2,
        }),
      );

      const result = await app
        .get('/v1/programRegistry')
        .query({ excludePatientId: testPatient.id });
      expect(result).toHaveSucceeded();
      expect(result.body.data.length).toBe(3);
    });

    it('should escape the excludePatientId parameter', async () => {
      const result = await app
        .get('/v1/programRegistry')
        .query({ excludePatientId: "'bobby tables/\\'&;" });
      expect(result).toHaveSucceeded();
      expect(result.body.data.length).toBe(0);
    });
  });

  describe('Listing conditions (GET /v1/programRegistry/:id/conditions)', () => {
    it('should list available conditions', async () => {
      const { id: programRegistryId } = await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: testProgram.id }),
      );
      await models.ProgramRegistryCondition.create(
        fake(models.ProgramRegistryCondition, { programRegistryId }),
      );
      await models.ProgramRegistryCondition.create(
        fake(models.ProgramRegistryCondition, { programRegistryId }),
      );

      const result = await app.get(`/v1/programRegistry/${programRegistryId}/conditions`);
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body.count).toEqual(2);
      expect(body.data.length).toEqual(2);
    });
  });

  describe('Listing registrations (GET /v1/programRegistry/:id/registrations)', () => {
    it('should list registrations', async () => {
      const { id: programRegistryId } = await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: testProgram.id }),
      );
      const CLINICAL_STATUS_DATA = {
        name: 'aa',
        color: 'blue',
      };
      const programRegistryClinicalStatus = await models.ProgramRegistryClinicalStatus.create(
        fake(models.ProgramRegistryClinicalStatus, {
          programRegistryId,
          ...CLINICAL_STATUS_DATA,
        }),
      );

      const clinician = await models.User.create(fake(models.User, { displayName: 'Lucy' }));

      const baseRegistrationData = {
        programRegistryId,
        registrationStatus: REGISTRATION_STATUSES.ACTIVE,
        date: '2023-09-04 08:00:00',
      };

      // Patient 1: Should pull all required data
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          ...baseRegistrationData,
          patientId: (await models.Patient.create(fake(models.Patient, { displayId: '1' }))).id,
          clinicianId: clinician.id,
          clinicalStatusId: programRegistryClinicalStatus.id,
        }),
      );

      // Patient 2: Should show most recent registration only
      const patient2 = await models.Patient.create(fake(models.Patient, { displayId: '2' }));
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          ...baseRegistrationData,
          patientId: patient2.id,
          date: '2023-09-04 08:00:00',
        }),
      );
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          ...baseRegistrationData,
          patientId: patient2.id,
          date: '2023-09-05 08:00:00',
        }),
      );

      const result = await app.get(`/v1/programRegistry/${programRegistryId}/registrations`).query({
        sortBy: 'clinicalStatus',
      });
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body.count).toEqual(2);
      expect(body.data.length).toEqual(2);
      expect(body.data).toMatchObject([
        {
          clinicalStatus: CLINICAL_STATUS_DATA,
          conditions: null,
          facility: {
            name: null,
          },
          patient: {
            displayId: '1',
            village: {
              name: null,
            },
          },
          registeringFacility: {
            name: null,
          },
          registrationStatus: 'active',
          village: {
            name: null,
          },
        },
        {
          patient: {
            displayId: '2',
          },
        },
      ]);
    });

    it('should filter by associated condition', async () => {
      // Config models
      const { id: programRegistryId } = await models.ProgramRegistry.create(
        fake(models.ProgramRegistry, { programId: testProgram.id }),
      );
      const programRegistryClinicalStatus = await models.ProgramRegistryClinicalStatus.create(
        fake(models.ProgramRegistryClinicalStatus, {
          programRegistryId,
        }),
      );
      const relevantCondition = await models.ProgramRegistryCondition.create(
        fake(models.ProgramRegistryCondition, { programRegistryId }),
      );
      const decoyCondition = await models.ProgramRegistryCondition.create(
        fake(models.ProgramRegistryCondition, { programRegistryId }),
      );

      const clinician = await models.User.create(fake(models.User, { displayName: 'Lucy' }));

      const baseRegistrationData = {
        programRegistryId,
        registrationStatus: REGISTRATION_STATUSES.ACTIVE,
        date: '2023-09-04 08:00:00',
      };

      // Patient 1: Should show
      const patient1 = await models.Patient.create(fake(models.Patient, { displayId: '2-1' }));
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          ...baseRegistrationData,
          patientId: patient1.id,
          clinicianId: clinician.id,
          clinicalStatusId: programRegistryClinicalStatus.id,
        }),
      );

      await models.PatientProgramRegistrationCondition.create(
        fake(models.PatientProgramRegistrationCondition, {
          patientId: patient1.id,
          programRegistryId,
          programRegistryConditionId: decoyCondition.id,
        }),
      );
      await models.PatientProgramRegistrationCondition.create(
        fake(models.PatientProgramRegistrationCondition, {
          patientId: patient1.id,
          programRegistryId,
          programRegistryConditionId: relevantCondition.id,
        }),
      );

      // Patient 2: Should not show
      const patient2 = await models.Patient.create(fake(models.Patient, { displayId: '2-2' }));
      await models.PatientProgramRegistration.create(
        fake(models.PatientProgramRegistration, {
          ...baseRegistrationData,
          patientId: patient2.id,
          date: '2023-09-04 08:00:00',
        }),
      );
      await models.PatientProgramRegistrationCondition.create(
        fake(models.PatientProgramRegistrationCondition, {
          patientId: patient2.id,
          programRegistryId,
          programRegistryConditionId: decoyCondition.id,
        }),
      );

      const result = await app.get(`/v1/programRegistry/${programRegistryId}/registrations`).query({
        programRegistryCondition: relevantCondition.id,
      });
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body.count).toEqual(1);
      expect(body.data.length).toEqual(1);
      expect(body.data).toMatchObject([
        { conditions: expect.arrayContaining([decoyCondition.name, relevantCondition.name]) },
      ]);
    });

    describe('Patient Filtering', () => {
      const patientFilters = [
        { filter: 'dateOfBirth', value: '3000-01-01' },
        { filter: 'displayId', value: 'TEST_DISPLAY_ID' },
        { filter: 'sex', value: 'male' },
        { filter: 'sex', value: 'female' },
        { filter: 'sex', value: 'other' },
        { filter: 'firstName', value: 'TEST_FIRST_NAME' },
        { filter: 'lastName', value: 'TEST_LAST_NAME' },
      ];
      let registryId = null;

      beforeAll(async () => {
        const { id: programRegistryId } = await models.ProgramRegistry.create(
          fake(models.ProgramRegistry, { programId: testProgram.id }),
        );
        registryId = programRegistryId;
        await Promise.all(
          patientFilters.map(async ({ filter, value }) => {
            const patient = await models.Patient.create(
              fake(models.Patient, {
                [filter]: value,
              }),
            );
            await models.PatientProgramRegistration.create(
              fake(models.PatientProgramRegistration, {
                programRegistryId,
                patientId: patient.id,
              }),
            );
          }),
        );
      });

      it.each(patientFilters)(
        'Should only include records matching patient filter ($filter: $value)',
        async ({ filter, value }) => {
          const result = await app.get(`/v1/programRegistry/${registryId}/registrations`).query({
            rowsPerPage: 100,
            [filter]: value,
          });
          expect(result).toHaveSucceeded();

          expect(result.body.data).not.toHaveLength(0);
          result.body.data.forEach(x => {
            expect(x.patient).toHaveProperty(filter, value);
          });
        },
      );
    });
  });
});

// ```
// with
// most_recent_registrations as (
//     SELECT *
//     FROM (
//       SELECT
//         *,
//         ROW_NUMBER() OVER (PARTITION BY patient_id, program_registry_id ORDER BY date DESC, id DESC) AS row_num
//     FROM patient_program_registrations
//     WHERE program_registry_id = 'e7658b50-ecc2-0000-a391-3405b2bee242'
//   ) n
//   WHERE n.row_num = 1
// ),
// conditions as (
//     SELECT patient_id, jsonb_agg(prc.\"name\") condition_list
//   FROM patient_program_registration_conditions pprc
//     JOIN program_registry_conditions prc
//       ON pprc.program_registry_condition_id = prc.id
//   WHERE pprc.program_registry_id = 'e7658b50-ecc2-0000-a391-3405b2bee242'
//   GROUP BY patient_id
// )\n     SELECT COUNT(1) AS count
// ROM most_recent_registrations mrr
// LEFT JOIN patients patient
//   ON patient.id = mrr.patient_id
// LEFT JOIN reference_data patient_village
//   ON patient.village_id = patient_village.id
// LEFT JOIN reference_data currently_at_village
//   ON mrr.village_id = currently_at_village.id
// LEFT JOIN facilities currently_at_facility
//   ON mrr.facility_id = currently_at_facility.id
// LEFT JOIN facilities registering_facility
//   ON mrr.registering_facility_id = registering_facility.id
// LEFT JOIN conditions
//   ON conditions.patient_id = mrr.patient_id
// LEFT JOIN program_registry_clinical_statuses status
//   ON mrr.clinical_status_id = status.id
// LEFT JOIN program_registries program_registry
//   ON mrr.program_registry_id = program_registry.id
// LEFT JOIN users clinician
//   ON mrr.clinician_id = clinician.id

//  WHERE patient.date_of_death IS NULL
//  AND (select '[\"' || prc2.name || '\"]' from program_registry_conditions prc2 where prc2.id == '225d4356-3877-0000-9f8f-63eb1f01214b'):jsonb <@ conditions.condition_list
//  AND mrr.registration_status != 'recordedInError'
//  AND mrr.registration_status = 'active'"
//       },
//       "sql": "with
//       most_recent_registrations as (
//           SELECT *
//           FROM (
//             SELECT
//               *,
//               ROW_NUMBER() OVER (PARTITION BY patient_id, program_registry_id ORDER BY date DESC, id DESC) AS row_num
//           FROM patient_program_registrations
//           WHERE program_registry_id = 'e7658b50-ecc2-0000-a391-3405b2bee242'
//         ) n
//         WHERE n.row_num = 1
//       ),
//       conditions as (
//           SELECT patient_id, jsonb_agg(prc.\"name\") condition_list
//         FROM patient_program_registration_conditions pprc
//           JOIN program_registry_conditions prc
//             ON pprc.program_registry_condition_id = prc.id
//         WHERE pprc.program_registry_id = 'e7658b50-ecc2-0000-a391-3405b2bee242'
//         GROUP BY patient_id
//       )\n     SELECT COUNT(1) AS count

//      FROM most_recent_registrations mrr
//       LEFT JOIN patients patient
//         ON patient.id = mrr.patient_id
//       LEFT JOIN reference_data patient_village
//         ON patient.village_id = patient_village.id
//       LEFT JOIN reference_data currently_at_village
//         ON mrr.village_id = currently_at_village.id
//       LEFT JOIN facilities currently_at_facility
//         ON mrr.facility_id = currently_at_facility.id
//       LEFT JOIN facilities registering_facility
//         ON mrr.registering_facility_id = registering_facility.id
//       LEFT JOIN conditions
//         ON conditions.patient_id = mrr.patient_id
//       LEFT JOIN program_registry_clinical_statuses status
//         ON mrr.clinical_status_id = status.id
//       LEFT JOIN program_registries program_registry
//         ON mrr.program_registry_id = program_registry.id
//       LEFT JOIN users clinician
//         ON mrr.clinician_id = clinician.id

//        WHERE patient.date_of_death IS NULL
//        AND (select '[\"' || prc2.name || '\"]' from program_registry_conditions prc2 where prc2.id == '225d4356-3877-0000-9f8f-63eb1f01214b')::jsonb <@ conditions.condition_list
//        AND mrr.registration_status != 'recordedInError'
//        AND mrr.registration_status = 'active'
// ```
