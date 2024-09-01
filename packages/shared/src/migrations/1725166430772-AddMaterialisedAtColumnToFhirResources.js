/** @typedef {import('sequelize').QueryInterface} QueryInterface */
import { DataTypes, Sequelize } from 'sequelize';
/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.addColumn({ schema: 'fhir', tableName: 'patients' }, 'materialized_at', {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: Sequelize.NOW,
  });
  await query.addColumn({ schema: 'fhir', tableName: 'encounters' }, 'materialized_at', {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: Sequelize.NOW,
  });
  await query.addColumn({ schema: 'fhir', tableName: 'immunizations' }, 'materialized_at', {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: Sequelize.NOW,
  });
  await query.addColumn({ schema: 'fhir', tableName: 'organizations' }, 'materialized_at', {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: Sequelize.NOW,
  });
  await query.addColumn({ schema: 'fhir', tableName: 'practitioners' }, 'materialized_at', {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: Sequelize.NOW,
  });
  await query.addColumn({ schema: 'fhir', tableName: 'service_requests' }, 'materialized_at', {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: Sequelize.NOW,
  });
  await query.addColumn({ schema: 'fhir', tableName: 'specimens' }, 'materialized_at', {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: Sequelize.NOW,
  });
}

/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.removeColumn({ schema: 'fhir', tableName: 'patients' }, 'materialized_at');
  await query.removeColumn({ schema: 'fhir', tableName: 'encounters' }, 'materialized_at');
  await query.removeColumn({ schema: 'fhir', tableName: 'immunizations' }, 'materialized_at');
  await query.removeColumn({ schema: 'fhir', tableName: 'organizations' }, 'materialized_at');
  await query.removeColumn({ schema: 'fhir', tableName: 'practitioners' }, 'materialized_at');
  await query.removeColumn({ schema: 'fhir', tableName: 'service_requests' }, 'materialized_at');
  await query.removeColumn({ schema: 'fhir', tableName: 'specimens' }, 'materialized_at');
}
