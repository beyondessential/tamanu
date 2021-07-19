import { importData } from '~/admin/importDataDefinition';
import { preprocessRecordSet } from '~/admin/preprocessRecordSet';

const TEST_DATA_PATH = './__tests__/importers/test_definitions.xlsx';

// the importer can take a little while
jest.setTimeout(30000);

describe('Data definition import', () => {
  let resultInfo = null;
  let recordGroups = null;

  beforeAll(async () => {
    const rawData = await importData({ file: TEST_DATA_PATH });
    const { recordGroups: rg, ...rest } = await preprocessRecordSet(rawData);
    resultInfo = rest;
    recordGroups = rg;
  });

  it('should ensure every record has an id', () => {
    for (const [, records] of recordGroups) {
      records.forEach(r => {
        expect(r).toHaveProperty('data.id');
      });
    }
  });

  const expectError = (recordType, text) => {
    const hasError = record => record.errors.some(e => e.includes(text));
    const condition = record => record.recordType === recordType && hasError(record);
    expect(resultInfo.errors.some(condition)).toEqual(true);
  };

  it('should flag records with missing ids', () => {
    expectError('referenceData', 'id is a required field');
  });

  it('should flag records with invalid ids', () => {
    expectError('referenceData', 'id must not have spaces or punctuation');
  });

  it('should flag records with invalid codes', () => {
    expectError('referenceData', 'code must not have spaces or punctuation');
  });

  it('should flag records with duplicate ids', () => {
    expectError('referenceData', 'is already being used at');
  });

  it('should import a bunch of reference data items', () => {
    const { records } = resultInfo.stats;

    expect(records).toHaveProperty('referenceData:village', 10);
    expect(records).toHaveProperty('referenceData:drug', 10);
    expect(records).toHaveProperty('referenceData:allergy', 10);
    expect(records).toHaveProperty('referenceData:icd10', 10);
    expect(records).toHaveProperty('referenceData:triageReason', 10);
    expect(records).toHaveProperty('referenceData:procedureType', 10);
    expect(records).toHaveProperty('referenceData:imagingType', 4);
  });

  it('should import user records', () => {
    const { records } = resultInfo.stats;
    expect(records).toHaveProperty('user', 10);
  });

  it('should import facility records', () => {
    const { records } = resultInfo.stats;
    expect(records).toHaveProperty('facility', 10);
  });

  it('should import department records', () => {
    const { records } = resultInfo.stats;
    expect(records).toHaveProperty('department', 10);
  });

  it('should import location records', () => {
    const { records } = resultInfo.stats;
    expect(records).toHaveProperty('location', 10);
  });

  it('should import patient records', () => {
    const { records } = resultInfo.stats;
    expect(records).toHaveProperty('patient', 10);
  });

  it('should import lab test type records', () => {
    const { records } = resultInfo.stats;
    expect(records).toHaveProperty('labTestType', 10);
  });

  it('should report an error if an FK search comes up empty', () => {
    expectError('patient', 'could not find a referenceData called "village-nowhere"');
  });

  it('should report an error if an FK is of the wrong type', () => {
    expectError('patient', 'linked referenceData for');
  });
});
