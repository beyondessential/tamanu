const TARGETS = [
  { table: 'encounters', type: 'location' },
  { table: 'encounters', type: 'department' },
  { table: 'procedures', type: 'location' },
];

// helper function to ensure ref data records point to the right kind of data
async function sanitiseForeignKeys(query, table, target) {
  const column = `${target}_id`;

  // find any records that have an erroneous foreign key
  // (eg a location_id that points to a department)
  const [records] = await query.sequelize.query(
    `
    SELECT ${table}.id
      FROM ${table}
      JOIN reference_data ON ${column} = reference_data.id
      WHERE reference_data.type <> :type;
  `,
    {
      replacements: {
        type: target,
      },
    },
  );

  // bail early if there aren't any; job's done!
  if (!records.length) return;

  // pick any valid record off the pile for the appropriate data type
  // to use as a replacement (this will be a destructive operation but
  // these fields are all dummy data even when they're healthy)
  const [validRecords] = await query.sequelize.query(
    `
    SELECT id
      FROM reference_data 
      WHERE type = :type
      LIMIT 1
  `,
    { replacements: { type: target } },
  );

  const validFkey = validRecords[0].id;

  // set the erroneous records to use a valid id so the rest of the migration
  // can continue without error
  await query.sequelize.query(
    `
    UPDATE ${table}
      SET ${column} = :validFkey
      WHERE id IN (:ids)
  `,
    {
      replacements: {
        validFkey,
        ids: records.map(x => x.id),
      },
    },
  );
}

// helper function to move a FK constraint to point at a different column/table
async function switchConstraint(query, table, target, up) {
  const column = `${target}_id`; // eg location_id
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
        FOREIGN KEY (${column})
        REFERENCES ${reference} (id)
        ON UPDATE CASCADE 
        ON DELETE SET NULL;
  `);
}

module.exports = {
  up: async query => {
    for (const t of TARGETS) {
      await sanitiseForeignKeys(query, t.table, t.type);
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
