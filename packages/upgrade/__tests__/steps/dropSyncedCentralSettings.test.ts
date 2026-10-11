import { describe, expect, it, vi } from 'vitest';

import { STEPS } from '../../src/steps/1791760364392-dropSyncedCentralSettings.js';

const [step] = STEPS;

const runOn = async (serverType: 'central' | 'facility') => {
  const query = vi.fn(async () => [[], 0]);
  await step.run({ serverType, sequelize: { query } } as any);
  return query.mock.calls.map(([sql, options]: any) => ({
    sql: sql.replace(/\s+/g, ' ').trim(),
    replacements: options?.replacements,
  }));
};

describe('1791760364392-dropSyncedCentralSettings', () => {
  it('on central, removes only the lookup rows of central-scope settings', async () => {
    expect(await runOn('central')).toEqual([
      {
        sql: "DELETE FROM sync_lookup WHERE record_type = 'settings' AND record_id IN (SELECT id::text FROM settings WHERE scope = :central)",
        replacements: { central: 'central' },
      },
    ]);
  });

  it('on a facility, deletes its copies of central-scope settings', async () => {
    expect(await runOn('facility')).toEqual([
      {
        sql: 'DELETE FROM settings WHERE scope = :central',
        replacements: { central: 'central' },
      },
    ]);
  });
});
