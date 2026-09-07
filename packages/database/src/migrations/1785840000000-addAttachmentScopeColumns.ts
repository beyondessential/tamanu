import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = { tableName: 'attachments', schema: 'public' };

// spec: ATCH
// An attachment carries the patient linkage of the record it is created for and,
// where that record is pinned to an encounter, that encounter — copied on at
// creation so the attachment's synchronisation scope matches its owning record's.
// Both are nullable: an attachment may hang off a patient directly, off an
// encounter, or (for legacy rows) off neither until backfilled.
export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn(TABLE, 'patient_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: { model: 'patients', key: 'id' },
  });
  await query.addColumn(TABLE, 'encounter_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: { model: 'encounters', key: 'id' },
  });
  await query.addIndex(TABLE, ['patient_id'], { name: 'attachments_patient_id' });
  await query.addIndex(TABLE, ['encounter_id'], { name: 'attachments_encounter_id' });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeIndex(TABLE, 'attachments_encounter_id');
  await query.removeIndex(TABLE, 'attachments_patient_id');
  await query.removeColumn(TABLE, 'encounter_id');
  await query.removeColumn(TABLE, 'patient_id');
}
