import { v4 as uuidv4 } from 'uuid';
import { initDatabase, closeDatabase } from 'sync-server/app/database';
import { REFERENCE_TYPES } from 'shared/constants';
import {
  fakeAdministeredVaccine,
  fakeEncounter,
  fakePatient,
  fakeProgram,
  fakeProgramDataElement,
  fakeReferenceData,
  fakeScheduledVaccine,
  fakeStringFields,
  fakeSurvey,
  fakeSurveyResponse,
  fakeSurveyResponseAnswer,
  fakeSurveyScreenComponent,
  fakeUser,
} from './fake';
import { withDate } from './utilities';

describe('wrappers', () => {
  describe('sqlWrapper', () => {
    let wrapper;
    beforeAll(async () => {
      wrapper = (await initDatabase({ testMode: true })).store;
    });

    afterAll(closeDatabase);

    const modelTests = [
      // ['administeredVaccine', fakeAdministeredVaccine],
      // [
      //   'encounter',
      //   async () => {
      //     const patient = fakePatient();
      //     await wrapper.insert('patient', patient);

      //     const examiner = fakeUser('examiner');
      //     await wrapper.insert('user', examiner);

      //     const location = fakeReferenceData('location');
      //     await wrapper.insert('reference', location);

      //     const department = fakeReferenceData('department');
      //     await wrapper.insert('reference', department);

      //     const encounter = fakeEncounter();
      //     encounter.data.patientId = patient.data.id;
      //     encounter.data.examinerId = examiner.data.id;
      //     encounter.data.locationId = location.data.id;
      //     encounter.data.departmentId = department.data.id;

      //     return encounter;
      //   },
      // ],
      // ['surveyResponse', fakeSurveyResponse],
      // ['surveyResponseAnswer', fakeSurveyResponseAnswer],
      ['patient', fakePatient],
      ['program', fakeProgram],
      ['programDataElement', fakeProgramDataElement],
      ['reference', fakeReferenceData],
      [
        'scheduledVaccine',
        async () => {
          const scheduledVaccine = fakeScheduledVaccine();

          const vaccineId = uuidv4();
          const vaccine = {
            data: {
              id: vaccineId,
              type: REFERENCE_TYPES.VACCINE,
              ...fakeStringFields(`vaccine_${vaccineId}_`, ['code', 'name']),
            },
          };
          await wrapper.insert('reference', vaccine);
          scheduledVaccine.data.vaccineId = vaccineId;

          return scheduledVaccine;
        },
      ],
      ['survey', fakeSurvey],
      ['surveyScreenComponent', fakeSurveyScreenComponent],
      ['user', fakeUser],
    ];

    it('contains a test case for each model', () => {
      // This is intended as a reminder for anyone adding a new model.
      // It might need to be refactored/removed if more complicated routes
      // like 'patient/:id/thing' are added.
      expect(wrapper.builtRoutes.length).toEqual(modelTests.length);
    });

    modelTests.forEach(([channel, fakeInstance]) => {
      describe(channel, () => {
        beforeAll(async () => {
          await wrapper.unsafeRemoveAllOfChannel(channel);
        });

        it('finds no records when empty', async () => {
          const records = await wrapper.findSince(channel, 0, { limit: 10, offset: 0 });
          expect(records).toHaveLength(0);
        });

        it('finds and counts records after an insertion', async () => {
          const instance1 = await fakeInstance();
          await withDate(new Date(1980, 5, 1), async () => {
            await wrapper.insert(channel, instance1);
          });

          const instance2 = await fakeInstance();
          await withDate(new Date(1990, 5, 1), async () => {
            await wrapper.insert(channel, instance2);
          });

          const since = new Date(1985, 5, 1).valueOf();
          expect(await wrapper.findSince(channel, since)).toEqual([
            {
              ...instance2,
              createdAt: new Date(1990, 5, 1),
              updatedAt: new Date(1990, 5, 1),
              deletedAt: null,
            },
          ]);
          expect(await wrapper.countSince(channel, since)).toEqual(1);
        });

        it('marks records as deleted', async () => {
          const instance = await fakeInstance();
          instance.id = uuidv4();
          await wrapper.insert(channel, instance);

          await wrapper.markRecordDeleted(channel, instance.id);

          const instances = await wrapper.findSince(channel, 0);
          expect(instances.find(r => r.id === instance.id)).toEqual({
            ...instance,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
            deletedAt: expect.any(Date),
          });
        });

        it('removes all records of a channel', async () => {
          const record = await fakeInstance();
          await wrapper.insert(channel, record);

          await wrapper.unsafeRemoveAllOfChannel(channel);

          expect(await wrapper.findSince(channel, 0)).toEqual([]);
        });
      });
    });
  });
});
