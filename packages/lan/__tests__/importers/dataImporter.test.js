import { importData } from '../../app/admin/importDataDefinition';
import { preprocessRecordSet } from '../../app/admin/preprocessRecordSet';
import { sendRecordGroups } from '../../app/admin/createDataImporterEndpoint';
import { createTestContext } from '../utilities';
import { WebRemote } from '../../app/sync/WebRemote';

jest.mock('../../app/sync/WebRemote');

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

      const response = await nonAdminApp.post('/v1/admin/importData');
      expect(response).toBeForbidden();
    });
  });
});

describe('sendRecordGroups', () => {
  const fetchMock = jest
    .spyOn(WebRemote.prototype, 'fetch')
    .mockImplementation(() => Promise.resolve({ error: null }));

  it('splits recordGroups by channel and sends them', async () => {
    // arrange
    const recordGroups = [
      // test reference data channel override
      ['referenceData', [{ id: 'ref123' }]],
      // test channel grouping
      [
        'encounter',
        [
          { channel: 'patient/pat123/encounter', id: 'enc123' },
          { channel: 'patient/pat123/encounter', id: 'enc456' },
          { channel: 'patient/pat456/encounter', id: 'enc789' },
        ],
      ],
      // test records without a channel
      ['patient', [{ id: 'pat123' }]],
      // test chunking
      ['user', [{ id: 'u1' }, { id: 'u2' }, { id: 'u3' }, { id: 'u4' }]],
    ];

    // act
    await sendRecordGroups(recordGroups);

    // assert
    [
      ['reference', ['ref123']],
      ['patient/pat123/encounter', ['enc123', 'enc456']],
      ['patient/pat456/encounter', ['enc789']],
      ['patient', ['pat123']],
      ['user', ['u1', 'u2', 'u3']],
      ['user', ['u4']],
    ].forEach(([channel, ids]) => {
      expect(fetchMock).toHaveBeenCalledWith(
        `sync/${encodeURIComponent(channel)}`,
        expect.objectContaining({
          method: 'POST',
          body: expect.arrayContaining(ids.map(id => expect.objectContaining({ id }))),
        }),
      );
    });
  });
});
