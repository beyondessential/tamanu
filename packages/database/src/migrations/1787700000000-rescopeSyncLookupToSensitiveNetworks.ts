import { QueryInterface, QueryTypes } from 'sequelize';

import { getModelsForPull } from '../sync';

// DML only (spec: specs/sync/sensitive-networks.md).
//
// Existing lookup rows still carry the old scoping, where a record recorded at a sensitive facility
// was pinned to that facility's own id. Population now writes the facility's network instead and
// leaves the facility null, so these rows have to be moved over in the same upgrade — otherwise
// they stay pinned to one facility while new rows reach the whole network.
//
// Only rows the old sensitivity CASE wrote are touched: a facility that belongs to a network, on a
// record type that hangs off an encounter. A row scoped to a facility for genuine facility binding
// — a patient facility link, a facility-scoped setting — keeps its facility and is left alone.
//
// updated_at_sync_tick is deliberately untouched. Nothing stamps sync_lookup itself (the sync tick
// and hard-delete triggers sit on the source tables and write into it), so a direct update
// preserves ticks and no facility re-pulls a record it already holds.

// The same predicate the guard test uses: a model is network scoped exactly when its lookup query
// reaches encounters. Derived from the registry rather than listed, so it cannot drift from the
// population logic it is mirroring — Notification included, whose joins reach encounters through
// its metadata.
const getEncounterScopedRecordTypes = async (query: QueryInterface) => {
  const models = getModelsForPull(query.sequelize.models as any);
  if (Object.keys(models).length === 0) {
    throw new Error('No models registered, so the record types to rescope cannot be derived');
  }

  const recordTypes = [];
  for (const model of Object.values<any>(models)) {
    const { joins } = (await model.buildSyncLookupQueryDetails({})) ?? {};
    if (model.tableName === 'encounters' || /JOIN\s+encounters\b/.test(joins ?? '')) {
      recordTypes.push(model.tableName);
    }
  }
  return recordTypes;
};

// Without a networked facility there is nothing to move, and facility_id is unindexed.
const hasNetworkedFacility = async (query: QueryInterface) => {
  const [{ exists }] = await query.sequelize.query<{ exists: boolean }>(
    `SELECT EXISTS (SELECT 1 FROM facilities WHERE sensitive_network_id IS NOT NULL);`,
    { type: QueryTypes.SELECT },
  );
  return exists;
};

export async function up(query: QueryInterface): Promise<void> {
  if (!(await hasNetworkedFacility(query))) return;

  const encounterScopedRecordTypes = await getEncounterScopedRecordTypes(query);

  await query.sequelize.query(
    `
    UPDATE sync_lookup
    SET sensitive_network_id = facilities.sensitive_network_id,
        facility_id = NULL
    FROM facilities
    WHERE sync_lookup.facility_id = facilities.id
      -- a facility deleted while it was sensitive gained no network, so its rows keep their
      -- facility rather than ending up with neither scope and reaching everyone
      AND facilities.sensitive_network_id IS NOT NULL
      AND sync_lookup.record_type IN (:encounterScopedRecordTypes);
    `,
    { replacements: { encounterScopedRecordTypes }, type: QueryTypes.UPDATE },
  );
}

export async function down(query: QueryInterface): Promise<void> {
  if (!(await hasNetworkedFacility(query))) return;

  const encounterScopedRecordTypes = await getEncounterScopedRecordTypes(query);

  // A network of one restores exactly the facility the row used to carry. A network with several
  // members has no single facility to go back to, so those rows keep their network and the old
  // population logic would rebuild them.
  await query.sequelize.query(
    `
    UPDATE sync_lookup
    SET facility_id = sole_members.id,
        sensitive_network_id = NULL
    FROM (
      SELECT sensitive_network_id, MIN(id) AS id
      FROM facilities
      WHERE sensitive_network_id IS NOT NULL
      GROUP BY sensitive_network_id
      HAVING COUNT(*) = 1
    ) AS sole_members
    WHERE sync_lookup.sensitive_network_id = sole_members.sensitive_network_id
      AND sync_lookup.record_type IN (:encounterScopedRecordTypes);
    `,
    { replacements: { encounterScopedRecordTypes }, type: QueryTypes.UPDATE },
  );
}
