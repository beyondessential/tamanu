module.exports = {
  up: async (query) => {
    await query.sequelize.query("ALTER TYPE enum_program_data_elements_type ADD VALUE 'Signature'");
  },
  down: async () => {
    // Note: PostgreSQL doesn't support removing enum values directly
    // This would require recreating the enum type which is complex and risky
    // For now, we'll leave the value in the enum
    throw new Error('Cannot remove enum values in PostgreSQL without recreating the type');
  },
};