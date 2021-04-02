import { importData } from '~/admin/importDataDefinition';
import { processRecordSet } from '~/admin/processRecordSet';
import { ERRORS } from '~/admin/importerValidators';

const TEST_DATA_PATH = './__tests__/importers/test_definitions.xlsx';

// the importer can take a little while 
jest.setTimeout(30000);

describe('Data definition import', () => {

  let resultInfo = null;
  let recordGroups = null;

  beforeAll(async () => {
    const rawData = await importData({ file: TEST_DATA_PATH });
    const { 
      recordGroups: rg, 
      ...rest 
    } = processRecordSet(rawData);
    resultInfo = rest;
    recordGroups = rg;
  });

  it('should ensure every record has an id', () => {
    for(const [k, records] of recordGroups) {
      records.map(r => {
        expect(r).toHaveProperty('data.id');
      });
    }
  });

  it('should flag records with missing ids', () => {
    const missingIds = resultInfo.errors.filter(x => x.error === ERRORS.MISSING_ID);
    expect(missingIds.length).toBeGreaterThan(0);
  });

  it('should flag records with invalid ids', () => {
    const invalidIds = resultInfo.errors.filter(x => x.error === ERRORS.INVALID_ID);
    expect(invalidIds.length).toBeGreaterThan(0);
  });

  it('should flag records with duplicate ids', () => {
    const duplicateIds = resultInfo.errors.filter(x => x.error === ERRORS.DUPLICATE_ID);
    expect(duplicateIds.length).toBeGreaterThan(0);
  });

  it('should import a bunch of reference data items', () => {
    const { records } = resultInfo.stats;

    expect(records).toHaveProperty('referenceData:village', 10);
    expect(records).toHaveProperty('referenceData:drug', 10);
    expect(records).toHaveProperty('referenceData:allergy', 10);
    expect(records).toHaveProperty('referenceData:department', 10);
    expect(records).toHaveProperty('referenceData:location', 10);
    expect(records).toHaveProperty('referenceData:icd10', 10);
    expect(records).toHaveProperty('referenceData:triageReason', 10);
    expect(records).toHaveProperty('referenceData:procedureType', 10);
    expect(records).toHaveProperty('referenceData:imagingType', 3);
  });

  it('should import user records', () => {
    const { records } = resultInfo.stats;
    expect(records).toHaveProperty('user', 10);
  });

  it('should import patient records', () => {
    const { records } = resultInfo.stats;
    expect(records).toHaveProperty('patient', 10);
  });

});
