import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { FACT_LAST_SUCCESSFUL_SYNC_PULL } from '@tamanu/constants/facts';
import { omit } from 'es-toolkit';
import { COLUMNS_EXCLUDED_FROM_SYNC, SYNC_TICK_FLAGS } from '@tamanu/database/sync';
import { fake } from '@tamanu/fake-data/fake';

import { applyBootstrap } from '../../app/sync/facilityBootstrap';
import { getServerFacilityIds } from '../../app/serverConfig';
import { createTestContext } from '../utilities';

// spec: FBOOT#applying-the-bootstrap
describe('applyBootstrap', () => {
  let ctx;
  let models;
  let sequelize;

  const apply = records =>
    sequelize.transaction(() => applyBootstrap({ sequelize, models }, records));

  // the shape central serves: a pulled change, with no timestamps or sync tick in its data
  const record = (model, values, { isDeleted = false } = {}) => ({
    recordType: model.tableName,
    recordId: values.id,
    isDeleted,
    data: omit(values, COLUMNS_EXCLUDED_FROM_SYNC),
  });

  const syncTickOf = async (model, id) => {
    const [[{ tick }]] = await sequelize.query(
      `SELECT updated_at_sync_tick AS tick FROM ${model.tableName} WHERE id = :id`,
      { replacements: { id } },
    );
    return Number(tick);
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    sequelize = ctx.sequelize;
  });

  afterAll(() => ctx.close());

  it('saves records as pulled, so the bootstrap never pushes them back to central', async () => {
    const catchment = fake(models.ReferenceData, { type: 'catchment' });
    const facility = fake(models.Facility, { catchmentId: catchment.id });

    // facility first: saved in dependency order regardless
    await apply([record(models.Facility, facility), record(models.ReferenceData, catchment)]);

    expect(await models.Facility.findByPk(facility.id)).toMatchObject({ name: facility.name });
    expect(await syncTickOf(models.Facility, facility.id)).toBe(
      SYNC_TICK_FLAGS.LAST_UPDATED_ELSEWHERE,
    );
    expect(await syncTickOf(models.ReferenceData, catchment.id)).toBe(
      SYNC_TICK_FLAGS.LAST_UPDATED_ELSEWHERE,
    );
  });

  it('replaces bootstrapped records with their current versions when applied again', async () => {
    const role = fake(models.Role);
    await apply([record(models.Role, role)]);
    await apply([record(models.Role, { ...role, name: 'Renamed on central' })]);

    expect(await models.Role.findByPk(role.id)).toMatchObject({ name: 'Renamed on central' });
  });

  it('saves deleted records as deleted', async () => {
    const role = fake(models.Role);
    await apply([record(models.Role, role, { isDeleted: true })]);

    expect(await models.Role.findByPk(role.id)).toBeNull();
    expect(await models.Role.findByPk(role.id, { paranoid: false })).not.toBeNull();
  });

  it('leaves the pull cursor alone', async () => {
    const pullCursor = await models.LocalSystemFact.get(FACT_LAST_SUCCESSFUL_SYNC_PULL);
    await apply([record(models.Role, fake(models.Role))]);

    expect(await models.LocalSystemFact.get(FACT_LAST_SUCCESSFUL_SYNC_PULL)).toBe(pullCursor);
  });

  it('saves none of a bootstrap that fails to apply', async () => {
    const role = fake(models.Role);
    const orphan = fake(models.UserFacility, {
      userId: 'a-user-not-in-the-bootstrap',
      facilityId: 'a-facility-not-in-the-bootstrap',
    });

    await expect(
      apply([record(models.Role, role), record(models.UserFacility, orphan)]),
    ).rejects.toThrow();
    expect(await models.Role.findByPk(role.id, { paranoid: false })).toBeNull();
  });

  // spec: FSETUP#setting-up-state
  it('lets a bootstrapped user log in before the first sync', async () => {
    const password = 'bootstrapped-password';
    const user = fake(models.User, {
      role: 'admin',
      password: await models.User.hashPassword(password),
    });
    const facilities = getServerFacilityIds().map(id => fake(models.Facility, { id, name: id }));
    await apply([
      record(models.User, user),
      ...facilities.map(facility => record(models.Facility, facility)),
    ]);

    const response = await ctx.baseApp.post('/api/login').send({
      email: user.email,
      password,
      deviceId: 'bootstrap-login-device',
    });
    expect(response).toHaveSucceeded();
    expect(response.body.availableFacilities.map(({ id }) => id).sort()).toEqual(
      getServerFacilityIds().sort(),
    );
  });
});
