module.exports = {
  up: async query => {
    // This migration can fail if enum_notes_record_type already includes LabRequest
    // so if it fails we can just ignore it
    // (if it fails for a different reason, we have bigger problems)
    try {
      await query.sequelize.query("ALTER TYPE enum_notes_record_type ADD VALUE 'LabRequest'");
    } catch(e) {
    }
  },
  down: async query => {
  },
};
