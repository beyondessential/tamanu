import { fake } from '../../fake/index.js';
import type { CommonParams } from './common.js';

interface CreateTaskParams extends CommonParams {
  encounterId: string;
  userId: string;
  referenceDataId: string;
}
export const createTask = async ({
  models,
  encounterId,
  userId,
  referenceDataId,
}: CreateTaskParams): Promise<void> => {
  const { Task, TaskDesignation, TaskTemplate, TaskTemplateDesignation, UserDesignation } = models;

  const task = await Task.create(
    fake(Task, {
      encounterId,
      requestedByUserId: userId,
      completedByUserId: userId,
      notCompletedByUserId: userId,
      notCompletedReasonId: referenceDataId,
      todoByUserId: userId,
      deletedByUserId: userId,
      deletedReasonId: referenceDataId,
    }),
  );
  await TaskDesignation.create(
    fake(TaskDesignation, {
      taskId: task.id,
      designationId: referenceDataId,
    }),
  );

  const taskTemplate = await TaskTemplate.create(fake(TaskTemplate, { referenceDataId }));
  await TaskTemplateDesignation.create(
    fake(TaskTemplateDesignation, {
      taskTemplateId: taskTemplate.id,
      designationId: referenceDataId,
    }),
  );
  await UserDesignation.create(
    fake(UserDesignation, {
      userId,
      designationId: referenceDataId,
    }),
  );
};
