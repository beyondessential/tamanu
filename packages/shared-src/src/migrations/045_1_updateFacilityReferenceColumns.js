
// helper function to move a FK constraint to point at a different column/table
async function switchConstraint(query, table, target, up) {
  const column = `${target}_id`;                // eg location_id
  const constraint = `${table}_${column}_fkey`; // eg encounter_location_id_fkey

  // remove existing constraint
  await query.sequelize.query(`
    ALTER TABLE ${table} 
      DROP CONSTRAINT ${constraint};
  `);

  // add constraint to new table
  const reference = up ? `${target}s` : `reference_data`;
  await query.sequelize.query(`
    ALTER TABLE ${table}
      ADD CONSTRAINT ${constraint}
        FOREIGN KEY 
        REFERENCES ${reference}(id);
  `);
}

const TARGETS = [
  { table: 'encounters', type: 'location' },
  { table: 'encounters', type: 'department' },
  { table: 'procedures', type: 'location' },
];

module.exports = {
  up: async query => {
    for (const t of TARGETS) {
      await switchConstraint(query, t.table, t.type, true);
    }
  },
  down: async query => {
    const targets = [...TARGETS];
    targets.reverse();
    for (const t of targets) {
      await switchConstraint(query, t.table, t.type, false);
    }
  },
};
