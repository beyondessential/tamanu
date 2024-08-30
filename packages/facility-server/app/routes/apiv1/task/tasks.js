import express from 'express';
import asyncHandler from 'express-async-handler';
import { ForbiddenError, NotFoundError } from '@tamanu/shared/errors';
import { REFERENCE_TYPES, TASK_STATUSES } from '@tamanu/constants';
import { z } from 'zod';
import { Op } from 'sequelize';

const taskRoutes = express.Router();
export { taskRoutes as tasks };

/**
 * Mark task as completed
 * Only tasks in TODO & NON_COMPLETED status can be marked as completed
 */
const taskCompletionInputSchema = z.object({
  taskIds: z
    .string()
    .uuid()
    .array()
    .length(1),
  completedBy: z.string().uuid(),
  completedTime: z.string().datetime(),
  completedNote: z.string().optional(),
});
taskRoutes.post(
  '/completed',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Task');
    const { taskIds, ...completedInfo } = await taskCompletionInputSchema.parseAsync(req.body);

    //validate task
    const tasks = await req.models.Task.findAll({
      where: { id: { [Op.in]: taskIds } },
      attributes: ['id', 'status'],
    });
    if (!tasks?.length) throw new NotFoundError('No tasks not found');

    const allowedStatuses = [TASK_STATUSES.TODO, TASK_STATUSES.NON_COMPLETED];
    if (!tasks.every(task => allowedStatuses.includes(task.status))) {
      throw new ForbiddenError('Tasks are not in TODO or NON_COMPLETED status');
    }

    //update task
    await req.models.Task.update(
      { ...completedInfo, status: TASK_STATUSES.COMPLETED },
      { where: { id: { [Op.in]: taskIds } } },
    );
    res.json();
  }),
);

/**
 * Mark task as not completed
 * Only tasks in TODO status can be marked as not completed
 */
const taskNonCompletionInputSchema = z.object({
  notCompletedBy: z.string().uuid(),
  notCompletedTime: z.string().datetime(),
  notCompletedReasonId: z.string().optional(),
});
taskRoutes.put(
  '/:taskId/notCompleted',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Task');
    //validate task
    const taskId = req.params.taskId;
    const task = await req.models.Task.findByPk(taskId, {
      attributes: ['id', 'status'],
    });
    if (!task) throw new NotFoundError('Task not found');
    if (task.status !== TASK_STATUSES.TODO) throw new ForbiddenError('Task is not in TODO status');

    //validate input
    const input = await taskNonCompletionInputSchema.parseAsync(req.body);
    const notCompleteReason = await req.models.ReferenceData.findByPk(input.notCompletedReasonId, {
      where: { type: REFERENCE_TYPES.TASK_NOT_COMPLETED_REASON },
    });
    if (!notCompleteReason) throw new NotFoundError('Not completed reason not found');

    await req.models.Task.update(
      { ...input, status: TASK_STATUSES.NON_COMPLETED },
      { where: { id: taskId } },
    );
    res.json();
  }),
);
