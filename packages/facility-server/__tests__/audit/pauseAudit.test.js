import { AUDIT_PAUSE_KEY } from '@tamanu/constants';
import { createTestContext } from '../utilities';

describe('pauseAudit', () => {
  let ctx;
  let sequelize;
  let models;
  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    sequelize = ctx.sequelize;
    await models.Setting.set('audit.changes.enabled', true);
  });

  afterAll(() => ctx.close());

  it('should pause audit for a transaction when pause key is true', async () => {
    const program1 = await models.Program.create({ code: 'test-1', name: 'Test Program 1' });
    const program2 = await sequelize.transaction(async () => {
      await sequelize.setTransactionVar(AUDIT_PAUSE_KEY, true);
      return models.Program.create({ code: 'test-2', name: 'Test Program 2' });
    });
    const changes = await sequelize.query(
      `SELECT * FROM logs.changes WHERE record_id IN (:programIds);`,
      {
        type: sequelize.QueryTypes.SELECT,
        replacements: {
          programIds: [program1.id, program2.id],
        },
      },
    );
    expect(changes.length).toBe(1);
    // Only the program not created in the paused audit transaction
    expect(changes[0].record_id).toBe(program1.id);
  });
});
