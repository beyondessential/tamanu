import { REFERENCE_TYPES } from '@tamanu/constants';
import { GENERAL_IMPORTABLE_DATA_TYPES } from '@tamanu/constants/importable';
import { createDummyPatient } from 'shared/demoData/patients';
import { exporter } from '../../app/admin/exporter/exporter';
import { importerTransaction } from '../../app/admin/importerEndpoint';
import { referenceDataImporter } from '../../app/admin/referenceDataImporter';
import { createAllergy, createDiagnosis } from '../exporters/referenceDataUtils';
import { createTestContext } from '../utilities';
import './matchers';

// the importer can take a little while
jest.setTimeout(30000);

describe('Import from an exported file', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  function doImport(options) {
    const { file, ...opts } = options;
    return importerTransaction({
      importer: referenceDataImporter,
      file: `${file}`,
      models: ctx.store.models,
      includedDataTypes: GENERAL_IMPORTABLE_DATA_TYPES,
      ...opts,
    });
  }

  const clearData = async () => {
    const { ReferenceData, Patient, PatientFieldDefinitionCategory } = ctx.store.models;
    await ReferenceData.destroy({ where: {}, force: true });
    await Patient.destroy({ where: {}, force: true });
    await PatientFieldDefinitionCategory.destroy({ where: {}, force: true });
  };

  afterAll(() => ctx.close());

  afterEach(async () => {
    jest.clearAllMocks();
    await clearData();
  });

  it('Should export mixed Reference Data and other table data', async () => {
    const patientData = createDummyPatient(models);
    await models.Patient.create(patientData);
    await createDiagnosis(models);
    await createAllergy(models);
    const fileName = await exporter(
      models,
      {
        1: 'patient',
        2: REFERENCE_TYPES.ALLERGY,
        3: 'diagnosis',
      },
      './exported-refdata-all-table.xlsx',
    );

    // Remove all the data in order to test the import using the exported file
    await clearData();

    const { errors, stats } = await doImport({ file: fileName });
    expect(errors).toBeEmpty();
    expect(stats).toMatchObject({
      'ReferenceData/allergy': { created: 2, updated: 0, errored: 0 },
      'ReferenceData/diagnosis': { created: 2, updated: 0, errored: 0 },
      Patient: { created: 1, updated: 0, errored: 0 },
    });
  });
});
