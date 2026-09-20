import { QueryTypes } from 'sequelize';

import { FACT_CURRENT_SYNC_TICK } from '@tamanu/constants';

import { END, type Steps, type StepArgs } from '../step.js';

// Ids, not codes: a reference data import can edit a code, but an id names the same facility
// forever.
const SRH_FACILITY_IDS = ['facility-SRHCentral', 'facility-SRHWestern', 'facility-SRHNorthern'];

// A network of its own rather than electing one of the backfilled three, whose id and name are
// their facility's and can't be renamed once referenced.
const SRH_NETWORK = { id: 'sensitiveNetwork-srh', code: 'SRH', name: 'SRH' };

interface FacilityRow {
  id: string;
  networkId: string | null;
}

const findFacilities = ({ sequelize }: StepArgs) =>
  sequelize.query<FacilityRow>(
    `
    SELECT id, sensitive_network_id AS "networkId"
    FROM facilities
    WHERE id IN (:facilityIds)
      AND deleted_at IS NULL;
    `,
    { replacements: { facilityIds: SRH_FACILITY_IDS }, type: QueryTypes.SELECT },
  );

// Fiji's sensitive facilities predate networks, so U6's backfill gave each one a network of its
// own — preserving the isolation they had, which is the only safe default. Fiji want their three
// SRH facilities sharing one network instead, a deliberate widening of confidentiality that cannot
// be undone once synced, so this names the three facilities rather than merging whatever networks
// it finds: a sensitive facility added later is left alone, and the step is a no-op everywhere
// else and on every upgrade after the merge.
//
// at: END with no before/after deps runs after the whole migration batch (listSteps adds the
// MIGRATIONS_END edge) and is never sunset, unlike an after: needsMigration() gate.
export const STEPS: Steps = [
  {
    at: END,
    async check({ serverType }: StepArgs) {
      return serverType === 'central';
    },
    async run(args: StepArgs) {
      const {
        sequelize,
        log,
        models: { LocalSystemFact },
      } = args;

      await sequelize.transaction(async () => {
        const facilities = await findFacilities(args);

        // Another deployment, or not the shape this was written for.
        if (
          facilities.length !== SRH_FACILITY_IDS.length ||
          facilities.some(({ networkId }) => !networkId)
        ) {
          log.debug(
            'SRH facilities are not all present in a network, so there is nothing to merge',
          );
          return;
        }

        const mergedIds = [
          ...new Set(
            facilities
              .map(({ networkId }) => networkId as string)
              .filter(networkId => networkId !== SRH_NETWORK.id),
          ),
        ];
        if (mergedIds.length === 0) {
          log.debug('SRH facilities already share a sensitive network');
          return;
        }

        log.info('Merging SRH sensitive networks', {
          into: SRH_NETWORK.id,
          merging: mergedIds.length,
        });

        // Unguarded, so a network already holding this id, code or name aborts the upgrade. Past
        // the early return above, every one of those means the deployment is not in the state
        // this step was written for, and going ahead would enrol the facilities into a network
        // that is not the one described here. Note this cannot be ON CONFLICT DO NOTHING anyway:
        // code and name are DEFERRABLE unique constraints (TAM-7004), and Postgres refuses a
        // deferrable constraint as a speculative-insertion arbiter.
        await sequelize.query(
          `INSERT INTO sensitive_networks (id, code, name) VALUES (:id, :code, :name);`,
          { replacements: SRH_NETWORK, type: QueryTypes.INSERT },
        );

        await sequelize.query(
          `UPDATE facilities SET sensitive_network_id = :targetId
           WHERE id IN (:facilityIds);`,
          {
            replacements: { targetId: SRH_NETWORK.id, facilityIds: SRH_FACILITY_IDS },
            type: QueryTypes.UPDATE,
          },
        );

        // Retagging alone leaves every row older than each facility's last pull, so nothing would
        // be pulled. Take a fresh tick the way the sync clock does, so no session shares it, and
        // reserve it before the statement that writes it.
        const tock = await LocalSystemFact.incrementValue(FACT_CURRENT_SYNC_TICK, 2);

        // Historical rows already carry a network: the rescope migration moved them off their
        // facility earlier in this same upgrade, and population has written the network since.
        //
        // Retag and re-tick in one pass. sync_lookup is the largest table in the deployment, and
        // splitting these writes the same rows twice for no gain — the tick pass could only ever
        // match rows this statement has just moved, because the network was created above and so
        // nothing referenced it beforehand.
        await sequelize.query(
          `UPDATE sync_lookup
           SET sensitive_network_id = :targetId,
               updated_at_sync_tick = :tick
           WHERE sensitive_network_id IN (:mergedIds);`,
          {
            replacements: { targetId: SRH_NETWORK.id, tick: tock - 1, mergedIds },
            type: QueryTypes.UPDATE,
          },
        );

        await sequelize.query(
          `UPDATE sensitive_networks SET deleted_at = NOW() WHERE id IN (:mergedIds);`,
          { replacements: { mergedIds }, type: QueryTypes.UPDATE },
        );
      });
    },
  },
];
