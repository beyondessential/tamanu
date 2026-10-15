import { describe, it, expect, vi } from 'vitest';

import { FIJI_SRH_FACILITY_IDS, FIJI_SRH_NETWORK } from '../../src/sensitiveNetworks.js';

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
  it('rescopes the SRH rows in a single statement', async () => {
    const { args, queries } = makeArgs({ hasFijiSrh: true });

    await fijiSrhStep.run(args);

    const writes = queries.filter(query => query.sql.includes('UPDATE sync_lookup'));
    expect(writes).toHaveLength(1);
    expect(writes[0].sql).toContain('facility_id = NULL');
    expect(writes[0].replacements).toMatchObject({ facilityIds: FIJI_SRH_FACILITY_IDS });
  });

  // A lookup re-tick would be undone by any full lookup rebuild; a newly marked patient's history
  // is pulled from all time regardless of lookup ticks.
  it('re-marks the SRH patients for sync so each facility pulls their full history', async () => {
    const { args, queries } = makeArgs({ hasFijiSrh: true });

    await fijiSrhStep.run(args);

    const reMark = findQuery(queries, 'UPDATE patient_facilities')!;
    expect(reMark.sql).toContain('updated_at_sync_tick = 1');
    expect(reMark.replacements).toMatchObject({ facilityIds: FIJI_SRH_FACILITY_IDS });
    expect(findQuery(queries, 'UPDATE sync_lookup')!.sql).not.toContain('updated_at_sync_tick');
  });

  it('leaves rows that are not encounter scoped alone', async () => {
    const { args, queries } = makeArgs({ hasFijiSrh: true });

    await fijiSrhStep.run(args);

    const { encounterScopedRecordTypes } = findQuery(queries, 'UPDATE sync_lookup')!.replacements;
    expect(encounterScopedRecordTypes).toContain('encounters');
    expect(encounterScopedRecordTypes).not.toContain('patient_facilities');
  });

});
