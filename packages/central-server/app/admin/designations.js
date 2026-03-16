import express from 'express';
import asyncHandler from 'express-async-handler';
import { escapeRegExp } from 'lodash';
import { Op } from 'sequelize';
import { z } from 'zod';

import { REFERENCE_TYPES } from '@tamanu/constants';
import { DatabaseDuplicateError, InvalidOperationError, NotFoundError } from '@tamanu/errors';
import { getResourceList } from '@tamanu/shared/utils/crudHelpers';

/** `/admin/designation` endpoint for CRUD-ing a single user_designation */
export const designationRouter = express.Router();

/** `/admin/designations` endpoint for CRUD-ing multiple user designations at once */
export const designationsRouter = express.Router();

designationsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'UserDesignation');

    const filters = [];
    const designationIdQuery = req.query.designationId?.trim();
    if (designationIdQuery) {
      filters.push({ designationId: designationIdQuery });
    }

    const displayNameQuery = req.query.display_name?.trim();
    const displayNameClause = displayNameQuery
      ? {
          displayName: { [Op.iRegexp]: `\\m${escapeRegExp(displayNameQuery)}` },
        }
      : undefined;

    const {
      store: { models },
    } = req;
    const options = {
      include: [
        {
          model: models.User,
          as: 'user',
          attributes: ['id', 'displayName'],
          required: Boolean(displayNameQuery),
          where: displayNameClause,
        },
      ],
    };
    if (filters.length > 0) {
      options.additionalFilters = filters.length === 1 ? filters[0] : { [Op.and]: filters };
    }

    const response = await getResourceList(req, 'UserDesignation', '', options);
    res.send(response);
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
    req.checkPermission('delete', 'UserDesignation');

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
