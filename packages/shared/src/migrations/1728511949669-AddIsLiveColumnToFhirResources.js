/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { DataTypes } from 'sequelize';
/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.addColumn({ schema: 'fhir', tableName: 'patients' }, 'is_live', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });
  await query.addColumn({ schema: 'fhir', tableName: 'encounters' }, 'is_live', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });
  await query.addColumn({ schema: 'fhir', tableName: 'immunizations' }, 'is_live', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });
  await query.addColumn({ schema: 'fhir', tableName: 'organizations' }, 'is_live', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });
  await query.addColumn({ schema: 'fhir', tableName: 'practitioners' }, 'is_live', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });
  await query.addColumn({ schema: 'fhir', tableName: 'service_requests' }, 'is_live', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });
  await query.addColumn({ schema: 'fhir', tableName: 'specimens' }, 'is_live', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });
  await query.addColumn({ schema: 'fhir', tableName: 'non_fhir_medici_report' }, 'is_live', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });
}

/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.removeColumn({ schema: 'fhir', tableName: 'patients' }, 'is_live');
  await query.removeColumn({ schema: 'fhir', tableName: 'encounters' }, 'is_live');
  await query.removeColumn({ schema: 'fhir', tableName: 'immunizations' }, 'is_live');
  await query.removeColumn({ schema: 'fhir', tableName: 'organizations' }, 'is_live');
  await query.removeColumn({ schema: 'fhir', tableName: 'practitioners' }, 'is_live');
  await query.removeColumn({ schema: 'fhir', tableName: 'service_requests' }, 'is_live');
  await query.removeColumn({ schema: 'fhir', tableName: 'specimens' }, 'is_live');
  await query.removeColumn({ schema: 'fhir', tableName: 'non_fhir_medici_report' }, 'is_live');
}
