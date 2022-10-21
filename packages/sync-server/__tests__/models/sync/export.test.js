import { addDays, subDays, format } from 'date-fns';
import {
  buildNestedEncounter,
  expectDeepSyncRecordMatch,
  fake,
  fakeUser,
  unsafeSetUpdatedAt,
  upsertAssociations,
} from 'shared/test-helpers';
import { createExportPlan, executeExportPlan } from 'shared/models/sync';
import { fakeUUID } from 'shared/utils/generateId';

import { createTestContext } from '../../utilities';

const makeUpdatedAt = daysAgo =>
  format(subDays(new Date(), daysAgo), 'yyyy-MM-dd hh:mm:ss.SSS +00:00');

describe('export', () => {
  [true, false].forEach(syncClientMode => {
    describe(`in ${syncClientMode ? 'client' : 'server'} mode`, () => {
      let ctx;
      let models;
      const patientId = fakeUUID();
      const userId = fakeUUID();
      const facilityId = fakeUUID();
      const scheduledVaccineId = fakeUUID();

      beforeAll(async () => {
        ctx = await createTestContext({ syncClientMode });
        models = ctx.store.models;
        const { Patient, User, Facility, ScheduledVaccine } = models;
        await Patient.create({ ...fake(Patient), id: patientId });
        await User.create({ ...fakeUser(), id: userId });
        await Facility.create({ ...fake(Facility), id: facilityId });
        await ScheduledVaccine.create({
          ...fake(ScheduledVaccine),
          id: scheduledVaccineId,
        });
      });

      afterAll(async () => {
        await ctx.close();
      });

      const testCases = [
        ['Patient', () => fake(models.Patient)],
        [
          'Encounter',
          () => buildNestedEncounter(models, patientId),
          `patient/${patientId}/encounter`,
        ],
        ['Encounter', () => buildNestedEncounter(models, patientId), 'labRequest/all/encounter'],
        [
          'Encounter',
          async () => {
            const encounter = await buildNestedEncounter(models, patientId);
            encounter.administeredVaccines = encounter.administeredVaccines.map(v => ({
              ...v,
              scheduledVaccineId,
            }));
            return encounter;
          },
          `scheduledVaccine/${scheduledVaccineId}/encounter`,
        ],
        [
          'PatientAllergy',
          () => ({ ...fake(models.PatientAllergy), patientId }),
          `patient/${patientId}/allergy`,
        ],
        [
          'PatientCarePlan',
          () => ({ ...fake(models.PatientCarePlan), patientId }),
          `patient/${patientId}/carePlan`,
        ],
        [
          'PatientCondition',
          () => ({ ...fake(models.PatientCondition), patientId }),
          `patient/${patientId}/condition`,
        ],
        [
          'PatientFamilyHistory',
          () => ({ ...fake(models.PatientFamilyHistory), patientId }),
          `patient/${patientId}/familyHistory`,
        ],
        [
          'PatientIssue',
          () => ({ ...fake(models.PatientIssue), patientId }),
          `patient/${patientId}/issue`,
        ],
        ['ReportRequest', () => ({ ...fake(models.ReportRequest), requestedByUserId: userId })],
        [
          'UserFacility',
          async () => {
            const user = await models.User.create(fakeUser());
            return { id: fakeUUID(), userId: user.id, facilityId };
          },
        ],
      ];
      testCases.forEach(([modelName, fakeRecord, overrideChannel]) => {
        describe(modelName, () => {
          beforeEach(async () => {
            const model = models[modelName];
            await model.truncate({ cascade: true, force: true });
          });

          it('exports pages of records', async () => {
            // arrange
            const model = models[modelName];
            const channel = overrideChannel || (await model.syncConfig.getChannels())[0];
            const plan = createExportPlan(model.sequelize, channel);
            const records = [await fakeRecord(), await fakeRecord()];
            const updatedAts = [makeUpdatedAt(20), makeUpdatedAt(0)];
            await Promise.all(
              records.map(async (record, i) => {
                await model.create({ ...record, isPushing: syncClientMode }); // only set isPushing in client mode
                await upsertAssociations(model, record);
                await unsafeSetUpdatedAt(ctx.store.sequelize, {
                  table: model.tableName,
                  id: record.id,
                  updated_at: updatedAts[i],
                });
              }),
            );

            // act
            const { records: firstRecords, cursor: firstCursor } = await executeExportPlan(plan, {
              limit: 1,
            });
            const { records: secondRecords, cursor: secondCursor } = await executeExportPlan(plan, {
              limit: 1,
              since: firstCursor,
            });
            const { records: thirdRecords } = await executeExportPlan(plan, {
              limit: 1,
              since: secondCursor,
            });

            // assert
            expect(firstRecords.length).toEqual(1);

            let nullableDateFields = [];
            switch (modelName) {
              case 'Patient':
                nullableDateFields = ['dateOfDeath'];
                break;
              case 'Encounter':
                nullableDateFields = ['plannedLocationStartTime'];
                break;
              default:
                break;
            }
            expectDeepSyncRecordMatch(records[0], firstRecords[0], {
              nullableDateFields,
            });
            expect(secondRecords.length).toEqual(1);
            expectDeepSyncRecordMatch(records[1], secondRecords[0], {
              nullableDateFields,
            });
            expect(thirdRecords.length).toEqual(0);
          });
        });
      });

      it('respects until', async () => {
        // arrange
        const { Patient } = models;
        await Patient.truncate({ cascade: true, force: true });
        const channel = Patient.syncConfig.getChannels()[0];
        const plan = createExportPlan(Patient.sequelize, channel);

        const patient1 = await Patient.create({
          ...fake(Patient),
          isPushing: syncClientMode,
        });
        const patient2 = await Patient.create({
          ...fake(Patient),
          isPushing: syncClientMode,
        });
        const until = addDays(new Date(), 1);
        await unsafeSetUpdatedAt(ctx.store.sequelize, {
          table: Patient.tableName,
          id: patient2.id,
          updated_at: addDays(until, 1).toISOString(),
        });

        // act
        const { records } = await executeExportPlan(plan, {
          limit: 10,
          until: until.getTime(),
        });

        // assert
        expect(records).toEqual([
          {
            data: expect.objectContaining({
              id: patient1.id,
            }),
          },
        ]);
        expect(records.length).toEqual(1);
      });
    });
  });
});
