import { REFERENCE_TYPES } from 'shared/constants';
import { createDummyPatient } from 'shared/demoData/patients';
import { createTestContext } from '../utilities';
import { referenceDataExporter } from '../../app/admin/referenceDataExporter/referenceDataExporter';
import * as excelUtils from '../../app/admin/referenceDataExporter/excelUtils';

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
    const { ReferenceData, Patient } = ctx.store.models;
    jest.clearAllMocks();
    await ReferenceData.destroy({ where: {}, force: true });
    await Patient.destroy({ where: {}, force: true });
  });

  async function createDiagnosis() {
    await models.ReferenceData.create({
      type: 'icd10',
      code: 'M79.7',
      id: 'icd10-M79-7',
      name: 'Myofibrosis',
    });
    await models.ReferenceData.create({
      type: 'icd10',
      code: 'S79.9',
      id: 'icd10-S79-9',
      name: 'Thigh injury',
    });
  }

  async function createAllergy() {
    await models.ReferenceData.create({
      type: 'allergy',
      code: 'Sesame',
      id: 'allergy-Sesame',
      name: 'Sesame',
    });
    await models.ReferenceData.create({
      type: 'allergy',
      code: 'Wheat',
      id: 'allergy-Wheat',
      name: 'Wheat',
    });
  }

  it('Should export empty data if no data type selected', async () => {
    await referenceDataExporter(models);
    expect(writeExcelFileSpy).toBeCalledWith([]);
  });

  it('Should export a file with no data if there is no reference data for the selected type', async () => {
    await referenceDataExporter(models, { 1: REFERENCE_TYPES.ICD10, 2: REFERENCE_TYPES.ALLERGY });
    expect(writeExcelFileSpy).toBeCalledWith([
      {
        data: [],
        name: 'Icd 10',
      },
      {
        data: [],
        name: 'Allergy',
      },
    ]);
  });

  it('Should export a tab with name "Patient Field Def Category" for "patientFieldDefinitionCategory"', async () => {
    await referenceDataExporter(models, { 1: 'patientFieldDefinitionCategory' });
    expect(writeExcelFileSpy).toBeCalledWith([
      {
        data: [],
        name: 'Patient Field Def Category',
      },
    ]);
  });

  it('Should export a tab "Diagnosis" and uses all Reference Data where type equals "icd10"', async () => {
    await createDiagnosis();
    await referenceDataExporter(models, { 1: 'diagnosis' });
    expect(writeExcelFileSpy).toBeCalledWith([
      {
        data: [
          ['id', 'code', 'name'],
          ['icd10-M79-7', 'M79.7', 'Myofibrosis'],
          ['icd10-S79-9', 'S79.9', 'Thigh injury'],
        ],
        name: 'Diagnosis',
      },
    ]);
  });

  it('Should not export when exporting other reference data', async () => {
    await createDiagnosis();
    await referenceDataExporter(models, { 1: REFERENCE_TYPES.ALLERGY });
    expect(writeExcelFileSpy).toBeCalledWith([
      {
        data: [],
        name: 'Allergy',
      },
    ]);
  });

  it('Should export allergy only', async () => {
    await createDiagnosis();
    await createAllergy();
    await referenceDataExporter(models, { 1: REFERENCE_TYPES.ALLERGY });
    expect(writeExcelFileSpy).toBeCalledWith([
      {
        data: [
          ['id', 'code', 'name'],
          ['allergy-Sesame', 'Sesame', 'Sesame'],
          ['allergy-Wheat', 'Wheat', 'Wheat'],
        ],
        name: 'Allergy',
      },
    ]);
  });

  it('Should export both Diagnosis and Allergy', async () => {
    await createDiagnosis();
    await createAllergy();
    await referenceDataExporter(models, { 1: REFERENCE_TYPES.ALLERGY, 2: 'diagnosis' });
    expect(writeExcelFileSpy).toBeCalledWith([
      {
        data: [
          ['id', 'code', 'name'],
          ['allergy-Sesame', 'Sesame', 'Sesame'],
          ['allergy-Wheat', 'Wheat', 'Wheat'],
        ],
        name: 'Allergy',
      },
      {
        data: [
          ['id', 'code', 'name'],
          ['icd10-M79-7', 'M79.7', 'Myofibrosis'],
          ['icd10-S79-9', 'S79.9', 'Thigh injury'],
        ],
        name: 'Diagnosis',
      },
    ]);
  });

  it('Should export data from other tables besides Reference data', async () => {
    const patientData = createDummyPatient(models);
    const patient = await models.Patient.create(patientData);
    await referenceDataExporter(models, { 1: 'patient' });
    expect(writeExcelFileSpy).toBeCalledWith([
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
            patient.dateOfBirth,
            patient.dateOfDeath,
            patient.sex,
            patient.email,
            patient.villageId,
            patient.mergedIntoId,
          ],
        ],
        name: 'Patient',
      },
    ]);
  });

  it('Should export mixed Reference Data and Other table data', async () => {
    const patientData = createDummyPatient(models);
    const patient = await models.Patient.create(patientData);
    await createDiagnosis();
    await createAllergy();
    await referenceDataExporter(models, {
      1: 'patient',
      2: REFERENCE_TYPES.ALLERGY,
      3: 'diagnosis',
    });
    expect(writeExcelFileSpy).toBeCalledWith([
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
            patient.dateOfBirth,
            patient.dateOfDeath,
            patient.sex,
            patient.email,
            patient.villageId,
            patient.mergedIntoId,
          ],
        ],
        name: 'Patient',
      },
      {
        data: [
          ['id', 'code', 'name'],
          ['allergy-Sesame', 'Sesame', 'Sesame'],
          ['allergy-Wheat', 'Wheat', 'Wheat'],
        ],
        name: 'Allergy',
      },
      {
        data: [
          ['id', 'code', 'name'],
          ['icd10-M79-7', 'M79.7', 'Myofibrosis'],
          ['icd10-S79-9', 'S79.9', 'Thigh injury'],
        ],
        name: 'Diagnosis',
      },
    ]);
  });
});
