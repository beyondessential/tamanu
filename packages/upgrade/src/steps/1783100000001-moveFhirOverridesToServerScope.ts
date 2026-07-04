import { Op, QueryTypes } from 'sequelize';
import { FACT_FHIR_OVERRIDES_MIGRATED, SETTINGS_SCOPES } from '@tamanu/constants';

import type { Steps, StepArgs } from '../step.ts';
import { END } from '../step.js';

const OVERRIDE_KEY = 'fhir.worker.resourceMaterialisationEnabled';

// The facility server a facility belongs to, per its most recent non-mobile
// sync session. Facilities that have never synced from a facility server
// resolve to null.
const deviceForFacility = async (sequelize: any, facilityId: string) => {
  const [row] = await sequelize.query(
    `
      SELECT parameters->>'deviceId' AS "deviceId"
      FROM sync_sessions
      WHERE parameters->'facilityIds' @> :facilityJson::jsonb
        AND COALESCE(parameters->>'isMobile', 'false') != 'true'
        AND parameters->>'deviceId' IS NOT NULL
      ORDER BY start_time DESC
      LIMIT 1
    `,
    {
      type: QueryTypes.SELECT,
      replacements: { facilityJson: JSON.stringify([facilityId]) },
    },
  );
  return (row as { deviceId?: string } | undefined)?.deviceId ?? null;
};

// fhir.worker.resourceMaterialisationEnabled used to be facility-overridable,
// with the values of every facility on a server union-merged at boot (any-true
// wins; a facility false never disabled anything). It is now a server-scope
// (device-keyed) setting. This central step replays that merge once: facility
// rows are grouped by the device that serves them and any-true values become a
// device row, then the facility rows are removed (the deletion syncs down).
// Facilities with no known device are left untouched with a warning — their
// rows are inert either way, since nothing reads the facility key any more.
export const STEPS: Steps = [
  {
    at: END,
    async check({ serverType, models: { LocalSystemFact } }: StepArgs) {
      return serverType === 'central' && !(await LocalSystemFact.get(FACT_FHIR_OVERRIDES_MIGRATED));
    },
    async run({ sequelize, models: { Setting, LocalSystemFact }, log, toVersion }: StepArgs) {
      // settings are stored one row per leaf: `<key>.<ResourceType>` -> boolean
      const facilityRows = await Setting.findAll({
        where: {
          scope: SETTINGS_SCOPES.FACILITY,
          key: { [Op.like]: `${OVERRIDE_KEY}.%` },
        },
      });

      const deviceByFacility = new Map<string, string | null>();
      const enabledByDevice = new Map<string, Record<string, boolean>>();
      const migratedRowIds: string[] = [];
      for (const row of facilityRows) {
        if (!deviceByFacility.has(row.facilityId!)) {
          deviceByFacility.set(row.facilityId!, await deviceForFacility(sequelize, row.facilityId));
        }
        const deviceId = deviceByFacility.get(row.facilityId!);
        if (!deviceId) {
          log.warn('moveFhirOverridesToServerScope: no known device for facility; leaving row', {
            facilityId: row.facilityId,
          });
          continue;
        }
        const resource = row.key.slice(OVERRIDE_KEY.length + 1);
        const enabled = enabledByDevice.get(deviceId) ?? {};
        if (row.value) enabled[resource] = true;
        enabledByDevice.set(deviceId, enabled);
        migratedRowIds.push(row.id);
      }

      for (const [deviceId, enabled] of enabledByDevice.entries()) {
        if (Object.keys(enabled).length === 0) continue;
        const existing = await Setting.get(OVERRIDE_KEY, null, SETTINGS_SCOPES.SERVER, deviceId);
        if (existing !== undefined) continue; // never clobber an operator's value
        await Setting.set(OVERRIDE_KEY, enabled, SETTINGS_SCOPES.SERVER, null, deviceId);
      }

      if (migratedRowIds.length) {
        // soft delete, so the removal syncs down to the facility copies
        await Setting.destroy({ where: { id: migratedRowIds } });
      }

      await LocalSystemFact.set(FACT_FHIR_OVERRIDES_MIGRATED, toVersion);
    },
  },
];
