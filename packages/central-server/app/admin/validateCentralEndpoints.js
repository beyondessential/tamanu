import { get as getAtPath } from 'es-toolkit/compat';

import { SETTINGS_SCOPES } from '@tamanu/constants';
import { InvalidParameterError } from '@tamanu/errors';
import { getScopedSchema } from '@tamanu/settings';
import { normaliseCentralEndpoint } from '@tamanu/utils/centralEndpoint';

const ENDPOINTS_KEY = 'sync.centralEndpoints';
const REQUIRE_HTTPS_KEY = 'security.requireHttps';

// spec: CEND
// Whether `security.requireHttps` is in effect on central once this save lands. Central reads the
// global and central scopes, and the key is unique across them, so a save at either scope that
// carries the value wins over what is stored.
async function isHttpsRequiredOnCentral({ Setting, settings, scope }) {
  const savesCentralReadScope =
    scope === SETTINGS_SCOPES.CENTRAL || scope === SETTINGS_SCOPES.GLOBAL;
  const incoming = savesCentralReadScope ? getAtPath(settings, REQUIRE_HTTPS_KEY) : undefined;
  const value = incoming ?? (await Setting.get(REQUIRE_HTTPS_KEY));
  return Boolean(value);
}

/**
 * Rejects a save that carries a central endpoint list central cannot accept: an entry that is not
 * a valid endpoint, or a plain `http` entry while central requires HTTPS (central would refuse
 * the connection). The settings editor validates the same schema client-side, but nothing
 * server-side does, so this is what enforces the rule for API callers.
 */
export async function validateCentralEndpointsSave({ Setting, settings, scope }) {
  const endpoints = getAtPath(settings, ENDPOINTS_KEY);
  if (endpoints === undefined) return;

  const leaf = getAtPath(getScopedSchema(scope), [
    'properties',
    'sync',
    'properties',
    'centralEndpoints',
  ]);
  if (!leaf) return;

  try {
    await leaf.type.validate(endpoints, { strict: true });
  } catch (error) {
    throw new InvalidParameterError(`${ENDPOINTS_KEY}: ${error.message}`);
  }

  const hasHttpEntry = endpoints.some(endpoint =>
    normaliseCentralEndpoint(endpoint).endpoint?.startsWith('http:'),
  );
  if (hasHttpEntry && (await isHttpsRequiredOnCentral({ Setting, settings, scope }))) {
    throw new InvalidParameterError(
      `${ENDPOINTS_KEY} cannot contain http endpoints while ${REQUIRE_HTTPS_KEY} is in effect`,
    );
  }
}
