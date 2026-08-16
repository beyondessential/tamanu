import { QueryInterface } from 'sequelize';

// FHIR resource tables (fhir.* schema) that carry the resolved/last_updated columns
// the resolver job scans. Not sync-tracked (syncDirection: DO_NOT_SYNC), so no
// sync_lookup rebuild is needed here.
const TABLES = [
  'encounters',
  'immunizations',
  'medication_requests',
  'non_fhir_medici_report',
  'organizations',
  'patients',
  'practitioners',
  'service_requests',
  'specimens',
];

const indexName = (table: string) => `${table}_unresolved_last_updated`;

export async function up(query: QueryInterface): Promise<void> {
  // The resolver job repeatedly scans for resolved = false (see
  // FhirResource.resolveUpstreams); without this, every scan is a full sequential
  // scan of the whole table. Partial on resolved = false so the index stays small
  // even though most rows are resolved.
  for (const table of TABLES) {
    await query.addIndex(
      { schema: 'fhir', tableName: table },
      {
        name: indexName(table),
        fields: ['last_updated'],
        where: { resolved: false },
      },
    );
  }
}

export async function down(query: QueryInterface): Promise<void> {
  for (const table of TABLES) {
    await query.removeIndex({ schema: 'fhir', tableName: table }, indexName(table));
  }
}
