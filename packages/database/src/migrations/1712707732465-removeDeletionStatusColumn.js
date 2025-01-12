import { DataTypes } from 'sequelize';

const DELETION_STATUSES = {
  DELETED: 'deleted',
  REVOKED: 'revoked',
  RECORDED_IN_ERROR: 'recorded-in-error',
};

export async function up(query) {
  await query.sequelize.query(`
    UPDATE patient_program_registration_conditions
    SET deleted_at = now()
    WHERE deletion_status = '${DELETION_STATUSES.DELETED}'
    AND deleted_at IS NULL;
  `);
  await query.removeColumn('patient_program_registration_conditions', 'deletion_status');
}

export async function down(query) {
  await query.addColumn('patient_program_registration_conditions', 'deletion_status', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
  await query.sequelize.query(`
    UPDATE patient_program_registration_conditions
    SET deletion_status = '${DELETION_STATUSES.DELETED}'
    WHERE deleted_at IS NOT NULL;
  `);
  await query.sequelize.query(`
    UPDATE patient_program_registration_conditions
    SET deleted_at = NULL
    WHERE deleted_at IS NOT NULL;
  `);
}
