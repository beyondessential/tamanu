import express from 'express';
import asyncHandler from 'express-async-handler';
import { escapeRegExp } from 'lodash';
import { ForeignKeyConstraintError, Op, UniqueConstraintError } from 'sequelize';
import { z } from 'zod';

import { REFERENCE_TYPES } from '@tamanu/constants';
import { DatabaseDuplicateError, InvalidOperationError, NotFoundError } from '@tamanu/errors';
import { getResourceList } from '@tamanu/shared/utils/crudHelpers';

/** `/admin/designation` endpoint for a single designation (ReferenceData) */
export const designationRouter = express.Router();

/** `/admin/designations` endpoint for listing and creating designation types (ReferenceData) */
export const designationsRouter = express.Router();

designationsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'ReferenceData');

    const idQuery = req.query.id?.trim();
    const nameQuery = req.query.display_name?.trim();

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
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
});

designationRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'ReferenceData');

    const { ReferenceData } = req.store.models;
    const { id, name } = await createDesignationSchema.parseAsync(req.body);

    let designation;
    try {
      designation = await ReferenceData.create({
        code: id.trim(),
        id: id.trim(),
        name: name.trim(),
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

designationRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('delete', 'ReferenceData');

    const {
      store: {
        models: { ReferenceData, UserDesignation },
      },
      params: { id: designationId },
    } = req;

    const designation = await ReferenceData.findByPk(designationId);
    if (!designation) {
      throw new NotFoundError(`No designation found with ID ${designationId}`);
    }

    try {
      await designation.destroy();
    } catch (err) {
      if (err instanceof ForeignKeyConstraintError) {
        const count = await UserDesignation.count({
          where: { designationId },
        });
        const objectVerb = count === 1 ? 'user is' : 'users are';
        throw new InvalidOperationError(
          `Cannot delete designation with ID ’${designationId}’. ${count} ${objectVerb} assigned to it.`,
        );
      }
      throw err;
    }
    res.status(204).send();
  }),
);
