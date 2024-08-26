import express from 'express';
import asyncHandler from 'express-async-handler';
import { ForbiddenError, NotFoundError } from '@tamanu/shared/errors';
import { TASK_STATUSES } from '@tamanu/constants';
import { z } from 'zod';

export const taskRoute = express.Router();

/**
 * Mark task as completed
 * Only tasks in TODO status can be marked as completed
 */
const taskCompletionInputSchema = z.object({
  completedBy: z.string().uuid(),
  completedTime: z.string().datetime(),
  completedNote: z.string().optional(),
});
taskRoute.post(
  '/:taskId/completed',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Task');
    const taskId = req.params.taskId;
    const input = await taskCompletionInputSchema.parseAsync(req.body);

    const task = await req.models.Task.findByPk(taskId, {
      attributes: ['id', 'status'],
    });
    if (!task) throw new NotFoundError('Task not found');

    if (task.status !== TASK_STATUSES.TODO) throw new ForbiddenError('Task is not in TODO status');

    await req.models.Task.update(input, { where: { id: taskId } });
    res.json();
  }),
);
