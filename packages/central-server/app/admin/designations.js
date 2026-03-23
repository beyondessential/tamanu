import express from 'express';
import asyncHandler from 'express-async-handler';
import { escapeRegExp } from 'lodash';
import { Op, UniqueConstraintError } from 'sequelize';
import { z } from 'zod';

import { REFERENCE_TYPES } from '@tamanu/constants';
import { DatabaseConstraintError, DatabaseDuplicateError, NotFoundError } from '@tamanu/errors';
import { getResourceList } from '@tamanu/shared/utils/crudHelpers';

/** `/admin/designation` endpoint for a single designation (ReferenceData) */
export const designationRouter = express.Router();

/** `/admin/designations` endpoint for listing and creating multiple designations (ReferenceData) */
export const designationsRouter = express.Router();

designationsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'ReferenceData');

    const idQuery = req.query.id?.trim();
    const nameQuery = req.query.name?.trim();

    const additionalFilters = {
      type: REFERENCE_TYPES.DESIGNATION,
      ...(idQuery && { id: idQuery }),
      ...(nameQuery && {
        name: { [Op.iRegexp]: `\\m${escapeRegExp(nameQuery)}` },
      }),
    };

    const response = await getResourceList(req, 'ReferenceData', '', { additionalFilters });
    res.send(response);
  }),
);

const createDesignationSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, { message: '`code` must be at least 1 character' })
    .max(255, { message: '`code` must be no longer than 255 characters' }),
  id: z
    .string()
    .trim()
    .min(1, { message: '`id` must be at least 1 character' })
    .max(255, { message: '`id` must be no longer than 255 characters' }),
  name: z
    .string()
    .trim()
    .min(1, { message: '`name` must be at least 1 character' })
    .max(65_535, { message: '`name` must be no longer than 65,535 characters' }),
});

designationRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'ReferenceData');

    const { ReferenceData } = req.store.models;
    const { code, id, name } = await createDesignationSchema.parseAsync(req.body);

    let designation;
    try {
      designation = await ReferenceData.create({
        code,
        id,
        name,
        type: REFERENCE_TYPES.DESIGNATION,
      });
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new DatabaseDuplicateError(`A reference datum already exists with ID ‘${id}’.`);
      }
      throw err;
    }

    res.status(201).send(designation);
  }),
);

designationRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'ReferenceData');

    const {
      store: {
        models: { ReferenceData },
      },
      params: { id },
    } = req;

    const designation = await ReferenceData.findOne({
      where: { id, type: REFERENCE_TYPES.DESIGNATION },
    });
    if (!designation) {
      throw new NotFoundError(`No designation found with ID ‘${id}’`);
    }

    res.send(designation.forResponse());
  }),
);

const deleteDesignationQuerySchema = z.object({
  dryRun: z
    .string()
    .optional()
    .transform(value => value === '1'),
});

designationRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('delete', 'ReferenceData');

    const { dryRun } = await deleteDesignationQuerySchema.parseAsync(req.query);

    const {
      store: {
        models: { ReferenceData, UserDesignation, Task },
        sequelize,
      },
      params: { id: designationId },
    } = req;

    await sequelize.transaction(async () => {
      const designation = await ReferenceData.findByPk(designationId);
      if (!designation) {
        throw new NotFoundError(`No designation found with ID ‘${designationId}’`);
      }

      const where = { designationId };
      const [taskCount, userCount] = await Promise.all([
        Task.count({ where }),
        UserDesignation.count({ where }),
      ]);
      if (taskCount > 0 || userCount > 0) {
        throw new InvalidDesignationDeletionError(designationId, taskCount, userCount);
      }

      if (!dryRun) {
        await designation.destroy();
      }
    });

    res.status(204).send();
  }),
);

class InvalidDesignationDeletionError extends DatabaseConstraintError {
  constructor(
    /** @type {string} */ designationId,
    /** @type {number} */ taskCount,
    /** @type {number} */ userCount,
  ) {
    const task = taskCount === 1 ? 'task' : 'tasks';
    const user = userCount === 1 ? 'user' : 'users';

    super(
      `Cannot delete designation with ID ‘${designationId}’. ${taskCount} ${task} and ${userCount} ${user} assigned to it.`,
    );
    this.withExtraData({
      designationId,
      assignedTaskCount: taskCount,
      assignedUserCount: userCount,
    });
  }
}
