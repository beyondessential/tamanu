import { DataTypes } from 'sequelize';

const TABLE = { schema: 'fhir', tableName: 'service_requests' };

export async function up(query) {
  await query.changeColumn(TABLE, 'status', DataTypes.TEXT, {
    allowNull: false,
  });
  await query.changeColumn(TABLE, 'intent', DataTypes.TEXT, {
    allowNull: false,
  });

  await query.changeColumn(TABLE, 'priority', DataTypes.TEXT);
  await query.addColumn(TABLE, 'code', 'fhir.codeable_concept');

  await query.removeColumn(TABLE, 'subject');
  await query.addColumn(TABLE, 'subject', 'fhir.reference', {
    allowNull: false,
  });

  await query.removeColumn(TABLE, 'requester');
  await query.addColumn(TABLE, 'requester', 'fhir.reference');

  await query.removeColumn(TABLE, 'occurrence_date_time');
  await query.addColumn(TABLE, 'occurrence_date_time', {
    type: DataTypes.DATE,
    allowNull: true,
  });
}

export async function down(query) {
  await query.changeColumn(TABLE, 'status', DataTypes.STRING(16), {
    allowNull: false,
  });
  await query.changeColumn(TABLE, 'intent', DataTypes.STRING(16), {
    allowNull: false,
  });
  await query.changeColumn(TABLE, 'priority', DataTypes.STRING(10));
  await query.removeColumn(TABLE, 'code');

  await query.removeColumn(TABLE, 'subject');
  await query.addColumn(TABLE, 'subject', DataTypes.UUID, {
    allowNull: false,
    references: {
      model: { schema: 'fhir', tableName: 'patients' },
      key: 'id',
    },
  });

  await query.removeColumn(TABLE, 'requester');
  await query.addColumn(TABLE, 'requester', DataTypes.UUID, {
    allowNull: true,
    references: {
      model: { schema: 'fhir', tableName: 'practitioners' },
      key: 'id',
    },
  });

  await query.removeColumn(TABLE, 'occurrence_date_time');
  await query.addColumn(TABLE, 'occurrence_date_time', {
    type: 'date_time_string',
    allowNull: true,
  });
}
