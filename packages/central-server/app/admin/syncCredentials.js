import crypto from 'node:crypto';
import asyncHandler from 'express-async-handler';
import * as z from 'zod';
import { DEVICE_SCOPES, USER_KINDS, FACT_SETTINGS_PSK } from '@tamanu/constants';
import { ForbiddenError } from '@tamanu/errors';
import { log } from '@tamanu/shared/services/logging';
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

const rotateSyncUserCredentials = async (user, { displayName, password }) => {
  user.set({ displayName, role: 'admin', kind: USER_KINDS.SYNC });
  await user.setPassword(password);
  return user.save();
};

// Provision (or rotate) a dedicated sync user and return its credentials, for a
// facility's setup wizard. Mirrors the sync users the `provision` subcommand
// makes. Gated on manage:all — only a central super-admin may mint these.
export const provisionSyncCredentials = asyncHandler(async (req, res) => {
  req.checkPermission('manage', 'all');

  const { deviceId, facilityIds } = bodySchema.parse(req.body);
  const uniqueFacilityIds = [...new Set(facilityIds.map(id => id.trim()))].sort();

  const { Device, User, LocalSystemSecret } = req.store.models;
  const { sequelize } = req.store;

  const email = syncUserEmail(deviceId);
  // Summarise rather than listing every id so the display name stays short for
  // servers that serve many facilities.
  const displayName =
    uniqueFacilityIds.length > 3
      ? `System: ${uniqueFacilityIds.length} facilities sync`
      : `System: ${uniqueFacilityIds.join(', ')} sync`;
  const password = crypto.randomBytes(24).toString('base64url');

  // One transaction: the password is rotated here, so a half-applied provision would
  // leave the facility unable to log in with either the old or the new credential.
  await sequelize.transaction(async () => {
    const existing = await User.findOne({ where: { email } });
    const syncUser = existing
      ? await rotateSyncUserCredentials(existing, { displayName, password })
      : await User.create({
          email,
          displayName,
          role: 'admin',
          kind: USER_KINDS.SYNC,
          password,
        });

    // The caller's probe login already registered this device under whichever admin
    // it validated, with no scopes. Sync then logs in as the user minted above asking
    // for sync_client, and central refuses a device asking for more than it holds.
    const scopes = [DEVICE_SCOPES.SYNC_CLIENT];
    const device = await Device.findByPk(deviceId);
    if (device) {
      await device.update({ registeredById: syncUser.id, scopes });
    } else {
      await Device.create({ id: deviceId, registeredById: syncUser.id, scopes });
    }
  });

  // Hand the facility the deployment-wide settings PSK so secrets central
  // encrypts into synced settings are decryptable there. Generated here if this
  // is the first server to need it; facilities never mint their own.
  await ensureSettingsPsk(LocalSystemSecret);
  const settingsPsk = await LocalSystemSecret.get(FACT_SETTINGS_PSK);

  // Plaintext credential in the body — keep it out of any intermediary cache.
  res.set('Cache-Control', 'no-store').send({ email, password, settingsPsk });
});

// Returns the deployment-wide settings PSK to a facility server that already has
// sync credentials but no PSK yet (provisioned before the PSK existed). Read-only:
// central mints the PSK on its own upgrade and when provisioning sync credentials,
// so a GET only reads it. If it's somehow absent this returns null and the facility
// retries on its next sync — the GET never writes. Unlike provisionSyncCredentials
// it doesn't rotate the sync password, so a facility can call it repeatedly.
export const getSettingsPsk = asyncHandler(async (req, res) => {
  req.checkPermission('manage', 'all');

  // manage:all alone isn't enough: mobile and facility servers share the sync_client
  // device scope, and the isMobile flag is client-supplied, so a person's admin
  // credentials on any client would otherwise read the deployment key. kind is set by
  // central when it mints the account, which is the only part a caller can't choose.
  if (req.user?.kind !== USER_KINDS.SYNC) {
    throw new ForbiddenError('Only a sync user may read the settings PSK');
  }

  // Raw key material leaves the server here — keep a trace of who took it.
  log.info('Settings PSK read via admin API', { userId: req.user?.id });

  const { LocalSystemSecret } = req.store.models;
  const settingsPsk = await LocalSystemSecret.get(FACT_SETTINGS_PSK);

  res.set('Cache-Control', 'no-store').send({ settingsPsk });
});
