module.exports = {
  up: async query => {
    // populate facilities
    await query.sequelize.query(
      `
      INSERT INTO facilities
        (id, name, code, updated_at, created_at, type, division)
        SELECT id, name, code, now()::timestamptz(3), now()::timestamptz(3), :type, :division
          FROM reference_data
          WHERE reference_data.type = 'facility';
    `,
      {
        // leaving type and division as empty strings as they will require
        // a reimport anyway
        replacements: {
          type: '',
          division: '',
        },
      },
    );

    // departments and locations need a facility attached, but we won't know
    // which until we do a reimport. so, just use whichever facility for now
    const [records] = await query.sequelize.query(`
      SELECT id FROM facilities LIMIT 1
    `);

    if (records.length === 0) {
      // No facilities -- this will only happen on a fresh server, so it's safe
      // to assume there are no departments or locations either. Our work here
      // is done.
      return;
    }

    const facilityId = records[0].id;

    // populate departments
    await query.sequelize.query(
      `
      INSERT INTO departments
        (id, name, code, updated_at, created_at, facility_id)
        SELECT id, name, code, now()::timestamptz(3), now()::timestamptz(3), :facilityId
          FROM reference_data
          WHERE reference_data.type = 'department';
    `,
      {
        replacements: {
          facilityId,
        },
      },
    );

    // populate locations
    await query.sequelize.query(
      `
      INSERT INTO locations
        (id, name, code, updated_at, created_at, facility_id)
        SELECT id, name, code, now()::timestamptz(3), now()::timestamptz(3), :facilityId
          FROM reference_data
          WHERE reference_data.type = 'location';
    `,
      {
        replacements: {
          facilityId,
        },
      },
    );
  },
  down: async query => {
    await query.sequelize.query(`DELETE FROM locations;`);
    await query.sequelize.query(`DELETE FROM departments;`);
    await query.sequelize.query(`DELETE FROM facilities;`);
  },
};
