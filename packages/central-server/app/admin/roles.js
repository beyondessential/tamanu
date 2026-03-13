import express from 'express';
import asyncHandler from 'express-async-handler';
import { literal, Op } from 'sequelize';
import { z } from 'zod';

import { DatabaseDuplicateError, InvalidOperationError, NotFoundError } from '@tamanu/errors';
import { getResourceList } from '@tamanu/shared/utils/crudHelpers';

export const rolesRouter = express.Router();

rolesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Role');

    const filters = [];
    const idQuery = req.query.id?.trim();
    if (idQuery) {
      filters.push({
        id: { [Op.iLike]: `%${idQuery}%` },
      });
    }
    const nameQuery = req.query.name?.trim();
    if (nameQuery) {
      filters.push({
        name: { [Op.iLike]: `%${nameQuery}%` },
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

rolesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'Role');

    const { Role } = req.store.models;
    const { id, name } = await createRoleSchema.parseAsync(req.body);

    const role = await req.store.sequelize.transaction(async () => {
      const exists = Boolean(await Role.findOne({ attributes: [literal('1')], where: { id } }));
      if (exists) {
        throw new DatabaseDuplicateError(`A role already exists with ID ‘${id}’`);
      }

      return Role.create({ id, name });
    });

    res.status(201).send(role);
  }),
);

rolesRouter.delete(
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
        throw new NotFoundError(`No role found with ID ${id}`);
      }

      const count = await User.count({
        where: { role: role.name },
      });
      if (count > 0) {
        const unit = count === 1 ? 'user' : 'users';
        throw new InvalidOperationError(
          `Cannot delete ’${role.name}’ role. ${count} ${unit} are assigned to it.`,
        );
      }

      await role.destroy();
    });
    res.status(204).send();
  }),
);
