import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable('procedure_type_surveys', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('gen_random_uuid'),
    },
    procedure_type_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'reference_data',
        key: 'id',
      },
    },
    survey_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'surveys',
        key: 'id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await query.addConstraint('procedure_type_surveys', {
    fields: ['procedure_type_id', 'survey_id'],
    type: 'unique',
    name: 'procedure_type_survey_unique',
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable('procedure_type_surveys');
}
