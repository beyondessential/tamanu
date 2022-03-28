module.exports = {
  up: async query => {
    await query.removeConstraint('document_metadata', 'document_metadata_owner_id_fkey');
  },
  down: async query => {
    await query.addConstraint('document_metadata', ['document_owner'], {
      type: 'foreign key',
      name: 'document_metadata_owner_id_fkey',
      references: {
        table: 'users',
        field: 'id',
      },
    });
  },
};
