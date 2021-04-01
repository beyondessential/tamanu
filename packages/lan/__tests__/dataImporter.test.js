import { importData } from '~/admin/importDataDefinition';
import { ERRORS } from '~/admin/importerValidators';

const TEST_DATA_PATH = './__tests__/importers/test_definitions.xlsx';

describe('Data definition import', () => {

  let importedData = null;

  beforeAll(async () => {
    importedData = await importData({ file: TEST_DATA_PATH });
  });

  it('should ensure every record has an id', () => {
    importedData.records.map(r => {
      expect(r).toHaveProperty('data.id');
    });
  });

  it('should flag records with missing ids', () => {
    const missingIds = importedData.errors.filter(x => x.error === ERRORS.MISSING_ID);
    expect(missingIds.length).toBeGreaterThan(0);
  });

  it('should flag records with invalid ids', () => {
    const invalidIds = importedData.errors.filter(x => x.error === ERRORS.INVALID_ID);
    expect(invalidIds.length).toBeGreaterThan(0);
  });

  it('should flag records with duplicate ids', () => {
    const duplicateIds = importedData.errors.filter(x => x.error === ERRORS.DUPLICATE_ID);
    expect(duplicateIds.length).toBeGreaterThan(0);
  });

  it('should import a bunch of reference data items', () => {
    const { sheetResults } = importedData;

    expect(sheetResults.villages).toHaveProperty('ok', 10);
    expect(sheetResults.drugs).toHaveProperty('ok', 10);
    expect(sheetResults.allergies).toHaveProperty('ok', 10);
    expect(sheetResults.departments).toHaveProperty('ok', 10);
    expect(sheetResults.locations).toHaveProperty('ok', 10);
    expect(sheetResults.diagnoses).toHaveProperty('ok', 10);
    expect(sheetResults.triageReasons).toHaveProperty('ok', 10);
    expect(sheetResults.procedures).toHaveProperty('ok', 10);

    expect(sheetResults.imagingTypes).toHaveProperty('ok', 3);
  });

  xit('should import user records', () => {
    const { sheetResults } = importedData;

    expect(sheetResults.users).toHaveProperty('ok', 10);
  });

  xit('should import patient records', () => {
    const { sheetResults } = importedData;
    expect(sheetResults.labTestTypes).toHaveProperty('ok', 10);
  });

});
