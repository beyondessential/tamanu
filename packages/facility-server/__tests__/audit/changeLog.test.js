import { QueryTypes } from 'sequelize';

import { fake } from '@tamanu/fake-data/fake';
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
    it('should not create changelog entries when transaction is rolled back', async () => {
      try {
        await sequelize.transaction(async transaction => {
          await models.Program.create(fake(models.Program), { transaction });
          throw new Error('Intentional rollback');
        });
      } catch (error) {
        expect(error.message).toBe('Intentional rollback');
      }

      const changes = await sequelize.query('SELECT * FROM logs.changes', {
        type: QueryTypes.SELECT,
      });
      expect(changes).toEqual([]);
    });

    it('should create changelog entries only when transaction commits', async () => {
      const programIds = await sequelize.transaction(async transaction => {
        const program1 = await models.Program.create(fake(models.Program), { transaction });
        const program2 = await models.Program.create(fake(models.Program), { transaction });
        const ids = [program1.id, program2.id];

        const changesInTransaction = await sequelize.query(
          'SELECT * FROM logs.changes WHERE record_id IN (:programIds)',
          {
            type: QueryTypes.SELECT,
            replacements: { programIds: ids },
            transaction,
          },
        );
        expect(changesInTransaction).toEqual([]);

        return ids;
      });

      const changesAfterCommit = await sequelize.query(
        'SELECT * FROM logs.changes WHERE record_id IN (:programIds)',
        {
          type: QueryTypes.SELECT,
          replacements: { programIds },
        },
      );

      expect(changesAfterCommit).toHaveLength(2);
      expect(changesAfterCommit).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ record_id: programIds[0], table_name: 'programs' }),
          expect.objectContaining({ record_id: programIds[1], table_name: 'programs' }),
        ]),
      );
    });

    it('should create changelog entries for updates only on commit', async () => {
      const program = await models.Program.create(fake(models.Program));
      const updatedName = 'Updated Name';
      await sequelize.transaction(async transaction => {
        await program.update({ name: updatedName }, { transaction });

        const changesInTransaction = await sequelize.query(
          'SELECT * FROM logs.changes WHERE record_id = :programId',
          {
            type: QueryTypes.SELECT,
            replacements: { programId: program.id },
            transaction,
          },
        );
        expect(changesInTransaction).toEqual([]);
      });

      const changesAfterCommit = await sequelize.query(
        'SELECT * FROM logs.changes WHERE record_id = :programId',
        {
          type: QueryTypes.SELECT,
          replacements: { programId: program.id },
        },
      );

      expect(changesAfterCommit).toEqual([
        expect.objectContaining({
          record_id: program.id,
          table_name: 'programs',
          record_data: expect.objectContaining({ name: updatedName }),
        }),
      ]);
    });

    it('should defer trigger execution until end of transaction', async () => {
      const programId = await sequelize.transaction(async transaction => {
        const program = await models.Program.create(fake(models.Program), { transaction });

        const changesBeforeCommit = await sequelize.query(
          'SELECT * FROM logs.changes WHERE record_id = :id',
          {
            type: QueryTypes.SELECT,
            replacements: { id: program.id },
            transaction,
          },
        );

        expect(changesBeforeCommit).toEqual([]);
        return program.id;
      });

      const changesAfterCommit = await sequelize.query(
        'SELECT * FROM logs.changes WHERE record_id = :id',
        {
          type: QueryTypes.SELECT,
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
      const program1 = await models.Program.create(fake(models.Program));
      const program2 = await sequelize.transaction(async transaction => {
        await pauseAudit(sequelize);
        return models.Program.create(fake(models.Program), { transaction });
      });

      const changes = await sequelize.query(
        'SELECT * FROM logs.changes WHERE record_id IN (:programIds)',
        {
          type: QueryTypes.SELECT,
          replacements: {
            programIds: [program1.id, program2.id],
          },
        },
      );

      expect(changes).toEqual([
        expect.objectContaining({
          record_id: program1.id,
          table_name: 'programs',
        }),
      ]);
    });

    it('should only pause audit within the specific transaction', async () => {
      // Outside transaction
      const program1 = await models.Program.create(fake(models.Program));

      // Paused transaction
      const program2 = await sequelize.transaction(async transaction => {
        await pauseAudit(sequelize);
        return models.Program.create(fake(models.Program), { transaction });
      });
      // Unpaused transaction
      const program3 = await sequelize.transaction(async transaction =>
        models.Program.create(fake(models.Program), { transaction }),
      );

      const changes = await sequelize.query(
        'SELECT * FROM logs.changes WHERE record_id IN (:ids)',
        {
          type: QueryTypes.SELECT,
          replacements: { ids: [program1.id, program2.id, program3.id] },
        },
      );

      expect(changes).toHaveLength(2);
      expect(changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ record_id: program1.id, table_name: 'programs' }),
          expect.objectContaining({ record_id: program3.id, table_name: 'programs' }),
        ]),
      );
    });
  });
});
