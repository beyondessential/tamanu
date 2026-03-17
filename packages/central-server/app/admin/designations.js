import express from 'express';
import asyncHandler from 'express-async-handler';
import { escapeRegExp } from 'lodash';
import { Op } from 'sequelize';
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

designationsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'ReferenceData');

    const {
      store: {
        models: { ReferenceData },
        sequelize,
      },
    } = req;
    const { id, name } = await createDesignationSchema.parseAsync(req.body);

    const designation = await sequelize.transaction(async () => {
      const exists = await ReferenceData.findByPk(id);
      if (exists) {
        throw new DatabaseDuplicateError(`A reference datum already exists with ID ‘${id}’.`);
      }

      return ReferenceData.create({
        code: id.trim(),
        id: id.trim(),
        name: name.trim(),
        type: REFERENCE_TYPES.DESIGNATION,
      });
    });

    res.status(201).send(designation);
  }),
);

const createUserDesignationSchema = z.object({
  userId: z.string().trim().min(1),
  designationId: z.string().trim().min(1),
});

designationRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'UserDesignation');

    const { UserDesignation } = req.store.models;
    const { userId, designationId } = await createUserDesignationSchema.parseAsync(req.body);

    const userDesignation = await req.store.sequelize.transaction(async () => {
      const exists = await UserDesignation.findOne({
        where: { userId, designationId },
      });
      if (exists) {
        throw new DatabaseDuplicateError(
          `A user designation already exists for user ‘${userId}’ and designation ‘${designationId}’.`,
        );
      }

      return UserDesignation.create({ userId, designationId });
    });

    res.status(201).send(userDesignation);
  }),
);

designationRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('delete', 'ReferenceData');

    const {
      store: {
        models: { UserDesignation, ReferenceData },
        sequelize,
      },
      params: { id },
    } = req;

    await sequelize.transaction(async () => {
      const designation = await ReferenceData.findOne({
        where: { id, type: REFERENCE_TYPES.DESIGNATION },
      });
      if (!designation) {
        throw new NotFoundError(`No designation found with ID ${id}`);
      }

      const count = await UserDesignation.count({
        where: { designationId: id },
      });
      if (count > 0) {
        const objectVerb = count === 1 ? 'user is' : 'users are';
        throw new InvalidOperationError(
          `Cannot delete designation with ID ’${id}’. ${count} ${objectVerb} assigned to it.`,
        );
      }

      await designation.destroy();
    });
    res.status(204).send();
  }),
);
