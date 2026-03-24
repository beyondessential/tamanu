import asyncHandler from 'express-async-handler';
import { UniqueConstraintError } from 'sequelize';
import { z } from 'zod';

import { DatabaseDuplicateError } from '@tamanu/errors';

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

export const createRole = asyncHandler(async (req, res) => {
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
});
