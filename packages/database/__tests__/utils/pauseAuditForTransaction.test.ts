import { closeDatabase, createTestDatabase } from '../sync/utilities';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { AUDIT_PAUSE_KEY } from '@tamanu/constants';

describe('pauseAuditForTransaction', () => {
  let sequelize;
  let models;

  beforeAll(async () => {
    const database = await createTestDatabase();
    sequelize = database.sequelize;
    models = database.models;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('should pause audit for a transaction when pause key is true', async () => {
    const program1 = await models.Program.create({ code: 'test-1', name: 'Test Program 1' });
    const program2 = await sequelize.transaction(async () => {
      await sequelize.setTransactionVar(AUDIT_PAUSE_KEY, true);
      return await models.Program.create({ code: 'test-2', name: 'Test Program 2' });
    });
    const changes = await sequelize.query(
      `SELECT * FROM logs.changes WHERE record_id in (:programIds);`,
      {
        type: sequelize.QueryTypes.SELECT,
        replacements: {
          programIds: [program1.id, program2.id],
        },
      },
    );
    expect(changes.length).toBe(1);
    expect(changes[0].record_id).toBe(program1.id);
  });
});
