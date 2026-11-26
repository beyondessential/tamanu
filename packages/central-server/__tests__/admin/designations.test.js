import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { REFERENCE_TYPES } from '@tamanu/constants';
import { createTestContext } from '../utilities';

describe('Admin designations', () => {
  let ctx;
  let models;
  let adminApp;

  const idPrefix = `designationSearch${Date.now().toString(36)}`;
  const underscoreId = `${idPrefix}_nurse`;
  const lookalikeId = `${idPrefix}Xnurse`;
  const plainId = `${idPrefix}doctor`;
  const seededIds = [underscoreId, lookalikeId, plainId];

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    adminApp = await ctx.baseApp.asRole('admin');

    await models.ReferenceData.bulkCreate(
      seededIds.map(id => ({ id, code: id, name: id, type: REFERENCE_TYPES.DESIGNATION })),
    );
  });

  afterAll(async () => {
    await models.ReferenceData.destroy({ where: { id: seededIds }, force: true });
    await ctx.close();
  });

  describe('GET /api/admin/designations', () => {
    const searchIds = async id => {
      const response = await adminApp.get('/api/admin/designations').query({ id });
      expect(response).toHaveSucceeded();
      return response.body.data.map(designation => designation.id);
    };

    it('lists the designations whose id contains the search', async () => {
      const ids = await searchIds(idPrefix);
      expect(ids.sort()).toEqual([...seededIds].sort());
    });

    it('matches an underscore in the search literally', async () => {
      const ids = await searchIds(`${idPrefix}_`);
      expect(ids).toEqual([underscoreId]);
    });

    it('returns only ids containing an underscore when searching for one', async () => {
      const ids = await searchIds('_');
      expect(ids).toContain(underscoreId);
      expect(ids.filter(id => !id.includes('_'))).toEqual([]);
    });
  });
});
