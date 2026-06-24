import crypto from 'node:crypto';
import asyncHandler from 'express-async-handler';
import * as z from 'zod';

const bodySchema = z.object({
  facilityIds: z
    .array(z.string().trim().min(1))
    .min(1)
    .max(100),
});

// Deterministic, fixed-length local part derived from the facility ids, so
// re-running setup rotates the same account and ids like ['a','b'] don't collide
// with ['a-b']. Hashing also bounds the email length regardless of id count.
const syncUserEmail = facilityIds =>
  `sync.${crypto
    .createHash('sha256')
    .update(facilityIds.join('\0'))
    .digest('hex')
    .slice(0, 32)}@sync.tamanu`;

// Provision (or rotate) a dedicated sync user for a facility server and return
// its credentials. Called by a facility server's setup wizard once an admin has
// authenticated. Mirrors the sync users created by the `provision` subcommand:
// a "System: <facilities> sync" user with a generated password.
//
// Gated on manage:all — only a central super-admin may mint sync credentials.
export const provisionSyncCredentials = asyncHandler(async (req, res) => {
  req.checkPermission('manage', 'all');

  const { facilityIds } = bodySchema.parse(req.body);
  const uniqueFacilityIds = [...new Set(facilityIds.map(id => id.trim()))].sort();

  const { User } = req.store.models;

  const email = syncUserEmail(uniqueFacilityIds);
  const displayName = `System: ${uniqueFacilityIds.join(', ')} sync`;
  const password = crypto.randomBytes(24).toString('base64url');

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    existing.set({ displayName, role: 'admin' });
    // setPassword is async (it hashes); must await before save or the unhashed
    // password (a pending Promise) gets persisted.
    await existing.setPassword(password);
    await existing.save();
  } else {
    await User.create({ email, displayName, role: 'admin', password });
  }

  res.send({ email, password });
});
