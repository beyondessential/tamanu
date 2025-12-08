import { pauseAudit } from '@tamanu/database/utils/audit';
import { createTestContext } from '../utilities';

describe('pauseAudit', () => {
  let ctx;
  let sequelize;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    sequelize = ctx.sequelize;
  });

  afterAll(() => ctx.close());

  beforeEach(async () => {
    await models.Setting.set('audit.changes.enabled', true);
    await models.Program.destroy({ where: {}, force: true });
    await sequelize.query('DELETE FROM logs.changes');
  });

  describe('Pause functionality', () => {
    it('should pause audit for a transaction when pause key is true', async () => {
      const program1 = await models.Program.create({ code: 'test-1', name: 'Test Program 1' });
      
      const program2 = await sequelize.transaction(async transaction => {
        await pauseAudit(sequelize);
        return models.Program.create(
          { code: 'test-2', name: 'Test Program 2' },
          { transaction },
        );
      });

      const changes = await sequelize.query(
        'SELECT * FROM logs.changes WHERE record_id IN (:programIds)',
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

    it('should pause audit when setting is disabled globally', async () => {
      await models.Setting.set('audit.changes.enabled', false);
      
      const program1 = await models.Program.create({ code: 'test-1', name: 'Test Program 1' });
      const program2 = await models.Program.create({ code: 'test-2', name: 'Test Program 2' });

      const changes = await sequelize.query(
        'SELECT * FROM logs.changes WHERE record_id IN (:programIds)',
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: {
            programIds: [program1.id, program2.id],
          },
        },
      );

      expect(changes.length).toBe(0);
    });

    it('should allow selective pausing within a transaction', async () => {
      const result = await sequelize.transaction(async transaction => {
        const before = await models.Program.create(
          { code: 'before-pause', name: 'Before Pause' },
          { transaction },
        );

        await pauseAudit(sequelize);

        const during = await models.Program.create(
          { code: 'during-pause', name: 'During Pause' },
          { transaction },
        );

        return { beforeId: before.id, duringId: during.id };
      });

      const changes = await sequelize.query(
        'SELECT * FROM logs.changes WHERE record_id IN (:ids)',
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: { ids: [result.beforeId, result.duringId] },
        },
      );

      expect(changes.length).toBe(1);
      expect(changes[0].record_id).toBe(result.beforeId);
    });

    it('should only pause audit within the specific transaction', async () => {
      const program1 = await models.Program.create({ code: 'outside-1', name: 'Outside 1' });

      await sequelize.transaction(async transaction => {
        await pauseAudit(sequelize);
        await models.Program.create(
          { code: 'inside-paused', name: 'Inside Paused' },
          { transaction },
        );
      });

      const program2 = await models.Program.create({ code: 'outside-2', name: 'Outside 2' });

      const changes = await sequelize.query(
        'SELECT * FROM logs.changes WHERE record_id IN (:ids)',
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: { ids: [program1.id, program2.id] },
        },
      );

      expect(changes.length).toBe(2);
      expect(changes.map(c => c.record_id)).toEqual(
        expect.arrayContaining([program1.id, program2.id]),
      );
    });
  });
});
