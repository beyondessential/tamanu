import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { importerTransaction } from '../../../app/admin/importer/importerEndpoint';
import { referenceDataImporter } from '../../../app/admin/referenceDataImporter';
import { createTestContext } from '../../utilities';
import '../matchers';

// the importer can take a little while
vi.setConfig({ testTimeout: 50000 });

describe('Patients import', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
    await ctx.store.models.ReferenceData.upsert({
      id: 'village-test',
      code: 'village-test',
      type: 'village',  
      name: 'Village test',
    });
  });
  afterAll(async () => {
    await ctx.close();
  });

  function doImport(options) {
    const { file, ...opts } = options;
    return importerTransaction({
      importer: referenceDataImporter,
      file: `./__tests__/importers/patient/${file}.xlsx`,
      models: ctx.store.models,
      includedDataTypes: ['patient', 'patientFieldDefinition', 'patientFieldDefinitionCategory'],
      checkPermission: () => true,
      ...opts,
    });
  }

  it('should succeed with valid data', async () => {
    const { didntSendReason, errors, stats } = await doImport({
      file: 'valid-patient',
      dryRun: true,
    });
    expect(didntSendReason).toEqual('dryRun');
    expect(errors).toHaveLength(0);
    expect(stats).toEqual({
      Patient: { created: 1, updated: 0, errored: 0, deleted: 0, restored: 0, skipped: 0 },
      PatientAdditionalData: {
        created: 1,
        updated: 0,
        errored: 0,
        deleted: 0,
        restored: 0,
        skipped: 0,
      },
    });
  });

  it('should not write anything for a dry run', async () => {
    const { Patient } = ctx.store.models;
    const beforeCount = await Patient.count();

    await doImport({ file: 'valid-patient', dryRun: true });

    const afterCount = await Patient.count();
    expect(afterCount).toEqual(beforeCount);
  });

  it('should validate Patient data', async () => {
    const { didntSendReason, errors } = await doImport({
      file: 'invalid-patient',
      dryRun: true,
    });

    expect(didntSendReason).toEqual('validationFailed');

    expect(errors).toContainValidationError(
      'patient',
      2,
      'firstName is a required field on patient at row 2',
    );

    expect(errors).toContainValidationError(
      'patient',
      2,
      'lastName is a required field on patient at row 2',
    );

    expect(errors).toContainValidationError(
      'patient',
      2,
      'sex is a required field on patient at row 2',
    );

    expect(errors).toContainValidationError(
      'patient',
      2,
      'dateOfBirth is a required field on patient at row 2',
    );
  });

  it('should create PatientAdditionalData when patientAdditionalData field is TRUE', async () => {
    const { didntSendReason, errors, stats } = await doImport({
      file: 'create-pad',
      dryRun: true,
    });

    expect(didntSendReason).toEqual('dryRun');
    expect(errors).toHaveLength(0);
    expect(stats).toEqual({
      Patient: { created: 1, updated: 0, errored: 0, deleted: 0, restored: 0, skipped: 0 },
      PatientAdditionalData: {
        created: 1,
        updated: 0,
        errored: 0,
        deleted: 0,
        restored: 0,
        skipped: 0,
      },
    });
  });

  it('should not create PatientAdditionalData when patientAdditionalData field is FALSE', async () => {
    const { didntSendReason, errors, stats } = await doImport({
      file: 'ignore-pad',
      dryRun: true,
    });

    expect(didntSendReason).toEqual('dryRun');
    expect(errors).toHaveLength(0);
    expect(stats).toEqual({
      Patient: { created: 1, updated: 0, errored: 0, deleted: 0, restored: 0, skipped: 0 },
    });
  });

  it('should not create PatientAdditionalData when patientAdditionalData field does not exist', async () => {
    const { didntSendReason, errors, stats } = await doImport({
      file: 'no-pad-column',
      dryRun: true,
    });

    expect(didntSendReason).toEqual('dryRun');
    expect(errors).toHaveLength(0);
    expect(stats).toEqual({
      Patient: { created: 1, updated: 0, errored: 0, deleted: 0, restored: 0, skipped: 0 },
    });
  });

  it('should create PatientFieldValue when a valid custom field is set (corresponds to valid PatientFieldDefinition)', async () => {
    const { didntSendReason, errors, stats } = await doImport({
      file: 'valid-custom-field',
      dryRun: true,
    });

    expect(didntSendReason).toEqual('dryRun');
    expect(errors).toHaveLength(0);
    expect(stats.Patient).toEqual({ created: 1, updated: 0, errored: 0, deleted: 0, restored: 0, skipped: 0 });
    expect(stats.PatientFieldValue).toEqual({ created: 1, updated: 0, errored: 0, deleted: 0, restored: 0, skipped: 0 });
  });

  it('should throw an error when an undefined custom field is specified in the columns (column name does not correspond to a valid PatientFieldDefinition)', async () => {
    const { didntSendReason, errors } = await doImport({
      file: 'invalid-custom-field',
      dryRun: true,
    });

    expect(didntSendReason).toEqual('validationFailed');

    expect(errors).toContainAnError(
      'patient',
      2,
      'No such patient field definition: patientFieldDef2',
    );
  });

  it('should create PatientFieldValue when a valid custom field is set (corresponds to valid PatientFieldDefinition) and patientAdditionalData field is TRUE', async () => {
    const { didntSendReason, errors, stats } = await doImport({
      file: 'valid-custom-field-with-pad',
      dryRun: true,
    });

    expect(didntSendReason).toEqual('dryRun');
    expect(errors).toHaveLength(0);
    expect(stats.Patient).toEqual({ created: 1, updated: 0, errored: 0, deleted: 0, restored: 0, skipped: 0 });
    expect(stats.PatientAdditionalData).toEqual({ created: 1, updated: 0, errored: 0, deleted: 0, restored: 0, skipped: 0 });
    expect(stats.PatientFieldValue).toEqual({ created: 1, updated: 0, errored: 0, deleted: 0, restored: 0, skipped: 0 });
  });

  // The Billing information fields are importable only because their column names match
  // PatientAdditionalData attributes (spec: administration/patient-data.md), so nothing in the
  // importer names them and a silent drop would go unnoticed.
  it('imports the billing information fields onto the patient additional data', async () => {
    const { errors } = await doImport({ file: 'billing-information' });
    expect(errors).toHaveLength(0);

    const saved = await ctx.store.models.PatientAdditionalData.getForPatient(
      'b1111111-1111-4111-8111-111111111111',
    );
    expect(saved).toMatchObject({
      adoptionNumber: 'ADOPT-IMPORT-1',
      marriageLicence: 'ML-IMPORT-1',
      familySize: '3',
      // Stored as the sheet gives it, without being checked against the current sliding fee
      // scale, which does not cover this band
      annualIncome: '999 - 1,111',
      payor1ReferenceNumber: 'PAYOR-REF-IMPORT-1',
      payor2ReferenceNumber: 'PAYOR-REF-IMPORT-2',
    });
  });
});
