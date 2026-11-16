import { isEqual } from 'es-toolkit/compat';

import { FACT_CENTRAL_ENDPOINTS, SETTINGS_SCOPES } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { normaliseCentralEndpoint } from '@tamanu/utils/centralEndpoint';

import { canUseCentralEndpoints, getServerFacilityIds } from '../serverConfig';

const ENDPOINTS_KEY = 'sync.centralEndpoints';

// spec: CEND
// A facility's effective list: its own entries in order, then the global ones, with any endpoint
// already present dropped from its later position. A server hosting several facilities uses each
// hosted facility's entries in turn before the global ones. Both scopes are read separately
// because settings arrays replace rather than merge, so a merged read would hide the global list.
export async function readEffectiveCentralEndpoints({ models: { Setting }, facilityIds }) {
  const facilityLists = [];
  for (const facilityId of facilityIds) {
    facilityLists.push(
      (await Setting.get(ENDPOINTS_KEY, facilityId, SETTINGS_SCOPES.FACILITY)) ?? [],
    );
  }
  const globalList = (await Setting.get(ENDPOINTS_KEY, null, SETTINGS_SCOPES.GLOBAL)) ?? [];

  const endpoints = [];
  for (const entry of [...facilityLists.flat(), ...globalList]) {
    const result = normaliseCentralEndpoint(entry);
    if (!result.isValid) {
      log.warn('applyCentralEndpoints: ignoring invalid endpoint', {
        entry,
        reason: result.reason,
      });
    } else if (!endpoints.includes(result.endpoint)) {
      endpoints.push(result.endpoint);
    }
  }
  return endpoints;
}

/**
 * Takes the list central supplied through settings sync as the recorded list, once a login at one
 * of its entries succeeds. Until then synced settings change nothing about where the facility
 * connects. Runs off the back of a completed sync session.
 *
 * - SYNC_URL fixes the host externally, so lists are ignored
 * - an empty list leaves the recorded list alone
 * - an identical list changes nothing
 * - when no entry passes, the recorded list stands and a later sync tries again
 *
 * @returns {Promise<{ applied: boolean, reason?: string }>}
 */
export async function applyCentralEndpoints({
  models,
  selector,
  facilityIds = getServerFacilityIds() ?? [],
}) {
  if (!selector || !canUseCentralEndpoints()) return { applied: false, reason: 'not-applicable' };

  const supplied = await readEffectiveCentralEndpoints({ models, facilityIds });
  if (supplied.length === 0) return { applied: false, reason: 'empty' };
  if (isEqual(supplied, selector.hosts)) return { applied: false, reason: 'unchanged' };

  const verified = await selector.firstPassing(supplied);
  if (verified !== null) {
    await models.LocalSystemFact.set(FACT_CENTRAL_ENDPOINTS, JSON.stringify(supplied));
    await selector.adopt(supplied, verified);
    log.info('applyCentralEndpoints: recorded central endpoints', {
      endpoints: supplied,
      using: verified,
    });
    return { applied: true };
  }

  log.warn(
    'applyCentralEndpoints: no supplied endpoint passed a login, keeping the recorded list',
    {
      supplied,
      recorded: selector.hosts,
    },
  );
  return { applied: false, reason: 'none-verified' };
}
