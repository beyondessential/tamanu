import { importDataDefinition } from '~/dataDefinitionImporter';
import { createTestContext } from './utilities';

const TEST_DATA_PATH = './data/test_definitions.xlsx';
const { baseApp, models } = createTestContext();

describe.only("Data definition import", () => {
	
	it("should read a file successfully", async () => {
		const result = await importDataDefinition(TEST_DATA_PATH, models);

		console.log(result);

		const second_result = await importDataDefinition(TEST_DATA_PATH, models);
		console.log(second_result);
	});

});
