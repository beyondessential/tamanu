import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { fake } from '@tamanu/fake-data/fake';
import { REFERENCE_TYPES, REFERENCE_DATA_RELATION_TYPES } from '@tamanu/constants';

import { labTestCategoryLoader } from '../../app/admin/referenceDataImporter/loaders';
import { createTestContext } from '../utilities';

// The loader reads the optional defaultSpecimenType column on the lab test category sheet and keeps
// the category's default specimen type as an at-most-one ReferenceDataRelation. It destroys stale
// relations itself and returns the relation to upsert; these tests persist the returned rows to
// assert the resulting state.
describe('labTestCategoryLoader', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  afterAll(async () => {
    await ctx.close();
  });

  const HEADER_WITH_COLUMN = ['id', 'code', 'name', 'defaultSpecimenType'];

  const createSpecimenType = () =>
    models.ReferenceData.create({ ...fake(models.ReferenceData), type: REFERENCE_TYPES.SPECIMEN_TYPE });

  const createCategory = () =>
    models.ReferenceData.create({
      ...fake(models.ReferenceData),
      type: REFERENCE_TYPES.LAB_TEST_CATEGORY,
    });

  const getDefault = categoryId =>
    models.ReferenceDataRelation.findOne({
      where: {
        referenceDataParentId: categoryId,
        type: REFERENCE_DATA_RELATION_TYPES.DEFAULT_SPECIMEN_TYPE,
      },
    });

  const persist = async rows => {
    for (const { model, values } of rows) {
      await models[model].create(values);
    }
  };

  it('returns a relation row for a valid default specimen type', async () => {
    const category = await createCategory();
    const specimenType = await createSpecimenType();
    const pushError = vi.fn();

    const rows = await labTestCategoryLoader(
      { id: category.id, defaultSpecimenType: specimenType.id },
      { models, header: HEADER_WITH_COLUMN, pushError },
    );
    await persist(rows);

    expect(pushError).not.toHaveBeenCalled();
    expect((await getDefault(category.id))?.referenceDataId).toBe(specimenType.id);
  });

  it('clears the default when the column is present but empty', async () => {
    const category = await createCategory();
    const specimenType = await createSpecimenType();
    await models.ReferenceDataRelation.create({
      referenceDataParentId: category.id,
      referenceDataId: specimenType.id,
      type: REFERENCE_DATA_RELATION_TYPES.DEFAULT_SPECIMEN_TYPE,
    });

    const rows = await labTestCategoryLoader(
      { id: category.id, defaultSpecimenType: '' },
      { models, header: HEADER_WITH_COLUMN, pushError: vi.fn() },
    );

    expect(rows).toEqual([]);
    expect(await getDefault(category.id)).toBeNull();
  });

  it('replaces an existing default, keeping at most one', async () => {
    const category = await createCategory();
    const first = await createSpecimenType();
    const second = await createSpecimenType();
    await models.ReferenceDataRelation.create({
      referenceDataParentId: category.id,
      referenceDataId: first.id,
      type: REFERENCE_DATA_RELATION_TYPES.DEFAULT_SPECIMEN_TYPE,
    });

    const rows = await labTestCategoryLoader(
      { id: category.id, defaultSpecimenType: second.id },
      { models, header: HEADER_WITH_COLUMN, pushError: vi.fn() },
    );
    await persist(rows);

    expect((await getDefault(category.id))?.referenceDataId).toBe(second.id);
    const count = await models.ReferenceDataRelation.count({
      where: {
        referenceDataParentId: category.id,
        type: REFERENCE_DATA_RELATION_TYPES.DEFAULT_SPECIMEN_TYPE,
      },
    });
    expect(count).toBe(1);
  });

  it('leaves an existing default untouched when the column is absent', async () => {
    const category = await createCategory();
    const specimenType = await createSpecimenType();
    await models.ReferenceDataRelation.create({
      referenceDataParentId: category.id,
      referenceDataId: specimenType.id,
      type: REFERENCE_DATA_RELATION_TYPES.DEFAULT_SPECIMEN_TYPE,
    });

    const rows = await labTestCategoryLoader(
      { id: category.id },
      { models, header: ['id', 'code', 'name'], pushError: vi.fn() },
    );

    expect(rows).toEqual([]);
    expect((await getDefault(category.id))?.referenceDataId).toBe(specimenType.id);
  });

  it('errors when the default specimen type is not a specimen type', async () => {
    const category = await createCategory();
    const notASpecimenType = await models.ReferenceData.create({
      ...fake(models.ReferenceData),
      type: REFERENCE_TYPES.LAB_TEST_CATEGORY,
    });
    const pushError = vi.fn();

    const rows = await labTestCategoryLoader(
      { id: category.id, defaultSpecimenType: notASpecimenType.id },
      { models, header: HEADER_WITH_COLUMN, pushError },
    );

    expect(pushError).toHaveBeenCalled();
    expect(rows).toEqual([]);
    expect(await getDefault(category.id)).toBeNull();
  });
});
