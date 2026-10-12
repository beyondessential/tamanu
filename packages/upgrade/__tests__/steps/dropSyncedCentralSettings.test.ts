import { describe, expect, it, vi } from 'vitest';

// The audit barrel reads server config at import.
vi.mock('@tamanu/database/utils/audit', () => import('../../../database/src/utils/audit/pauseAudit'));

import { STEPS } from '../../src/steps/1791760364392-dropSyncedCentralSettings.js';

const [step] = STEPS;

const runOn = async (serverType: 'central' | 'facility') => {
  const query = vi.fn(async () => [[], 0]);
  const setTransactionVar = vi.fn();
  const transaction = async (work: () => Promise<void>) => work();
  await step.run({ serverType, sequelize: { query, setTransactionVar, transaction } } as any);
  return {
    queries: query.mock.calls.map(([sql, options]: any) => ({
      sql: sql.replace(/\s+/g, ' ').trim(),
      replacements: options?.replacements,
    })),
    transactionVars: setTransactionVar.mock.calls,
  };
};

describe('1791760364392-dropSyncedCentralSettings', () => {
  it('on central, removes only the lookup rows of central-scope settings', async () => {
    const { queries, transactionVars } = await runOn('central');
    expect(transactionVars).toEqual([]);
    expect(queries).toEqual([
      {
        sql: "DELETE FROM sync_lookup WHERE record_type = 'settings' AND record_id IN (SELECT id::text FROM settings WHERE scope = :central)",
        replacements: { central: 'central' },
      },
    ]);
  });

  it('on a facility, deletes its copies of central-scope settings without logging them', async () => {
    const { queries, transactionVars } = await runOn('facility');
    expect(transactionVars).toEqual([['audit.pause', true]]);
    expect(queries).toEqual([
      {
        sql: 'DELETE FROM settings WHERE scope = :central',
        replacements: { central: 'central' },
      },
    ]);
  });
});
