import Sequelize from 'sequelize';

export async function up(query) {
  await query.sequelize.query(`
    CREATE TABLE notes AS (SELECT * FROM note_pages) WITH NO DATA;
  `);

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
}

export async function down(query) {
  await query.dropTable('notes');
}
