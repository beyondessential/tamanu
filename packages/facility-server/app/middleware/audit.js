export const attachAuditUserToDbSession = async (req, res, next) => {
  const { db, user } = req;
  const { id: userId } = user;

  await db.sequelize.query(`set_config('audit.user_id', :userId, true);`, {
    replacements: { userId },
  });

  next();
};
