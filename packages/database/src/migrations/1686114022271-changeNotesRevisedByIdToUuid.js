import Sequelize from 'sequelize';

export async function up(query) {
  await query.removeColumn('notes', 'revised_by_id');

  await query.addColumn('notes', 'revised_by_id', {
    type: Sequelize.UUID,
    references: {
      model: 'notes',
      key: 'id',
    },
    allowNull: true,
  });
}

export async function down(query) {
  await query.removeConstraint('notes', 'notes_revised_by_id_fkey');

  await query.removeColumn('notes', 'revised_by_id');

  await query.addColumn('notes', 'revised_by_id', {
    type: Sequelize.STRING,
    allowNull: true,
  });
}
