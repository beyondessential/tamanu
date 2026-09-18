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

    it('deletes a network left empty by its only member moving elsewhere', async () => {
      const emptied = await createNetwork();
      const destination = await createNetwork();
      const facility = await createFacility(emptied.id);

      await facility.update({ sensitiveNetworkId: destination.id });
      await emptied.destroy();

      expect(await models.SensitiveNetwork.findByPk(emptied.id)).toBeNull();
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
