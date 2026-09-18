import { Database } from '~/infra/db';
import { Task } from '~/models/Task';
import { fakeUser, fakePatient, fakeEncounter, fakeTask } from '/root/tests/helpers/fake';
import { runSyncSaveTransaction } from './runSyncSaveTransaction';
import type { IPatient, IUser } from '~/types';

describe('runSyncSaveTransaction', () => {
  let encounterId: string;
  let requestedByUserId: string;

  beforeAll(async () => {
    await Database.connect();

    const user = fakeUser();
    await Database.models.User.insert(user);
    requestedByUserId = user.id;

    const patient = fakePatient();
    await Database.models.Patient.insert(patient);

    const encounter = fakeEncounter();
    encounter.patient = { id: patient.id } as IPatient;
    encounter.examiner = { id: user.id } as IUser;
    await Database.models.Encounter.insert(encounter as any);
    encounterId = encounter.id;
  });

  beforeEach(async () => {
    // SQLite processes deletes row-by-row and can raise FK violations when deleting a parent before its children
    await Database.client.query('PRAGMA foreign_keys = OFF;');
    await Database.models.Task.clear();
    await Database.client.query('PRAGMA foreign_keys = ON;');
    jest.restoreAllMocks();
  });

  it('commits the work without running foreign_key_check when nothing is violated', async () => {
    const querySpy = jest.spyOn(Database.client.createQueryRunner(), 'query');

    await runSyncSaveTransaction(['tasks'], async em => {
      await em.getRepository(Task).save(fakeTask(encounterId, requestedByUserId));
    });

    expect(await Database.models.Task.count()).toBe(1);
    const foreignKeyChecks = querySpy.mock.calls.filter(([sql]) =>
      String(sql).includes('foreign_key_check'),
    );
    expect(foreignKeyChecks).toHaveLength(0);
  });

  it('allows a child to be saved before its parent within the transaction', async () => {
    const parentId = crypto.randomUUID();

    await runSyncSaveTransaction(['tasks'], async em => {
      const repo = em.getRepository(Task);
      await repo.save(fakeTask(encounterId, requestedByUserId, { parentTaskId: parentId }));
      await repo.save(fakeTask(encounterId, requestedByUserId, { id: parentId }));
    });

    expect(await Database.models.Task.count()).toBe(2);
  });

  it('names the offending record when the commit fails on a deferred foreign key, and rolls back', async () => {
    const childId = crypto.randomUUID();

    await expect(
      runSyncSaveTransaction(['tasks'], async em => {
        // parentTaskId references a task that is never inserted
        await em
          .getRepository(Task)
          .save(
            fakeTask(encounterId, requestedByUserId, {
              id: childId,
              parentTaskId: crypto.randomUUID(),
            }),
          );
      }),
    ).rejects.toThrow(childId);

    expect(Database.client.createQueryRunner().isTransactionActive).toBe(false);
    expect(await Database.models.Task.count()).toBe(0);
  });

  it('keeps the commit error as the cause when the foreign key diagnostic itself fails', async () => {
    const queryRunner = Database.client.createQueryRunner();
    const commitError = new Error('disk I/O error');
    jest.spyOn(queryRunner, 'commitTransaction').mockRejectedValue(commitError);
    const query = queryRunner.query.bind(queryRunner);
    jest.spyOn(queryRunner, 'query').mockImplementation((sql, ...rest) => {
      if (String(sql).includes('foreign_key_check')) throw new Error('database is locked');
      return query(sql, ...rest);
    });

    await expect(
      runSyncSaveTransaction(['tasks'], async em => {
        await em.getRepository(Task).save(fakeTask(encounterId, requestedByUserId));
      }),
    ).rejects.toMatchObject({
      message: expect.stringContaining('database is locked'),
      cause: commitError,
    });

    expect(queryRunner.isTransactionActive).toBe(false);
    expect(await Database.models.Task.count()).toBe(0);
  });

  it('rethrows other errors from the work and rolls back', async () => {
    await expect(
      runSyncSaveTransaction(['tasks'], async em => {
        await em.getRepository(Task).save(fakeTask(encounterId, requestedByUserId));
        throw new Error('save exploded');
      }),
    ).rejects.toThrow('save exploded');

    expect(Database.client.createQueryRunner().isTransactionActive).toBe(false);
    expect(await Database.models.Task.count()).toBe(0);
  });
});
