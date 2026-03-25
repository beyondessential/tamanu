import asyncHandler from 'express-async-handler';

import { DatabaseConstraintError, NotFoundError } from '@tamanu/errors';

class InvalidRoleDeletionError extends DatabaseConstraintError {
  constructor(/** @type {string} */ roleId, /** @type {number} */ assignedUserCount) {
    const isSingular = assignedUserCount === 1;
    const unit = isSingular ? 'user' : 'users';

    super(
      `Cannot delete role with ID ‘${roleId}’. ${assignedUserCount}\u{00A0}${unit} assigned to it.`,
    );
    this.withExtraData({ assignedUserCount });
  }
}

/** @privateRemarks Remember to run this within a transaction. */
export const assertRoleIsDeletable = async ({ Role, User, roleId }) => {
  const role = await Role.findByPk(roleId);
  if (!role) throw new NotFoundError(`No role found with ID ‘${roleId}’`);

  const assignedUserCount = await User.count({
    where: { role: role.id }, // No FK constraint!
  });
  if (assignedUserCount > 0) throw new InvalidRoleDeletionError(roleId, assignedUserCount);

  return role;
};

export const deleteRoleById = asyncHandler(async (req, res) => {
  req.checkPermission('delete', 'Role');

  const {
    store: {
      models: { Role, User },
      sequelize,
    },
    params: { id },
  } = req;

  await sequelize.transaction(async () => {
    const role = await assertRoleIsDeletable({ Role, User, roleId: id });
    await role.destroy();
  });

  res.status(204).send();
});
