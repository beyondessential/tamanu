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

  // These facilities see each other's history for the first time, but every cursor is already past
  // it. Re-marking their patients for sync has each facility pull those patients' full history on
  // its next sync, as for any newly marked patient, which now includes the other two facilities'.
  // The trigger stamps the current tick in place of 1, as in bumpSyncTickForRepull.
  await sequelize.query(
    `UPDATE patient_facilities SET updated_at_sync_tick = 1 WHERE facility_id IN (:facilityIds);`,
    { replacements: { facilityIds: FIJI_SRH_FACILITY_IDS }, type: QueryTypes.UPDATE },
  );
};

export const STEPS: Steps = [
  {
    ...BETWEEN_SCHEMA_MIGRATIONS,
    // Central only: sync_lookup is populated there, and central decides which patients a facility
    // pulls in full. A Fiji facility server receives both the networks and the membership by sync.
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
