import Sequelize, { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('administered_vaccines', 'marked_for_push', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });
  await query.addColumn('administered_vaccines', 'is_pushing', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });

  await query.addColumn('administered_vaccines', 'pushed_at', {
    type: Sequelize.DATE,
    allowNull: true,
  });
  await query.addColumn('administered_vaccines', 'pulled_at', {
    type: Sequelize.DATE,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('administered_vaccines', 'marked_for_push');
  await query.removeColumn('administered_vaccines', 'is_pushing');
  await query.removeColumn('administered_vaccines', 'pushed_at');
  await query.removeColumn('administered_vaccines', 'pulled_at');
}
