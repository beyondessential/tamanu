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
    // Facilities first: a network with members refuses to go.
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

  describe('deletion', () => {
    it('refuses to delete a network that has a member facility', async () => {
      const network = await createNetwork();
      await createFacility(network.id);

      await expect(network.destroy()).rejects.toThrow(
        'A sensitive network cannot be deleted while facilities belong to it',
      );
      expect(await models.SensitiveNetwork.findByPk(network.id)).not.toBeNull();
    });

    it('leaves member facilities untouched when a delete is refused', async () => {
      const network = await createNetwork();
      const facility = await createFacility(network.id);

      await expect(network.destroy()).rejects.toThrow();

      // The generic beforeDestroy hook cascades to HasMany/HasOne targets, so a network that
      // declared facilities as its children would soft-delete them here instead of refusing.
      const reloaded = await models.Facility.findByPk(facility.id);
      expect(reloaded).not.toBeNull();
      expect(reloaded.deletedAt).toBeNull();
      expect(reloaded.sensitiveNetworkId).toBe(network.id);
    });

    it('refuses a bulk delete that would take a network with a member facility', async () => {
      const empty = await createNetwork();
      const withMember = await createNetwork();
      await createFacility(withMember.id);

      await expect(models.SensitiveNetwork.destroy({ where: {} })).rejects.toThrow(
        'A sensitive network cannot be deleted while facilities belong to it',
      );
      expect(await models.SensitiveNetwork.findByPk(empty.id)).not.toBeNull();
    });

    it('deletes a network with no members', async () => {
      const network = await createNetwork();

      await network.destroy();

      expect(await models.SensitiveNetwork.findByPk(network.id)).toBeNull();
    });

    it('deletes a network left empty by its only member moving elsewhere', async () => {
      const original = await createNetwork();
      const destination = await createNetwork();
      const facility = await createFacility(original.id);

      await facility.update({ sensitiveNetworkId: destination.id });
      await original.destroy();

      expect(await models.SensitiveNetwork.findByPk(original.id)).toBeNull();
    });

    it('counts a soft-deleted facility as a member, since restoring it would dangle', async () => {
      const network = await createNetwork();
      const facility = await createFacility(network.id);
      await facility.destroy();

      await expect(network.destroy()).rejects.toThrow(
        'A sensitive network cannot be deleted while facilities belong to it',
      );
    });
  });
});
