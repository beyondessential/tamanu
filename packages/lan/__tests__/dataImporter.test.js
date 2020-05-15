import { importDataDefinition } from '~/dataDefinitionImporter';
import { createTestContext } from './utilities';

const TEST_DATA_PATH = './data/test_definitions.xlsx';
const { models } = createTestContext();

describe('Data definition import', () => {
  it('should read a file successfully', async () => {
    const results = {};
    await importDataDefinition(models, TEST_DATA_PATH, sheetResult => {
      results[sheetResult.type] = sheetResult;
    });

    expect(results.users.created).toEqual(5);
    expect(results.villages.created).toEqual(34);
    expect(results.labtesttypes.errors[0]).toEqual('No such importer: labtesttypes');

    // import it again and make sure it's all idempotent
    const updateResults = {};
    await importDataDefinition(models, TEST_DATA_PATH, sheetResult => {
      updateResults[sheetResult.type] = sheetResult;
    });

    expect(updateResults.users.errors.length).toEqual(5);
    expect(
      updateResults.users.errors.every(x => x.includes('cannot be updated via bulk import')),
    ).toEqual(true);
    expect(updateResults.villages.updated).toEqual(34);
  });
});
