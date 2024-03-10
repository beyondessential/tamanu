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
    parent_relation_id: 'country1',
  },
  {
    parent_relation_id: 'country1',
    reference_datum_id: 'division1',
  },
  {
    parent_relation_id: 'country1',
    reference_datum_id: 'division2',
  },
  {
    parent_relation_id: 'division1',
    reference_datum_id: 'subdivision1',
  },
  {
    parent_relation_id: 'division1',
    reference_datum_id: 'subdivision2',
  },
  {
    parent_relation_id: 'subdivision1',
    reference_datum_id: 'village1',
  },
  {
    parent_relation_id: 'subdivision1',
    reference_datum_id: 'village2',
  },
  {
    parent_relation_id: 'subdivision2',
    reference_datum_id: 'village3',
  },
  {
    parent_relation_id: 'subdivision2',
    reference_datum_id: 'village4',
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
      type: REFERENCE_DATA_RELATION_TYPES.ADDRESS_HIERARCHY,
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

  it('should get a hierarchy node with a parent', async () => {
    const { parent } = await models.ReferenceData.getNodeWithParent({ id: 'division1' });
    expect(parent.id).toEqual('country1');
  });

  it('should get ancestors of a given node id', async () => {
    const output = await models.ReferenceData.getAncestorsOfId('village4');
    expect(output.length).toEqual(4);
  });

  it('should get ancestors of a given node type', async () => {
    const output = await models.ReferenceData.getAncestorsOfType('village');
    expect(output.length).toEqual(4);
    expect(output).toEqual(['village', 'subdivision', 'division', 'country']);
  });

  it('should filter ancestors by relation type', async () => {
    const output = await models.ReferenceData.getAncestorsOfId(
      'village4',
      REFERENCE_DATA_RELATION_TYPES.FACILITY_CATCHMENT,
    );
    expect(output.length).toEqual(0);
  });
});
