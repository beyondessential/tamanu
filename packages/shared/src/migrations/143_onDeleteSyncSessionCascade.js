module.exports = {
  up: async query => {
    await query.sequelize.query(`
      ALTER TABLE sync_session_records
      DROP CONSTRAINT sync_session_records_session_id_fkey
    `);
    await query.sequelize.query(`
      ALTER TABLE sync_session_records
      ADD CONSTRAINT sync_session_records_session_id_fkey
        FOREIGN KEY (session_id)
        REFERENCES sync_sessions(id)
        ON DELETE CASCADE;
    `);
  },
  down: async query => {
    await query.sequelize.query(`
      ALTER TABLE sync_session_records
      DROP CONSTRAINT sync_session_records_session_id_fkey
    `);
    await query.sequelize.query(`
      ALTER TABLE sync_session_records
      ADD CONSTRAINT sync_session_records_session_id_fkey
        FOREIGN KEY (session_id)
        REFERENCES sync_sessions(id)
        ON DELETE RESTRICT;
    `);
  },
};
