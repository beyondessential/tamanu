import express from 'express';
import asyncHandler from 'express-async-handler';
import { escapeRegExp } from 'lodash';
import { Op, UniqueConstraintError } from 'sequelize';
import { z } from 'zod';
import { sentence } from 'case';

import {
  BaseValidationError,
  DatabaseDuplicateError,
  ERROR_TYPE,
  InvalidOperationError,
  NotFoundError,
} from '@tamanu/errors';
import { getResourceList } from '@tamanu/shared/utils/crudHelpers';

/** `/admin/role` endpoint for CRUD-ing a single role */
export const roleRouter = express.Router();

/** `/admin/roles` endpoint for CRUD-ing multiple roles at once */
export const rolesRouter = express.Router();

rolesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Role');

    const filters = [];
    const idQuery = req.query.id?.trim();
    if (idQuery) {
      filters.push({ id: idQuery });
    }
    const nameQuery = req.query.name?.trim();
    if (nameQuery) {
      filters.push({
        name: { [Op.iRegexp]: `\\m${escapeRegExp(nameQuery)}` },
      });
    }

    const options = {};
    if (filters.length > 0) {
      options.additionalFilters = filters.length === 1 ? filters[0] : { [Op.and]: filters };
    }

    const response = await getResourceList(req, 'Role', '', options);
    res.send(response);
  }),
);

const createRoleSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, { message: '`id` must be at least 1 character' })
    .max(255, { message: '`id` must be no longer than 255 characters' }),
  name: z
    .string()
    .trim()
    .min(1, { message: '`name` must be at least 1 character' })
    .max(255, { message: '`name` must be no longer than 255 characters' }),
});

roleRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Role');

    const {
      store: {
        models: { Role },
      },
      params: { id },
    } = req;

    const role = await Role.findByPk(id);
    if (!role) {
      throw new NotFoundError(`No role found with ID ‘${id}’`);
    }

    res.send(role);
  }),
);

roleRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'Role');

    const { Role } = req.store.models;
    const { id, name } = await createRoleSchema.parseAsync(req.body);

    let role;
    try {
      role = await Role.create({ id, name });
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new DatabaseDuplicateError(`A role already exists with ID ‘${id}’`);
      }
      throw err;
    }

    res.status(201).send(role);
  }),
);

roleRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('delete', 'Role');

    const {
      store: {
        models: { Role, User },
        sequelize,
      },
      params: { id },
    } = req;

    await sequelize.transaction(async () => {
      const role = await Role.findByPk(id);
      if (!role) {
        throw new NotFoundError(`No role found with ID ‘${id}’`);
      }

      const count = await User.count({
        where: { role: role.id }, // No FK constraint!
      });
      if (count > 0) {
        throw new InvalidRoleDeletionError(id, count);
      }

      await role.destroy();
    });
    res.status(204).send();
  }),
);

class InvalidRoleDeletionError extends BaseValidationError {
  constructor(/** @type {string} */ roleId, /** @type {number} */ count) {
    const isSingular = count === 1;
    const subject = isSingular ? 'user' : 'users';
    const verb = isSingular ? 'is' : 'are';
    const detail = `Cannot delete role with ID ‘${roleId}’ as ${count} ${subject} ${verb} assigned to it. Please update their user ${isSingular ? 'profile' : 'profiles'} first in order to delete the role.`;

    super(ERROR_TYPE.VALIDATION_CONSTRAINT, `${sentence(subject)} assigned to role`, detail);
  }
}
