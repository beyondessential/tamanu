import { pauseAudit } from '@tamanu/database/utils/audit';
import { createTestContext } from '../utilities';

describe('Changelog Trigger Transactional Safety', () => {
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

  describe('Transaction commit behavior', () => {
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
        expect(changesInTransaction.length).toBe(0);

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

    it('should not create changelog entries when transaction rolls back', async () => {
      let programIds;
      try {
        await sequelize.transaction(async transaction => {
          const program = await models.Program.create(
            { code: 'test-rollback', name: 'Will Rollback' },
            { transaction },
          );
          const program2 = await models.Program.create(
            { code: 'test-rollback-2', name: 'Will Rollback 2' },
            { transaction },
          );
          programIds = [program.id, program2.id];

          throw new Error('Intentional rollback');
        });
      } catch (error) {
        expect(error.message).toBe('Intentional rollback');
      }

      const changes = await sequelize.query(
        'SELECT * FROM logs.changes WHERE record_id IN (:programIds)',
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: { programIds },
        },
      );

      expect(changes.length).toBe(0);
    });
  });

  describe('Update operations', () => {
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
        expect(changesInTransaction.length).toBe(0);
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
          record_data: expect.objectContaining({ name: 'Updated Name' }) ,
        }),
      ]);
    });

    it('should not create changelog entries for rolled back updates', async () => {
      const program = await models.Program.create({
        code: 'update-rollback',
        name: 'Original Name',
      });

      await sequelize.query('DELETE FROM logs.changes');

      try {
        await sequelize.transaction(async transaction => {
          await program.update({ name: 'This Will Rollback' }, { transaction });
          throw new Error('Rollback update');
        });
      } catch (error) {
        expect(error.message).toBe('Rollback update');
      }

      const changes = await sequelize.query(
        'SELECT * FROM logs.changes WHERE record_id = :programId',
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: { programId: program.id },
        },
      );

      expect(changes).toEqual([]);
    });
  });

  describe('Transaction rollback scenarios', () => {
    it('should rollback all changelog entries when constraint violation occurs', async () => {
      const existingProgram = await models.Program.create({
        code: 'existing-program',
        name: 'Existing',
      });

      await sequelize.query('DELETE FROM logs.changes');

      let newProgramId;
      let errorThrown = false;

      try {
        await sequelize.transaction(async transaction => {
          const program = await models.Program.create(
            { code: 'new-program', name: 'New Program' },
            { transaction },
          );
          newProgramId = program.id;

          await sequelize.query(
            `INSERT INTO programs (id, code, name, created_at, updated_at, updated_at_sync_tick) 
             VALUES (:id, 'duplicate', 'Duplicate ID', NOW(), NOW(), 0)`,
            {
              replacements: { id: existingProgram.id },
              transaction,
            },
          );
        });
      } catch (error) {
        errorThrown = true;
        expect(error.name).toMatch(/Sequelize/);
      }

      expect(errorThrown).toBe(true);

      const changes = await sequelize.query('SELECT * FROM logs.changes WHERE record_id = :id', {
        type: sequelize.QueryTypes.SELECT,
        replacements: { id: newProgramId },
      });

      expect(changes.length).toBe(0);
    });

    it('should work correctly with nested transactions (savepoints)', async () => {
      const result = await sequelize.transaction(async outerTransaction => {
        const p1 = await models.Program.create(
          { code: 'outer-1', name: 'Outer 1' },
          { transaction: outerTransaction },
        );

        let p2Id;
        try {
          await sequelize.transaction({ transaction: outerTransaction }, async innerTransaction => {
            const p2 = await models.Program.create(
              { code: 'inner-1', name: 'Inner 1' },
              { transaction: innerTransaction },
            );
            p2Id = p2.id;
            throw new Error('Rollback inner');
          });
        } catch (error) {
          expect(error.message).toBe('Rollback inner');
        }

        const p3 = await models.Program.create(
          { code: 'outer-2', name: 'Outer 2' },
          { transaction: outerTransaction },
        );

        return { p1Id: p1.id, p2Id, p3Id: p3.id };
      });

      const changes = await sequelize.query(
        'SELECT * FROM logs.changes WHERE record_id IN (:ids)',
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: { ids: [result.p1Id, result.p2Id, result.p3Id] },
        },
      );

      expect(changes.length).toBe(2);
      expect(changes.map(c => c.record_id)).toEqual(
        expect.arrayContaining([result.p1Id, result.p3Id]),
      );
      expect(changes.map(c => c.record_id)).not.toContain(result.p2Id);
    });
  });

  describe('Audit pause integration', () => {
    it('should respect audit pause with constraint triggers', async () => {
      let pausedId;
      await sequelize.transaction(async transaction => {
        await pauseAudit(sequelize);
        const paused = await models.Program.create(
          { code: 'paused', name: 'Paused' },
          { transaction },
        );
        pausedId = paused.id;
      });

      const changes = await sequelize.query('SELECT * FROM logs.changes WHERE record_id = :id', {
        type: sequelize.QueryTypes.SELECT,
        replacements: { id: pausedId },
      });

      expect(changes.length).toBe(0);
    });
  });

  describe('Constraint trigger behavior', () => {
    it('should defer trigger execution until end of transaction', async () => {
      let programId;

      await sequelize.transaction(async transaction => {
        const program = await models.Program.create(
          { code: 'timing-test', name: 'Timing Test' },
          { transaction },
        );
        programId = program.id;

        const changesBeforeCommit = await sequelize.query(
          'SELECT COUNT(*) as count FROM logs.changes WHERE record_id = :id',
          {
            type: sequelize.QueryTypes.SELECT,
            replacements: { id: program.id },
            transaction,
          },
        );

        expect(changesBeforeCommit[0].count).toBe('0');
      });

      const changesAfterCommit = await sequelize.query(
        'SELECT COUNT(*) as count FROM logs.changes WHERE record_id = :id',
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: { id: programId },
        },
      );

      expect(changesAfterCommit[0].count).toBe('1');
    });
  });
});
