import Sequelize, { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('patient_birth_data', 'marked_for_push', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });
  await query.addColumn('patient_birth_data', 'is_pushing', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });

  await query.addColumn('patient_birth_data', 'pushed_at', {
    type: Sequelize.DATE,
    allowNull: true,
  });
  await query.addColumn('patient_birth_data', 'pulled_at', {
    type: Sequelize.DATE,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('patient_birth_data', 'marked_for_push');
  await query.removeColumn('patient_birth_data', 'is_pushing');
  await query.removeColumn('patient_birth_data', 'pushed_at');
  await query.removeColumn('patient_birth_data', 'pulled_at');
}
