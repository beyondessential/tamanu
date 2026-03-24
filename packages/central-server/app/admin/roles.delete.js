import asyncHandler from 'express-async-handler';
import { z } from 'zod';

import { DatabaseConstraintError, NotFoundError } from '@tamanu/errors';

const deleteRoleQuerySchema = z.object({
  dryRun: z
    .string()
    .optional()
    .transform(value => value === '1'),
});

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

  const { dryRun } = await deleteRoleQuerySchema.parseAsync(req.query);

  const {
    store: {
      models: { Role, User },
      sequelize,
    },
    params: { id },
  } = req;

  await sequelize.transaction({ readOnly: dryRun }, async () => {
    const role = await assertRoleIsDeletable({ Role, User, roleId: id });
    if (!dryRun) await role.destroy();
  });

  res.status(204).send();
});
