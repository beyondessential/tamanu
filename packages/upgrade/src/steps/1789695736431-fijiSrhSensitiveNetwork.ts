import { QueryTypes } from 'sequelize';

import { FACT_CURRENT_SYNC_TICK } from '@tamanu/constants';

import {
  BETWEEN_SCHEMA_MIGRATIONS,
  ENCOUNTER_SCOPED_RECORD_TYPES,
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
export const enrolFijiSrhFacilities = async (
  sequelize: StepArgs['sequelize'],
  { LocalSystemFact }: StepArgs['models'],
) => {
  // These facilities see each other's history for the first time, so the rows have to look new or
  // nobody pulls them: every cursor is already past them. Take a fresh tick the way the sync clock
  // does, so no session shares it. Taken up front so everything this step writes lands in the one
  // tick/tock pair: the facility rows on the tock the trigger stamps them with, the lookup rows on
  // the tick below it.
  const tock = await LocalSystemFact.incrementValue(FACT_CURRENT_SYNC_TICK, 2);

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

  // Rescope and re-tick in one pass, which is the whole point of the paths being exclusive.
  await sequelize.query(
    `
    UPDATE sync_lookup
    SET sensitive_network_id = :networkId,
        facility_id = NULL,
        updated_at_sync_tick = :tick
    WHERE facility_id IN (:facilityIds)
      AND record_type IN (:encounterScopedRecordTypes);
    `,
    {
      replacements: {
        networkId: FIJI_SRH_NETWORK.id,
        facilityIds: FIJI_SRH_FACILITY_IDS,
        tick: tock - 1,
        encounterScopedRecordTypes: ENCOUNTER_SCOPED_RECORD_TYPES,
      },
      type: QueryTypes.UPDATE,
    },
  );
};

export const STEPS: Steps = [
  {
    ...BETWEEN_SCHEMA_MIGRATIONS,
    // Central only: sync_lookup is populated there, and the tick this takes is central's clock. A
    // Fiji facility server receives both the networks and the membership by sync.
    async check({ sequelize, serverType }: StepArgs) {
      return serverType === 'central' && (await hasFijiSrhFacilities(sequelize));
    },
    async run({ sequelize, models, log }: StepArgs) {
      await sequelize.transaction(async () => {
        log.info('Enrolling the SRH facilities into one sensitive network', {
          network: FIJI_SRH_NETWORK.id,
        });
        await enrolFijiSrhFacilities(sequelize, models);
      });
    },
  },
];
