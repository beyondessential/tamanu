const TABLE = { schema: 'fhir', tableName: 'service_requests' };

export async function up(query) {
  await query.removeConstraint(TABLE, 'service_requests_imaging_request_id_fkey');
}

export async function down(query) {
  await query.addConstraint(TABLE, {
    type: 'foreign key',
    name: 'service_requests_imaging_request_id_fkey',
    fields: ['upstream_id'],
    references: {
      table: 'imaging_requests',
      field: 'id',
    },
  });
}
