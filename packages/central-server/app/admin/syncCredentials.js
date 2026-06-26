import crypto from 'node:crypto';
import asyncHandler from 'express-async-handler';
import * as z from 'zod';

const bodySchema = z.object({
  facilityIds: z
    .array(z.string().trim().min(1))
    .min(1)
    .max(100),
});

// Hash the ids so the email is deterministic (re-running rotates the same
// account), fixed-length, and collision-free (['a','b'] vs ['a-b']).
const syncUserEmail = facilityIds =>
  `sync.${crypto
    .createHash('sha256')
    .update(facilityIds.join('\0'))
    .digest('hex')
    .slice(0, 32)}@sync.tamanu`;

// Provision (or rotate) a dedicated sync user and return its credentials, for a
// facility's setup wizard. Mirrors the sync users the `provision` subcommand
// makes. Gated on manage:all — only a central super-admin may mint these.
export const provisionSyncCredentials = asyncHandler(async (req, res) => {
  req.checkPermission('manage', 'all');

  const { facilityIds } = bodySchema.parse(req.body);
  const uniqueFacilityIds = [...new Set(facilityIds.map(id => id.trim()))].sort();

  const { User } = req.store.models;

  const email = syncUserEmail(uniqueFacilityIds);
  // Summarise rather than listing every id so the display name stays short for
  // servers that serve many facilities.
  const displayName =
    uniqueFacilityIds.length > 3
      ? `System: ${uniqueFacilityIds.length} facilities sync`
      : `System: ${uniqueFacilityIds.join(', ')} sync`;
  const password = crypto.randomBytes(24).toString('base64url');

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    existing.set({ displayName, role: 'admin' });
    // setPassword is async (it hashes) — must await before save.
    await existing.setPassword(password);
    await existing.save();
  } else {
    await User.create({ email, displayName, role: 'admin', password });
  }

  // Plaintext credential in the body — keep it out of any intermediary cache.
  res.set('Cache-Control', 'no-store').send({ email, password });
});
