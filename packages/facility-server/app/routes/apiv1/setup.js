import asyncHandler from 'express-async-handler';
import * as z from 'zod';

import { TamanuApi } from '@tamanu/api-client';
import {
  SERVER_TYPES,
  DEVICE_SCOPES,
  FACT_CENTRAL_HOST,
  FACT_SYNC_EMAIL,
  FACT_SYNC_PASSWORD,
  FACT_FACILITY_IDS,
} from '@tamanu/constants';
import { parseSyncUrl } from '@tamanu/database/services/syncConnectionConfig';
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
  // Single connection string carrying host + sync user credentials, à la DATABASE_URL.
  syncUrl: z
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
    }, 'syncUrl must be an https URL'),
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

  const { syncUrl, facilityIds } = setupSyncSchema.parse(req.body);
  const uniqueFacilityIds = [...new Set(facilityIds)];

  const { host, email, password } = parseSyncUrl(syncUrl);
  if (!email || !password) {
    return res
      .status(400)
      .send({ error: { message: 'syncUrl must include the sync user credentials' } });
  }

  // The deliberate part: prove the host is reachable and the credentials
  // authenticate before saving anything.
  try {
    const probe = new TamanuApi({
      endpoint: `${host}/api`,
      agentName: SERVER_TYPES.FACILITY,
      agentVersion: version,
      deviceId: req.deviceId,
      logger: log,
    });
    await probe.login(email, password, {
      scopes: [DEVICE_SCOPES.SYNC_CLIENT],
      body: { facilityIds: uniqueFacilityIds },
      backoff: { maxAttempts: 1 },
    });
  } catch (error) {
    // Generic message + no syncUrl/password in logs — don't turn this into an
    // oracle for which internal hosts respond.
    log.warn(`Sync setup validation failed: ${error.type ?? error.name}`);
    return res
      .status(422)
      .send({ error: { message: 'Could not connect to the sync server with those details' } });
  }

  const { LocalSystemFact } = req.models;
  await LocalSystemFact.set(FACT_CENTRAL_HOST, host);
  await LocalSystemFact.set(FACT_SYNC_EMAIL, email);
  await LocalSystemFact.set(FACT_SYNC_PASSWORD, password);
  await LocalSystemFact.set(FACT_FACILITY_IDS, JSON.stringify(uniqueFacilityIds));

  // Refresh the in-memory holder so this process reports configured immediately;
  // the sync process picks up the new connection on its next (re)start.
  await initServerConfig({ context: { models: req.models } });

  log.info('Facility server configured via setup wizard', {
    host,
    facilityIds: uniqueFacilityIds,
  });

  res.send({ configured: true });
});
