const Sequelize = require('sequelize');

module.exports = {
  up: async query => {
    // Rename columns first
    await query.renameColumn('document_metadata', 'created_date', 'document_created_at');
    await query.renameColumn('document_metadata', 'uploaded_date', 'document_uploaded_at');
    await query.renameColumn('document_metadata', 'owner_id', 'document_owner');

    // Apply column changes (with new naming scheme)
    await query.changeColumn('document_metadata', 'name', {
      type: Sequelize.TEXT,
      allowNull: false,
    });
    await query.changeColumn('document_metadata', 'document_uploaded_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    });
    await query.changeColumn('document_metadata', 'document_owner', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Add missing columns
    await query.addColumn('document_metadata', 'department_id', {
      type: Sequelize.STRING,
      references: {
        model: 'reference_data',
        key: 'id',
      },
      allowNull: true,
    });
    await query.addColumn('document_metadata', 'note', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
  down: async query => {
    // Rename columns first
    await query.renameColumn('document_metadata', 'document_created_at', 'created_date');
    await query.renameColumn('document_metadata', 'document_uploaded_at', 'uploaded_date');
    await query.renameColumn('document_metadata', 'document_owner', 'owner_id');

    // Revert column changes (with old naming scheme)
    await query.changeColumn('document_metadata', 'name', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await query.changeColumn('document_metadata', 'uploaded_date', {
      type: Sequelize.DATE,
      allowNull: false,
    });
    await query.changeColumn('document_metadata', 'owner_id', {
      type: Sequelize.STRING,
      references: {
        model: 'users',
        key: 'id',
      },
      allowNull: false,
    });

    // Remove new columns
    await query.removeColumn('document_metadata', 'department_id');
    await query.removeColumn('document_metadata', 'note');
  },
};
