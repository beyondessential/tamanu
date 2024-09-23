import express from 'express';
import asyncHandler from 'express-async-handler';
import { ForbiddenError, NotFoundError } from '@tamanu/shared/errors';
import { REFERENCE_TYPES, TASK_STATUSES } from '@tamanu/constants';
import { z } from 'zod';
import { Op } from 'sequelize';
import { parseDate, toDateTimeString } from '@tamanu/shared/utils/dateTime';

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
 * Only tasks in TODO & COMPLETED status can be marked as not completed
 */
const taskNonCompletionInputSchema = z.object({
  taskIds: z
    .string()
    .uuid()
    .array()
    .length(1),
  notCompletedBy: z.string().uuid(),
  notCompletedTime: z.string().datetime(),
  notCompletedReasonId: z.string().optional(),
});
taskRoutes.put(
  '/notCompleted',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Task');
    const { taskIds, ...notCompletedInfo } = await taskNonCompletionInputSchema.parseAsync(
      req.body,
    );

    //validate not completed reason
    if (notCompletedInfo.notCompletedReasonId) {
      const notCompleteReason = await req.models.ReferenceData.findByPk(
        notCompletedInfo.notCompletedReasonId,
        {
          where: { type: REFERENCE_TYPES.TASK_NOT_COMPLETED_REASON },
        },
      );
      if (!notCompleteReason) throw new NotFoundError('Not completed reason not found');
    }

    //validate task
    const tasks = await req.models.Task.findAll({
      where: { id: { [Op.in]: taskIds } },
      attributes: ['id', 'status'],
    });
    if (!tasks?.length) throw new NotFoundError('No tasks not found');

    const allowedStatuses = [TASK_STATUSES.TODO, TASK_STATUSES.COMPLETED];
    if (!tasks.every(task => allowedStatuses.includes(task.status))) {
      throw new ForbiddenError('Task is not in TODO or COMPLETED status');
    }

    //update tasks
    await req.models.Task.update(
      { ...notCompletedInfo, status: TASK_STATUSES.NON_COMPLETED },
      { where: { id: { [Op.in]: taskIds } } },
    );
    res.json();
  }),
);

/**
 * Delete a task
 * Only allow to delete task with TODO status
 */
const taskDeletionInputSchema = z.object({
  taskIds: z
    .string()
    .uuid()
    .array()
    .length(1),
  deletedByUserId: z.string().uuid(),
  deletedTime: z.string().datetime(),
  deletedReasonId: z.string().optional(),
});
taskRoutes.delete(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('delete', 'Task');
    const { taskIds, ...deletedInfo } = await taskDeletionInputSchema.parseAsync(req.body);

    //validate deleted reason
    if (deletedInfo.deletedReasonId) {
      const deletedReason = await req.models.ReferenceData.findByPk(deletedInfo.deletedReasonId, {
        where: { type: REFERENCE_TYPES.TASK_DELETION_REASON },
      });
      if (!deletedReason) throw new NotFoundError('Deleted reason not found');
    }

    //validate task
    const allowedStatuses = [TASK_STATUSES.TODO];
    const tasks = await req.models.Task.findAll({
      where: { id: { [Op.in]: taskIds }, status: { [Op.in]: allowedStatuses } },
      attributes: ['id', 'status', 'dueTime', 'frequencyValue', 'frequencyUnit', 'parentTaskId'],
    });
    if (tasks?.length !== taskIds.length)
      throw new ForbiddenError('Some of selected tasks are not in TODO status');

    await req.db.transaction(async () => {
      //update deletion info
      await req.models.Task.update(deletedInfo, { where: { id: { [Op.in]: taskIds } } });

      //delete tasks
      for (const task of tasks) {
        if (task.isRepeatingTask()) {
          const parentTask = !task.parentTaskId
            ? task
            : await req.models.Task.findOne({
                where: { id: task.parentTaskId },
              });
          if (parentTask) {
            parentTask.endTime = new Date(new Date(task.dueTime).getTime() - 1);
            await parentTask.save();
            //remove all child tasks that have dueTime over parent endtime
            await req.models.Task.destroy({
              where: {
                parentTaskId: parentTask.id,
                id: { [Op.ne]: task.id },
                dueTime: { [Op.gt]: parentTask.endTime },
                status: TASK_STATUSES.TODO,
              },
              individualHooks: true,
            });
          }
        }
        await task.destroy();
      }
    });

    res.status(204).json();
  }),
);
