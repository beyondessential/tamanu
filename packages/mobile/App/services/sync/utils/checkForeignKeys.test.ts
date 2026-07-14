import { v4 as uuidv4 } from 'uuid';

import { Database } from '~/infra/db';
import { Task } from '~/models/Task';
import { fakeUser, fakePatient, fakeEncounter, fakeTask } from '/root/tests/helpers/fake';
import { deferForeignKeys } from './deferForeignKeys';
import { checkForeignKeys } from './checkForeignKeys';
import { IPatient, IUser } from '~/types';

describe('checkForeignKeys', () => {
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

  it('does not throw when all foreign keys are satisfied', async () => {
    await Database.client.transaction(async em => {
      await deferForeignKeys(em);
      const repo = em.getRepository(Task);
      await repo.save(fakeTask(encounterId, requestedByUserId));
      await checkForeignKeys(em, ['tasks']);
    });
  });

  it('throws naming the offending record when a deferred foreign key is violated', async () => {
    const childId = uuidv4();
    await expect(
      Database.client.transaction(async em => {
        await deferForeignKeys(em);
        const repo = em.getRepository(Task);
        // parentTaskId references a task that is never inserted
        await repo.save(
          fakeTask(encounterId, requestedByUserId, { id: childId, parentTaskId: uuidv4() }),
        );
        await checkForeignKeys(em, ['tasks']);
      }),
    ).rejects.toThrow(childId);
  });
});
