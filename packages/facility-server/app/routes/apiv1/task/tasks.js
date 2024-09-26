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
    .min(1),
  notCompletedByUserId: z.string(),
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
 * Mark task as todo
 * Only tasks in COMPLETED & NON_COMPLETED status can be marked as todo
 * - Copy info from the selected task and set the new task status as todo, set todo info to the new task
 * - Delete the selected task
 */
const taskTodoInputSchema = z.object({
  taskIds: z
    .string()
    .uuid()
    .array()
    .min(1),
  todoByUserId: z.string(),
  todoTime: z.string().datetime(),
  todoNote: z.string().optional(),
});
taskRoutes.put(
  '/todo',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Task');
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
      include: ['designations']
    });

    if (!tasks?.length) throw new NotFoundError('No tasks not found');

    const allowedStatuses = [TASK_STATUSES.COMPLETED, TASK_STATUSES.NON_COMPLETED];
    if (!tasks.every(task => allowedStatuses.includes(task.status)))
      throw new ForbiddenError(`Task is not in ${allowedStatuses.join(', ')} status`);

    await req.db.transaction(async () => {
      for (const task of tasks) {
        //copy info from the selected task and set the new task as todo with todo info
        const newId = uuidv4();
        await req.models.Task.create({
          ...task.dataValues,
          id: newId,
          status: TASK_STATUSES.TODO,
          ...todoInfo,
        });
        await req.models.TaskDesignation.bulkCreate(
          task.dataValues.designations.map(designation => ({
            designationId: designation.id,
            taskId: newId,
          })),
        );

        //delete the selected task
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

      const taskDesignationAssociations = tasksData.flatMap(task => {
        return task.designations.map(designation => ({
          taskId: task.id,
          designationId: designation.id,
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
