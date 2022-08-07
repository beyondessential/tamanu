import matchers from 'expect/build/matchers';

import importer from '../../app/admin/refdataImporter';
import { ValidationError, ForeignkeyResolutionError } from '../../app/admin/refdataImporter/errors';
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

function toContainFkError(errors, inSheet, atRow, withMessage) {
  return toContainError(errors, { ofType: ForeignkeyResolutionError, inSheet, atRow, withMessage });
}

expect.extend({ toContainError, toContainValidationError, toContainFkError });

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
      'ReferenceData/diagnosis': { created: 10, updated: 0, errored: 0 },
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

  it('should error on missing file', async () => {
    const { didntSendReason, errors } = await doImport({
      file: 'nofile',
      dryRun: true,
    });

    expect(didntSendReason).toEqual('validationFailed');

    expect(errors[0]).toHaveProperty(
      'message',
      `ENOENT: no such file or directory, open './__tests__/importers/refdata-nofile.xlsx'`,
    );
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

    expect(errors).toContainValidationError('diagnosis', 3, BAD_CODE_ERROR_MESSAGE);
    expect(errors).toContainValidationError('triageReason', 4, 'duplicate id: triage-dupeid');
    expect(errors).toContainValidationError('triageReason', 5, BAD_ID_ERROR_MESSAGE);
  });

  // as example of non-refdata import
  it('should validate users', async () => {
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

  it('should validate foreign keys', async () => {
    const { didntSendReason, errors } = await doImport({
      file: 'invalid-fk',
      dryRun: true,
    });

    expect(didntSendReason).toEqual('validationFailed');
    expect(errors).toContainFkError(
      'patient',
      4,
      'valid foreign key expected in column village (corresponding to villageId) but found: village-nowhere',
    );
    expect(errors).toContainFkError(
      'patient',
      5,
      'valid foreign key expected in column village (corresponding to villageId) but found: drug-id',
    );
  });

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
