import { importers } from '../../app/admin/refdataImporter';
import { createTestContext } from '../utilities';

const TEST_DATA_PATH = './__tests__/importers/test_definitions.xlsx';

// the importer can take a little while
jest.setTimeout(30000);

describe('Data definition import', () => {
  let resultInfo = null;
  let recordGroups = null;

  beforeAll(async () => {
    const rawData = await importers({ file: TEST_DATA_PATH });
    // const { recordGroups: rg, ...rest } = await preprocessRecordSet(rawData);
    // resultInfo = rest;
    // recordGroups = rg;
  });

  it('should ensure every record has an id', () => {
    for (const [, records] of recordGroups) {
      records.forEach(r => {
        expect(r).toHaveProperty('data.id');
      });
    }
  });

  const findFirstError = (recordType, text) => {
    const hasError = record => record.errors.some(e => e.includes(text));
    const condition = record => record.recordType === recordType && hasError(record);
    return resultInfo.errors.find(condition);
  };

  const expectError = (recordType, text) => {
    expect(findFirstError(recordType, text)).toBeTruthy();
  };

  it('should flag records with missing ids', () => {
    expectError('referenceData', 'record has no id');
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

    expect(records).toHaveProperty('referenceData:village', 13);
    expect(records).toHaveProperty('referenceData:drug', 10);
    expect(records).toHaveProperty('referenceData:allergy', 10);
    expect(records).toHaveProperty('referenceData:icd10', 10);
    expect(records).toHaveProperty('referenceData:triageReason', 10);
    expect(records).toHaveProperty('referenceData:procedureType', 10);
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

  it('should import scheduled vaccine records', () => {
    const { records } = resultInfo.stats;
    expect(records).toHaveProperty('scheduledVaccine', 1);
  });

  it('should import administered vaccine records', () => {
    const { records } = resultInfo.stats;
    expect(records).toHaveProperty('encounter:administeredVaccine', 2);
  });

  it('should report an error if an FK search comes up empty', () => {
    expectError(
      'patient',
      'could not find a record of type referenceData called "village-nowhere"',
    );
  });

  it('should report an error if an FK is of the wrong type', () => {
    expectError(
      'patient',
      'could not find a record of type referenceData called "2ecb58ca-8b2b-42e8-9c18-fd06c09653e1"',
    );
  });

  describe('Visibility status', () => {
    // All the record types work the same, just testing against Village 
    let villageRecords;
    beforeAll(() => {
      villageRecords = recordGroups
        .find(([t]) => t === 'referenceData')[1]
        .filter(x => x.sheet === 'villages')
        .reduce((state, current) => ({ ...state, [current.data.id]: current }), {});
    });

    it('Should import visibility status', () => {
      expect(villageRecords['village-historical']).toHaveProperty('data.visibilityStatus', 'historical');
      expect(villageRecords['village-visible']).toHaveProperty('data.visibilityStatus', 'current');
    });

    it('Should default to visible', () => {
      expect(villageRecords['village-default-visible']).toHaveProperty('data.visibilityStatus', 'current');
    });

    it('Should only accept valid values', () => {
      const error = findFirstError('referenceData', `visibilityStatus must be`);
      expect(error.data).toHaveProperty('id', 'village-invalid-visibility');
    });

  });

  describe('Importer permissions', () => {
    let ctx;
    beforeAll(async () => {
      ctx = await createTestContext();
    });
    afterAll(() => ctx.close());

    it('Should forbid an import by a non-admin', async () => {
      const { baseApp } = ctx;
      const nonAdminApp = await baseApp.asRole('practitioner');

      const response = await nonAdminApp.post('/v1/admin/importers');
      expect(response).toBeForbidden();
    });
  });
});