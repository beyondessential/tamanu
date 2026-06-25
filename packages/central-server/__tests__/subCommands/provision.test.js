import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { chance, fake } from '@tamanu/fake-data/fake';

import { createTestContext } from '../utilities';
import { provision } from '../../dist/subCommands/provision';

const ADMIN_EMAIL = 'admin@tamanu.io';

async function writeProvisioningFile(payload) {
  const path = join(tmpdir(), `provision-${chance.guid()}.json`);
  await fs.writeFile(path, JSON.stringify(payload));
  return path;
}

describe('provision subCommand', () => {
  let ctx;
  let User;
  let provisioningPath;

  beforeAll(async () => {
    ctx = await createTestContext();
    User = ctx.store.models.User;

    provisioningPath = await writeProvisioningFile({
      users: {
        [ADMIN_EMAIL]: {
          role: 'admin',
          password: 'admin',
          displayName: 'Initial Admin',
        },
      },
    });
  });

  afterAll(async () => {
    await fs.rm(provisioningPath, { force: true });
    await ctx.close();
  });

  beforeEach(async () => {
    await User.destroy({ where: { email: ADMIN_EMAIL }, force: true });
  });

  // The seed-snapshot pipeline lands a DB populated by fake-data's populateDb,
  // which creates random clinician users but never the provisioning admin.
  // Provisioning must still run in that state.
  it('runs on a DB with fake users but no provisioned admin', async () => {
    await User.create(fake(User, { email: chance.email() }));
    expect(await User.count({ where: { email: ADMIN_EMAIL } })).toBe(0);

    await provision(provisioningPath, { skipIfNotNeeded: true });

    expect(await User.count({ where: { email: ADMIN_EMAIL } })).toBe(1);
  });

  it('skips when the provisioned admin user already exists (skipIfNotNeeded)', async () => {
    const initial = await User.create(fake(User, { email: ADMIN_EMAIL }));

    await provision(provisioningPath, { skipIfNotNeeded: true });

    const after = await User.findOne({ where: { email: ADMIN_EMAIL } });
    expect(after.id).toBe(initial.id);
    expect(await User.count({ where: { email: ADMIN_EMAIL } })).toBe(1);
  });

  it('throws when the provisioned admin already exists and skipIfNotNeeded is false', async () => {
    await User.create(fake(User, { email: ADMIN_EMAIL }));

    await expect(
      provision(provisioningPath, { skipIfNotNeeded: false }),
    ).rejects.toThrow(/already in the database/);
  });
});
