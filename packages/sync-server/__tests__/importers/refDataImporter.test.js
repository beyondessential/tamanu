import importer from '../../app/admin/refdataImporter';
import { createTestContext } from '../utilities';

// the importer can take a little while
jest.setTimeout(30000);

// const findFirstError = (recordType, text) => {
//   const hasError = record => record.errors.some(e => e.includes(text));
//   const condition = record => record.recordType === recordType && hasError(record);
//   return resultInfo.errors.find(condition);
// };

// const expectError = (recordType, text) => {
//   expect(findFirstError(recordType, text)).toBeTruthy();
// };

describe('Data definition import', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
  });
  afterAll(async () => {
    await ctx.close();
  });
  
  function doImport(options) {
    const { file, ...opts } = options;
    return importer({
      file: `./__tests__/importers/refdata-${file}.xlsx`,
      models: ctx.store.models,
      ...opts,
    });
  }

  it('should succeed with valid data', async () => {
    const { didntSendReason, errors, stats } = await doImport({ file: 'valid', dryRun: true });

    expect(didntSendReason).toEqual('dryRun');
    expect(errors).toBeEmpty();
    expect(stats).toEqual({
      'ReferenceData/allergy': { created: 10, updated: 0, errored: 0 },
      'ReferenceData/drug': { created: 10, updated: 0, errored: 0 },
      'ReferenceData/triageReason': { created: 10, updated: 0, errored: 0 },
      'ReferenceData/imagingType': { created: 4, updated: 0, errored: 0 },
      'ReferenceData/labTestCategory': { created: 5, updated: 0, errored: 0 },
      'ReferenceData/labTestType': { created: 10, updated: 0, errored: 0 },
      'ReferenceData/village': { created: 13, updated: 0, errored: 0 },
      User: { created: 10, updated: 0, errored: 0 },
      Facility: { created: 10, updated: 0, errored: 0 },
      ScheduledVaccine: { created: 1, updated: 0, errored: 0 },
      LabTestType: { created: 10, updated: 0, errored: 0 },
      Patient: { created: 10, updated: 0, errored: 0 },
      Department: { created: 10, updated: 0, errored: 0 },
      Location: { created: 10, updated: 0, errored: 0 },
      Encounter: { created: 2, updated: 0, errored: 0 },
      AdministeredVaccine: { created: 2, updated: 0, errored: 0 },
    });
  });

  it('should not write anything for a dry run', async () => {
    const { ReferenceData } = ctx.store.models;
    const beforeCount = await ReferenceData.count();

    await doImport({ file: 'valid', dryRun: true });

    const afterCount = await ReferenceData.count();
    expect(afterCount).toEqual(beforeCount);
  });

  it.todo('should flag records with missing ids');
  // it('should flag records with missing ids', () => {
  //   expectError('referenceData', 'record has no id');
  // });

  it.todo('should flag records with invalid ids');
  // it('should flag records with invalid ids', () => {
  //   expectError('referenceData', 'id must not have spaces or punctuation');
  // });

  it.todo('should flag records with invalid codes');
  // it('should flag records with invalid codes', () => {
  //   expectError('referenceData', 'code must not have spaces or punctuation');
  // });

  it.todo('should flag records with duplicate ids');
  // it('should flag records with duplicate ids', () => {
  //   expectError('referenceData', 'is already being used at');
  // });

  it.todo('should report an error if an FK search comes up empty');
  // it('should report an error if an FK search comes up empty', () => {
  //   expectError(
  //     'patient',
  //     'could not find a record of type referenceData called "village-nowhere"',
  //   );
  // });

  it.todo('should report an error if an FK is of the wrong type');
  // it('should report an error if an FK is of the wrong type', () => {
  //   expectError(
  //     'patient',
  //     'could not find a record of type referenceData called "2ecb58ca-8b2b-42e8-9c18-fd06c09653e1"',
  //   );
  // });

  describe.skip('Visibility status', () => {
    // All the record types work the same, just testing against Village
    // let villageRecords;
    // beforeAll(() => {
    //   villageRecords = recordGroups
    //     .find(([t]) => t === 'referenceData')[1]
    //     .filter(x => x.sheet === 'villages')
    //     .reduce((state, current) => ({ ...state, [current.data.id]: current }), {});
    // });

    it('Should import visibility status', () => {
      expect(villageRecords['village-historical']).toHaveProperty(
        'data.visibilityStatus',
        'historical',
      );
      expect(villageRecords['village-visible']).toHaveProperty('data.visibilityStatus', 'current');
    });

    it('Should default to visible', () => {
      expect(villageRecords['village-default-visible']).toHaveProperty(
        'data.visibilityStatus',
        'current',
      );
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

    // TODO: when permission checking is implemented on sync server
    it.skip('Should forbid an import by a non-admin', async () => {
      const { baseApp } = ctx;
      const nonAdminApp = await baseApp.asRole('practitioner');

      const response = await nonAdminApp.post('/v1/admin/importRefData');
      expect(response).toBeForbidden();
    });
  });
});
