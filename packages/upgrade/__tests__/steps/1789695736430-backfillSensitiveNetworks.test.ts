import { describe, it, expect, vi } from 'vitest';

import { STEPS } from '../../src/steps/1789695736430-backfillSensitiveNetworks.js';

const [ordinaryStep] = STEPS;

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
      models: { LocalSystemFact: { incrementValue: vi.fn(async () => 42) } },
      log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn() },
    } as any,
    queries,
  };
};

const findQuery = (queries: { sql: string }[], fragment: string) =>
  queries.find(query => query.sql.includes(fragment));

describe('1789695736430-backfillSensitiveNetworks', () => {
  it('runs between the two schema migrations', () => {
    expect(ordinaryStep.after).toContain('migration/1789695736424-createSensitiveNetworks');
    expect(ordinaryStep.before).toContain('migration/1789695736426-dropFacilityIsSensitive');
  });

  it('claims a deployment without the SRH facilities', async () => {
    const { args } = makeArgs({ hasFijiSrh: false });

    await expect(ordinaryStep.check(args)).resolves.toBe(true);
  });

  it('leaves a deployment with them to the SRH step', async () => {
    const { args } = makeArgs({ hasFijiSrh: true });

    await expect(ordinaryStep.check(args)).resolves.toBe(false);
  });

  it('stands down on a later upgrade, once is_sensitive has been dropped', async () => {
    const { args } = makeArgs({ isSensitiveDropped: true });

    await expect(ordinaryStep.check(args)).resolves.toBe(false);
  });

  it('gives each sensitive facility a network of its own', async () => {
    const { args, queries } = makeArgs();

    await ordinaryStep.run(args);

    expect(findQuery(queries, 'INSERT INTO sensitive_networks')!.sql).toContain(
      "'sensitiveNetwork-' || id",
    );
    expect(findQuery(queries, 'UPDATE facilities')!.sql).toContain('is_sensitive = TRUE');
  });

  it('moves the lookup rows onto those networks without touching any tick', async () => {
    const { args, queries } = makeArgs();

    await ordinaryStep.run(args);

    const rescope = findQuery(queries, 'UPDATE sync_lookup')!;
    expect(rescope.sql).toContain('facility_id = NULL');
    expect(rescope.sql).not.toContain('updated_at_sync_tick');
  });
});
