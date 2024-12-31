import { QueryTypes } from 'sequelize';

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
      `Found some report definitions in the db that have the same name as each other. Please resolve the duplication before proceeding.\nThe duplicated names are: ${names}`,
    );
  }

  await query.sequelize.query(`
    ALTER TABLE report_definitions ADD CONSTRAINT report_definitions_name_key UNIQUE (name);
  `);
}

export async function down(query) {
  await query.sequelize.query(`
    ALTER TABLE report_definitions DROP CONSTRAINT report_definitions_name_key;
 `);
}
