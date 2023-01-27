import Sequelize from 'sequelize';

export async function up(query) {
  await query.changeColumn('procedures', 'note', {
    type: Sequelize.TEXT,
    allowNull: true,
  });
}

export async function down(query) {
  await query.changeColumn('procedures', 'note', {
    type: Sequelize.STRING,
    allowNull: true,
  });
}
