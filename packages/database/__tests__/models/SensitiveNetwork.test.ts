import { describe, expect, it, beforeAll, beforeEach, afterAll } from 'vitest';

import { fake } from '@tamanu/fake-data/fake';

import { closeDatabase, createTestDatabase } from '../utilities';

// spec: specs/sync/sensitive-networks.md
describe('SensitiveNetwork', () => {
  let models;
  beforeAll(async () => {
    ({ models } = await createTestDatabase());
  });
  beforeEach(async () => {
    // Facilities first: they reference networks.
    await models.Facility.truncate({ cascade: true, force: true });
    await models.SensitiveNetwork.truncate({ cascade: true, force: true });
  });
  afterAll(async () => {
    await closeDatabase();
  });

  const createNetwork = () => models.SensitiveNetwork.create(fake(models.SensitiveNetwork));
  const createFacility = (sensitiveNetworkId = null) =>
    models.Facility.create(fake(models.Facility, { sensitiveNetworkId }));

  describe('membership', () => {
    it('treats a facility as sensitive exactly when it belongs to a network', async () => {
      const network = await createNetwork();
      const member = await createFacility(network.id);
      const ordinary = await createFacility();

      expect(member.sensitiveNetworkId).toBe(network.id);
      expect(ordinary.sensitiveNetworkId).toBeNull();
    });

    it('reads a facility back through its network association', async () => {
      const network = await createNetwork();
      const facility = await createFacility(network.id);

      const reloaded = await models.Facility.findByPk(facility.id, {
        include: 'sensitiveNetwork',
      });
      expect(reloaded.sensitiveNetwork.id).toBe(network.id);
    });
  });

  describe('labels', () => {
    // Networks take the code and name of the facility they were made for, and two facilities can
    // share both. Constraining either here would fail the upgrade partway through on a deployment
    // that has such a pair.
    it('allows two networks to share a code and a name', async () => {
      const existing = await createNetwork();
      const twin = await models.SensitiveNetwork.create(
        fake(models.SensitiveNetwork, { code: existing.code, name: existing.name }),
      );

      expect(twin.id).not.toBe(existing.id);
      expect(twin.code).toBe(existing.code);
      expect(twin.name).toBe(existing.name);
    });
  });
});
