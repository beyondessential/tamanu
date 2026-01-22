import { fake } from '@tamanu/fake-data/fake';
import { SURVEY_TYPES } from '@tamanu/constants';

import { importerTransaction } from '../../dist/admin/importer/importerEndpoint';
import { programImporter } from '../../dist/admin/programImporter';
import { createTestContext } from '../utilities';
import './matchers';

// the importer can take a little while
jest.setTimeout(60000);

describe('Programs import - Charting', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
  });

  beforeEach(async () => {
    const {
      Program,
      Survey,
      ProgramDataElement,
      SurveyScreenComponent,
    } = ctx.store.models;
    await SurveyScreenComponent.destroy({ where: {}, force: true });
    await ProgramDataElement.destroy({ where: {}, force: true });
    await Survey.destroy({ where: {}, force: true });
    await Program.destroy({ where: {}, force: true });
  });
  afterAll(async () => {
    await ctx.close();
  });

  function doImport(options) {
    const { file, xml = false, ...opts } = options;
    return importerTransaction({
      importer: programImporter,
      file: `./__tests__/importers/programs-${file}${xml ? '.xml' : '.xlsx'}`,
      models: ctx.store.models,
      checkPermission: () => true,
      ...opts,
    });
  }

  describe('Simple chart', () => {
    it('Should import a valid simple chart survey', async () => {
      const { errors, stats, didntSendReason } = await doImport({
        file: 'charting-simple-valid',
        dryRun: true,
      });
      expect(errors).toBeEmpty();
      expect(didntSendReason).toEqual('dryRun');
      expect(stats).toMatchObject({
        Program: { created: 1, updated: 0, errored: 0 },
        Survey: { created: 1, updated: 0, errored: 0 },
        ProgramDataElement: { created: 4, updated: 0, errored: 0 },
        SurveyScreenComponent: { created: 4, updated: 0, errored: 0 },
      });
    });
    it('Should be able to import multiple simple chart surveys for the same program', async () => {
      const { errors, stats, didntSendReason } = await doImport({
        file: 'charting-simple-multiple-valid',
        dryRun: true,
      });
      expect(errors).toBeEmpty();
      expect(didntSendReason).toEqual('dryRun');
      expect(stats).toMatchObject({
        Program: { created: 1, updated: 0, errored: 0 },
        Survey: { created: 2, updated: 0, errored: 0 },
        ProgramDataElement: { created: 7, skipped: 1, errored: 0 },
        SurveyScreenComponent: { created: 8, updated: 0, errored: 0 },
      });
    });
    it('Should refuse to import a simple chart survey with isSensitive set to true', async () => {
      const { errors } = await doImport({
        file: 'charting-simple-sensitive-invalid',
        dryRun: true,
      });
      expect(errors).toContainAnError('metadata', 0, 'Charting survey can not be sensitive');
    });
    it('Should refuse to import a simple chart if the first question has wrong ID', async () => {
      const { errors } = await doImport({
        file: 'charting-simple-datetime-invalid-id',
        dryRun: true,
      });
      const expectedError =
        "sheetName: Test Chart, code: 'testchartcode0', First question should have 'pde-PatientChartingDate' as ID";
      expect(errors.length).toEqual(1);
      expect(errors[0].message).toEqual(expectedError);
    });
    it('Should refuse to import a simple chart if the first question is not DateTime type', async () => {
      const { errors } = await doImport({
        file: 'charting-simple-datetime-invalid-type',
        dryRun: true,
      });
      const expectedError =
        "sheetName: Test Chart, code: 'PatientChartingDate', First question should be DateTime type";
      expect(errors.length).toEqual(1);
      expect(errors[0].message).toEqual(expectedError);
    });
  });
  describe('Complex chart', () => {
    it('Should import a valid complex chart survey', async () => {
      const { errors, stats, didntSendReason } = await doImport({
        file: 'charting-complex-valid',
        dryRun: true,
      });
      expect(errors).toBeEmpty();
      expect(didntSendReason).toEqual('dryRun');
      expect(stats).toMatchObject({
        Program: { created: 1, updated: 0, errored: 0 },
        Survey: { created: 2, updated: 0, errored: 0 },
        ProgramDataElement: { created: 8, updated: 0, errored: 0 },
        SurveyScreenComponent: { created: 8, updated: 0, errored: 0 },
      });
    });
    it('Should refuse to import without its core info (ComplexChartCore)', async () => {
      const { errors } = await doImport({
        file: 'charting-complex-main-only-invalid',
        dryRun: true,
      });
      expect(errors).toContainAnError(
        'metadata',
        0,
        'Complex charts need a core data set survey',
      );
    });
    it('Should refuse to import without its main info (ComplexChart)', async () => {
      const { errors } = await doImport({
        file: 'charting-complex-core-only-invalid',
        dryRun: true,
      });
      expect(errors).toContainAnError(
        'metadata',
        0,
        'Cannot import a complex chart core without the main survey',
      );
    });
    it('Should refuse to import a complex core survey without special question config types', async () => {
      const { errors, stats } = await doImport({
        file: 'charting-complex-core-question-types-invalid',
        dryRun: true,
      });

      const errorMessages = [
        'Invalid complex chart core questions',
        "sheetName: Core, code: 'ComplexChartInstanceName', Invalid question type",
        "sheetName: Core, code: 'ComplexChartDate', Invalid question type",
        "sheetName: Core, code: 'ComplexChartType', Invalid question type",
        "sheetName: Core, code: 'ComplexChartSubtype', Invalid question type",
      ];

      errors.forEach((error, i) => {
        expect(error.message).toEqual(errorMessages[i]);
      });

      expect(stats).toMatchObject({
        Program: { created: 1, updated: 0, errored: 0 },
        Survey: { created: 2, updated: 0, errored: 0 },
        ProgramDataElement: { created: 8, updated: 0, errored: errorMessages.length },
        SurveyScreenComponent: { created: 8, updated: 0, errored: 0 },
      });
    });
    it('Should refuse to import a complex core survey without special question config IDs', async () => {
      const { errors, stats } = await doImport({
        file: 'charting-complex-core-question-ids-invalid',
        dryRun: true,
      });

      const errorMessages = [
        "sheetName: Core, code: 'testchartcorecode0', Invalid ID for question type",
        "sheetName: Core, code: 'testchartcorecode1', Invalid ID for question type",
        "sheetName: Core, code: 'testchartcorecode2', Invalid ID for question type",
        "sheetName: Core, code: 'testchartcorecode3', Invalid ID for question type",
      ];

      errors.forEach((error, i) => {
        expect(error.message).toEqual(errorMessages[i]);
      });

      expect(stats).toMatchObject({
        Program: { created: 1, updated: 0, errored: 0 },
        Survey: { created: 2, updated: 0, errored: 0 },
        ProgramDataElement: { created: 8, updated: 0, errored: errorMessages.length },
        SurveyScreenComponent: { created: 8, updated: 0, errored: 0 },
      });
    });
    it('Should only be able to hide "type" and "subtype" questions for complex core survey', async () => {
      const { errors, stats } = await doImport({
        file: 'charting-complex-core-hidden-question-invalid',
        dryRun: true,
      });

      const errorMessages = [
        "sheetName: Core, code: 'ComplexChartInstanceName', ComplexChartInstanceName cannot be hidden",
        "sheetName: Core, code: 'ComplexChartDate', ComplexChartDate cannot be hidden",
      ];

      errors.forEach((error, i) => {
        expect(error.message).toEqual(errorMessages[i]);
      });

      expect(stats).toMatchObject({
        Program: { created: 1, updated: 0, errored: 0 },
        Survey: { created: 2, updated: 0, errored: 0 },
        ProgramDataElement: { created: 8, updated: 0, errored: errorMessages.length },
        SurveyScreenComponent: { created: 8, updated: 0, errored: 0 },
      });
    });
    it('Should only be one complex chart and complex core per program', async () => {
      const { errors } = await doImport({
        file: 'charting-complex-multiple-invalid',
        dryRun: true,
      });
      expect(errors).toContainAnError(
        'metadata',
        0,
        'Only one complex chart and complex chart core allowed in a program',
      );
    });
    it('Should refuse to import a complex chart set if it already exists in that program', async () => {
      const { Program, Survey } = ctx.store.models;
      const program = await Program.create({
        ...fake(Program),
        id: 'program-testcomplexchart',
        code: 'testcomplexchart',
      });
      await Survey.create({
        ...fake(Survey),
        surveyType: SURVEY_TYPES.COMPLEX_CHART,
        programId: program.id,
      });
      await Survey.create({
        ...fake(Survey),
        surveyType: SURVEY_TYPES.COMPLEX_CHART_CORE,
        programId: program.id,
      });
      const { errors } = await doImport({
        file: 'charting-complex-valid',
        dryRun: true,
      });
      expect(errors).toContainAnError(
        'metadata',
        0,
        'Complex chart set already exists for this program',
      );
    });
    it('Should refuse to import a complex chart survey with isSensitive set to true', async () => {
      const { errors } = await doImport({
        file: 'charting-complex-sensitive-invalid',
        dryRun: true,
      });
      expect(errors).toContainAnError('metadata', 0, 'Charting survey can not be sensitive');
    });
    it('Should refuse to import a complex chart core survey with isSensitive set to true', async () => {
      const { errors } = await doImport({
        file: 'charting-complex-core-sensitive-invalid',
        dryRun: true,
      });
      expect(errors).toContainAnError('metadata', 0, 'Charting survey can not be sensitive');
    });
    it('Should refuse to import a complex chart if the first question has wrong ID', async () => {
      const { errors } = await doImport({
        file: 'charting-complex-datetime-invalid-id',
        dryRun: true,
      });
      const expectedError =
        "sheetName: Test Chart, code: 'testchartcode0', First question should have 'pde-PatientChartingDate' as ID";
      expect(errors.length).toEqual(1);
      expect(errors[0].message).toEqual(expectedError);
    });
    it('Should refuse to import a complex chart if the first question is not DateTime type', async () => {
      const { errors } = await doImport({
        file: 'charting-complex-datetime-invalid-type',
        dryRun: true,
      });
      const expectedError =
        "sheetName: Test Chart, code: 'PatientChartingDate', First question should be DateTime type";
      expect(errors.length).toEqual(1);
      expect(errors[0].message).toEqual(expectedError);
    });
    it('Should refuse to import a complex chart core without exactly 4 question types', async () => {
      const { errors } = await doImport({
        file: 'charting-complex-core-question-amount-invalid',
        dryRun: true,
      });
      const expectedError = 'Invalid complex chart core questions';
      expect(errors.length).toEqual(1);
      expect(errors[0].message).toEqual(expectedError);
    });
    it('Should refuse to import a complex chart core without specific order', async () => {
      const { errors } = await doImport({
        file: 'charting-complex-core-question-order-invalid',
        dryRun: true,
      });
      const expectedError = 'Invalid complex chart core questions';
      expect(errors.length).toEqual(1);
      expect(errors[0].message).toEqual(expectedError);
    });

    it('Should refuse to import a complex chart with visualisation config', async () => {
      const { stats, errors } = await doImport({
        file: 'charting-complex-visualisation-config-invalid',
        dryRun: true,
      });

      const errorMessages = [
        "sheetName: Core, code: 'ComplexChartType', Visualisation config is not allowed for complex charts",
        "validationCriteria: this field has unspecified keys: min, max, normalRange on Core at row 4",
        "sheetName: Test Chart, code: 'testchartcode2', Visualisation config is not allowed for complex charts",
      ];

      expect(errors.map(e => e.message)).toEqual(errorMessages);

      expect(stats).toMatchObject({
        Program: { created: 1, updated: 0, errored: 0 },
        Survey: { created: 2, updated: 0, errored: 0 },
        ProgramDataElement: { created: 8, updated: 0, errored: 2 },
        SurveyScreenComponent: { created: 7, updated: 0, errored: 1 },
      });
    });
  });
});
