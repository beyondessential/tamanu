import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable('patient_invoice_insurance_plans', {
    id: {
      type: DataTypes.TEXT,
      defaultValue: Sequelize.fn('gen_random_uuid'),
      allowNull: false,
      primaryKey: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('now'),
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('now'),
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    patient_id: {
      type: DataTypes.TEXT,
      allowNull: false,
      references: { model: 'patients', key: 'id' },
    },
    invoice_insurance_plan_id: {
      type: DataTypes.TEXT,
      allowNull: false,
      references: { model: 'invoice_insurance_plans', key: 'id' },
    },
  });

  await query.addIndex('patient_invoice_insurance_plans', ['patient_id'], {
    name: `idx_patient_invoice_insurance_plans_patient_id`,
  });

  await query.sequelize.query(`
    CREATE UNIQUE INDEX idx_patient_invoice_insurance_plans_patient_id_invoice_insurance_plan_id
    ON patient_invoice_insurance_plans (patient_id, invoice_insurance_plan_id)
    WHERE deleted_at IS NULL;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable('patient_invoice_insurance_plans');
}
