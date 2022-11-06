module.exports = {
  up: async query => {
    await query.removeConstraint('document_metadata', 'document_metadata_attachment_id_fkey');
  },
  down: async query => {
    await query.addConstraint('document_metadata', ['attachment_id'], {
      type: 'foreign key',
      name: 'document_metadata_attachment_id_fkey',
      references: {
        table: 'attachments',
        field: 'id',
      },
    });
  },
};
