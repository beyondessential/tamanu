module.exports = {
  up: async query => {
    return query.sequelize.query("ALTER TYPE enum_notes_record_type ADD VALUE 'LabRequest'");
  },

  down: async query => {
    var q = 'DELETE FROM pg_enum ' +
      'WHERE enumlabel = \'LabRequest\' ' +
      'AND enumtypid = ( SELECT oid FROM pg_type WHERE typname = \'enum_notes_record_type\')';
    return query.sequelize.query(q);
  },
};
