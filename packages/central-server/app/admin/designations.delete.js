import asyncHandler from 'express-async-handler';

import { REFERENCE_TYPES } from '@tamanu/constants';
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

/** @privateRemarks Remember to run this within a transaction. */
export const assertDesignationIsDeletable = async ({
  ReferenceData,
  TaskDesignation,
  UserDesignation,
  designationId,
}) => {
  const designation = await ReferenceData.findOne({
    where: { id: designationId, type: REFERENCE_TYPES.DESIGNATION },
  });
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

  return designation;
};

export const deleteDesignationById = asyncHandler(async (req, res) => {
  req.checkPermission('delete', 'ReferenceData');

  const {
    store: {
      models: { ReferenceData, TaskDesignation, UserDesignation },
      sequelize,
    },
    params: { id: designationId },
  } = req;

  await sequelize.transaction(async () => {
    const designation = await assertDesignationIsDeletable({
      ReferenceData,
      TaskDesignation,
      UserDesignation,
      designationId,
    });
    await designation.destroy();
  });

  res.status(204).send();
});
