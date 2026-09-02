import { describe, expect, it, beforeAll, beforeEach, afterAll } from 'vitest';

import { fake } from '@tamanu/fake-data/fake';

import { SENSITIVE_NETWORK_IS_FIXED_MESSAGE } from '../../src/models/Facility';
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

  describe('membership does not change', () => {
    it('allows a facility to be created already enrolled in a network', async () => {
      const network = await createNetwork();
      const facility = await createFacility(network.id);

      expect(facility.sensitiveNetworkId).toBe(network.id);
    });

    it('refuses enrolling an existing facility that belongs to no network', async () => {
      const network = await createNetwork();
      const facility = await createFacility();

      await expect(facility.update({ sensitiveNetworkId: network.id })).rejects.toThrow(
        SENSITIVE_NETWORK_IS_FIXED_MESSAGE,
      );

      await facility.reload();
      expect(facility.sensitiveNetworkId).toBeNull();
    });

    it('refuses removing a facility from its network', async () => {
      const network = await createNetwork();
      const facility = await createFacility(network.id);

      await expect(facility.update({ sensitiveNetworkId: null })).rejects.toThrow(
        SENSITIVE_NETWORK_IS_FIXED_MESSAGE,
      );

      await facility.reload();
      expect(facility.sensitiveNetworkId).toBe(network.id);
    });

    it('refuses moving a facility to a different network', async () => {
      const from = await createNetwork();
      const to = await createNetwork();
      const facility = await createFacility(from.id);

      await expect(facility.update({ sensitiveNetworkId: to.id })).rejects.toThrow(
        SENSITIVE_NETWORK_IS_FIXED_MESSAGE,
      );

      await facility.reload();
      expect(facility.sensitiveNetworkId).toBe(from.id);
    });

    it('refuses moving a facility that is the sole member of its network', async () => {
      const from = await createNetwork();
      const to = await createNetwork();
      const facility = await createFacility(from.id);

      const members = await models.Facility.count({ where: { sensitiveNetworkId: from.id } });
      expect(members).toBe(1);

      await expect(facility.update({ sensitiveNetworkId: to.id })).rejects.toThrow(
        SENSITIVE_NETWORK_IS_FIXED_MESSAGE,
      );
    });

    it('refuses enrolling a facility that was deleted while belonging to no network', async () => {
      const network = await createNetwork();
      const facility = await createFacility();
      await facility.destroy();

      await facility.restore();
      await expect(facility.update({ sensitiveNetworkId: network.id })).rejects.toThrow(
        SENSITIVE_NETWORK_IS_FIXED_MESSAGE,
      );
    });

    it('names the facility in the refusal', async () => {
      const network = await createNetwork();
      const facility = await createFacility();

      await expect(facility.update({ sensitiveNetworkId: network.id })).rejects.toThrow(
        facility.code,
      );
    });

    it('leaves other facility fields writable on a networked facility', async () => {
      const network = await createNetwork();
      const facility = await createFacility(network.id);

      await facility.update({ name: 'Renamed facility' });

      await facility.reload();
      expect(facility.name).toBe('Renamed facility');
      expect(facility.sensitiveNetworkId).toBe(network.id);
    });

    it('treats rewriting the same network as no change', async () => {
      const network = await createNetwork();
      const facility = await createFacility(network.id);

      await facility.update({ sensitiveNetworkId: network.id, name: 'Still here' });

      await facility.reload();
      expect(facility.sensitiveNetworkId).toBe(network.id);
      expect(facility.name).toBe('Still here');
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
