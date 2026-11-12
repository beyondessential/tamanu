import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { DEVICE_SCOPES, SERVER_TYPES, SETTINGS_SCOPES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { buildFacilityBootstrap } from '../../app/sync/buildFacilityBootstrap';
import { createTestContext } from '../utilities';

describe('Facility bootstrap', () => {
  let ctx;
  let models;
  let baseApp;
  let syncUser;
  let token;

  const deviceId = 'bootstrap-test-device';
  const facilityId = 'bootstrap-facility';
  const otherFacilityId = 'bootstrap-other-facility';

  const fetchBootstrap = (body = { facilityIds: [facilityId] }) =>
    baseApp
      .post('/api/sync/bootstrap')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tamanu-Client', SERVER_TYPES.FACILITY)
      .send(body);

  const recordIdsOfType = (records, recordType) =>
    records.filter(record => record.recordType === recordType).map(record => record.recordId);

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;

    syncUser = await models.User.create(fake(models.User, { password: 'password', role: 'admin' }));
    await models.Device.create(
      fake(models.Device, {
        id: deviceId,
        registeredById: syncUser.id,
        scopes: [DEVICE_SCOPES.SYNC_CLIENT],
      }),
    );

    const loginResponse = await baseApp
      .post('/api/login')
      .set('X-Tamanu-Client', SERVER_TYPES.FACILITY)
      .send({
        email: syncUser.email,
        password: 'password',
        deviceId,
        scopes: [DEVICE_SCOPES.SYNC_CLIENT],
      });
    expect(loginResponse).toHaveSucceeded();
    token = loginResponse.body.token;
  });

  afterAll(() => ctx.close());

  // spec: FBOOT#contents
  it('carries the records the login path reads', async () => {
    const catchment = await models.ReferenceData.create(
      fake(models.ReferenceData, { type: 'catchment' }),
    );
    const facility = await models.Facility.create(
      fake(models.Facility, { id: facilityId, catchmentId: catchment.id }),
    );
    const role = await models.Role.create(fake(models.Role));
    const permission = await models.Permission.create(
      fake(models.Permission, { roleId: role.id, verb: 'read', noun: 'Patient' }),
    );
    const user = await models.User.create(fake(models.User, { role: role.id }));
    const userFacility = await models.UserFacility.create({
      userId: user.id,
      facilityId: facility.id,
    });

    const response = await fetchBootstrap();
    expect(response).toHaveSucceeded();
    const { records } = response.body;

    expect(recordIdsOfType(records, 'facilities')).toContain(facility.id);
    expect(recordIdsOfType(records, 'reference_data')).toContain(catchment.id);
    expect(recordIdsOfType(records, 'roles')).toContain(role.id);
    expect(recordIdsOfType(records, 'permissions')).toContain(permission.id);
    expect(recordIdsOfType(records, 'users')).toEqual(
      expect.arrayContaining([user.id, syncUser.id]),
    );
    expect(recordIdsOfType(records, 'user_facilities')).toContain(userFacility.id);
  });

  it('carries the sensitive networks facilities belong to', async () => {
    const network = await models.SensitiveNetwork.create({
      id: 'bootstrap-network',
      code: 'BOOTSTRAP-NETWORK',
      name: 'Bootstrap network',
    });
    const facility = await models.Facility.create(
      fake(models.Facility, { sensitiveNetworkId: network.id }),
    );

    const { records } = (await fetchBootstrap()).body;
    expect(recordIdsOfType(records, 'facilities')).toContain(facility.id);
    expect(recordIdsOfType(records, 'sensitive_networks')).toContain(network.id);
  });

  it('carries users with their password hashes, so local login works', async () => {
    const user = await models.User.create(fake(models.User, { password: 'a-password' }));
    const { password: hash } = await models.User.scope('withPassword').findByPk(user.id);

    const { records } = (await fetchBootstrap()).body;
    const bootstrappedUser = records.find(record => record.recordId === user.id);
    expect(bootstrappedUser.data.password).toBe(hash);
  });

  it('carries no reference data beyond facility catchments', async () => {
    const unrelated = await models.ReferenceData.create(
      fake(models.ReferenceData, { type: 'drug' }),
    );

    const { records } = (await fetchBootstrap()).body;
    expect(recordIdsOfType(records, 'reference_data')).not.toContain(unrelated.id);
  });

  it('carries settings for the requested facilities and global settings only', async () => {
    await models.Facility.findOrCreate({
      where: { id: otherFacilityId },
      defaults: fake(models.Facility, { id: otherFacilityId }),
    });
    await models.Facility.findOrCreate({
      where: { id: facilityId },
      defaults: fake(models.Facility, { id: facilityId }),
    });
    const globalSetting = await models.Setting.create({
      key: 'bootstrapTest.global',
      value: 1,
      scope: SETTINGS_SCOPES.GLOBAL,
    });
    const facilitySetting = await models.Setting.create({
      key: 'bootstrapTest.facility',
      value: 2,
      scope: SETTINGS_SCOPES.FACILITY,
      facilityId,
    });
    const otherFacilitySetting = await models.Setting.create({
      key: 'bootstrapTest.facility',
      value: 3,
      scope: SETTINGS_SCOPES.FACILITY,
      facilityId: otherFacilityId,
    });

    const settingIds = recordIdsOfType((await fetchBootstrap()).body.records, 'settings');
    expect(settingIds).toEqual(expect.arrayContaining([globalSetting.id, facilitySetting.id]));
    expect(settingIds).not.toContain(otherFacilitySetting.id);
  });

  it('carries the pre-sync screens’ translations in every language, and no others', async () => {
    const make = (stringId, language) =>
      models.TranslatedString.create({ stringId, language, text: `${stringId} (${language})` });
    const wanted = await Promise.all([
      make('login.bootstrapTest.label', 'en'),
      make('login.bootstrapTest.label', 'km'),
      make('splash.bootstrapTest.message', 'km'),
      make('languageName', 'km'),
      make('countryCode', 'km'),
    ]);
    const unwanted = await Promise.all([
      make('patient.bootstrapTest.label', 'km'),
      make('loginLike.bootstrapTest.label', 'km'),
    ]);

    const translationIds = recordIdsOfType(
      (await fetchBootstrap()).body.records,
      'translated_strings',
    );
    expect(translationIds).toEqual(expect.arrayContaining(wanted.map(({ id }) => id)));
    for (const { id } of unwanted) {
      expect(translationIds).not.toContain(id);
    }
  });

  it('carries no patient-linked data', async () => {
    await models.Patient.create(fake(models.Patient));

    const { records } = (await fetchBootstrap()).body;
    const recordTypes = new Set(records.map(record => record.recordType));
    expect([...recordTypes].sort()).toEqual([
      'facilities',
      'permissions',
      'reference_data',
      'roles',
      'sensitive_networks',
      'settings',
      'translated_strings',
      'user_facilities',
      'users',
    ]);
  });

  // spec: FBOOT#serving-the-bootstrap
  it('shapes each record as a pulled change, including its deletion state', async () => {
    const deletedRole = await models.Role.create(fake(models.Role));
    await deletedRole.destroy();

    const { records } = (await fetchBootstrap()).body;
    const record = records.find(({ recordId }) => recordId === deletedRole.id);
    expect(record).toMatchObject({
      recordType: 'roles',
      recordId: deletedRole.id,
      isDeleted: true,
      data: { id: deletedRole.id, name: deletedRole.name },
    });
    for (const excluded of ['createdAt', 'updatedAt', 'deletedAt', 'updatedAtSyncTick']) {
      expect(record.data).not.toHaveProperty(excluded);
    }
  });

  // spec: FBOOT#serving-the-bootstrap
  it('reads every table from one snapshot, so a mid-build write cannot break its references', async () => {
    const { sequelize } = ctx.store;
    // Held open on its own connection so the test controls when it becomes visible; an unmanaged
    // transaction is the only way to commit at a chosen moment. Reference data is read before
    // facilities, so without one snapshot the facility would arrive without its catchment.
    const writer = await sequelize.transaction();
    const catchment = fake(models.ReferenceData, { type: 'catchment' });
    const latecomer = fake(models.Facility, { catchmentId: catchment.id });
    await models.ReferenceData.create(catchment, { transaction: writer });
    await models.Facility.create(latecomer, { transaction: writer });

    let hasCommitted = false;
    const query = sequelize.query.bind(sequelize);
    vi.spyOn(sequelize, 'query').mockImplementation(async (sql, options) => {
      // just before the facilities are read, and only then
      if (
        !hasCommitted &&
        typeof sql === 'string' &&
        sql.includes(`'facilities' AS "recordType"`)
      ) {
        hasCommitted = true;
        await writer.commit();
      }
      return query(sql, options);
    });

    let records;
    try {
      records = await buildFacilityBootstrap(ctx.store, [facilityId]);
    } finally {
      vi.restoreAllMocks();
      if (!hasCommitted) await writer.rollback();
      await models.Facility.destroy({ where: { id: latecomer.id }, force: true });
      await models.ReferenceData.destroy({ where: { id: catchment.id }, force: true });
    }

    expect(hasCommitted).toBe(true);
    expect(recordIdsOfType(records, 'facilities')).not.toContain(latecomer.id);
    // the property that matters: nothing references a record the bootstrap doesn't carry
    const catchmentIds = new Set(recordIdsOfType(records, 'reference_data'));
    const danglingCatchments = records
      .filter(record => record.recordType === 'facilities' && record.data.catchmentId)
      .filter(record => !catchmentIds.has(record.data.catchmentId));
    expect(danglingCatchments).toEqual([]);
  });

  it('requires facility ids', async () => {
    const response = await fetchBootstrap({ facilityIds: [] });
    expect(response).toHaveRequestError();
  });

  it('refuses a request without a sync client device', async () => {
    const response = await baseApp
      .post('/api/sync/bootstrap')
      .set('X-Tamanu-Client', SERVER_TYPES.FACILITY)
      .send({ facilityIds: [facilityId] });
    expect(response).toHaveRequestError();
  });
});
