import type { Models } from '@tamanu/database';
const { fake } = require('@tamanu/shared/test-helpers/fake');

interface CreateTaskingDataParams {
  models: Models;
  encounterId: string;
  userId: string;
  referenceDataId: string;
}
export const createTaskingData = async ({
  models: { Task, TaskDesignation, TaskTemplate, TaskTemplateDesignation, UserDesignation },
  encounterId,
  userId,
  referenceDataId,
}: CreateTaskingDataParams): Promise<void> => {
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
