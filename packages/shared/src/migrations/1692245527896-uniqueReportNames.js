import Sequelize, { QueryTypes } from 'sequelize';

export async function up(query) {
  const dupes = await query.sequelize.query(
    `
    SELECT COUNT(*), name 
    FROM report_definitions
    GROUP BY name
    HAVING COUNT(*) > 1
  `,
    {
      type: QueryTypes.SELECT,
    },
  );

  if (dupes.length > 0) {
    const names = dupes.map(d => `"${d.name}" (x${d.count})`).join(',');
    throw new Error(
      `Found some Report definitions in the db that have the same name as each other. Please resolve the duplication before proceeding.\nThe duplicated names are: ${names}`,
    );
  }

  await query.changeColumn('report_definitions', 'name', {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  });
}

export async function down(query) {
  await query.changeColumn('report_definitions', 'name', {
    type: Sequelize.STRING,
    allowNull: false,
    unique: false,
  });
}
