import express from 'express';
import asyncHandler from 'express-async-handler';
import { ForbiddenError, NotFoundError } from '@tamanu/shared/errors';
import { REFERENCE_TYPES, TASK_STATUSES } from '@tamanu/constants';
import { z } from 'zod';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

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
    .array(),
  completedByUserId: z.string(),
  completedTime: z.string().datetime(),
  completedNote: z.string().optional(),
});
taskRoutes.post(
  '/completed',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Task');
    const { taskIds, ...completedInfo } = await taskCompletionInputSchema.parseAsync(req.body);

    //validate task
    const allowedStatuses = [TASK_STATUSES.TODO, TASK_STATUSES.NON_COMPLETED];
    const tasks = await req.models.Task.findAll({
      where: { id: { [Op.in]: taskIds }, status: { [Op.in]: allowedStatuses } },
      attributes: ['id', 'status'],
    });

    if (tasks?.length !== taskIds.length) {
      throw new ForbiddenError(
        `Some of selected tasks are not in ${allowedStatuses.join(', ')} status`,
      );
    }

    //update task
    await req.models.Task.update(
      { ...completedInfo, status: TASK_STATUSES.COMPLETED },
      { where: { id: { [Op.in]: taskIds } } },
    );
    res.status(204).json();
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
  notCompletedByUserId: z.string().uuid(),
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
    const allowedStatuses = [TASK_STATUSES.TODO, TASK_STATUSES.COMPLETED];
    const tasks = await req.models.Task.findAll({
      where: { id: { [Op.in]: taskIds }, status: { [Op.in]: allowedStatuses } },
      attributes: ['id', 'status'],
    });
    if (tasks?.length !== taskIds.length) {
      throw new ForbiddenError(
        `Some of selected tasks are not in ${allowedStatuses.join(', ')} status`,
      );
    }

    //update tasks
    await req.models.Task.update(
      { ...notCompletedInfo, status: TASK_STATUSES.NON_COMPLETED },
      { where: { id: { [Op.in]: taskIds } } },
    );
    res.status(204).json();
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

const tasksCreationSchema = z.object({
  startTime: z.string().datetime(),
  encounterId: z.string().uuid(),
  requestedByUserId: z.string(),
  requestTime: z.string().datetime(),
  note: z.string().optional(),
  tasks: z
    .object({
      name: z.string(),
      frequencyValue: z.number().optional(),
      frequencyUnit: z.string().optional(),
      designationIds: z
        .string()
        .array()
        .optional(),
      highPriority: z.boolean(),
    })
    .array(),
});
taskRoutes.post(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'Task');
    const {
      startTime,
      requestedByUserId,
      requestTime,
      encounterId,
      note,
      tasks,
    } = await tasksCreationSchema.parseAsync(req.body);
    const { models, db } = req;
    const { Task, TaskDesignation } = models;

    await db.transaction(async () => {
      const tasksData = tasks.map(task => {
        const designations = task.designationIds.map(designation => ({
          designationId: designation,
        }));

        return {
          ...task,
          id: uuidv4(),
          designations,
          dueTime: startTime,
          requestedByUserId,
          requestTime,
          encounterId,
          note,
        };
      });

      const createdTasks = await Task.bulkCreate(tasksData);

      const taskDesignationAssociations = tasksData.flatMap(task => {
        return task.designations.map(designation => ({
          taskId: task.id,
          designationId: designation.designationId,
        }));
      });

      await TaskDesignation.bulkCreate(taskDesignationAssociations);

      const hasRepeatedTasks = tasksData.some(task => task.frequencyValue && task.frequencyUnit);
      if (hasRepeatedTasks) {
        await Task.generateRepeatingTasks(tasksData);
      }

      res.send(createdTasks);
    });
  }),
);
