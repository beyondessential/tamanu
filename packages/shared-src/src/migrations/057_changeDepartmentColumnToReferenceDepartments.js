module.exports = {
  up: async query => {
    // Replace old constraint with a new one that points out to departments rather than reference_data
    await query.removeConstraint('document_metadata', 'document_metadata_department_id_fkey');
    await query.addConstraint('document_metadata', ['department_id'], {
      type: 'foreign key',
      name: 'document_metadata_department_id_fkey',
      references: {
        table: 'departments',
        field: 'id',
      },
    });
  },
  down: async query => {
    await query.removeConstraint('document_metadata', 'document_metadata_department_id_fkey');
    await query.addConstraint('document_metadata', ['department_id'], {
      type: 'foreign key',
      name: 'document_metadata_department_id_fkey',
      references: {
        table: 'reference_data',
        field: 'id',
      },
    });
  },
};
