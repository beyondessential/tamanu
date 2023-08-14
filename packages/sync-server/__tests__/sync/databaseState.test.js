import { beforeAll, describe, it } from '@jest/globals';

import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { fake } from 'shared/test-helpers/fake';

import { createTestContext } from '../utilities';

// This file is a copy from the facility server,
// all changes applied here should be applied there as well.
describe('databaseState', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  afterAll(() => ctx.close());

  it('all syncing models should have a tick column', async () => {
    const syncModels = Object.values(models).filter(
      model => model.syncDirection !== SYNC_DIRECTIONS.DO_NOT_SYNC,
    );

    for (const Model of syncModels) {
      expect(
        Model.rawAttributes.updatedAtSyncTick,
        `Model ${Model.name} is missing a tick column`,
      ).toBeDefined();
    }
  });

  it('unsyncing models should not have tick column', async () => {
    const unsyncModels = Object.values(models).filter(
      model => model.syncDirection === SYNC_DIRECTIONS.DO_NOT_SYNC,
    );

    for (const Model of unsyncModels) {
      expect(
        Model.rawAttributes.updatedAtSyncTick,
        `Model ${Model.name} should not have a tick column`,
      ).not.toBeDefined();
    }
  });

  it('syncing models should set tick on create', async () => {
    const { LocalSystemFact, Patient, Facility } = models;
    const currentTick = await LocalSystemFact.get('currentSyncTick');

    // can't test against every model because of dependencies, just pick a few
    for (const Model of [Patient, Facility]) {
      const instance = await Model.create(fake(Model));

      expect(
        instance.updatedAtSyncTick,
        `Model ${Model.name}'s tick column isn't initialised`,
      ).toEqual(currentTick);
    }
  });
});
