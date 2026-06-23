import asyncHandler from 'express-async-handler';
import * as z from 'zod';

import { TamanuApi } from '@tamanu/api-client';
import {
  SERVER_TYPES,
  FACT_CENTRAL_HOST,
  FACT_SYNC_EMAIL,
  FACT_SYNC_PASSWORD,
  FACT_FACILITY_IDS,
} from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';

import { isServerConfigured, initServerConfig } from '../../serverConfig';
import { version } from '../../serverInfo';

// First-run setup endpoints. Unauthenticated by necessity — before sync there
// are no users to authenticate. The status endpoint gates the web setup wizard;
// the sync endpoint records where this server syncs to and which facilities it
// serves. It only works while the server is UNCONFIGURED (see below).

export const setupStatusHandler = asyncHandler(async (req, res) => {
  req.flagPermissionChecked();
  res.send({ configured: isServerConfigured() });
});

const isProduction = process.env.NODE_ENV === 'production';

const setupSyncSchema = z.object({
  host: z
    .string()
    .url()
    .refine(value => {
      try {
        const { protocol } = new URL(value);
        // https only (allow http in non-production for local dev).
        return protocol === 'https:' || (!isProduction && protocol === 'http:');
      } catch {
        return false;
      }
    }, 'host must be an https URL'),
  email: z.string().trim().min(1),
  password: z.string().min(1),
  facilityIds: z.array(z.string().trim().min(1)).min(1),
});

export const setupSyncHandler = asyncHandler(async (req, res) => {
  req.flagPermissionChecked();

  // Only permitted while unconfigured. Once configured, reconfiguration goes
  // through env / direct DB — never this unauthenticated endpoint — so a live,
  // populated server's sync target can't be repointed by an unauthenticated call.
  if (isServerConfigured()) {
    return res.status(409).send({ error: { message: 'Server is already configured' } });
  }

  const { host, email, password, facilityIds } = setupSyncSchema.parse(req.body);
  const uniqueFacilityIds = [...new Set(facilityIds.map(id => id.trim()))];
  const normalisedHost = new URL(host).origin;

  // The deliberate part: prove the host is reachable and the credentials
  // authenticate, before saving anything. Also the authorisation gate — this
  // endpoint is unauthenticated (a fresh server has no users), so we require the
  // supplied credentials to be a central superuser. (Next pass: central
  // provisions a dedicated sync user once the admin has authenticated here.)
  const probe = new TamanuApi({
    endpoint: `${normalisedHost}/api`,
    agentName: SERVER_TYPES.FACILITY,
    agentVersion: version,
    deviceId: req.deviceId,
    logger: log,
  });

  let loginResult;
  try {
    loginResult = await probe.login(email, password, { scopes: [], backoff: { maxAttempts: 1 } });
  } catch (error) {
    // Generic message + no host/password in logs — don't turn this into an
    // oracle for which internal hosts respond.
    log.warn(`Sync setup validation failed: ${error.type ?? error.name}`);
    return res
      .status(422)
      .send({ error: { message: 'Could not connect to the sync server with those details' } });
  }

  if (!loginResult.ability?.can('manage', 'all')) {
    return res.status(403).send({
      error: { message: 'You must be an administrator on the central server to set up this server' },
    });
  }

  // Have central provision a dedicated sync user (rather than storing the admin's
  // own credentials). The probe is authenticated as the admin from the login above.
  let syncCredentials;
  try {
    syncCredentials = await probe.post('admin/syncCredentials', {
      facilityIds: uniqueFacilityIds,
    });
  } catch (error) {
    log.warn(`Sync credential provisioning failed: ${error.type ?? error.name}`);
    return res
      .status(502)
      .send({ error: { message: 'Could not provision sync credentials on the central server' } });
  }

  const { LocalSystemFact } = req.models;
  await LocalSystemFact.set(FACT_CENTRAL_HOST, normalisedHost);
  await LocalSystemFact.set(FACT_SYNC_EMAIL, syncCredentials.email);
  // ponytail: sync password stored plaintext in local_system_facts for now — move
  // to the encrypted local_system_secrets table (in progress on another branch)
  // once it lands.
  await LocalSystemFact.set(FACT_SYNC_PASSWORD, syncCredentials.password);
  await LocalSystemFact.set(FACT_FACILITY_IDS, JSON.stringify(uniqueFacilityIds));

  // Refresh the in-memory holder so this process reports configured immediately;
  // the sync process picks up the new connection on its next (re)start.
  await initServerConfig({ context: { models: req.models } });

  log.info('Facility server configured via setup wizard', {
    host: normalisedHost,
    facilityIds: uniqueFacilityIds,
  });

  res.send({ configured: true });
});
