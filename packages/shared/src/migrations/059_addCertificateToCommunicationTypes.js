const { DatabaseError } = require('sequelize');

module.exports = {
  up: async query => {
    // This migration can fail if enum_patient_communications_type already includes Certificate
    // so if it fails we can just ignore it
    try {
      await query.sequelize.query(
        "ALTER TYPE enum_patient_communications_type ADD VALUE 'Certificate'",
      );
    } catch (e) {
      if (e instanceof DatabaseError) {
        if (e.message.match(`already exists`)) {
          return;
        }
      }
      // it failed for a different reason - rethrow
      throw e;
    }
  },
  down: async () => {
    // no down migration - it's unsafe to delete enums
  },
};
