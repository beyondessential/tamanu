import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('procedures', 'department_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'departments',
      key: 'id',
    },
  });

  await query.addColumn('procedures', 'assistant_anaesthetist_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  });

  await query.addColumn('procedures', 'time_in', {
    type: DataTypes.DATETIMESTRING,
    allowNull: true,
  });

  await query.addColumn('procedures', 'time_out', {
    type: DataTypes.DATETIMESTRING,
    allowNull: true,
  });

  // Create junction table
  await query.createTable('procedure_survey_responses', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    procedure_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'procedures',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    survey_response_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'survey_responses', // assuming this is your table name
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  // Add unique constraint to prevent duplicates
  await query.addConstraint('procedure_survey_responses', {
    fields: ['procedure_id', 'survey_response_id'],
    type: 'unique',
    name: 'unique_procedure_survey_response',
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable('procedure_survey_responses');
  await query.removeColumn('procedures', 'time_out');
  await query.removeColumn('procedures', 'time_in');
  await query.removeColumn('procedures', 'assistant_anaesthetist_id');
  await query.removeColumn('procedures', 'department_id');
}
