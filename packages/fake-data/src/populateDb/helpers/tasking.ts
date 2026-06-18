import { randomRecordId } from '../randomRecord.js';
import { fake } from '../../fake/index.js';
import type { CommonParams } from './common.js';

interface CreateTaskParams extends CommonParams {
  encounterId?: string;
  userId?: string;
  referenceDataId?: string;
}
export const createTask = async ({
  models,
  encounterId,
  userId,
  referenceDataId,
}: CreateTaskParams): Promise<void> => {
  const { Task, TaskDesignation, TaskTemplate, TaskTemplateDesignation, UserDesignation } = models;

  const resolvedEncounterId = encounterId || (await randomRecordId(models, 'Encounter'));
  const resolvedUserId = userId || (await randomRecordId(models, 'User'));
  const resolvedRefDataId = referenceDataId || (await randomRecordId(models, 'ReferenceData'));

  const task = await Task.create(
    fake(Task, {
      encounterId: resolvedEncounterId,
      requestedByUserId: resolvedUserId,
      completedByUserId: resolvedUserId,
      notCompletedByUserId: resolvedUserId,
      notCompletedReasonId: resolvedRefDataId,
      todoByUserId: resolvedUserId,
      deletedByUserId: resolvedUserId,
      deletedReasonId: resolvedRefDataId,
    }),
  );
  await TaskDesignation.create(
    fake(TaskDesignation, {
      taskId: task.id,
      designationId: resolvedRefDataId,
    }),
  );

  const [taskTemplate] = await TaskTemplate.findOrCreate({
    where: { referenceDataId: resolvedRefDataId },
    defaults: fake(TaskTemplate, { referenceDataId: resolvedRefDataId }),
  });
  await TaskTemplateDesignation.findOrCreate({
    where: { taskTemplateId: taskTemplate.id, designationId: resolvedRefDataId },
    defaults: fake(TaskTemplateDesignation, {
      taskTemplateId: taskTemplate.id,
      designationId: resolvedRefDataId,
    }),
  });
  await UserDesignation.findOrCreate({
    where: { userId: resolvedUserId, designationId: resolvedRefDataId },
    defaults: fake(UserDesignation, {
      userId: resolvedUserId,
      designationId: resolvedRefDataId,
    }),
  });
};
