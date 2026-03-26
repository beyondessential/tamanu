import { DataTypes, QueryInterface } from 'sequelize';

// Migration 2 of 2: Set patient_id NOT NULL
// Backfill of null patient_id is in 1771277622908-backfillEncountersPatientIdToTestPatient.ts

export async function up(query: QueryInterface): Promise<void> {
  await query.changeColumn('encounters', 'patient_id', {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'patients',
      key: 'id',
    },
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.changeColumn('encounters', 'patient_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'patients',
      key: 'id',
    },
  });
}
