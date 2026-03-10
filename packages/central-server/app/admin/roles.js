import express from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';

import { DatabaseDuplicateError, NotFoundError } from '@tamanu/errors';

export const rolesRouter = express.Router();

const createRoleSchema = z.object({
  name: z.string().trim().min(1),
});

rolesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const {
      store: {
        models: { Role },
      },
    } = req;

    req.checkPermission('create', 'Role');

    const { name } = await createRoleSchema.parseAsync(req.body);

    const exists = Boolean(await Role.findOne({ where: { name } }));
    if (exists) {
      throw new DatabaseDuplicateError(`A role already exists with name ‘${name}’`);
    }

    const role = await Role.create({ name });
    res.status(201).send(role);
  }),
);

rolesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const {
      store: {
        models: { Role },
      },
      params: { id },
    } = req;

    req.checkPermission('delete', 'Role');

    const role = await Role.findByPk(id);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    await role.destroy();
    res.status(204).send();
  }),
);
