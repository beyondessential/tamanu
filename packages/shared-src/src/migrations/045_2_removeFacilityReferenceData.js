
module.exports = {
  up: async query => {
    await query.sequelize.query(`
      DELETE FROM reference_data 
        WHERE type IN ('facility', 'department', 'location');
    `);
  },
  down: async query => {
    await query.sequelize.query(`
      INSERT INTO reference_data
        (id, code, name, updated_at, deleted_at, type)
        SELECT id, code, name, updated_at, deleted_at, 'facility'
          FROM facilities;
    `);
    await query.sequelize.query(`
      INSERT INTO reference_data
        (id, code, name, updated_at, deleted_at, type)
        SELECT id, code, name, updated_at, deleted_at, 'department'
          FROM departments;
    `);
    await query.sequelize.query(`
      INSERT INTO reference_data
        (id, code, name, updated_at, deleted_at, type)
        SELECT id, code, name, updated_at, deleted_at, 'location'
          FROM locations;
    `);
  },
};
