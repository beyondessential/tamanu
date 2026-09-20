import { describe, it, expect, vi } from 'vitest';
import { FACT_CURRENT_SYNC_TICK } from '@tamanu/constants';

import { STEPS } from '../../src/steps/1788700000000-mergeFijiSensitiveNetworks.js';

const [mergeStep] = STEPS;

const NETWORK_ID = 'sensitiveNetwork-srh';
const SRH_FACILITIES = [
  { id: 'facility-SRHCentral', networkId: 'sensitiveNetwork-SRHCentral' },
  { id: 'facility-SRHWestern', networkId: 'sensitiveNetwork-SRHWestern' },
  { id: 'facility-SRHNorthern', networkId: 'sensitiveNetwork-SRHNorthern' },
];
const BACKFILLED_NETWORK_IDS = SRH_FACILITIES.map(({ networkId }) => networkId);

const makeArgs = ({ facilities = SRH_FACILITIES, serverType = 'central' } = {}) => {
  const queries: { sql: string; replacements: any }[] = [];
  return {
    args: {
      serverType,
      sequelize: {
        transaction: async (callback: () => Promise<void>) => callback(),
        query: vi.fn(async (sql: string, options: any = {}) => {
          queries.push({ sql, replacements: options.replacements });
          if (sql.includes('FROM facilities')) return facilities;
          return [[], 0];
        }),
      },
      models: {
        LocalSystemFact: { incrementValue: vi.fn(async () => 42) },
      },
      log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn() },
    } as any,
    queries,
  };
};

const findQuery = (queries: { sql: string }[], fragment: string) =>
  queries.find(query => query.sql.includes(fragment));

const writes = (queries: { sql: string }[]) =>
  queries.filter(query => query.sql.includes('UPDATE') || query.sql.includes('INSERT'));

describe('1788700000000-mergeFijiSensitiveNetworks', () => {
  it('runs on a central server', async () => {
    const { args } = makeArgs();
    await expect(mergeStep.check(args)).resolves.toBe(true);
  });

  it('does not run on a facility server', async () => {
    const { args } = makeArgs({ serverType: 'facility' });
    await expect(mergeStep.check(args)).resolves.toBe(false);
  });

  it('moves the SRH facilities into a network of their own', async () => {
    const { args, queries } = makeArgs();

    await mergeStep.run(args);

    expect(findQuery(queries, 'INSERT INTO sensitive_networks')!.replacements).toMatchObject({
      id: NETWORK_ID,
      code: 'SRH',
    });
    expect(findQuery(queries, 'UPDATE facilities')!.replacements).toMatchObject({
      targetId: NETWORK_ID,
      facilityIds: SRH_FACILITIES.map(({ id }) => id),
    });
  });

  it('retires the networks the backfill gave each facility', async () => {
    const { args, queries } = makeArgs();

    await mergeStep.run(args);

    expect(findQuery(queries, 'UPDATE sync_lookup')!.replacements).toMatchObject({
      targetId: NETWORK_ID,
      mergedIds: BACKFILLED_NETWORK_IDS,
    });
    expect(
      findQuery(queries, 'UPDATE sensitive_networks SET deleted_at')!.replacements,
    ).toMatchObject({
      mergedIds: BACKFILLED_NETWORK_IDS,
    });
  });

  it('bumps the retagged rows onto a fresh tick so every facility pulls them', async () => {
    const { args, queries } = makeArgs();

    await mergeStep.run(args);

    expect(args.models.LocalSystemFact.incrementValue).toHaveBeenCalledWith(
      FACT_CURRENT_SYNC_TICK,
      2,
    );
    // the "tick" of the tick-tock, as the sync clock does it
    expect(findQuery(queries, 'updated_at_sync_tick')!.replacements).toMatchObject({
      tick: 41,
      targetId: NETWORK_ID,
    });
  });

  // sync_lookup is the largest table in the deployment, so retag and re-tick have to be one
  // statement: a separate tick pass could only rewrite rows the retag had just written.
  it('retags and re-ticks sync_lookup in a single pass', async () => {
    const { args, queries } = makeArgs();

    await mergeStep.run(args);

    const lookupWrites = queries.filter(query => query.sql.includes('UPDATE sync_lookup'));
    expect(lookupWrites).toHaveLength(1);
    expect(lookupWrites[0].sql).toContain('sensitive_network_id = :targetId');
    expect(lookupWrites[0].sql).toContain('updated_at_sync_tick = :tick');
  });

  it('writes nothing once the facilities share the network', async () => {
    const { args, queries } = makeArgs({
      facilities: SRH_FACILITIES.map(facility => ({ ...facility, networkId: NETWORK_ID })),
    });

    await mergeStep.run(args);

    expect(writes(queries)).toHaveLength(0);
  });

  it('writes nothing on a deployment without the SRH facilities', async () => {
    const { args, queries } = makeArgs({ facilities: [] });

    await mergeStep.run(args);

    expect(writes(queries)).toHaveLength(0);
  });

  it('writes nothing when one of the facilities is missing', async () => {
    const { args, queries } = makeArgs({ facilities: SRH_FACILITIES.slice(0, 2) });

    await mergeStep.run(args);

    expect(writes(queries)).toHaveLength(0);
  });

  it('writes nothing when a facility is not in a network', async () => {
    const { args, queries } = makeArgs({
      facilities: [...SRH_FACILITIES.slice(0, 2), { id: 'facility-SRHNorthern', networkId: null }],
    });

    await mergeStep.run(args);

    expect(writes(queries)).toHaveLength(0);
  });
});
