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

  describe('deletion', () => {
    it('refuses to delete a network that has a member facility', async () => {
      const network = await createNetwork();
      await createFacility(network.id);

      await expect(network.destroy()).rejects.toThrow(/member facilities/);
      expect(await models.SensitiveNetwork.findByPk(network.id)).not.toBeNull();
    });

    it('deletes a network with no members', async () => {
      const network = await createNetwork();

      await network.destroy();

      expect(await models.SensitiveNetwork.findByPk(network.id)).toBeNull();
    });

    // The generic beforeDestroy hook cascades a soft delete to a model's HasMany targets, which is
    // why SensitiveNetwork declares none. If that ever regresses, the refused delete would take the
    // member with it.
    it('leaves member facilities untouched when a delete is refused', async () => {
      const network = await createNetwork();
      const member = await createFacility(network.id);

      await expect(network.destroy()).rejects.toThrow(/member facilities/);

      const reloaded = await models.Facility.findByPk(member.id, { paranoid: false });
      expect(reloaded.deletedAt).toBeNull();
      expect(reloaded.sensitiveNetworkId).toBe(network.id);
    });

    it('refuses a bulk delete covering a network with a member, and takes none of them', async () => {
      const withMember = await createNetwork();
      const empty = await createNetwork();
      await createFacility(withMember.id);

      await expect(
        models.SensitiveNetwork.destroy({
          where: { id: [withMember.id, empty.id] },
        }),
      ).rejects.toThrow(/member facilities/);

      expect(await models.SensitiveNetwork.findByPk(withMember.id)).not.toBeNull();
      expect(await models.SensitiveNetwork.findByPk(empty.id)).not.toBeNull();
    });

    // Restoring the facility would otherwise leave it pointing at a network that no longer exists.
    it('counts a soft-deleted facility as a member', async () => {
      const network = await createNetwork();
      const facility = await createFacility(network.id);
      await facility.destroy();

      await expect(network.destroy()).rejects.toThrow(/member facilities/);
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
