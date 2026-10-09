import { REFERENCE_TYPES, TASK_STATUSES } from '@tamanu/constants';
import { randomRecordId, randomReferenceDataId } from '../randomRecord.js';
import { fake, chance } from '../../fake/index.js';
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
  const resolvedDesignationId =
    referenceDataId || (await randomReferenceDataId(models, REFERENCE_TYPES.DESIGNATION));
  const resolvedTemplateRefDataId =
    referenceDataId || (await randomReferenceDataId(models, REFERENCE_TYPES.TASK_TEMPLATE));

  const status = chance.pickone(Object.values(TASK_STATUSES));
  const isCompleted = status === TASK_STATUSES.COMPLETED;
  const isNotCompleted = status === TASK_STATUSES.NON_COMPLETED;
  const task = await Task.create(
    fake(Task, {
      status,
      encounterId: resolvedEncounterId,
      requestedByUserId: resolvedUserId,
      completedByUserId: isCompleted ? resolvedUserId : null,
      notCompletedByUserId: isNotCompleted ? resolvedUserId : null,
      notCompletedReasonId: isNotCompleted
        ? referenceDataId ||
          (await randomReferenceDataId(models, REFERENCE_TYPES.TASK_NOT_COMPLETED_REASON))
        : null,
    }),
  );
  await TaskDesignation.create(
    fake(TaskDesignation, {
      taskId: task.id,
      designationId: resolvedDesignationId,
    }),
  );

  const [taskTemplate] = await TaskTemplate.findOrCreate({
    where: { referenceDataId: resolvedTemplateRefDataId },
    defaults: fake(TaskTemplate, { referenceDataId: resolvedTemplateRefDataId }),
  });
  await TaskTemplateDesignation.findOrCreate({
    where: { taskTemplateId: taskTemplate.id, designationId: resolvedDesignationId },
    defaults: fake(TaskTemplateDesignation, {
      taskTemplateId: taskTemplate.id,
      designationId: resolvedDesignationId,
    }),
  });
  await UserDesignation.findOrCreate({
    where: { userId: resolvedUserId, designationId: resolvedDesignationId },
    defaults: fake(UserDesignation, {
      userId: resolvedUserId,
      designationId: resolvedDesignationId,
    }),
  });
};
