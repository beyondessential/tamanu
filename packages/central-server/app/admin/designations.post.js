import asyncHandler from 'express-async-handler';
import { UniqueConstraintError } from 'sequelize';
import { z } from 'zod';

import { REFERENCE_TYPES } from '@tamanu/constants';
import { DatabaseDuplicateError } from '@tamanu/errors';

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

export const createDesignation = asyncHandler(async (req, res) => {
  req.checkPermission('create', 'ReferenceData');

  const { ReferenceData } = req.store.models;
  const { code, id, name } = await createDesignationSchema.parseAsync(req.body);

  try {
    const designation = await ReferenceData.create({
      code,
      id,
      name,
      type: REFERENCE_TYPES.DESIGNATION,
    });
    res.status(201).send(designation);
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      throw new DatabaseDuplicateError(`A reference datum already exists with ID ‘${id}’.`);
    }
    throw err;
  }
});
