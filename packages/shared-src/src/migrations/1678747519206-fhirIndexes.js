const BTREE_INDEXES = {
  diagnostic_reports: ['last_updated', 'status', 'effective_date_time', 'issued'],
  immunizations: ['last_updated', 'status', 'occurrence_date_time', 'lot_number'],
  patients: ['last_updated', 'active', 'gender', 'birth_date', 'deceased_date_time'],
  service_requests: ['last_updated', 'status', 'intent', 'priority', 'occurrence_date_time'],
};

const GIN_INDEXES = {
  diagnostic_reports: ['identifier', 'code', 'subject', 'performer', 'result', 'extension'],
  immunizations: ['vaccine_code', 'patient', 'encounter', 'site', 'performer', 'protocol_applied'],
  patients: ['identifier', 'telecom', 'address', 'link', 'extension'],
  service_requests: [
    'identifier',
    'category',
    'order_detail',
    'location_code',
    'code',
    'subject',
    'requester',
  ],
};

export async function up(query) {
  for (const [tableName, fields] of Object.entries(BTREE_INDEXES)) {
    for (const field of fields) {
      await query.addIndex(
        { schema: 'fhir', tableName },
        {
          name: `${tableName}_${field}_idx`,
          fields: [field],
          using: 'btree',
        },
      );
    }
  }

  for (const [tableName, fields] of Object.entries(GIN_INDEXES)) {
    for (const field of fields) {
      await query.addIndex(
        { schema: 'fhir', tableName },
        {
          name: `${tableName}_${field}_ginp`,
          fields: [field],
          using: 'gin',
          operator: 'jsonb_path_ops',
          // we only use this index for @? queries, so we can use the more
          // efficient jsonb_path_ops operator class instead of the default
        },
      );
    }
  }
}

export async function down(query) {
  await query.sequelize.query(
    Object.entries(BTREE_INDEXES)
      .flatMap(([tableName, fields]) =>
        fields.map(field => `DROP INDEX IF EXISTS fhir.${tableName}_${field}_idx;`),
      )
      .join(' '),
  );

  await query.sequelize.query(
    Object.entries(GIN_INDEXES)
      .flatMap(([tableName, fields]) =>
        fields.map(
          field =>
            `DROP INDEX IF EXISTS fhir.${tableName}_${field}_gin; DROP INDEX IF EXISTS fhir.${tableName}_${field}_ginp;`,
        ),
      )
      .join(' '),
  );
}
