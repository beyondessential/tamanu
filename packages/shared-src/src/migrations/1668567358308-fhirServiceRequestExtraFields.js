import { DataTypes } from 'sequelize';

export async function up(query) {
  query.changeColumn('fhir.service_requests', 'status', DataTypes.TEXT);
  query.changeColumn('fhir.service_requests', 'intent', DataTypes.TEXT);
  query.changeColumn('fhir.service_requests', 'priority', DataTypes.TEXT);
  query.addColumn('fhir.service_requests', 'code', 'fhir.codeable_concept');
  query.changeColumn('fhir.service_requests', 'subject', 'fhir.reference', {
    allowNull: false,
  });
  query.changeColumn('fhir.service_requests', 'requester', 'fhir.reference');
}

export async function down(query) {
  query.changeColumn('fhir.service_requests', 'status', DataTypes.STRING(16));
  query.changeColumn('fhir.service_requests', 'intent', DataTypes.STRING(16));
  query.changeColumn('fhir.service_requests', 'priority', DataTypes.STRING(10));
  query.removeColumn('fhir.service_requests', 'code');

  query.removeColumn('fhir.service_requests', 'subject');
  query.addColumn('fhir.service_requests', 'subject', DataTypes.UUID, {
    allowNull: false,
    references: {
      model: { schema: 'fhir', tableName: 'patients' },
      key: 'id',
    },
  });

  query.removeColumn('fhir.service_requests', 'requester');
  query.addColumn('fhir.service_requests', 'requester', DataTypes.UUID, {
    allowNull: true,
    references: {
      model: { schema: 'fhir', tableName: 'practitioners' },
      key: 'id',
    },
  });
}
