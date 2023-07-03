import Sequelize from 'sequelize';

export async function up(query) {
  // Deep clone note_pages table
  await query.sequelize.query(`
    CREATE TABLE notes (LIKE note_pages INCLUDING ALL);
  `);

  // Add extra columns
  await query.addColumn('notes', 'author_id', {
    type: Sequelize.STRING,
    references: {
      model: 'users',
      key: 'id',
    },
    allowNull: true,
  });

  await query.addColumn('notes', 'on_behalf_of_id', {
    type: Sequelize.STRING,
    references: {
      model: 'users',
      key: 'id',
    },
    allowNull: true,
  });

  await query.addColumn('notes', 'revised_by_id', {
    type: Sequelize.STRING,
    allowNull: true,
  });

  await query.addColumn('notes', 'content', {
    type: Sequelize.TEXT,
    allowNull: false,
    defaultValue: '',
  });

  await query.addIndex('notes', {
    fields: ['record_id'],
  });
  await query.addIndex('notes', {
    fields: ['date'],
  });
}

export async function down(query) {
  await query.dropTable('notes');
}
