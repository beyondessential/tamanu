import { v4 as uuidv4 } from 'uuid';

import { Database } from '~/infra/db';
import { Task } from '~/models/Task';
import { fakeUser, fakePatient, fakeEncounter, fakeTask } from '/root/tests/helpers/fake';
import { deferForeignKeys } from './deferForeignKeys';
import { IPatient, IUser } from '~/types';

describe('deferForeignKeys', () => {
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
  });

  it('allows inserting a child before its parent when foreign keys are deferred', async () => {
    const parentId = uuidv4();
    const childId = uuidv4();

    await Database.client.transaction(async em => {
      await deferForeignKeys(em);

      const repo = em.getRepository(Task);
      await repo.save(fakeTask(encounterId, requestedByUserId, { id: childId, parentTaskId: parentId }));
      await repo.save(fakeTask(encounterId, requestedByUserId, { id: parentId }));
    });

    const child = await Database.models.Task.findOne({ where: { id: childId } });
    expect(child).toBeTruthy();
    expect(child.parentTaskId).toBe(parentId);
  });

  it('fails without deferral when child is inserted before parent', async () => {
    await expect(
      Database.client.transaction(async em => {
        const repo = em.getRepository(Task);
        await repo.save(fakeTask(encounterId, requestedByUserId, { parentTaskId: uuidv4() }));
      }),
    ).rejects.toThrow(/FOREIGN KEY/i);
  });

  it('automatically resets after transaction commit', async () => {
    // First transaction: defer foreign keys
    await Database.client.transaction(async em => {
      await deferForeignKeys(em);
      const repo = em.getRepository(Task);
      await repo.save(fakeTask(encounterId, requestedByUserId));
    });

    // Second transaction: pragma should be OFF, so this should fail
    await expect(
      Database.client.transaction(async em => {
        const repo = em.getRepository(Task);
        await repo.save(fakeTask(encounterId, requestedByUserId, { parentTaskId: uuidv4() }));
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
        await repo.save(fakeTask(encounterId, requestedByUserId, { parentTaskId: uuidv4() }));
      }),
    ).rejects.toThrow(/FOREIGN KEY/i);
  });
});
