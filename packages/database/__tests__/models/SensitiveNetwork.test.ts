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

  describe('uniqueness', () => {
    it('refuses a second network with the same code', async () => {
      const existing = await createNetwork();
      await expect(
        models.SensitiveNetwork.create(fake(models.SensitiveNetwork, { code: existing.code })),
      ).rejects.toThrow();
    });

    it('refuses a second network with the same name', async () => {
      const existing = await createNetwork();
      await expect(
        models.SensitiveNetwork.create(fake(models.SensitiveNetwork, { name: existing.name })),
      ).rejects.toThrow();
    });
  });
});
