import { describe, it, expect, vi } from 'vitest';

import {
  ENCOUNTER_SCOPED_RECORD_TYPES,
  FIJI_SRH_FACILITY_IDS,
  FIJI_SRH_NETWORK,
} from '../../src/sensitiveNetworks.js';

import { STEPS } from '../../src/steps/1789695736431-fijiSrhSensitiveNetwork.js';

const [fijiSrhStep] = STEPS;

const makeArgs = ({ hasFijiSrh = false, isSensitiveDropped = false, serverType = 'central' } = {}) => {
  const queries: { sql: string; replacements: any }[] = [];
  return {
    args: {
      serverType,
      sequelize: {
        transaction: async (callback: () => Promise<void>) => callback(),
        query: vi.fn(async (sql: string, options: any = {}) => {
          queries.push({ sql, replacements: options.replacements });
          if (sql.includes('information_schema.columns')) {
            return [{ exists: !isSensitiveDropped }];
          }
          if (sql.includes('count(*) FROM facilities')) return [{ count: hasFijiSrh ? 3 : 2 }];
          return [[], 0];
        }),
      },
      log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn() },
    } as any,
    queries,
  };
};

const findQuery = (queries: { sql: string }[], fragment: string) =>
  queries.find(query => query.sql.includes(fragment));

describe('1789695736431-fijiSrhSensitiveNetwork', () => {
  it('runs between the two schema migrations', () => {
    expect(fijiSrhStep.after).toContain('migration/1789695736424-createSensitiveNetworks');
    expect(fijiSrhStep.before).toContain('migration/1789695736426-dropFacilityIsSensitive');
  });

  it('claims a deployment holding the SRH facilities', async () => {
    const { args } = makeArgs({ hasFijiSrh: true });

    await expect(fijiSrhStep.check(args)).resolves.toBe(true);
  });

  it('leaves every other deployment to the ordinary backfill', async () => {
    const { args } = makeArgs({ hasFijiSrh: false });

    await expect(fijiSrhStep.check(args)).resolves.toBe(false);
  });

  it('stands down on a later upgrade, once is_sensitive has been dropped', async () => {
    const { args } = makeArgs({ hasFijiSrh: true, isSensitiveDropped: true });

    await expect(fijiSrhStep.check(args)).resolves.toBe(false);
  });

  it('leaves it to central, which holds the lookup table and the clock', async () => {
    const { args } = makeArgs({ hasFijiSrh: true, serverType: 'facility' });

    await expect(fijiSrhStep.check(args)).resolves.toBe(false);
  });

  it('creates the one shared network', async () => {
    const { args, queries } = makeArgs({ hasFijiSrh: true });

    await fijiSrhStep.run(args);

    expect(findQuery(queries, 'INSERT INTO sensitive_networks')!.replacements).toMatchObject(
      FIJI_SRH_NETWORK,
    );
  });

  it('enrols all three facilities into it', async () => {
    const { args, queries } = makeArgs({ hasFijiSrh: true });

    await fijiSrhStep.run(args);

    expect(findQuery(queries, 'UPDATE facilities')!.replacements).toMatchObject({
      networkId: FIJI_SRH_NETWORK.id,
      facilityIds: FIJI_SRH_FACILITY_IDS,
    });
  });

  // The point of the paths being exclusive: the SRH rows are written once, not tagged by the
  // ordinary rescope and then rewritten.
  it('rescopes the SRH lookup rows in a single statement', async () => {
    const { args, queries } = makeArgs({ hasFijiSrh: true });

    await fijiSrhStep.run(args);

    const writes = queries.filter(query => query.sql.includes('UPDATE sync_lookup'));
    expect(writes).toHaveLength(1);
    expect(writes[0].sql).toContain('facility_id = NULL');
    expect(writes[0].sql).not.toContain('updated_at_sync_tick');
    expect(writes[0].replacements).toMatchObject({ facilityIds: FIJI_SRH_FACILITY_IDS });
  });

  // A tick set only on sync_lookup is undone by a full lookup rebuild, which reads the source tick.
  it('bumps the sync tick on every encounter scoped source record', async () => {
    const { args, queries } = makeArgs({ hasFijiSrh: true });

    await fijiSrhStep.run(args);

    const touches = queries.filter(query => query.sql.includes('FROM sync_lookup'));
    expect(touches.map(query => query.replacements.recordType)).toEqual(
      ENCOUNTER_SCOPED_RECORD_TYPES,
    );
    for (const touch of touches) {
      expect(touch.sql).toContain(`UPDATE "${touch.replacements.recordType}"`);
      expect(touch.sql).toContain('SET updated_at_sync_tick = 1');
      expect(touch.replacements.facilityIds).toEqual(FIJI_SRH_FACILITY_IDS);
    }
  });

  it('touches the source records while the lookup rows still name the SRH facilities', async () => {
    const { args, queries } = makeArgs({ hasFijiSrh: true });

    await fijiSrhStep.run(args);

    const lastTouch = queries.findLastIndex(query => query.sql.includes('FROM sync_lookup'));
    const rescope = queries.findIndex(query => query.sql.includes('UPDATE sync_lookup'));
    expect(lastTouch).toBeLessThan(rescope);
  });

  it('leaves rows that are not encounter scoped alone', async () => {
    const { args, queries } = makeArgs({ hasFijiSrh: true });

    await fijiSrhStep.run(args);

    const { encounterScopedRecordTypes } = findQuery(queries, 'UPDATE sync_lookup')!.replacements;
    expect(encounterScopedRecordTypes).toContain('encounters');
    expect(encounterScopedRecordTypes).not.toContain('patient_facilities');
  });

});
