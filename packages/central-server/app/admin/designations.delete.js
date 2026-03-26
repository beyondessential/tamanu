import asyncHandler from 'express-async-handler';

import { REFERENCE_TYPES } from '@tamanu/constants';
import { DatabaseConstraintError, NotFoundError } from '@tamanu/errors';

class InvalidDesignationDeletionError extends DatabaseConstraintError {
  constructor(
    /** @type {string} */ designationId,
    /** @type {'task_designations' | 'user_designations'} */ table,
    /** @type {number} */ count,
  ) {
    const unit = table === 'task_designations' ? 'task' : 'user';
    const s = count === 1 ? '' : 's';

    super(
      `Cannot delete designation with ID ‘${designationId}’. ${count}\u{00A0}${unit}${s} assigned to it.`,
    );
    this.withExtraData({
      designationId,
      table,
      count,
    });
  }
}

/** @privateRemarks Remember to run this within a transaction. */
export const getDeletableDesignationOrThrow = async ({
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

  const userDesignationCount = await UserDesignation.count({ where });
  if (userDesignationCount > 0) {
    throw new InvalidDesignationDeletionError(
      designationId,
      'user_designations',
      userDesignationCount,
    );
  }

  const taskDesignationCount = await TaskDesignation.count({ where });
  if (taskDesignationCount > 0) {
    throw new InvalidDesignationDeletionError(
      designationId,
      'task_designations',
      taskDesignationCount,
    );
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
    const designation = await getDeletableDesignationOrThrow({
      ReferenceData,
      TaskDesignation,
      UserDesignation,
      designationId,
    });
    await designation.destroy();
  });

  res.status(204).send();
});
