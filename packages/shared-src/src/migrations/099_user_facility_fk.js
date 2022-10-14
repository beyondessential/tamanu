module.exports = {
  up: async query => {
    await query.sequelize.query(`
      ALTER TABLE user_facilities
        DROP CONSTRAINT user_facilities_facility_id_fkey;
      ALTER TABLE user_facilities
        ADD CONSTRAINT user_facilities_facility_id_fkey
          FOREIGN KEY (facility_id)
          REFERENCES facilities (id)
          ON UPDATE CASCADE
          ON DELETE SET NULL;
    `);
  },
  down: async query => {
    await query.sequelize.query(`
      ALTER TABLE user_facilities
        DROP CONSTRAINT user_facilities_facility_id_fkey;
      ALTER TABLE user_facilities
        ADD CONSTRAINT user_facilities_facility_id_fkey
          FOREIGN KEY (facility_id)
          REFERENCES reference_data (id)
          ON UPDATE CASCADE
          ON DELETE SET NULL;
    `);
  },
};
