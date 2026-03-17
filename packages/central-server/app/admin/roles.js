import express from 'express';
import asyncHandler from 'express-async-handler';
import { escapeRegExp } from 'lodash';
import { ForeignKeyConstraintError, Op, UniqueConstraintError } from 'sequelize';
import { z } from 'zod';

import { DatabaseDuplicateError, InvalidOperationError, NotFoundError } from '@tamanu/errors';
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
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
});

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
      },
      params: { id },
    } = req;

    const role = await Role.findByPk(id);
    if (!role) {
      throw new NotFoundError(`No role found with ID ${id}`);
    }

    try {
      await role.destroy();
    } catch (err) {
      if (err instanceof ForeignKeyConstraintError) {
        const count = await User.count({
          where: { role: role.id },
        });
        const objectVerb = count === 1 ? 'user is' : 'users are';
        throw new InvalidOperationError(
          `Cannot delete role with ID '${id}'. ${count} ${objectVerb} assigned to it.`,
        );
      }
      throw err;
    }
    res.status(204).send();
  }),
);
