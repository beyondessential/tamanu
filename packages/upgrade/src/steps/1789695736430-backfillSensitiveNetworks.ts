import { QueryTypes, type Sequelize } from 'sequelize';

import {
  BETWEEN_SCHEMA_MIGRATIONS,
  ENCOUNTER_SCOPED_RECORD_TYPES,
  hasFacilityIsSensitive,
  hasFijiSrhFacilities,
} from '../sensitiveNetworks.js';
import type { Steps, StepArgs } from '../step.js';

// The ordinary path: every sensitive facility becomes a network of one, preserving exactly the
// isolation it had. Pooling them would newly expose each facility's confidential data to the
// others, which cannot be undone once synced.
//
// Exclusive with the SRH path — a Fiji deployment runs that one instead, which enrols its three
// facilities and then does this work for anything else.
// spec: specs/sync/sensitive-networks.md
// The id comes from the facility's id, which is unique and already restricted to the characters an
// id may hold — unlike a code, which admits . and / and is not unique. That also keeps the backfill
// deterministic: a facility server and central land on the same id for the same facility.
//
// A network's code and name are each unique, and a facility's are not, so where two sensitive
// facilities share one it is numbered to keep them apart, in facility id order. An administrator
// renames them afterwards through the reference data import.
//
// Only facilities with no network, so this is safe to run after the SRH enrolment has claimed its
// three.
export const backfillNetworksOfOne = async (sequelize: Sequelize) => {
  await sequelize.query(`
    INSERT INTO sensitive_networks (id, code, name)
    SELECT
      'sensitiveNetwork-' || id,
      CASE
        WHEN count(*) OVER (PARTITION BY code) > 1
        THEN code || '-' || row_number() OVER (PARTITION BY code ORDER BY id)
        ELSE code
      END,
      CASE
        WHEN count(*) OVER (PARTITION BY name) > 1
        THEN name || ' ' || row_number() OVER (PARTITION BY name ORDER BY id)
        ELSE name
      END
    FROM facilities
    WHERE is_sensitive = TRUE
      AND deleted_at IS NULL
      AND sensitive_network_id IS NULL;
  `);

  await sequelize.query(`
    UPDATE facilities
    SET sensitive_network_id = 'sensitiveNetwork-' || id
    WHERE is_sensitive = TRUE
      AND deleted_at IS NULL
      AND sensitive_network_id IS NULL;
  `);
};

// Existing lookup rows still carry the old scoping. Population now writes the facility's network
// and leaves the facility null, so these rows have to be moved over in the same upgrade — otherwise
// they stay pinned to one facility while new rows reach the whole network.
//
// Only rows the old sensitivity CASE wrote are touched: a facility that belongs to a network, on a
// record type that hangs off an encounter. A row scoped to a facility for genuine facility binding
// — a patient facility link, a facility-scoped setting — keeps its facility and is left alone.
//
// updated_at_sync_tick is deliberately untouched. Nothing stamps sync_lookup itself (the sync tick
// and hard-delete triggers sit on the source tables and write into it), so a direct update
// preserves ticks and no facility re-pulls a record it already holds. That is right here and wrong
// for the SRH facilities, which are seeing each other's history for the first time — so that step
// re-ticks its own rows before calling this, and the facility match below can no longer reach them.
export const rescopeSyncLookup = async (sequelize: Sequelize) => {
  await sequelize.query(
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
    {
      replacements: { encounterScopedRecordTypes: ENCOUNTER_SCOPED_RECORD_TYPES },
      type: QueryTypes.UPDATE,
    },
  );
};

export const STEPS: Steps = [
  {
    ...BETWEEN_SCHEMA_MIGRATIONS,
    async check({ sequelize }: StepArgs) {
      if (!(await hasFacilityIsSensitive(sequelize))) return false;
      return !(await hasFijiSrhFacilities(sequelize));
    },
    async run({ sequelize, log }: StepArgs) {
      await sequelize.transaction(async () => {
        log.info('Giving each sensitive facility a network of its own');
        await backfillNetworksOfOne(sequelize);
        await rescopeSyncLookup(sequelize);
      });
    },
  },
];
