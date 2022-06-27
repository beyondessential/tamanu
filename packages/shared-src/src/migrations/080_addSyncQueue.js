import { STRING, DATE, NOW, BIGINT, UUIDV4, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface) {
  await query.sequelize.query(`
    CREATE SEQUENCE outgoing_changes_sequence;
  `);
  await query.createTable('outgoing_changes', {
    id: {
      type: STRING,
      defaultValue: UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    created_at: {
      type: DATE,
      defaultValue: NOW,
      allowNull: false,
    },
    updated_at: {
      type: DATE,
      defaultValue: NOW,
      allowNull: false,
    },
    deleted_at: {
      type: DATE,
      allowNull: true,
    },
    record_type: {
      type: STRING,
      allowNull: false,
    },
    record_id: {
      type: STRING,
      allowNull: false,
      unique: true,
    },
    patient_id: {
      type: STRING,
      allowNull: true,
      references: {
        model: 'patient',
        key: 'id',
      },
    },
    sequence: {
      type: BIGINT,
      allowNull: false,
      unique: true,
      default: "nextval('outgoing_changes_sequence')",
    },
  });
  await query.addIndex('outgoing_changes', {
    fields: ['sequence'],
    unique: true,
  });
  await query.addIndex('outgoing_changes', {
    fields: ['patient_id'],
    unique: false,
  });
}

export async function down(query: QueryInterface) {
  await query.dropTable('outgoing_changes');
  await query.sequelize.query('DROP SEQUENCE outgoing_changes_sequence;');
}
