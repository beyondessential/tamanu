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
  FACT_SETTINGS_PSK,
} from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { clearSettingsPskCache } from '@tamanu/shared/utils/crypto';

import { isServerConfigured, initServerConfig } from '../../serverConfig';
import { version } from '../../serverInfo';

// POST /public/setup/sync is unauthenticated (a fresh server has no users), so it's
// gated three ways: trusted source network, server still unconfigured, and valid
// central super-admin creds. We gate the source (not the target host — central may
// be on Tailscale) to stop a public attacker driving the probe (SSRF) or claiming
// a fresh server. Note the source gate is only as good as `req.ip`: behind a
// reverse proxy not covered by `config.proxy.trusted`, requests appear to come
// from the proxy's (private) address, so treat this as defence in depth — the
// admin-credentials check is the real gate.
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
        // https only; allow http off-production (read NODE_ENV here so tests can set it).
        const allowHttp = process.env.NODE_ENV !== 'production';
        return protocol === 'https:' || (allowHttp && protocol === 'http:');
      } catch {
        return false;
      }
    }, 'host must be an https URL'),
  email: z.string().trim().min(1),
  password: z.string().min(1),
  facilityIds: z.array(z.string().trim().min(1)).min(1).max(100),
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
    return res.status(422).send({
      error: {
        name: 'Could not connect to the central server',
        message: 'Check the URL and administrator credentials and try again.',
      },
    });
  }

  if (!loginResult.ability?.can('manage', 'all')) {
    return res.status(403).send({
      error: {
        message: 'You must be an administrator on the central server to set up this server',
      },
    });
  }

  // Have central provision a dedicated sync user rather than storing the admin's.
  let syncCredentials;
  try {
    syncCredentials = await probe.post('admin/syncCredentials', {
      deviceId: req.deviceId,
      facilityIds: uniqueFacilityIds,
    });
  } catch (error) {
    log.warn(`Sync credential provisioning failed: ${error.type ?? error.name}`);
    return res
      .status(502)
      .send({ error: { message: 'Could not provision sync credentials on the central server' } });
  }

  const { LocalSystemFact, LocalSystemSecret } = req.models;
  // Atomic write; advisory lock + re-check closes the TOCTOU with the
  // isServerConfigured() check above so concurrent requests can't both configure.
  let alreadyConfigured = false;
  await req.db.transaction(async () => {
    await req.db.query(`SELECT pg_advisory_xact_lock(hashtext('tamanu:facility-setup'));`);
    // Re-check via the sync email — written only by a completed wizard run, unlike
    // syncHost/facilityIds which the boot integrity check can drift-stamp. Keeps this
    // consistent with the isServerConfigured() gate above (a lone syncHost ≠ configured).
    if (await LocalSystemFact.get(FACT_SYNC_EMAIL)) {
      alreadyConfigured = true;
      return;
    }
    await LocalSystemFact.set(FACT_CENTRAL_HOST, normalisedHost);
    await LocalSystemFact.set(FACT_SYNC_EMAIL, syncCredentials.email);
    await LocalSystemFact.set(FACT_FACILITY_IDS, JSON.stringify(uniqueFacilityIds));
    // Password encrypted at rest, out of local_system_facts and the raw reporting role.
    await LocalSystemSecret.set(FACT_SYNC_PASSWORD, syncCredentials.password);
    // Deployment-wide settings PSK, pulled from central. Absent when talking to
    // an older central that doesn't serve it yet; a later sync/upgrade fills it.
    if (syncCredentials.settingsPsk) {
      await LocalSystemSecret.setIfAbsent(FACT_SETTINGS_PSK, syncCredentials.settingsPsk);
      // The server keeps running after setup: drop any key buffer cached from the
      // legacy config fallback so reads pick up the pulled PSK without a restart.
      clearSettingsPskCache();
    }
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
