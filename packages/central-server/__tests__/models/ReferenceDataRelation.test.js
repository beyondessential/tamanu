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
    childId: 'country1',
  },
  {
    parentId: 'country1',
    childId: 'division1',
  },
  {
    parentId: 'country1',
    childId: 'division2',
  },
  {
    parentId: 'division1',
    childId: 'subdivision1',
  },
  {
    parentId: 'division1',
    childId: 'subdivision2',
  },
  {
    parentId: 'subdivision1',
    childId: 'village1',
  },
  {
    parentId: 'subdivision1',
    childId: 'village2',
  },
  {
    parentId: 'subdivision2',
    childId: 'village3',
  },
  {
    parentId: 'subdivision2',
    childId: 'village4',
  },
];

async function prepopulate(models) {
  const { ReferenceData, ReferenceDataRelation } = models;

  try {
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
  } catch (error) {
    console.log('error', error);
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
    let output;
    try {
      output = await models.ReferenceData.getChildrenByParentId('division1');
    } catch (error) {
      console.log('TEST ERROR', error);
    }
    console.log('output', JSON.stringify(output, null, 4));
    expect(output.length).toEqual(2);
  });

  it('should get descendants by parent id', async () => {
    let output;
    try {
      output = await models.ReferenceData.getDescendantsByParentId('division1');
    } catch (error) {
      console.log('TEST ERROR', error);
    }
    expect(output.id).toEqual('division1');
    expect(output.children.length).toEqual(2);
    expect(output.children[0].children.length).toEqual(2);
    expect(output.children[0].id).toEqual('subdivision1');
    expect(output.children[1].children[1].id).toEqual('village4');
  });

  it.only('should get ancestors by id', async () => {
    let output;
    try {
      output = await models.ReferenceData.getAncestorsById('village4');
    } catch (error) {
      console.log('TEST ERROR', error);
    }
    console.log('output', output);
    expect(output.length).toEqual(3);
  });

  it('should get hierarchy by type', async () => {
    let output;
    try {
      output = await models.ReferenceData.getAddressHierarchyByType('country');
    } catch (error) {
      console.log('TEST ERROR', error);
    }
    console.log('output', JSON.stringify(output, null, 4));
    expect(output.length).toEqual(1);
  });
});
