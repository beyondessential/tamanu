import { QueryTypes } from 'sequelize';

import {
  BETWEEN_SCHEMA_MIGRATIONS,
  ENCOUNTER_SCOPED_RECORD_TYPES,
  hasFacilityIsSensitive,
  hasFijiSrhFacilities,
  FIJI_SRH_FACILITY_IDS,
  FIJI_SRH_NETWORK,
} from '../sensitiveNetworks.js';
import type { Steps, StepArgs } from '../step.js';

// Fiji want their three SRH facilities sharing one sensitive network rather than a network each — a
// deliberate widening of confidentiality that cannot be undone once synced.
//
// Exclusive with the ordinary backfill, so that these rows are rescoped once rather than tagged
// with three separate networks and then rewritten. Fiji holds no sensitive facility outside these
// three, so nothing here is left for the ordinary path to pick up.
// spec: specs/sync/sensitive-networks.md

// Unguarded insert, so a network already holding this id, code or name aborts the upgrade: past the
// check, each of those means the deployment is not in the state this was written for, and going
// ahead would enrol the facilities somewhere this step never described.
export const enrolFijiSrhFacilities = async (sequelize: StepArgs['sequelize']) => {
  await sequelize.query(
    `INSERT INTO sensitive_networks (id, code, name) VALUES (:id, :code, :name);`,
    { replacements: FIJI_SRH_NETWORK, type: QueryTypes.INSERT },
  );

  await sequelize.query(
    `UPDATE facilities SET sensitive_network_id = :networkId WHERE id IN (:facilityIds);`,
    {
      replacements: { networkId: FIJI_SRH_NETWORK.id, facilityIds: FIJI_SRH_FACILITY_IDS },
      type: QueryTypes.UPDATE,
    },
  );

  // These facilities see each other's history for the first time, so the records have to look new
  // or nobody pulls them: every cursor is already past them. Setting the tick to 1 has the trigger
  // stamp the current tick, as bumpSyncTickForRepull does, and the lookup refresh then re-ticks their
  // lookup rows. Re-ticking sync_lookup directly does not last: a full lookup rebuild takes each
  // row's tick from its source record, and 2.66 flags the lab tables for one.
  for (const recordType of ENCOUNTER_SCOPED_RECORD_TYPES) {
    await sequelize.query(
      `
      UPDATE "${recordType}" source
      SET updated_at_sync_tick = 1
      FROM sync_lookup
      WHERE sync_lookup.record_type = :recordType
        AND sync_lookup.facility_id IN (:facilityIds)
        AND sync_lookup.record_id = source.id::text;
      `,
      {
        replacements: { recordType, facilityIds: FIJI_SRH_FACILITY_IDS },
        type: QueryTypes.UPDATE,
      },
    );
  }

  await sequelize.query(
    `
    UPDATE sync_lookup
    SET sensitive_network_id = :networkId,
        facility_id = NULL
    WHERE facility_id IN (:facilityIds)
      AND record_type IN (:encounterScopedRecordTypes);
    `,
    {
      replacements: {
        networkId: FIJI_SRH_NETWORK.id,
        facilityIds: FIJI_SRH_FACILITY_IDS,
        encounterScopedRecordTypes: ENCOUNTER_SCOPED_RECORD_TYPES,
      },
      type: QueryTypes.UPDATE,
    },
  );
};

export const STEPS: Steps = [
  {
    ...BETWEEN_SCHEMA_MIGRATIONS,
    // Central only: sync_lookup is populated there, and the re-ticked records sync out from it. A
    // Fiji facility server receives both the networks and the membership by sync.
    async check({ sequelize, serverType }: StepArgs) {
      if (serverType !== 'central') return false;
      if (!(await hasFacilityIsSensitive(sequelize))) return false;
      return hasFijiSrhFacilities(sequelize);
    },
    async run({ sequelize, log }: StepArgs) {
      await sequelize.transaction(async () => {
        log.info('Enrolling the SRH facilities into one sensitive network', {
          network: FIJI_SRH_NETWORK.id,
        });
        await enrolFijiSrhFacilities(sequelize);
      });
    },
  },
];
