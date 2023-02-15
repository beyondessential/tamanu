async function getTablesWithEncounterId(sequelize) {
  const [tables] = await sequelize.query(
    `SELECT
      typname
    FROM
      pg_catalog.pg_attribute
    JOIN
      pg_catalog.pg_type
    ON
      pg_attribute.attrelid = pg_type.typrelid
    WHERE
      attname = 'encounter_id';`,
  );
  return tables.map(t => t.typname);
}

module.exports = {
  up: async query => {
    const encounterLinkedTables = await getTablesWithEncounterId(query.sequelize);
    for (const table of encounterLinkedTables) {
      await query.addIndex(table, ['encounter_id']);
    }

    // special cases
    await query.addIndex('referrals', ['initiating_encounter_id']);
    await query.addIndex('referrals', ['completing_encounter_id']);
  },
  down: async query => {
    const encounterLinkedTables = await getTablesWithEncounterId(query.sequelize);
    for (const table of encounterLinkedTables) {
      await query.removeIndex(table, ['encounter_id']);
    }

    // special cases
    await query.removeIndex('referrals', ['initiating_encounter_id']);
    await query.removeIndex('referrals', ['completing_encounter_id']);
  },
};
