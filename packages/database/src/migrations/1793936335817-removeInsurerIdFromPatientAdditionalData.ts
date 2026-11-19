import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = 'patient_additional_data';

// A patient's insurance is recorded as insurance plans on the invoicing side, so the patient's
// own insurer reference has nothing left reading it (spec: specs/patient/details.md). The
// insurance policy number stays.
export async function up(query: QueryInterface): Promise<void> {
  await query.removeColumn(TABLE, 'insurer_id');

  // Lookup rows written before this still carry insurerId. Both consumers drop keys they don't
  // know, so this is for the table's own correctness rather than to keep sync working.
  await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('${TABLE}');`);
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: the column comes back empty — which insurer each patient had is not recoverable.
  await query.addColumn(TABLE, 'insurer_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: { model: 'reference_data', key: 'id' },
  });

  await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('${TABLE}');`);
}
