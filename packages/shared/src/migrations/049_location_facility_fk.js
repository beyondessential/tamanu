module.exports = {
  up: async query => {
    await query.sequelize.query(`
      ALTER TABLE locations
        DROP CONSTRAINT locations_facility_id_fkey;
      ALTER TABLE locations
        ADD CONSTRAINT locations_facility_id_fkey
          FOREIGN KEY (facility_id)
          REFERENCES facilities (id)
          ON UPDATE CASCADE
          ON DELETE SET NULL;
    `);
  },
  down: async query => {
    await query.sequelize.query(`
      ALTER TABLE locations
        DROP CONSTRAINT locations_facility_id_fkey;
      ALTER TABLE locations
        ADD CONSTRAINT locations_facility_id_fkey
          FOREIGN KEY (facility_id)
          REFERENCES reference_data (id)
          ON UPDATE CASCADE
          ON DELETE SET NULL;
    `);
  },
};
