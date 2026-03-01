import { Op } from 'sequelize';

export async function checkUserUniqueness(User, { email, displayName, excludeId }) {
  const dupes = {};
  if (email) {
    const where = { email };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    dupes.email = !!(await User.findOne({ where }));
  }
  if (displayName) {
    const where = { displayName: { [Op.iLike]: displayName } };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    dupes.displayName = !!(await User.findOne({ where }));
  }
  return dupes;
}
