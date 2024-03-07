import { createTestContext } from '../utilities';
import { fakeReferenceData } from '@tamanu/shared/test-helpers/fake';
import { fakeUUID } from '@tamanu/shared/utils';

const referenceData = [
  { id: 'country1', type: 'country' },
  { id: 'division1', type: 'division' },
  { id: 'division2', type: 'division' },
  { id: 'subdivision1', type: 'subdivision' },
  { id: 'subdivision2', type: 'subdivision' },
  { id: 'village1', type: 'village' },
  { id: 'village2', type: 'village' },
  { id: 'village3', type: 'village' },
  { id: 'village4', type: 'village' },
  { id: 'diagnosis1' },
  { id: 'diagnosis2' },
];

const relationData = [
  {
    refDataId: 'country1',
  },
  {
    refDataParentId: 'country1',
    refDataId: 'division1',
  },
  {
    refDataParentId: 'country1',
    refDataId: 'division2',
  },
  {
    refDataParentId: 'division1',
    refDataId: 'subdivision1',
  },
  {
    refDataParentId: 'division1',
    refDataId: 'subdivision2',
  },
  {
    refDataParentId: 'subdivision1',
    refDataId: 'village1',
  },
  {
    refDataParentId: 'subdivision1',
    refDataId: 'village2',
  },
  {
    refDataParentId: 'subdivision2',
    refDataId: 'village3',
  },
  {
    refDataParentId: 'subdivision2',
    refDataId: 'village4',
  },
];

async function prepopulate(models) {
  const { ReferenceData, ReferenceDataRelation } = models;

  for (const refRecord of referenceData) {
    await ReferenceData.create({
      ...fakeReferenceData(),
      ...refRecord,
    });
  }

  for (const relRecord of relationData) {
    await ReferenceDataRelation.create({
      id: fakeUUID(),
      type: 'ADDRESS_HIERARCHY',
      ...relRecord,
    });
  }
}

describe('Reference Data Hierarchy', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    await prepopulate(models);
  });
  afterAll(() => ctx.close());

  it('should get children by parent id', async () => {
    const output = await models.ReferenceData.getChildrenByParentId('division1');
    expect(output.length).toEqual(2);
  });

  it('should get descendants by parent id', async () => {
    const output = await models.ReferenceData.getDescendantsByParentId('division1');
    expect(output.id).toEqual('division1');
    expect(output.children.length).toEqual(2);
    expect(output.children[0].children.length).toEqual(2);
    expect(output.children[0].id).toEqual('subdivision1');
    expect(output.children[1].children[1].id).toEqual('village4');
  });

  it('should get ancestors by id', async () => {
    const output = await models.ReferenceData.getAncestorsById('village4');
    expect(output.length).toEqual(4);
  });

  it('should get ancestors by type', async () => {
    const output = await models.ReferenceData.getAncestorByType('village');
    expect(output.length).toEqual(4);
    expect(output).toEqual(['village', 'subdivision', 'division', 'country']);
  });

  it('should get hierarchy by type', async () => {
    const output = await models.ReferenceData.getAddressHierarchyByType('country');
    expect(output.length).toEqual(1);
  });
});
