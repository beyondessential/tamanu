import asyncHandler from 'express-async-handler';

import { DatabaseConstraintError, NotFoundError } from '@tamanu/errors';

class InvalidRoleDeletionError extends DatabaseConstraintError {
  constructor(/** @type {string} */ roleId, /** @type {number} */ assignedUserCount) {
    const isSingular = assignedUserCount === 1;
    const subject = isSingular ? 'user' : 'users';

    super(
      `Cannot delete role with ID ‘${roleId}’. ${assignedUserCount} ${subject} assigned to it.`,
    );
    this.withExtraData({ assignedUserCount });
  }
}

export const getDeletableRoleOrThrow = async (models, roleId) => {
  if (!models.Role.sequelize?.isInsideTransaction?.()) {
    throw new Error('DEV ERROR: getDeletableRoleOrThrow should be run in a transaction');
  }

  const role = await models.Role.findByPk(roleId);
  if (!role) throw new NotFoundError(`No role found with ID ‘${roleId}’`);

  const assignedUserCount = await models.User.count({
    where: { role: role.id }, // No FK constraint!
  });
  if (assignedUserCount > 0) throw new InvalidRoleDeletionError(roleId, assignedUserCount);

  return role;
};

export const deleteRoleById = asyncHandler(async (req, res) => {
  req.checkPermission('delete', 'Role');

  const {
    store: { models, sequelize },
    params: { id },
  } = req;

  await sequelize.transaction(async () => {
    const role = await getDeletableRoleOrThrow(models, id);
    await role.destroy();
  });

  res.status(204).send();
});
