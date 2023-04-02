import Sequelize, { QueryTypes } from 'sequelize';

export async function up(query) {
  const dupes = await query.sequelize.query(
    `
    SELECT COUNT(*), code 
    FROM locations
    GROUP BY code
    HAVING COUNT(*) > 1
  `,
    {
      type: QueryTypes.SELECT,
    },
  );

  if (dupes.length > 0) {
    const codes = dupes.map(d => `"${d.code}" (x${d.count})`).join(',');
    throw new Error(
      `Found some Locations in the db that have the same code as each other. Please resolve the duplication before proceeding.\nThe duplicated codes are: ${codes}`,
    );
  }

  await query.changeColumn('locations', 'code', {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  });
}

export async function down(query) {
  await query.changeColumn('locations', 'code', {
    type: Sequelize.STRING,
    allowNull: false,
    unique: false,
  });
}
