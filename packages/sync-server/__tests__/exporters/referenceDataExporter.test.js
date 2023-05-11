import { REFERENCE_TYPES } from 'shared/constants';
import { createDummyPatient } from 'shared/demoData/patients';
import { createTestContext } from '../utilities';
import { referenceDataExporter } from '../../app/admin/referenceDataExporter/referenceDataExporter';
import * as excelUtils from '../../app/admin/referenceDataExporter/excelUtils';
import {
  createAllergy,
  createDiagnosis,
  createPatientFieldDefCategory,
  createPermission,
  createRole,
} from './referenceDataUtils';

describe('Reference data exporter', () => {
  const writeExcelFileSpy = jest.spyOn(excelUtils, 'writeExcelFile').mockReturnValue({});
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  afterAll(() => ctx.close());

  afterEach(async () => {
    const { ReferenceData, Patient, PatientFieldDefinitionCategory } = ctx.store.models;
    jest.clearAllMocks();
    await ReferenceData.destroy({ where: {}, force: true });
    await Patient.destroy({ where: {}, force: true });
    await PatientFieldDefinitionCategory.destroy({ where: {}, force: true });
  });

  it('Should export empty data if no data type selected', async () => {
    await referenceDataExporter(models);
    expect(writeExcelFileSpy).toBeCalledWith([], '');
  });

  it('Should export a file with no data if there is no reference data for the selected type', async () => {
    await referenceDataExporter(models, { 1: REFERENCE_TYPES.ICD10, 2: REFERENCE_TYPES.ALLERGY });
    expect(writeExcelFileSpy).toBeCalledWith(
      [
        {
          data: [],
          name: 'Icd 10',
        },
        {
          data: [],
          name: 'Allergy',
        },
      ],
      '',
    );
  });

  it('Should export a tab with name "Patient Field Def Category" for "patientFieldDefinitionCategory"', async () => {
    await createPatientFieldDefCategory(models);
    await referenceDataExporter(models, { 1: 'patientFieldDefinitionCategory' });
    expect(writeExcelFileSpy).toBeCalledWith(
      [
        {
          data: [
            ['id', 'name'],
            ['123', 'test 123'],
            ['1234', 'test 1234'],
          ],
          name: 'Patient Field Def Category',
        },
      ],
      '',
    );
  });

  it('Should export a tab "Diagnosis" and uses all Reference Data where type equals "icd10"', async () => {
    await createDiagnosis(models);
    await referenceDataExporter(models, { 1: 'diagnosis' });
    expect(writeExcelFileSpy).toBeCalledWith(
      [
        {
          data: [
            ['id', 'code', 'name', 'visibilityStatus'],
            ['icd10-M79-7', 'M79.7', 'Myofibrosis', 'current'],
            ['icd10-S79-9', 'S79.9', 'Thigh injury', 'current'],
          ],
          name: 'Diagnosis',
        },
      ],
      '',
    );
  });

  it('Should not export reference data types that are not included in the whitelist', async () => {
    await createDiagnosis(models);
    await referenceDataExporter(models, { 1: REFERENCE_TYPES.ALLERGY });
    expect(writeExcelFileSpy).toBeCalledWith(
      [
        {
          data: [],
          name: 'Allergy',
        },
      ],
      '',
    );
  });

  it('Should export allergy only', async () => {
    await createDiagnosis(models);
    await createAllergy(models);
    await referenceDataExporter(models, { 1: REFERENCE_TYPES.ALLERGY });
    expect(writeExcelFileSpy).toBeCalledWith(
      [
        {
          data: [
            ['id', 'code', 'name', 'visibilityStatus'],
            ['allergy-Sesame', 'Sesame', 'Sesame', 'current'],
            ['allergy-Wheat', 'Wheat', 'Wheat', 'current'],
          ],
          name: 'Allergy',
        },
      ],
      '',
    );
  });

  it('Should export both Diagnosis and Allergy', async () => {
    await createDiagnosis(models);
    await createAllergy(models);
    await referenceDataExporter(models, { 1: REFERENCE_TYPES.ALLERGY, 2: 'diagnosis' });
    expect(writeExcelFileSpy).toBeCalledWith(
      [
        {
          data: [
            ['id', 'code', 'name', 'visibilityStatus'],
            ['allergy-Sesame', 'Sesame', 'Sesame', 'current'],
            ['allergy-Wheat', 'Wheat', 'Wheat', 'current'],
          ],
          name: 'Allergy',
        },
        {
          data: [
            ['id', 'code', 'name', 'visibilityStatus'],
            ['icd10-M79-7', 'M79.7', 'Myofibrosis', 'current'],
            ['icd10-S79-9', 'S79.9', 'Thigh injury', 'current'],
          ],
          name: 'Diagnosis',
        },
      ],
      '',
    );
  });

  it('Should export data from other tables besides Reference data', async () => {
    const patientData = createDummyPatient(models);
    const patient = await models.Patient.create(patientData);
    await referenceDataExporter(models, { 1: 'patient' });
    expect(writeExcelFileSpy).toBeCalledWith(
      [
        {
          data: [
            [
              'id',
              'displayId',
              'firstName',
              'middleName',
              'lastName',
              'culturalName',
              'dateOfBirth',
              'dateOfDeath',
              'sex',
              'email',
              'visibilityStatus',
              'villageId',
              'mergedIntoId',
            ],
            [
              patient.id,
              patient.displayId,
              patient.firstName,
              patient.middleName,
              patient.lastName,
              patient.culturalName,
              new Date(patient.dateOfBirth),
              patient.dateOfDeath,
              patient.sex,
              patient.email,
              patient.visibilityStatus,
              patient.villageId,
              patient.mergedIntoId,
            ],
          ],
          name: 'Patient',
        },
      ],
      '',
    );
  });

  it('Should export mixed Reference Data and other table data', async () => {
    const patientData = createDummyPatient(models);
    const patient = await models.Patient.create(patientData);
    await createDiagnosis(models);
    await createAllergy(models);
    await referenceDataExporter(models, {
      1: 'patient',
      2: REFERENCE_TYPES.ALLERGY,
      3: 'diagnosis',
    });
    expect(writeExcelFileSpy).toBeCalledWith(
      [
        {
          data: [
            [
              'id',
              'displayId',
              'firstName',
              'middleName',
              'lastName',
              'culturalName',
              'dateOfBirth',
              'dateOfDeath',
              'sex',
              'email',
              'visibilityStatus',
              'villageId',
              'mergedIntoId',
            ],
            [
              patient.id,
              patient.displayId,
              patient.firstName,
              patient.middleName,
              patient.lastName,
              patient.culturalName,
              new Date(patient.dateOfBirth),
              patient.dateOfDeath,
              patient.sex,
              patient.email,
              patient.visibilityStatus,
              patient.villageId,
              patient.mergedIntoId,
            ],
          ],
          name: 'Patient',
        },
        {
          data: [
            ['id', 'code', 'name', 'visibilityStatus'],
            ['allergy-Sesame', 'Sesame', 'Sesame', 'current'],
            ['allergy-Wheat', 'Wheat', 'Wheat', 'current'],
          ],
          name: 'Allergy',
        },
        {
          data: [
            ['id', 'code', 'name', 'visibilityStatus'],
            ['icd10-M79-7', 'M79.7', 'Myofibrosis', 'current'],
            ['icd10-S79-9', 'S79.9', 'Thigh injury', 'current'],
          ],
          name: 'Diagnosis',
        },
      ],
      '',
    );
  });

  it('Should throw an error when passing an wrong data type', async () => {
    await createPatientFieldDefCategory(models);
    await expect(referenceDataExporter(models, { 1: 'wrongDataType' })).rejects.toThrow();
  });
});

describe('Permission and Roles exporter', () => {
  const writeExcelFileSpy = jest.spyOn(excelUtils, 'writeExcelFile').mockReturnValue({});
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  afterAll(() => ctx.close());

  afterEach(async () => {
    const { Permission, Role } = ctx.store.models;
    jest.clearAllMocks();
    await Permission.destroy({ where: {}, force: true });
    await Role.destroy({ where: {}, force: true });
  });

  it('Should export a file with no data if there is no permission and roles', async () => {
    await referenceDataExporter(models, { 1: 'permission', 2: 'role' });
    expect(writeExcelFileSpy).toBeCalledWith(
      [
        {
          data: [],
          name: 'Permission',
        },
        {
          data: [],
          name: 'Role',
        },
      ],
      '',
    );
  });

  it('Should export permissions with one aditional column for admin Role', async () => {
    await createRole(models, { id: 'admin', name: 'Admin' });
    await createPermission(models, { verb: 'list', noun: 'User', roleId: 'admin' });
    await createPermission(models, { verb: 'list', noun: 'ReferenceData', roleId: 'admin' });
    await createPermission(models, { verb: 'list', noun: 'Patient', roleId: 'admin' });
    await createPermission(models, {
      verb: 'read',
      noun: 'Report',
      objectId: 'new-patients',
      roleId: 'admin',
    });

    await referenceDataExporter(models, { 1: 'permission', 2: 'role' });
    expect(writeExcelFileSpy).toBeCalledWith(
      [
        {
          data: [
            ['verb', 'noun', 'objectId', 'admin'],
            ['list', 'User', null, 'y'],
            ['list', 'ReferenceData', null, 'y'],
            ['list', 'Patient', null, 'y'],
            ['read', 'Report', 'new-patients', 'y'],
          ],
          name: 'Permission',
        },
        {
          data: [
            ['id', 'name'],
            ['admin', 'Admin'],
          ],
          name: 'Role',
        },
      ],
      '',
    );
  });

  it('Should export permissions with two aditional columns for admin/reception Role', async () => {
    await createRole(models, { id: 'admin', name: 'Admin' });
    await createRole(models, { id: 'reception', name: 'Reception' });
    await createPermission(models, { verb: 'list', noun: 'User', roleId: 'reception' });
    await createPermission(models, { verb: 'list', noun: 'ReferenceData', roleId: 'reception' });

    await createPermission(models, { verb: 'list', noun: 'User', roleId: 'admin' });
    await createPermission(models, { verb: 'list', noun: 'ReferenceData', roleId: 'admin' });
    await createPermission(models, { verb: 'write', noun: 'User', roleId: 'admin' });
    await createPermission(models, { verb: 'write', noun: 'ReferenceData', roleId: 'admin' });
    await createPermission(models, {
      verb: 'read',
      noun: 'Report',
      objectId: 'new-patients',
      roleId: 'admin',
    });

    await referenceDataExporter(models, { 1: 'permission', 2: 'role' });
    expect(writeExcelFileSpy).toBeCalledWith(
      [
        {
          data: [
            ['verb', 'noun', 'objectId', 'reception', 'admin'],
            ['list', 'User', null, 'y', 'y'],
            ['list', 'ReferenceData', null, 'y', 'y'],
            ['write', 'User', null, '', 'y'],
            ['write', 'ReferenceData', null, '', 'y'],
            ['read', 'Report', 'new-patients', '', 'y'],
          ],
          name: 'Permission',
        },
        {
          data: [
            ['id', 'name'],
            ['admin', 'Admin'],
            ['reception', 'Reception'],
          ],
          name: 'Role',
        },
      ],
      '',
    );
  });
});
