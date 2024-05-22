import qs from 'qs';

import {
  createAdministeredVaccineData,
  createAllergy,
  createDataForEncounter,
  createDiagnosis,
  createLabTestCategory,
  createLabTestPanel,
  createPatientFieldDefCategory,
  createPatientFieldDefinitions,
  createPermission,
  createRole,
  createTestType,
  createVaccine,
} from './referenceDataUtils';
import { createDummyPatient } from '@tamanu/shared/demoData/patients';
import { createTestContext } from '../utilities';
import { exporter } from '../../dist/admin/exporter';
import { parseDate } from '@tamanu/shared/utils/dateTime';
import { REFERENCE_TYPES } from '@tamanu/constants';
import { writeExcelFile } from '../../dist/utils/excelUtils';
import { makeRoleWithPermissions } from '../permissions';

jest.mock('../../dist/admin/exporter/excelUtils', () => {
  const originalModule = jest.requireActual('../../dist/admin/exporter/excelUtils');

  return {
    __esModule: true,
    ...originalModule,
    writeExcelFile: jest.fn((_sheets, filename) => filename),
  };
});

describe('Reference data exporter', () => {
  let ctx;
  let models;
  let store;
  let app;

  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');
    store = ctx.store;
    models = store.models;
  });

  afterAll(() => ctx.close());

  afterEach(async () => {
    jest.clearAllMocks();

    const modelsToDestroy = [
      'AdministeredVaccine',
      'EncounterHistory',
      'Encounter',
      'ScheduledVaccine',
      'LabTestPanelLabTestTypes',
      'LabTestType',
      'LabTestPanel',
      'ReferenceData',
      'Patient',
      'PatientFieldDefinition',
      'PatientFieldDefinitionCategory',
      'Location',
      'Department',
      'TranslatedString',
    ];
    for (const model of modelsToDestroy) {
      await ctx.store.models[model].destroy({ where: {}, force: true });
    }
  });

  describe('Permissions check', () => {
    beforeEach(async () => {
      const { Permission, Role } = ctx.store.models;
      await Permission.destroy({ where: {}, force: true });
      await Role.destroy({ where: {}, force: true });
    });

    it('forbids export if having insufficient permission for reference data', async () => {
      await makeRoleWithPermissions(models, 'practitioner', [
        { verb: 'write', noun: 'EncounterDiagnosis' },
      ]);

      const result = await app
        .get('/v1/admin/export/referenceData')
        .query(qs.stringify({ includedDataTypes: ['allergy'] }));

      expect(result).toBeForbidden();
      expect(result.body.error.message).toBe('Cannot perform action "list" on ReferenceData.');
    });

    it('allows export if having sufficient permission for reference data', async () => {
      await makeRoleWithPermissions(models, 'practitioner', [
        { verb: 'list', noun: 'ReferenceData' },
      ]);

      const result = await app
        .get('/v1/admin/export/referenceData')
        .query(qs.stringify({ includedDataTypes: ['allergy'] }))
        .responseType('blob');

      // when downloading a file, for some reasons,
      // status of supertest is alwasy 404 even tho we are sure that it is successful
      // So below is a work around by checking if the response body is buffer to make sure the file is downloaded properly
      expect(Buffer.isBuffer(result.body)).toBeTrue();
    });
  });

  it('Should export empty data if no data type selected', async () => {
    await exporter(store);
    expect(writeExcelFile).toBeCalledWith([], '');
  });

  it('Should export a file with no data if there is no reference data for the selected type', async () => {
    await exporter(store, { 1: REFERENCE_TYPES.ICD10, 2: REFERENCE_TYPES.ALLERGY });
    expect(writeExcelFile).toBeCalledWith(
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
    await exporter(store, { 1: 'patientFieldDefinitionCategory' });
    expect(writeExcelFile).toBeCalledWith(
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

  it('It should export Patient field definition with the right options', async () => {
    await createPatientFieldDefCategory(models);
    await createPatientFieldDefinitions(models);

    await exporter(store, { 1: 'patientFieldDefinition' });
    expect(writeExcelFile).toBeCalledWith(
      [
        {
          data: [
            ['id', 'name', 'fieldType', 'options', 'visibilityStatus', 'categoryId'],
            [
              'fieldDefinition-primaryPolicyNumber',
              'Primary policy number',
              'string',
              null,
              'current',
              '123',
            ],
            ['fieldDefinition-size', 'Size', 'select', 's,m,l', 'current', '123'],
          ],
          name: 'Patient Field Definition',
        },
      ],
      '',
    );
  });

  it('Should export a tab "Diagnosis" and uses all Reference Data where type equals "icd10"', async () => {
    await createDiagnosis(models);
    await exporter(store, { 1: 'diagnosis' });
    expect(writeExcelFile).toBeCalledWith(
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
    await exporter(store, { 1: REFERENCE_TYPES.ALLERGY });
    expect(writeExcelFile).toBeCalledWith(
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
    await exporter(store, { 1: REFERENCE_TYPES.ALLERGY });
    expect(writeExcelFile).toBeCalledWith(
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

  it('Should export Panels with associated test types', async () => {
    const category = await createLabTestCategory(models, {
      id: 'category-1',
      name: 'Category 1',
      code: 'category-1',
    });

    const testType1 = await createTestType(models, {
      id: 'test-type-1',
      name: 'Test Type 1',
      code: 'test-type-1',
      labTestCategoryId: category.id,
    });
    const testType2 = await createTestType(models, {
      id: 'test-type-2',
      name: 'Test Type 2',
      code: 'test-type-2',
      labTestCategoryId: category.id,
    });
    await createLabTestPanel(models, {
      id: 'panel-with-two-types',
      name: 'Panel with two types',
      code: 'panel-with-two-types',
      labTestTypesIds: [testType1.id, testType2.id],
    });
    await exporter(store, { 1: 'labTestPanel' });

    expect(writeExcelFile).toBeCalledWith(
      [
        {
          data: [
            [
              'id',
              'code',
              'name',
              'visibilityStatus',
              'externalCode',
              'categoryId',
              'testTypesInPanel',
            ],
            [
              'panel-with-two-types',
              'panel-with-two-types',
              'Panel with two types',
              'current',
              null,
              null,
              'test-type-1,test-type-2',
            ],
          ],
          name: 'Lab Test Panel',
        },
      ],
      '',
    );
  });

  it('Should export both Diagnosis and Allergy', async () => {
    await createDiagnosis(models);
    await createAllergy(models);
    await exporter(store, { 1: REFERENCE_TYPES.ALLERGY, 2: 'diagnosis' });
    expect(writeExcelFile).toBeCalledWith(
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
    await exporter(store, { 1: 'patient' });
    expect(writeExcelFile).toBeCalledWith(
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
              parseDate(patient.dateOfBirth),
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
    await exporter(store, {
      1: 'patient',
      2: REFERENCE_TYPES.ALLERGY,
      3: 'diagnosis',
    });
    expect(writeExcelFile).toBeCalledWith(
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
              parseDate(patient.dateOfBirth),
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

  it('Should export Administered vaccine with encounter data', async () => {
    await createDataForEncounter(models);
    const vaccine = await createVaccine(models, { label: 'Covid', schedule: 'Dose 1' });
    const { administeredVaccine, encounter } = await createAdministeredVaccineData(models, vaccine);
    const {
      administeredVaccine: administeredVaccine2,
      encounter: encounter2,
    } = await createAdministeredVaccineData(models, vaccine);

    await exporter(store, {
      1: 'administeredVaccine',
    });
    expect(writeExcelFile).toBeCalledWith(
      [
        {
          data: [
            [
              'id',
              'batch',
              'consent',
              'consentGivenBy',
              'status',
              'reason',
              'injectionSite',
              'givenBy',
              'givenElsewhere',
              'vaccineBrand',
              'vaccineName',
              'disease',
              'circumstanceIds',
              'date',
              'encounterId',
              'scheduledVaccineId',
              'recorderId',
              'locationId',
              'departmentId',
              'notGivenReasonId',
              'examinerId',
              'patientId',
            ],
            [
              administeredVaccine.id,
              administeredVaccine.batch,
              'y',
              administeredVaccine.consentGivenBy,
              administeredVaccine.status,
              administeredVaccine.reason,
              administeredVaccine.injectionSite,
              administeredVaccine.givenBy,
              administeredVaccine.givenElsewhere,
              administeredVaccine.vaccineBrand,
              administeredVaccine.vaccineName,
              administeredVaccine.disease,
              administeredVaccine.circumstanceIds,
              parseDate(administeredVaccine.date),
              administeredVaccine.encounterId,
              administeredVaccine.scheduledVaccineId,
              administeredVaccine.recorderId,
              encounter.locationId,
              encounter.departmentId,
              administeredVaccine.notGivenReasonId,
              encounter.examinerId,
              encounter.patientId,
            ],
            [
              administeredVaccine2.id,
              administeredVaccine2.batch,
              'y',
              administeredVaccine2.consentGivenBy,
              administeredVaccine2.status,
              administeredVaccine2.reason,
              administeredVaccine2.injectionSite,
              administeredVaccine2.givenBy,
              administeredVaccine2.givenElsewhere,
              administeredVaccine2.vaccineBrand,
              administeredVaccine2.vaccineName,
              administeredVaccine2.disease,
              administeredVaccine2.circumstanceIds,
              parseDate(administeredVaccine2.date),
              administeredVaccine2.encounterId,
              administeredVaccine2.scheduledVaccineId,
              administeredVaccine2.recorderId,
              encounter2.locationId,
              encounter2.departmentId,
              administeredVaccine2.notGivenReasonId,
              encounter2.examinerId,
              encounter2.patientId,
            ],
          ],
          name: 'Administered Vaccine',
        },
      ],
      '',
    );
  });

  it('Should throw an error when passing an wrong data type', async () => {
    await createPatientFieldDefCategory(models);
    await expect(exporter(store, { 1: 'wrongDataType' })).rejects.toThrow();
  });

  it('Should export translated strings with a single row for each stringId with columns for a single language', async () => {
    await models.TranslatedString.create({
      stringId: 'test-string',
      language: 'en',
      text: 'test',
    });
    await models.TranslatedString.create({
      stringId: 'test-string2',
      language: 'km',
      text: 'សាកល្បង',
    });

    await exporter(store, { 1: 'translatedString' });

    expect(writeExcelFile).toBeCalledWith(
      [
        {
          data: [
            ['stringId', 'en', 'km'],
            ['test-string', 'test', null],
            ['test-string2', null, 'សាកល្បង'],
          ],
          name: 'Translated String',
        },
      ],
      '',
    );
  });

  it('Should export translated strings with a single row for each stringId with columns for multiple languages', async () => {
    await models.TranslatedString.create({
      stringId: 'test-string',
      language: 'en',
      text: 'test',
    });
    await models.TranslatedString.create({
      stringId: 'test-string',
      language: 'km',
      text: 'សាកល្បង',
    });

    await exporter(store, { 1: 'translatedString' });

    expect(writeExcelFile).toBeCalledWith(
      [
        {
          data: [
            ['stringId', 'en', 'km'],
            ['test-string', 'test', 'សាកល្បង'],
          ],
          name: 'Translated String',
        },
      ],
      '',
    );
  });
});

describe('Permission and Roles exporter', () => {
  let ctx;
  let store;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    store = ctx.store;
    models = store.models;
  });

  afterAll(() => ctx.close());

  afterEach(async () => {
    const { Permission, Role } = models;
    jest.clearAllMocks();
    await Permission.destroy({ where: {}, force: true });
    await Role.destroy({ where: {}, force: true });
  });

  it('Should export a file with no data if there is no permission and roles', async () => {
    await exporter(store, { 1: 'permission', 2: 'role' });
    expect(writeExcelFile).toBeCalledWith(
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

  it('Should have a single row for each object id', async () => {
    await createRole(models, { id: 'reception', name: 'Reception' });
    await createPermission(models, {
      verb: 'run',
      noun: 'Report',
      objectId: 'new-patients',
      roleId: 'reception',
    });
    await createPermission(models, {
      verb: 'run',
      noun: 'Report',
      objectId: 'new-encounters',
      roleId: 'reception',
    });

    await exporter(store, { 1: 'permission', 2: 'role' });
    expect(writeExcelFile).toBeCalledWith(
      [
        {
          data: [
            ['verb', 'noun', 'objectId', 'reception'],
            ['run', 'Report', 'new-patients', 'y'],
            ['run', 'Report', 'new-encounters', 'y'],
          ],
          name: 'Permission',
        },
        {
          data: [
            ['id', 'name'],
            ['reception', 'Reception'],
          ],
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

    await exporter(store, { 1: 'permission', 2: 'role' });
    expect(writeExcelFile).toBeCalledWith(
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

    await exporter(store, { 1: 'permission', 2: 'role' });
    expect(writeExcelFile).toBeCalledWith(
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
