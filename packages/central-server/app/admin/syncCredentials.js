import crypto from 'node:crypto';
import asyncHandler from 'express-async-handler';
import * as z from 'zod';

const bodySchema = z.object({
  facilityIds: z.array(z.string().trim().min(1)).min(1),
});

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

  // Deterministic per-server email so re-running setup rotates the same account
  // rather than accumulating sync users.
  const email = `sync.${uniqueFacilityIds.join('-')}@sync.tamanu`;
  const displayName = `System: ${uniqueFacilityIds.join(', ')} sync`;
  const password = crypto.randomBytes(24).toString('base64url');

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    existing.set({ displayName, role: 'admin' });
    existing.setPassword(password);
    await existing.save();
  } else {
    await User.create({ email, displayName, role: 'admin', password });
  }

  res.send({ email, password });
});
