import { QueryTypes } from 'sequelize';

export async function performAssumedRoleOperation(context, role, query, replacements) {
  const { sequelize } = context;
  sequelize.transaction(async () => {
    await sequelize.query(`SET ROLE ${role}`);
    const res = await sequelize.query(query, {
      type: QueryTypes.SELECT,
      replacements,
    });
    await sequelize.query('RESET ROLE');
    return res;
  });
}
