import { DataTypes, QueryInterface, Sequelize, QueryTypes } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable('procedure_assistant_clinicians', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('gen_random_uuid'),
    },
    procedure_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'procedures',
        key: 'id',
      },
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users',
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

  // Add indexes for better performance
  await query.addIndex('procedure_assistant_clinicians', ['procedure_id']);
  await query.addIndex('procedure_assistant_clinicians', ['user_id']);

  // Migrate existing data from assistantId to the new table
  const procedures = (await query.sequelize.query(
    `SELECT id, assistant_id FROM procedures WHERE assistant_id IS NOT NULL AND deleted_at IS NULL`,
    { type: QueryTypes.SELECT },
  )) as Array<{ id: string; assistant_id: string }>;

  for (const procedure of procedures) {
    await query.sequelize.query(
      `INSERT INTO procedure_assistant_clinicians (id, procedure_id, user_id, created_at, updated_at)
       VALUES (gen_random_uuid(), :procedureId, :userId, now(), now())`,
      {
        replacements: {
          procedureId: procedure.id,
          userId: procedure.assistant_id,
        },
        type: QueryTypes.INSERT,
      },
    );
  }

  // Remove the assistantId column from the procedures table
  await query.removeColumn('procedures', 'assistant_id');
}

export async function down(query: QueryInterface): Promise<void> {
  // Add back the assistantId column to the procedures table
  await query.addColumn('procedures', 'assistant_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  });

  // Migrate data back from the join table to the assistantId column
  // This will only keep the first assistant for each procedure
  const assistantClinicians = (await query.sequelize.query(
    `SELECT procedure_id, user_id FROM procedure_assistant_clinicians
     WHERE deleted_at IS NULL
     GROUP BY procedure_id, user_id`,
    { type: QueryTypes.SELECT },
  )) as Array<{ procedure_id: string; user_id: string }>;

  for (const assistant of assistantClinicians) {
    await query.sequelize.query(
      `UPDATE procedures SET assistant_id = :userId WHERE id = :procedureId`,
      {
        replacements: {
          userId: assistant.user_id,
          procedureId: assistant.procedure_id,
        },
        type: QueryTypes.UPDATE,
      },
    );
  }

  // Drop the procedure_assistant_clinicians table
  await query.dropTable('procedure_assistant_clinicians');
}
