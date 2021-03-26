import { importData } from '~/admin/importDataDefinition';

const TEST_DATA_PATH = './data/test_definitions.xlsx';

describe('Data definition import', () => {

  it('should read a file successfully', async () => {
    const { records, sheetResults } = await importData({ file: TEST_DATA_PATH });

    expect(records.every(r => r.data.id));

    expect(sheetResults.villages).toHaveProperty('count', 34);
    expect(sheetResults.drugs).toHaveProperty('count', 19);
    expect(sheetResults.allergies).toHaveProperty('count', 15);
    expect(sheetResults.departments).toHaveProperty('count', 12);
    expect(sheetResults.locations).toHaveProperty('count', 8);
    expect(sheetResults.diagnoses).toHaveProperty('count', 29);
    expect(sheetResults.triageReasons).toHaveProperty('count', 18);
    expect(sheetResults.imagingTypes).toHaveProperty('count', 3);
    expect(sheetResults.procedures).toHaveProperty('count', 18);

    // expect(sheetResults.users).toHaveProperty('count', 10);
    // expect(sheetResults.labTestTypes).toHaveProperty('count', 10);
  });
});
