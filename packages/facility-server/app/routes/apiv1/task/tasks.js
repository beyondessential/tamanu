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

const taskCreationSchema = z.object({
  startTime: z.string().datetime(),
  designationIds: z
    .string()
    .array()
    .optional(),
  name: z.string(),
  frequencyValue: z.number().optional(),
  frequencyUnit: z.string().optional(),
  encounterId: z.string().uuid(),
  requestedByUserId: z.string(),
  requestTime: z.string().datetime(),
  note: z.string().optional(),
  highPriority: z.boolean(),
});
taskRoutes.post(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'Task');
    const { models, db } = req;
    const { Task } = models;

    const { startTime, designationIds, ...other } = await taskCreationSchema.parseAsync(req.body);

    await db.transaction(async () => {
      const taskData = { dueTime: startTime, ...other };

      const task = await Task.create(taskData);
      if (designationIds) {
        await task.setDesignations(designationIds);
      }

      const mappedDesignations = designationIds.map(designation => ({
        designationId: designation,
      }));

      if (task.frequencyValue && task.frequencyUnit) {
        await Task.generateRepeatingTasks([
          { ...task.dataValues, designations: mappedDesignations },
        ]);
      }

      res.send(task);
    });
  }),
);

const taskSetCreationSchema = z.object({
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
  '/taskSet',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'Task');
    const {
      startTime,
      requestedByUserId,
      requestTime,
      encounterId,
      note,
      tasks,
    } = await taskSetCreationSchema.parseAsync(req.body);
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

      const createdTaskSet = await Task.bulkCreate(tasksData);

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

      res.send(createdTaskSet);
    });
  }),
);
