import asyncHandler from 'express-async-handler';
import { z } from 'zod';

import { DatabaseConstraintError, NotFoundError } from '@tamanu/errors';

class InvalidDesignationDeletionError extends DatabaseConstraintError {
  constructor(
    /** @type {string} */ designationId,
    /** @type {number} */ taskCount,
    /** @type {number} */ userCount,
  ) {
    const task = taskCount === 1 ? 'task' : 'tasks';
    const user = userCount === 1 ? 'user' : 'users';

    super(
      `Cannot delete designation with ID ‘${designationId}’. ${taskCount}\u{00A0}${task} and ${userCount}\u{00A0}${user} assigned to it.`,
    );
    this.withExtraData({
      designationId,
      assignedTaskCount: taskCount,
      assignedUserCount: userCount,
    });
  }
}

const deleteDesignationQuerySchema = z.object({
  dryRun: z
    .string()
    .optional()
    .transform(value => value === '1'),
});

export const deleteDesignationById = asyncHandler(async (req, res) => {
  req.checkPermission('delete', 'ReferenceData');

  const { dryRun } = await deleteDesignationQuerySchema.parseAsync(req.query);

  const {
    store: {
      models: { ReferenceData, TaskDesignation, UserDesignation },
      sequelize,
    },
    params: { id: designationId },
  } = req;

  await sequelize.transaction(async () => {
    const designation = await ReferenceData.findByPk(designationId);
    if (!designation) {
      throw new NotFoundError(`No designation found with ID ‘${designationId}’`);
    }

    const where = { designationId };
    const [taskCount, userCount] = await Promise.all([
      TaskDesignation.count({ where }),
      UserDesignation.count({ where }),
    ]);
    if (taskCount > 0 || userCount > 0) {
      throw new InvalidDesignationDeletionError(designationId, taskCount, userCount);
    }

    if (!dryRun) {
      await designation.destroy();
    }
  });

  res.status(204).send();
});
