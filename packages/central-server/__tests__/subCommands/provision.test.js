import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { chance, fake } from '@tamanu/fake-data/fake';

import { createTestContext } from '../utilities';
import {
  DEFAULT_PROVISIONING_DATA_DIRECTORY,
  parseDefaultProvisioningJsonSheets,
  provision,
  validateFullReferenceDataImport,
} from '../../app/subCommands/provision';

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

    await expect(provision(provisioningPath, { skipIfNotNeeded: false })).rejects.toThrow(
      /already in the database/,
    );
  });

  // Provisioning and the reference data import are the only things that write a facility, so the
  // fixed-membership rule lives on both.
  // spec: specs/sync/sensitive-networks.md
  describe('facility sensitive network', () => {
    const paths = [];

    afterAll(async () => {
      await Promise.all(paths.map(path => fs.rm(path, { force: true })));
    });

    const provisionFacility = async facilities => {
      const path = await writeProvisioningFile({
        users: { [ADMIN_EMAIL]: { role: 'admin', password: 'admin', displayName: 'Admin' } },
        facilities,
      });
      paths.push(path);
      return provision(path, { skipIfNotNeeded: false });
    };

    const seed = async sensitiveNetworkId => {
      const { Facility, SensitiveNetwork } = ctx.store.models;
      const network = await SensitiveNetwork.create(fake(SensitiveNetwork));
      const other = await SensitiveNetwork.create(fake(SensitiveNetwork));
      const facility = await Facility.create(
        fake(Facility, { sensitiveNetworkId: sensitiveNetworkId ? network.id : null }),
      );
      return { facility, network, other };
    };

    it('refuses to move an existing facility to a different network', async () => {
      const { facility, network, other } = await seed(true);

      await expect(
        provisionFacility({ [facility.id]: { sensitiveNetworkId: other.id } }),
      ).rejects.toThrow(/cannot change sensitive network/);

      await facility.reload();
      expect(facility.sensitiveNetworkId).toBe(network.id);
    });

    it('refuses to enrol an existing facility that belongs to no network', async () => {
      const { facility, network } = await seed(false);

      await expect(
        provisionFacility({ [facility.id]: { sensitiveNetworkId: network.id } }),
      ).rejects.toThrow(/cannot change sensitive network/);

      await facility.reload();
      expect(facility.sensitiveNetworkId).toBeNull();
    });

    it('leaves membership alone when the facility names no network', async () => {
      const { facility, network } = await seed(true);

      await provisionFacility({ [facility.id]: { name: 'Renamed facility' } });

      await facility.reload();
      expect(facility.name).toBe('Renamed facility');
      expect(facility.sensitiveNetworkId).toBe(network.id);
    });
  });

  // provision validates the default spreadsheet for completeness before importing it, and a
  // general importable data type with neither a sheet here nor an entry in
  // EXCLUDED_FROM_FULL_IMPORT_CHECK makes it throw — failing the central-provisioner deploy job,
  // so central-api never starts. Asserted against the parsed workbook rather than by provisioning,
  // which imports every sheet and takes minutes.
  describe('default provisioning data completeness', () => {
    it('passes the completeness check with no Sensitive Network sheet present', () => {
      const workbook = parseDefaultProvisioningJsonSheets(DEFAULT_PROVISIONING_DATA_DIRECTORY);

      // the exclusion is what carries this, not a sheet nobody noticed was added
      const sheetNames = Object.keys(workbook.Sheets).map(name =>
        name.toLowerCase().replace(/[^a-z]/g, ''),
      );
      expect(sheetNames).not.toContain('sensitivenetwork');

      expect(() => validateFullReferenceDataImport(workbook)).not.toThrow();
    });
  });
});
