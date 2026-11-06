import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = 'patient_additional_data';

// Fields for the Billing information section of patient details, plus the two new
// identification fields (spec: specs/patient/details.md). The payors are patient references,
// the same shape as mother_id and father_id, each with its own free-text reference number.
// annual_income holds the sliding fee scale band as displayed rather than an index into the
// scale, so a saved band still reads back correctly once the scale is edited.
export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn(TABLE, 'adoption_number', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await query.addColumn(TABLE, 'marriage_licence', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await query.addColumn(TABLE, 'family_size', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await query.addColumn(TABLE, 'annual_income', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await query.addColumn(TABLE, 'payor1_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: { model: 'patients', key: 'id' },
  });
  await query.addColumn(TABLE, 'payor1_reference_number', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await query.addColumn(TABLE, 'payor2_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: { model: 'patients', key: 'id' },
  });
  await query.addColumn(TABLE, 'payor2_reference_number', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  // No sync_lookup rebuild: every new column starts null, so a lookup row that predates them
  // describes the same record. Both consumers drop keys they don't know (the facility server
  // restricts updates to the model's attributes, mobile picks its own columns), so the rebuild
  // the insurer_id drop does next is the only one this table needs.
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn(TABLE, 'payor2_reference_number');
  await query.removeColumn(TABLE, 'payor2_id');
  await query.removeColumn(TABLE, 'payor1_reference_number');
  await query.removeColumn(TABLE, 'payor1_id');
  await query.removeColumn(TABLE, 'annual_income');
  await query.removeColumn(TABLE, 'family_size');
  await query.removeColumn(TABLE, 'marriage_licence');
  await query.removeColumn(TABLE, 'adoption_number');
}
