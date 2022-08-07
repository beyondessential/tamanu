import matchers from 'expect/build/matchers';

import importer from '../../app/admin/refdataImporter';
import { ValidationError } from '../../app/admin/refdataImporter/errors';
import { createTestContext } from '../utilities';

// the importer can take a little while
jest.setTimeout(30000);

function toContainError(errors, { ofType, inSheet, atRow, withMessage }) {
  return matchers.toContain(
    errors.map(error => `${error.constructor.name}: ${error.message}`),
    `${ofType.name}: ${withMessage} on ${inSheet} at row ${atRow}`,
  );
}

function toContainValidationError(errors, inSheet, atRow, withMessage) {
  return toContainError(errors, { ofType: ValidationError, inSheet, atRow, withMessage });
}

expect.extend({ toContainError, toContainValidationError });

const BAD_ID_ERROR_MESSAGE = 'id must not have spaces or punctuation other than -';
const BAD_CODE_ERROR_MESSAGE = 'code must not have spaces or punctuation other than -./';
const BAD_VIS_ERROR_MESSAGE =
  'visibilityStatus must be one of the following values: current, historical';

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

  it('should validate reference data', async () => {
    const { didntSendReason, errors } = await doImport({
      file: 'invalid-refdata',
      dryRun: true,
    });

    expect(didntSendReason).toEqual('validationFailed');

    expect(errors).toContainValidationError('village', 3, 'code is a required field');
    expect(errors).toContainValidationError('village', 4, 'name is a required field');
    expect(errors).toContainValidationError('village', 5, BAD_ID_ERROR_MESSAGE);
    expect(errors).toContainValidationError('village', 6, BAD_VIS_ERROR_MESSAGE);
    expect(errors).toContainValidationError('village', 7, 'id is a required field');

    expect(errors).toContainValidationError('triageReason', 5, BAD_ID_ERROR_MESSAGE);
    expect(errors).toContainValidationError('diagnosis', 3, BAD_CODE_ERROR_MESSAGE);
    // TODO: duplicate IDs
  });

  it('should validate users', async () => {
    // as example of non-refdata import
    const { didntSendReason, errors } = await doImport({
      file: 'invalid-users',
      dryRun: true,
    });

    expect(didntSendReason).toEqual('validationFailed');
    expect(errors).toContainValidationError('user', 2, 'password is a required field');
    expect(errors).toContainValidationError('user', 3, 'email is a required field');
    expect(errors).toContainValidationError('user', 4, 'displayName is a required field');
    expect(errors).toContainValidationError('user', 5, 'id is a required field');
  });

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
