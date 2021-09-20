
module.exports = {
  up: async query => {
    // TODO notes:
    // - are facilites.type and .division ok to leave null?
    //    - configurable values?
    // - problematic to carry over set updated_at and created_at?
    //    - should set to NOW() instead?
    // - should pulled_at really be omitted from the facility table?
    // - select default facility better?
    //    - these records almost certainly require a reimport but still

    // populate facilities   
    await query.sequelize.query(`
      INSERT INTO facilities
        (id, name, code, updated_at, created_at, type, division)
        SELECT id, name, code, now()::timestamptz(0), now()::timestamptz(0), :type, :division
          FROM reference_data
          WHERE reference_data.type = 'facility';
    `, {
      replacements: {
        type: '',
        division: '',
      }
    });

    const [records] = await query.sequelize.query(`
      SELECT id FROM facilities LIMIT 1
    `);
    const facilityId = records[0].id;

    // populate departments   
    await query.sequelize.query(`
      INSERT INTO departments
        (id, name, code, updated_at, created_at, facility_id)
        SELECT id, name, code, now()::timestamptz(0), now()::timestamptz(0), :facilityId
          FROM reference_data
          WHERE reference_data.type = 'department';
    `, {
      replacements: {
        facilityId,
      }
    });

    // populate locations   
    await query.sequelize.query(`
      INSERT INTO locations
        (id, name, code, updated_at, created_at, facility_id)
        SELECT id, name, code, now()::timestamptz(0), now()::timestamptz(0), :facilityId
          FROM reference_data
          WHERE reference_data.type = 'location';
    `, {
      replacements: {
        facilityId,
      }
    });
  },
  down: async query => {
    await query.sequelize.query(`DELETE FROM locations;`);
    await query.sequelize.query(`DELETE FROM departments;`);
    await query.sequelize.query(`DELETE FROM facilities;`);
  },
};
