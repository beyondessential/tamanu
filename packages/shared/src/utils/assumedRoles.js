import { QueryTypes } from 'sequelize';

export async function performAssumedRoleOperation(context, role, query, replacements) {
  const { sequelize } = context;
  sequelize.transaction(async () => {
    await sequelize.query(`SET ROLE ${role}`);
    const rolconfig = await sequelize.query(
      `SELECT unnest(rolconfig) config from pg_roles where rolname = '${role}'`,
      {
        type: QueryTypes.SELECT,
      },
    );
    // When assuming roles in postgres, the role's configuration is not automatically applied.
    const roleSettingsQuery = rolconfig.reduce((acc, { config }) => {
      const [key, value] = config.split('=');
      return `${acc} SET ${key} TO ${value};`;
    }, '');
    await sequelize.query(roleSettingsQuery);
    const res = await sequelize.query(query, {
      type: QueryTypes.SELECT,
      replacements,
    });
    const resetRoleSettingsQuery = rolconfig.reduce((acc, { config }) => {
      const [key] = config.split('=');
      return `${acc} RESET ${key};`;
    }, '');
    await sequelize.query(resetRoleSettingsQuery);
    await sequelize.query('RESET ROLE');
    return res;
  });
}
