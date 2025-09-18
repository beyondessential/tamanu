import express from 'express';
import asyncHandler from 'express-async-handler';
import { ForbiddenError, NotFoundError } from '@tamanu/errors';
import {
  REFERENCE_TYPES,
  SYSTEM_USER_UUID,
  TASK_DELETE_BY_SYSTEM_REASON,
  TASK_STATUSES,
} from '@tamanu/constants';
import { z } from 'zod';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { datetimeCustomValidation, getCurrentDateTimeString } from '@tamanu/utils/dateTime';

const taskRoutes = express.Router();
export { taskRoutes as tasks };

/**
 * Mark task as completed
 * Only tasks in TODO & NON_COMPLETED status can be marked as completed
 */
const taskCompletionInputSchema = z.object({
  taskIds: z.string().array().min(1),
  completedByUserId: z.string(),
  completedTime: datetimeCustomValidation,
  completedNote: z.string().optional(),
});
taskRoutes.post(
  '/completed',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Tasking');
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
  taskIds: z.string().array().min(1),
  notCompletedByUserId: z.string(),
  notCompletedTime: datetimeCustomValidation,
  notCompletedReasonId: z.string().optional(),
});
taskRoutes.put(
  '/notCompleted',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Tasking');
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
  taskIds: z.string().array().min(1),
  deletedByUserId: z.string(),
  deletedTime: datetimeCustomValidation,
  deletedReasonId: z.string().optional(),
});
taskRoutes.delete(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('delete', 'Tasking');
    const { taskIds, ...deletedInfo } = await taskDeletionInputSchema.parseAsync(req.query);

    //validate deleted reason
    if (deletedInfo.deletedReasonId) {
      const deletedReason = await req.models.ReferenceData.findByPk(deletedInfo.deletedReasonId, {
        where: { type: REFERENCE_TYPES.TASK_DELETION_REASON },
      });
      if (!deletedReason) throw new NotFoundError('Deleted reason not found');
    }

    const deletionReasonForFutureTasks = await req.models.ReferenceData.findByPk(
      TASK_DELETE_BY_SYSTEM_REASON,
    );

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
            parentTask.deletedReasonForSyncId = deletionReasonForFutureTasks?.id ?? null;
            await parentTask.save();

            await req.models.Task.update(
              {
                deletedByUserId: SYSTEM_USER_UUID,
                deletedTime: getCurrentDateTimeString(),
                deletedReasonId: deletionReasonForFutureTasks?.id ?? null,
              },
              {
                where: {
                  parentTaskId: parentTask.id,
                  id: { [Op.ne]: task.id },
                  dueTime: { [Op.gt]: parentTask.endTime },
                  status: TASK_STATUSES.TODO,
                },
              },
            );

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

/**
 * Mark task as todo
 * Only tasks in COMPLETED & NON_COMPLETED status can be marked as todo
 * - Only allow to set as todo for tasks that are not older than 48 hours
 * - Copy info from the selected task and set the new task status as todo, set todo info to the new task
 * - Delete the selected task
 */
const taskTodoInputSchema = z.object({
  taskIds: z.string().array().min(1),
  todoByUserId: z.string(),
  todoTime: datetimeCustomValidation.refine(
    (datetime) => new Date().getTime() - new Date(datetime).getTime() < 2 * 86400000,
    'Task is older than 48 hours',
  ),
  todoNote: z.string().optional(),
});
taskRoutes.put(
  '/todo',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Tasking');
    const { taskIds, ...todoInfo } = await taskTodoInputSchema.parseAsync(req.body);

    //validate task
    const tasks = await req.models.Task.findAll({
      where: { id: { [Op.in]: taskIds } },
      attributes: [
        'id',
        'name',
        'dueTime',
        'endTime',
        'requestTime',
        'status',
        'note',
        'frequencyValue',
        'frequencyUnit',
        'highPriority',
        'parentTaskId',
        'encounterId',
        'requestedByUserId',
      ],
      include: ['designations'],
    });

    if (!tasks?.length) throw new NotFoundError('No tasks not found');

    const allowedStatuses = [TASK_STATUSES.COMPLETED, TASK_STATUSES.NON_COMPLETED];
    if (!tasks.every((task) => allowedStatuses.includes(task.status)))
      throw new ForbiddenError(`Task is not in ${allowedStatuses.join(', ')} status`);

    const updateParentIdList = [];
    await req.db.transaction(async () => {
      for (const task of tasks) {
        //delete the selected task
        await task.destroy();

        //copy info from the selected task and set the new task as todo with todo info
        const newId = uuidv4();
        await req.models.Task.create({
          ...task.dataValues,
          id: newId,
          status: TASK_STATUSES.TODO,
          ...todoInfo,
          deletedAt: null,
        });
        await req.models.TaskDesignation.bulkCreate(
          task.dataValues.designations.map((designation) => ({
            designationId: designation.id,
            taskId: newId,
          })),
        );

        if (task.isRepeatingTask() && !task.parentTaskId) {
          updateParentIdList.push({ newId: newId, oldId: task.id });
        }
      }

      for (const { newId, oldId } of updateParentIdList) {
        await req.models.Task.update(
          { parentTaskId: newId },
          {
            where: {
              parentTaskId: oldId,
            },
          },
        );
      }
    });

    res.status(204).json();
  }),
);

const tasksCreationSchema = z.object({
  startTime: datetimeCustomValidation,
  encounterId: z.string().uuid(),
  requestedByUserId: z.string(),
  requestTime: datetimeCustomValidation,
  note: z.string().optional(),
  tasks: z
    .object({
      name: z.string(),
      frequencyValue: z.number().optional(),
      frequencyUnit: z.string().optional(),
      durationValue: z.number().optional(),
      durationUnit: z.string().optional(),
      designationIds: z.string().array().optional(),
      highPriority: z.boolean(),
    })
    .array(),
});
taskRoutes.post(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'Tasking');
    const { startTime, requestedByUserId, requestTime, encounterId, note, tasks } =
      await tasksCreationSchema.parseAsync(req.body);
    const { models, db } = req;
    const { Task, TaskDesignation } = models;

    await db.transaction(async () => {
      const tasksData = tasks.map((task) => {
        const designations = task.designationIds.map((designation) => ({
          id: designation,
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

      const taskDesignationAssociations = tasksData.flatMap((task) => {
        return task.designations.map((designation) => ({
          taskId: task.id,
          designationId: designation.id,
        }));
      });

      await TaskDesignation.bulkCreate(taskDesignationAssociations);

      const hasRepeatedTasks = tasksData.some((task) => task.frequencyValue && task.frequencyUnit);
      if (hasRepeatedTasks) {
        await Task.generateRepeatingTasks(tasksData);
      }

      res.send(createdTasks);
    });
  }),
);
