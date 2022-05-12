const { DatabaseError } = require('sequelize');

module.exports = {
  up: async query => {
    // This migration can fail if enum_notes_record_type already includes LabRequest
    // so if it fails we can just ignore it
    try {
      await query.sequelize.query("ALTER TYPE enum_notes_record_type ADD VALUE 'LabRequest'");
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
