import asyncHandler from 'express-async-handler';
import * as z from 'zod';
import ipaddr from 'ipaddr.js';

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

// POST /public/setup/sync is unauthenticated (a fresh server has no users), so
// it's gated three ways: central super-admin credentials must validate, the
// server must still be UNCONFIGURED, and the request must come from a trusted
// network. (Setup status is folded into the public ping response.)

// We can't restrict the target host (central may be on a private/Tailscale
// network), so we restrict the request source instead — stopping a public
// attacker from driving the outbound probe (SSRF) or claiming a fresh server.
const TRUSTED_SOURCE_RANGES = {
  ipv4: [
    '127.0.0.0/8',
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    '169.254.0.0/16',
    '100.64.0.0/10',
  ],
  ipv6: ['::1/128', 'fc00::/7', 'fe80::/10', 'fd7a:115c:a1e0::/48'],
};

export const isTrustedSetupSource = ip => {
  if (!ip) return false;
  let addr;
  try {
    // process() unwraps IPv4-mapped IPv6 (::ffff:1.2.3.4 -> 1.2.3.4).
    addr = ipaddr.process(ip);
  } catch {
    return false;
  }
  return (TRUSTED_SOURCE_RANGES[addr.kind()] ?? []).some(cidr =>
    addr.match(ipaddr.parseCIDR(cidr)),
  );
};


const setupSyncSchema = z.object({
  host: z
    .string()
    .url()
    .refine(value => {
      try {
        const { protocol } = new URL(value);
        // https only (allow http in non-production for local dev). Read NODE_ENV
        // here rather than at module load so tests that set it are respected.
        const allowHttp = process.env.NODE_ENV !== 'production';
        return protocol === 'https:' || (allowHttp && protocol === 'http:');
      } catch {
        return false;
      }
    }, 'host must be an https URL'),
  email: z.string().trim().min(1),
  password: z.string().min(1),
  facilityIds: z
    .array(z.string().trim().min(1))
    .min(1)
    .max(100),
});

export const setupSyncHandler = asyncHandler(async (req, res) => {
  req.flagPermissionChecked();

  if (!isTrustedSetupSource(req.ip)) {
    return res
      .status(403)
      .send({ error: { message: 'Setup is only available from the local network' } });
  }

  // Reconfiguring a live server goes through env / direct DB, not this endpoint.
  if (isServerConfigured()) {
    return res.status(409).send({ error: { message: 'Server is already configured' } });
  }

  const { host, email, password, facilityIds } = setupSyncSchema.parse(req.body);
  const uniqueFacilityIds = [...new Set(facilityIds.map(id => id.trim()))];
  const normalisedHost = new URL(host).origin;

  // Validate the host + credentials against central, and use them as the authz
  // gate (must be a central super-admin) before saving anything.
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
    // Generic message, no host/password logged — don't leak which hosts respond.
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

  // Have central provision a dedicated sync user rather than storing the admin's.
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

  const { LocalSystemFact, LocalSystemSecret } = req.models;
  // Atomic so a mid-write failure can't leave the server half-configured. The
  // advisory lock + re-check closes the TOCTOU between the isServerConfigured()
  // check above and the write: two concurrent trusted requests can both pass that
  // check, so the second to reach here must not silently overwrite the first.
  let alreadyConfigured = false;
  await req.db.transaction(async () => {
    await req.db.query(`SELECT pg_advisory_xact_lock(hashtext('tamanu:facility-setup'));`);
    if (await LocalSystemFact.get(FACT_CENTRAL_HOST)) {
      alreadyConfigured = true;
      return;
    }
    await LocalSystemFact.set(FACT_CENTRAL_HOST, normalisedHost);
    await LocalSystemFact.set(FACT_SYNC_EMAIL, syncCredentials.email);
    await LocalSystemFact.set(FACT_FACILITY_IDS, JSON.stringify(uniqueFacilityIds));
    // Password encrypted at rest, out of local_system_facts and the raw reporting role.
    await LocalSystemSecret.set(FACT_SYNC_PASSWORD, syncCredentials.password);
  });

  if (alreadyConfigured) {
    return res.status(409).send({ error: { message: 'Server is already configured' } });
  }

  // Refresh the holder so this process reports configured immediately; the sync
  // process picks it up on its next (re)start.
  await initServerConfig({ context: { models: req.models } });

  log.info('Facility server configured via setup wizard', {
    host: normalisedHost,
    facilityIds: uniqueFacilityIds,
  });

  res.send({ configured: true });
});
