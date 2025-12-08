import { pauseAudit } from '@tamanu/database/utils/audit';
import { createTestContext } from '../utilities';

describe('Changelogs', () => {
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

  describe('Changelog Trigger Transactional Safety', () => {
    it('should create changelog entries only when transaction commits', async () => {
      let programIds;
      await sequelize.transaction(async transaction => {
        const program1 = await models.Program.create(
          { code: 'test-1', name: 'Test Program 1' },
          { transaction },
        );

        const program2 = await models.Program.create(
          { code: 'test-2', name: 'Test Program 2' },
          { transaction },
        );

        programIds = [program1.id, program2.id];

        const changesInTransaction = await sequelize.query(
          'SELECT * FROM logs.changes WHERE record_id IN (:programIds)',
          {
            type: sequelize.QueryTypes.SELECT,
            replacements: { programIds },
            transaction,
          },
        );
        expect(changesInTransaction).toEqual([]);

        return programIds;
      });

      const changesAfterCommit = await sequelize.query(
        'SELECT * FROM logs.changes WHERE record_id IN (:programIds)',
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: { programIds },
        },
      );

      expect(changesAfterCommit).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            record_id: programIds[0],
            table_name: 'programs',
          }),
          expect.objectContaining({
            record_id: programIds[1],
            table_name: 'programs',
          }),
        ]),
      );
    });

    it('should create changelog entries for updates only on commit', async () => {
      const program = await models.Program.create({
        code: 'update-test',
        name: 'Original Name',
      });

      await sequelize.query('DELETE FROM logs.changes');

      await sequelize.transaction(async transaction => {
        await program.update({ name: 'Updated Name' }, { transaction });

        const changesInTransaction = await sequelize.query(
          'SELECT * FROM logs.changes WHERE record_id = :programId',
          {
            type: sequelize.QueryTypes.SELECT,
            replacements: { programId: program.id },
            transaction,
          },
        );
        expect(changesInTransaction).toEqual([]);
      });

      const changesAfterCommit = await sequelize.query(
        'SELECT * FROM logs.changes WHERE record_id = :programId',
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: { programId: program.id },
        },
      );

      expect(changesAfterCommit).toEqual([
        expect.objectContaining({
          record_id: program.id,
          table_name: 'programs',
          record_data: expect.objectContaining({ name: 'Updated Name' }),
        }),
      ]);
    });

    it('should defer trigger execution until end of transaction', async () => {
      let programId;

      await sequelize.transaction(async transaction => {
        const program = await models.Program.create(
          { code: 'timing-test', name: 'Timing Test' },
          { transaction },
        );
        programId = program.id;

        const changesBeforeCommit = await sequelize.query(
          'SELECT * FROM logs.changes WHERE record_id = :id',
          {
            type: sequelize.QueryTypes.SELECT,
            replacements: { id: program.id },
            transaction,
          },
        );

        expect(changesBeforeCommit).toEqual([]);
      });

      const changesAfterCommit = await sequelize.query(
        'SELECT * FROM logs.changes WHERE record_id = :id',
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: { id: programId },
        },
      );

      expect(changesAfterCommit).toEqual([
        expect.objectContaining({
          record_id: programId,
          table_name: 'programs',
        }),
      ]);
    });
  });

  describe('Pause Audit', () => {
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

      expect(changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            record_id: program1.id,
            table_name: 'programs',
          }),
        ]),
      );
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

      expect(changes).toEqual([]);
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

      expect(changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            record_id: program1.id,
            table_name: 'programs',
          }),
          expect.objectContaining({
            record_id: program2.id,
            table_name: 'programs',
          }),
        ]),
      );
    });
  });
});
