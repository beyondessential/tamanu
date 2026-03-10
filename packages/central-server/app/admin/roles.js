import { DatabaseDuplicateError, InvalidOperationError, NotFoundError } from '@tamanu/errors';
import express from 'express';
import asyncHandler from 'express-async-handler';
import * as yup from 'yup';

export const rolesRouter = express.Router();

const CREATE_VALIDATION = yup.object().shape({
  name: yup.string().trim().required(),
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

    const { name } = await CREATE_VALIDATION.validate(req.body);

    const existingRoleWithSameName = await Role.findOne({
      where: { name },
    });
    if (existingRoleWithSameName) {
      throw new DatabaseDuplicateError('Role name must be unique');
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
        models: { Role, User },
      },
      params: { id },
    } = req;

    req.checkPermission('delete', 'Role');

    const role = await Role.findByPk(id);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    const usersWithRole = await User.count({
      where: { role: id },
    });
    if (usersWithRole > 0) {
      throw new InvalidOperationError('Cannot delete role: one or more users are assigned to it');
    }

    await role.destroy();
    res.status(204).send();
  }),
);
