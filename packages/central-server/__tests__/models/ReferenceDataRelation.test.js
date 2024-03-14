import { createTestContext } from '../utilities';
import { fakeReferenceData } from '@tamanu/shared/test-helpers/fake';
import { fakeUUID } from '@tamanu/shared/utils';
import { REFERENCE_DATA_RELATION_TYPES } from '@tamanu/constants';

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
    referenceDataParentId: 'country1',
  },
  {
    referenceDataParentId: 'country1',
    referenceDataId: 'division1',
  },
  {
    referenceDataParentId: 'country1',
    referenceDataId: 'division2',
  },
  {
    referenceDataParentId: 'division1',
    referenceDataId: 'subdivision1',
  },
  {
    referenceDataParentId: 'division1',
    referenceDataId: 'subdivision2',
  },
  {
    referenceDataParentId: 'country1',
    referenceDataId: 'subdivision2',
    type: REFERENCE_DATA_RELATION_TYPES.FACILITY_CATCHMENT,
  },
  {
    referenceDataParentId: 'subdivision1',
    referenceDataId: 'village1',
  },
  {
    referenceDataParentId: 'subdivision1',
    referenceDataId: 'village2',
  },
  {
    referenceDataParentId: 'subdivision2',
    referenceDataId: 'village3',
  },
  {
    referenceDataParentId: 'subdivision2',
    referenceDataId: 'village4',
  },
];

async function prepopulate(models) {
  const { ReferenceData, ReferenceDataRelation } = models;

  await ReferenceData.bulkCreate(
    referenceData.map(refRecord => ({
      ...fakeReferenceData(),
      ...refRecord,
    })),
  );

  await ReferenceDataRelation.bulkCreate(
    relationData.map(relData => ({
      id: fakeUUID(),
      type: REFERENCE_DATA_RELATION_TYPES.ADDRESS_HIERARCHY,
      ...relData,
    })),
  );
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

  it('should get a hierarchy node with a parent', async () => {
    const parent = await models.ReferenceData.getParent('division1');
    expect(parent.id).toEqual('country1');
  });

  it('should get ancestors of a given node id', async () => {
    const entity = await models.ReferenceData.findByPk('village4');
    const ancestors = await entity.getAncestors();
    expect(ancestors.length).toEqual(4);
  });

  it('should filter ancestors by relation type', async () => {
    const entity = await models.ReferenceData.findByPk('village4');
    const ancestors = await entity.getAncestors(REFERENCE_DATA_RELATION_TYPES.FACILITY_CATCHMENT);
    expect(ancestors.length).toEqual(0);
  });
});
