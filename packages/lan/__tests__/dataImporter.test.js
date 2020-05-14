import { importDataDefinition } from '~/dataDefinitionImporter';
import { createTestContext } from './utilities';

const TEST_DATA_PATH = './data/test_definitions.xlsx';
const { baseApp, models } = createTestContext();

describe.only("Data definition import", () => {
  
  it("should read a file successfully", async () => {
    const result = await importDataDefinition(models, TEST_DATA_PATH);

    console.log(result);

    // import it again and make sure it's all idempotent
    const second_result = await importDataDefinition(models, TEST_DATA_PATH);
    console.log(second_result);
  });

});
