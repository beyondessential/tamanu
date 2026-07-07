import crypto from 'node:crypto';
import asyncHandler from 'express-async-handler';
import * as z from 'zod';
import { USER_KINDS, FACT_SETTINGS_PSK } from '@tamanu/constants';
import { ensureSettingsPsk } from '@tamanu/shared/utils/crypto';

const bodySchema = z.object({
  deviceId: z.string().trim().min(1),
  facilityIds: z.array(z.string().trim().min(1)).min(1).max(100),
});

// Hash the device id so the email is deterministic (re-running from the same
// server rotates the same account), fixed-length, and email-safe. Keyed on the
// device rather than the facility set so two servers serving the same
// facilities can't overwrite each other's credentials.
const syncUserEmail = deviceId =>
  `sync.${crypto.createHash('sha256').update(deviceId).digest('hex').slice(0, 32)}@sync.tamanu`;

// Provision (or rotate) a dedicated sync user and return its credentials, for a
// facility's setup wizard. Mirrors the sync users the `provision` subcommand
// makes. Gated on manage:all — only a central super-admin may mint these.
export const provisionSyncCredentials = asyncHandler(async (req, res) => {
  req.checkPermission('manage', 'all');

  const { deviceId, facilityIds } = bodySchema.parse(req.body);
  const uniqueFacilityIds = [...new Set(facilityIds.map(id => id.trim()))].sort();

  const { User, LocalSystemSecret } = req.store.models;

  const email = syncUserEmail(deviceId);
  // Summarise rather than listing every id so the display name stays short for
  // servers that serve many facilities.
  const displayName =
    uniqueFacilityIds.length > 3
      ? `System: ${uniqueFacilityIds.length} facilities sync`
      : `System: ${uniqueFacilityIds.join(', ')} sync`;
  const password = crypto.randomBytes(24).toString('base64url');

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    existing.set({ displayName, role: 'admin', kind: USER_KINDS.SYNC });
    await existing.setPassword(password);
    await existing.save();
  } else {
    await User.create({ email, displayName, role: 'admin', kind: USER_KINDS.SYNC, password });
  }

  // Hand the facility the deployment-wide settings PSK so secrets central
  // encrypts into synced settings are decryptable there. Generated here if this
  // is the first server to need it; facilities never mint their own.
  await ensureSettingsPsk(LocalSystemSecret);
  const settingsPsk = await LocalSystemSecret.get(FACT_SETTINGS_PSK);

  // Plaintext credential in the body — keep it out of any intermediary cache.
  res.set('Cache-Control', 'no-store').send({ email, password, settingsPsk });
});

// Returns the deployment-wide settings PSK to an authed facility that already has
// sync credentials but no PSK yet (provisioned before the PSK existed). Read-only:
// central mints the PSK on its own upgrade and when provisioning sync credentials,
// so a GET only reads it. If it's somehow absent this returns null and the facility
// retries on its next upgrade — the GET never writes. Unlike provisionSyncCredentials
// it doesn't rotate the sync password, so a facility can call it repeatedly.
export const getSettingsPsk = asyncHandler(async (req, res) => {
  req.checkPermission('manage', 'all');

  const { LocalSystemSecret } = req.store.models;
  const settingsPsk = await LocalSystemSecret.get(FACT_SETTINGS_PSK);

  res.set('Cache-Control', 'no-store').send({ settingsPsk });
});
