import { Op } from 'sequelize';

export async function checkUserUniqueness(User, { email, displayName, excludeId, caseInsensitiveEmail = false }) {
  const duplicates = {};
  if (email) {
    const where = { email: caseInsensitiveEmail ? { [Op.iLike]: email } : email };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    duplicates.email = Boolean(await User.findOne({ where }));
  }
  if (displayName) {
    const where = { displayName: { [Op.iLike]: displayName } };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    duplicates.displayName = Boolean(await User.findOne({ where }));
  }
  return duplicates;
}
