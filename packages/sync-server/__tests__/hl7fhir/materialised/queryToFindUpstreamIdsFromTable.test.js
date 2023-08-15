/*
If your PR is red because of this test, you likely need to either:
   1. Add an upstream inside your model's `queryToFindUpstreamIdsFromTable`
     (most likely scenario)
   2. Add an exception to `combinationsToIgnore`
     (probably only applicable if your model has multiple UpstreamModels defined)
*/

import util from 'util';
import { FHIR_INTERACTIONS } from '@tamanu/constants';
import { resourcesThatCanDo } from 'shared/utils/fhir/resources';
import { createTestContext } from '../../utilities';

expect.extend({
  async toReturnTruthyUpstreamIdsQueryFor(Resource, upstreamTable, table) {
    const id = 'irrelevant-id';
    if (typeof Resource !== 'function') {
      return {
        pass: false,
        message: () => 'must receive a model',
      };
    }
    if (typeof Resource.queryToFindUpstreamIdsFromTable !== 'function') {
      return {
        pass: false,
        message: () => 'must receive a model with a queryToFindUpstreamIdsFromTable method',
      };
    }
    const result = await Resource.queryToFindUpstreamIdsFromTable(upstreamTable, table, id);
    const printedCall = `${Resource.name}.queryToFindUpstreamIdsFromTable('${upstreamTable}', '${table}', '${id}')`;
    return {
      pass: Boolean(result),
      message: () => `${printedCall} returned ${util.inspect(result)}`,
    };
  },
});

/*
Combinations of tables that intentionally return null and can be ignored.

For example, ServiceRequest has both lab requests and imaging requests as upstream models, but
an imaging request shouldn't query lab tests while materialising.

*/
const combinationsToIgnore = [
  ['lab_requests', 'imaging_requests'],
  ['lab_requests', 'imaging_request_areas'],
  ['lab_requests', 'imaging_area_external_codes'],
  ['lab_requests', 'facilities'],
  ['lab_requests', 'locations'],
  ['lab_requests', 'location_groups'],
  ['lab_requests', 'reference_data'],

  ['imaging_requests', 'lab_requests'],
  ['imaging_requests', 'lab_tests'],
  ['imaging_requests', 'lab_test_types'],
  ['imaging_requests', 'lab_panel_requests'],
  ['imaging_requests', 'lab_panels'],
];

function isIgnored(upstreamTable, table) {
  return combinationsToIgnore.some(c => c[0] === upstreamTable && c[1] === table);
}

describe('queryToFindUpstreamIdsFromTable', () => {
  let ctx;
  let materialisableResources;
  beforeAll(async () => {
    ctx = await createTestContext();
    materialisableResources = resourcesThatCanDo(
      ctx.store.models,
      FHIR_INTERACTIONS.INTERNAL.MATERIALISE,
    );
  });
  afterAll(() => ctx.close());

  describe('queryToFindUpstreamIds', () => {
    it("shouldn't return null for a materialisable resource's upstream(s)", async () => {
      for (const Resource of materialisableResources) {
        for (const DistantUpstreamModel of Resource.upstreams) {
          for (const UpstreamModel of Resource.UpstreamModels) {
            const upstreamTable = UpstreamModel.tableName;
            const table = DistantUpstreamModel.tableName;
            if (!isIgnored(upstreamTable, table)) {
              await expect(Resource).toReturnTruthyUpstreamIdsQueryFor(upstreamTable, table);
            }
          }
        }
      }
    });
  });
});
