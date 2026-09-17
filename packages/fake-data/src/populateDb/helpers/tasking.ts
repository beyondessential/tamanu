import { REFERENCE_TYPES } from '@tamanu/constants';
import { randomRecordId, randomReferenceDataId } from '../randomRecord.js';
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
  const resolvedNotCompletedReasonId =
    referenceDataId ||
    (await randomReferenceDataId(models, REFERENCE_TYPES.TASK_NOT_COMPLETED_REASON));
  const resolvedDeletionReasonId =
    referenceDataId || (await randomReferenceDataId(models, REFERENCE_TYPES.TASK_DELETION_REASON));
  const resolvedDesignationId =
    referenceDataId || (await randomReferenceDataId(models, REFERENCE_TYPES.DESIGNATION));
  const resolvedTemplateRefDataId =
    referenceDataId || (await randomReferenceDataId(models, REFERENCE_TYPES.TASK_TEMPLATE));

  const task = await Task.create(
    fake(Task, {
      encounterId: resolvedEncounterId,
      requestedByUserId: resolvedUserId,
      completedByUserId: resolvedUserId,
      notCompletedByUserId: resolvedUserId,
      notCompletedReasonId: resolvedNotCompletedReasonId,
      todoByUserId: resolvedUserId,
      deletedByUserId: resolvedUserId,
      deletedReasonId: resolvedDeletionReasonId,
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
