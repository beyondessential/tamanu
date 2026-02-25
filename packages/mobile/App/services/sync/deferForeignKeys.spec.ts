import { v4 as uuidv4 } from 'uuid';

import { Database } from '~/infra/db';
import { Task } from '~/models/Task';
import { deferForeignKeys } from './MobileSyncManager';

describe('deferForeignKeys', () => {
  beforeAll(async () => {
    await Database.connect();
  });

  beforeEach(async () => {
    await Database.models.Task.clear();
  });

  const makeTask = (overrides: Partial<Task> = {}): Partial<Task> => ({
    id: uuidv4(),
    name: 'test-task',
    dueTime: new Date().toISOString(),
    requestTime: new Date().toISOString(),
    status: 'todo',
    taskType: 'normal_task',
    ...overrides,
  });

  it('allows inserting a child before its parent when foreign keys are deferred', async () => {
    const parentId = uuidv4();
    const childId = uuidv4();

    await Database.client.transaction(async em => {
      await deferForeignKeys(em);

      const repo = em.getRepository(Task);
      await repo.save(makeTask({ id: childId, parentTaskId: parentId }));
      await repo.save(makeTask({ id: parentId }));
    });

    const child = await Database.models.Task.findOne({ where: { id: childId } });
    expect(child).toBeTruthy();
    expect(child.parentTaskId).toBe(parentId);
  });

  it('fails without deferral when child is inserted before parent', async () => {
    await expect(
      Database.client.transaction(async em => {
        const repo = em.getRepository(Task);
        await repo.save(makeTask({ parentTaskId: uuidv4() }));
      }),
    ).rejects.toThrow(/FOREIGN KEY/i);
  });

  it('automatically resets after transaction commit', async () => {
    // First transaction: defer foreign keys
    await Database.client.transaction(async em => {
      await deferForeignKeys(em);
      const repo = em.getRepository(Task);
      await repo.save(makeTask());
    });

    // Second transaction: pragma should be OFF, so this should fail
    await expect(
      Database.client.transaction(async em => {
        const repo = em.getRepository(Task);
        await repo.save(makeTask({ parentTaskId: uuidv4() }));
      }),
    ).rejects.toThrow(/FOREIGN KEY/i);
  });

  it('automatically resets after transaction rollback from a JS error', async () => {
    // First transaction: defer foreign keys, then throw
    await expect(
      Database.client.transaction(async em => {
        await deferForeignKeys(em);
        throw new Error('simulated failure');
      }),
    ).rejects.toThrow('simulated failure');

    // Second transaction: pragma should be OFF, so this should fail
    await expect(
      Database.client.transaction(async em => {
        const repo = em.getRepository(Task);
        await repo.save(makeTask({ parentTaskId: uuidv4() }));
      }),
    ).rejects.toThrow(/FOREIGN KEY/i);
  });
});
