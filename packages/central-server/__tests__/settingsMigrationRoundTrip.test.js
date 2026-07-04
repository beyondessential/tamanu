import { FACT_DEVICE_ID, SETTINGS_SCOPES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { STEPS as CENTRAL_STEPS } from '../../upgrade/src/steps/1785000000000-migrateCentralConfigToSettings';
import { STEPS as FACILITY_STEPS } from '../../upgrade/src/steps/1785000000001-migrateFacilityConfigToSettings';
import { STEPS as SERVER_STEPS } from '../../upgrade/src/steps/1783100000000-migrateServerConfigToSettings';
import { STEPS as FHIR_STEPS } from '../../upgrade/src/steps/1783100000001-moveFhirOverridesToServerScope';
import { applyFacilitySettingMigrations } from '../../database/src/sync/applyFacilitySettingMigrations';
import config from 'config';
import { cloneDeep, merge } from 'es-toolkit/compat';
import { settingsCache } from '@tamanu/settings';
import { createTestContext } from './utilities';

jest.setTimeout(60000);

const logStub = { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} };

// Legacy-deployment config overrides, exercised through the whole pipeline:
// fallback reader -> central migration step -> facility carrier -> central apply.
const LEGACY_CONFIG = {
  mailgun: { from: 'legacy@roundtrip.test' },
  mail: {
    transport: {
      host: 'smtp.example.test',
      port: 587,
      auth: { user: 'mailer', pass: 'sekrit-smtp' },
    },
  },
  schedules: { outpatientDischarger: { schedule: '30 3 * * *' } },
  localisation: { data: { country: { name: 'Fiji', 'alpha-2': 'FJ', 'alpha-3': 'FJI' } } },
  integrations: {
    dhis2: { username: 'dhis-user' },
    mSupplyMed: { enabled: true, username: 'msu', password: 'mspw' },
  },
  tasking: { upcomingTasksTimeFrame: 9, upcomingTasksShouldBeGeneratedTimeFrame: 96 },
  sync: { dynamicLimiter: { maxLimit: 20000 } },
};

describe('config->settings migration round trip', () => {
  let ctx, models, Setting;

  const originals = {};
  beforeAll(async () => {
    for (const key of Object.keys(LEGACY_CONFIG)) {
      originals[key] = cloneDeep(config[key]);
    }
    merge(config, LEGACY_CONFIG);
    settingsCache.reset();
    ctx = await createTestContext();
    models = ctx.store.models;
    Setting = models.Setting;
  });
  afterAll(async () => {
    for (const [key, value] of Object.entries(originals)) {
      config[key] = value;
    }
    settingsCache.reset();
    await ctx.close();
  });

  it('serves legacy config through the fallback reader before migration', async () => {
    expect(await ctx.settings.get('mail.from')).toBe('legacy@roundtrip.test');
    expect(await ctx.settings.get('schedules.outpatientDischarger.schedule')).toBe('30 3 * * *');
    expect(await ctx.settings.get('country')).toMatchObject({ name: 'Fiji', 'alpha-2': 'FJ' });
  });

  it('central step: seeds settings, existing wins, secrets split and encrypted', async () => {
    // operator value that must survive
    await Setting.set(
      'schedules.outpatientDischarger.schedule',
      '0 5 * * *',
      SETTINGS_SCOPES.CENTRAL,
    );

    const args = { models, serverType: 'central', toVersion: '9.9.9', log: logStub };
    expect(await CENTRAL_STEPS[0].check(args)).toBe(true);
    await CENTRAL_STEPS[0].run(args);

    // existing-wins
    expect(
      await Setting.get('schedules.outpatientDischarger.schedule', null, SETTINGS_SCOPES.CENTRAL),
    ).toBe('0 5 * * *');
    // renamed lift
    expect(await Setting.get('mail.from', null, SETTINGS_SCOPES.CENTRAL)).toBe(
      'legacy@roundtrip.test',
    );
    // un-nested localisation (global scope, from central config)
    expect(await Setting.get('country', null, SETTINGS_SCOPES.GLOBAL)).toMatchObject({
      name: 'Fiji',
      'alpha-3': 'FJI',
    });
    expect(
      await Setting.get(
        'tasking.upcomingTasksShouldBeGeneratedTimeFrame',
        null,
        SETTINGS_SCOPES.GLOBAL,
      ),
    ).toBe(96);
    expect(await Setting.get('integrations.dhis2.username', null, SETTINGS_SCOPES.CENTRAL)).toBe(
      'dhis-user',
    );

    // no settings PSK in the test env: the graceful path keeps the password
    // embedded rather than failing the upgrade (encryption path unit-tested)
    const transport = await Setting.get('mail.transport', null, SETTINGS_SCOPES.CENTRAL);
    expect(transport).toEqual({
      host: 'smtp.example.test',
      port: 587,
      auth: { user: 'mailer', pass: 'sekrit-smtp' },
    });
    expect(await Setting.get('mail.transportPassword', null, SETTINGS_SCOPES.CENTRAL)).toBe(
      undefined,
    );

    // schema-secrets are never lifted
    expect(await Setting.get('integrations.telegram.apiToken', null, SETTINGS_SCOPES.CENTRAL)).toBe(
      undefined,
    );

    // idempotent
    expect(await CENTRAL_STEPS[0].check(args)).toBe(false);
  });

  it('reader serves identical values after migration', async () => {
    expect(await ctx.settings.get('mail.from')).toBe('legacy@roundtrip.test');
    expect(await ctx.settings.get('country')).toMatchObject({ name: 'Fiji' });
  });

  it('facility step + central apply: carrier round trip', async () => {
    const f1 = await models.Facility.create(fake(models.Facility));
    const f2 = await models.Facility.create(fake(models.Facility));

    const args = { models, serverType: 'facility', toVersion: '9.9.9', log: logStub };
    expect(await FACILITY_STEPS[0].check(args)).toBe(true);
    await FACILITY_STEPS[0].run(args);
    expect(await FACILITY_STEPS[0].check(args)).toBe(false); // fact-gated

    const rows = await models.FacilitySettingMigration.findAll({});
    const taskingRows = rows.filter(r => r.key === 'tasking.upcomingTasksTimeFrame');
    expect(taskingRows.map(r => r.facilityId).sort()).toEqual([f1.id, f2.id].sort());
    expect(taskingRows[0].value).toBe(9);
    // secret excluded from the mSupplyMed subtree
    const msupply = rows.find(r => r.key === 'integrations.mSupplyMed' && r.facilityId === f1.id);
    expect(msupply.value).toMatchObject({ enabled: true, username: 'msu' });
    expect(msupply.value.password).toBe(undefined);

    // one facility already has an operator value: apply must skip it
    await Setting.set('tasking.upcomingTasksTimeFrame', 4, SETTINGS_SCOPES.FACILITY, f2.id);

    await applyFacilitySettingMigrations(
      models,
      rows.map(r => r.id),
    );
    expect(
      await Setting.get('tasking.upcomingTasksTimeFrame', f1.id, SETTINGS_SCOPES.FACILITY),
    ).toBe(9);
    expect(
      await Setting.get('tasking.upcomingTasksTimeFrame', f2.id, SETTINGS_SCOPES.FACILITY),
    ).toBe(4);
    expect(
      (await Setting.get('integrations.mSupplyMed', f1.id, SETTINGS_SCOPES.FACILITY)).username,
    ).toBe('msu');
  });

  it('server step + central apply: device-keyed carrier round trip', async () => {
    const deviceId = 'facility-roundtrip-device';
    await models.LocalSystemFact.set(FACT_DEVICE_ID, deviceId);

    const args = { models, serverType: 'facility', toVersion: '9.9.9', log: logStub };
    expect(await SERVER_STEPS[0].check(args)).toBe(true);
    await SERVER_STEPS[0].run(args);
    expect(await SERVER_STEPS[0].check(args)).toBe(false); // fact-gated

    const rows = await models.FacilitySettingMigration.findAll({
      where: { deviceId },
    });
    const limiterRow = rows.find(r => r.key === 'sync.dynamicLimiter');
    expect(limiterRow.value).toMatchObject({ maxLimit: 20000 });
    expect(limiterRow.facilityId).toBe(null);

    await applyFacilitySettingMigrations(
      models,
      rows.map(r => r.id),
    );
    expect(
      await Setting.get('sync.dynamicLimiter.maxLimit', null, SETTINGS_SCOPES.SERVER, deviceId),
    ).toBe(20000);
    // routed to the device, invisible to other devices and to the plain server read
    expect(
      await Setting.get(
        'sync.dynamicLimiter.maxLimit',
        null,
        SETTINGS_SCOPES.SERVER,
        'other-device',
      ),
    ).toBe(undefined);
    expect(await Setting.get('sync.dynamicLimiter.maxLimit', null, SETTINGS_SCOPES.SERVER)).toBe(
      undefined,
    );

    // re-apply must not clobber an operator's newer central value
    await Setting.set('sync.dynamicLimiter.maxLimit', 555, SETTINGS_SCOPES.SERVER, null, deviceId);
    await applyFacilitySettingMigrations(
      models,
      rows.map(r => r.id),
    );
    expect(
      await Setting.get('sync.dynamicLimiter.maxLimit', null, SETTINGS_SCOPES.SERVER, deviceId),
    ).toBe(555);
  });

  it('fhir step: replays the per-facility union merge as one device row', async () => {
    const KEY = 'fhir.worker.resourceMaterialisationEnabled';
    const f3 = await models.Facility.create(fake(models.Facility));
    const f4 = await models.Facility.create(fake(models.Facility));
    const orphanFacility = await models.Facility.create(fake(models.Facility));

    // both facilities last synced from the same facility server
    const startTime = new Date();
    await models.SyncSession.create({
      startTime,
      lastConnectionTime: startTime,
      parameters: { deviceId: 'facility-fhir-device', facilityIds: [f3.id, f4.id] },
    });
    // a mobile session must not win the mapping
    await models.SyncSession.create({
      startTime: new Date(startTime.getTime() + 1000),
      lastConnectionTime: startTime,
      parameters: { deviceId: 'mobile-xyz', facilityIds: [f3.id], isMobile: true },
    });

    // Encounter/Specimen default to false, so these become real rows (Setting.set
    // skips default-equal values); Organization: false is a no-op under the merge.
    await Setting.set(
      KEY,
      { Encounter: true, Organization: false },
      SETTINGS_SCOPES.FACILITY,
      f3.id,
    );
    await Setting.set(KEY, { Specimen: true }, SETTINGS_SCOPES.FACILITY, f4.id);
    await Setting.set(KEY, { Immunization: true }, SETTINGS_SCOPES.FACILITY, orphanFacility.id);

    const args = {
      models,
      sequelize: ctx.store.sequelize,
      serverType: 'central',
      toVersion: '9.9.9',
      log: logStub,
    };
    expect(await FHIR_STEPS[0].check(args)).toBe(true);
    await FHIR_STEPS[0].run(args);
    expect(await FHIR_STEPS[0].check(args)).toBe(false); // fact-gated

    // any-true merge across the device's facilities; falses are no-ops
    expect(await Setting.get(KEY, null, SETTINGS_SCOPES.SERVER, 'facility-fhir-device')).toEqual({
      Encounter: true,
      Specimen: true,
    });
    // nothing routed to the mobile device
    expect(await Setting.get(KEY, null, SETTINGS_SCOPES.SERVER, 'mobile-xyz')).toBe(undefined);
    // migrated facility rows are gone; the unmapped facility's row is left alone
    expect(await Setting.get(KEY, f3.id, SETTINGS_SCOPES.FACILITY)).toBe(undefined);
    expect(await Setting.get(KEY, f4.id, SETTINGS_SCOPES.FACILITY)).toBe(undefined);
    expect(await Setting.get(KEY, orphanFacility.id, SETTINGS_SCOPES.FACILITY)).toEqual({
      Immunization: true,
    });
  });
});
