import { fake } from '@tamanu/shared/test-helpers/fake';
import { SURVEY_TYPES } from '@tamanu/constants';
import { importerTransaction } from '../../dist/admin/importerEndpoint';
import { programImporter } from '../../dist/admin/programImporter';
import { createTestContext } from '../utilities';
import './matchers';

// the importer can take a little while
jest.setTimeout(30000);

describe('Programs import', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();
  });

  const truncateTables = async () => {
    const { Program, Survey, ProgramDataElement, SurveyScreenComponent } = ctx.store.models;
    await SurveyScreenComponent.destroy({ where: {}, force: true });
    await ProgramDataElement.destroy({ where: {}, force: true });
    await Survey.destroy({ where: {}, force: true });
    await Program.destroy({ where: {}, force: true });
  };

  beforeEach(async () => {
    await truncateTables();
  });
  afterAll(async () => {
    await truncateTables();
    await ctx.close();
  });

  function doImport(options) {
    const { file, ...opts } = options;
    return importerTransaction({
      importer: programImporter,
      file: `./__tests__/importers/programs-${file}.xlsx`,
      models: ctx.store.models,
      settings: ctx.settings,
      ...opts,
    });
  }

  it('should succeed with valid data', async () => {
    const { didntSendReason, errors, stats } = await doImport({ file: 'valid', dryRun: true });

    expect(errors).toBeEmpty();
    expect(didntSendReason).toEqual('dryRun');
    expect(stats).toMatchObject({
      Program: { created: 1, updated: 0, errored: 0 },
      Survey: { created: 1, updated: 0, errored: 0 },
      ProgramDataElement: { created: 21, updated: 0, errored: 0 },
      SurveyScreenComponent: { created: 21, updated: 0, errored: 0 },
    });
  });

  it('should ignore obsolete surveys worksheets', async () => {
    const { didntSendReason, errors, stats } = await doImport({ file: 'obsolete', dryRun: true });

    expect(errors).toBeEmpty();
    expect(didntSendReason).toEqual('dryRun');
    expect(stats).toMatchObject({
      Program: { created: 1, updated: 0, errored: 0 },
      Survey: { created: 1, updated: 0, errored: 0 },
    });
  });

  it('should properly update surveys as obsolete', async () => {
    await doImport({ file: 'valid', dryRun: false });
    const { didntSendReason, errors, stats } = await doImport({ file: 'obsolete', dryRun: true });

    expect(errors).toBeEmpty();
    expect(didntSendReason).toEqual('dryRun');
    expect(stats).toMatchObject({
      Program: { created: 0, updated: 1, errored: 0 },
      Survey: { created: 0, updated: 1, errored: 0 },
    });
  });

  it('should soft delete survey questions', async () => {
    const { Survey, SurveyScreenComponent } = ctx.store.models;

    const getComponents = async () => {
      const survey = await Survey.findByPk('program-testprogram-deletion');
      expect(survey).toBeTruthy();
      return SurveyScreenComponent.findAll({
        where: {
          surveyId: survey.id,
          visibilityStatus: 'current',
        },
      });
    };

    {
      const { errors, stats } = await doImport({ file: 'deleteQuestions' });
      expect(errors).toBeEmpty();
      expect(stats).toMatchObject({
        ProgramDataElement: { created: 3 },
        SurveyScreenComponent: { created: 3 },
      });
    }

    // find imported ssc
    const componentsBefore = await getComponents();
    expect(componentsBefore).toHaveLength(3);

    {
      const { errors, stats } = await doImport({ file: 'deleteQuestions-2' });
      expect(errors).toBeEmpty();
      expect(stats).toMatchObject({
        ProgramDataElement: { updated: 3 },
        SurveyScreenComponent: { updated: 1, deleted: 2 },
      });
    }

    const componentsAfter = await getComponents();
    // of the three in the import doc:
    //  - one is not deleted
    //  - two is set to visibilityStatus = 'deleted'
    expect(componentsAfter).toHaveLength(1);
  });

  it('should not write anything for a dry run', async () => {
    const { ProgramDataElement } = ctx.store.models;
    const beforeCount = await ProgramDataElement.count();

    await doImport({ file: 'valid', dryRun: true });

    const afterCount = await ProgramDataElement.count();
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
      `ENOENT: no such file or directory, open './__tests__/importers/programs-nofile.xlsx'`,
    );
  });

  it('should error on invalid calculations', async () => {
    const { didntSendReason, errors, stats } = await doImport({
      file: 'calculation-validation',
      dryRun: true,
    });
    expect(didntSendReason).toEqual('validationFailed');
    expect(stats).toMatchObject({
      Program: { created: 1, updated: 0, errored: 0 },
      Survey: { created: 1, updated: 0, errored: 0 },
      ProgramDataElement: { created: 6, updated: 0, errored: 0 },
      SurveyScreenComponent: { created: 4, updated: 0, errored: 2 }, // 2 invalid calculations
    });
    expect(errors.length).toEqual(2);
  });

  it('run validation against question configs', async () => {
    const { didntSendReason, errors, stats } = await doImport({
      file: 'question-validation',
      dryRun: true,
    });

    expect(didntSendReason).toEqual('validationFailed');
    expect(errors.length).toEqual(31);
    expect(stats).toMatchObject({
      Program: { created: 1, updated: 0, errored: 0 },
      Survey: { created: 2, updated: 0, errored: 0 },
      ProgramDataElement: { created: 42, updated: 0, errored: 0 },
      SurveyScreenComponent: { created: 11, updated: 0, errored: 31 }, // 31 fields in failure test, 11 in success test
    });
  });

  describe('Vitals survey', () => {
    it('Should detect if the mandatory vitals questions are missing', async () => {
      const { errors } = await doImport({
        file: 'vitals-missing-qs',
        dryRun: true,
      });
      expect(errors).toContainValidationError('Vitals', 0, 'Survey missing required questions');
    });

    it('Should refuse to import more than one vitals survey', async () => {
      const { Program, Survey } = ctx.store.models;
      const program = await Program.create(fake(Program));
      await Survey.create({
        ...fake(Survey),
        surveyType: SURVEY_TYPES.VITALS,
        programId: program.id,
      });

      const { errors } = await doImport({
        file: 'vitals-valid',
        dryRun: true,
      });
      expect(errors).toContainAnError('metadata', 0, 'Only one vitals survey');
    });

    it('Should reject a vitals survey with isSensitive set to true', async () => {
      const { errors } = await doImport({
        file: 'vitals-sensitive-true',
        dryRun: true,
      });
      expect(errors).toContainAnError('metadata', 0, 'Vitals survey can not be sensitive');
    });

    it('Should validate normalRange in validation_criteria', async () => {
      const { errors, stats } = await doImport({
        file: 'vitals-validate-normal-range-in-validation-criteria',
        dryRun: true,
      });

      const errorMessages = [
        'sheetName: Vitals, code: \'PatientVitalsSBP\', normalRange must be within graphRange, got normalRange: {"min":30,"max":120}, graphRange: {"min":40,"max":240}}',
        'sheetName: Vitals, code: \'PatientVitalsDBP\', normalRange must be within graphRange, got normalRange: {"min":60,"max":250}, graphRange: {"min":40,"max":240}}',
        "sheetName: Vitals, code: 'PatientVitalsHeartRate', validationCriteria must be specified if visualisationConfig is presented",
        "sheetName: Vitals, code: 'PatientVitalsRespiratoryRate', validationCriteria must have normalRange",
        'sheetName: Vitals, code: \'PatientVitalsTemperature\', normalRange must be within graphRange, got normalRange: {"min":120,"max":185,"ageUnit":"months","ageMin":0,"ageMax":3}, graphRange: {"min":33.5,"max":41.5}}', // Validate array type normalRange
      ];

      errors.forEach((error, i) => {
        expect(error.message).toEqual(errorMessages[i]);
      });

      expect(stats).toMatchObject({
        Program: { created: 1, updated: 0, errored: 0 },
        Survey: { created: 1, updated: 0, errored: 0 },
        ProgramDataElement: { created: 16, updated: 0, errored: errorMessages.length },
        SurveyScreenComponent: { created: 16, updated: 0, errored: 0 },
      });
    });

    it('Should import a valid vitals survey', async () => {
      const { errors, stats, didntSendReason } = await doImport({
        file: 'vitals-valid',
        dryRun: true,
      });
      expect(errors).toBeEmpty();
      expect(didntSendReason).toEqual('dryRun');
      expect(stats).toMatchObject({
        Program: { created: 1, updated: 0, errored: 0 },
        Survey: { created: 1, updated: 0, errored: 0 },
        ProgramDataElement: { created: 16, updated: 0, errored: 0 },
        SurveyScreenComponent: { created: 16, updated: 0, errored: 0 },
      });
    });

    it('Should import a valid vitals survey and delete visualisationConfig', async () => {
      const { ProgramDataElement } = ctx.store.models;

      const validateVisualisationConfig = async expectValue => {
        const { visualisationConfig } = await ProgramDataElement.findOne({
          where: {
            code: 'PatientVitalsHeartRate',
          },
        });
        expect(visualisationConfig).toEqual(expectValue);
      };

      await doImport({
        file: 'vitals-valid',
        dryRun: false,
      });
      await validateVisualisationConfig(
        '{"yAxis":{"graphRange":{"min":30,"max":300}, "interval":10}}',
      );

      await doImport({
        file: 'vitals-delete-visualisation-config',
        dryRun: false,
      });
      await validateVisualisationConfig('');
    });

    it('should soft delete vital survey questions', async () => {
      const { Survey, SurveyScreenComponent } = ctx.store.models;

      const getComponents = async () => {
        const survey = await Survey.findByPk('program-testvitals-vitalsgood');
        expect(survey).toBeTruthy();

        return SurveyScreenComponent.findAll({
          where: {
            surveyId: survey.id,
            visibilityStatus: 'current',
          },
        });
      };

      {
        const { errors, stats } = await doImport({ file: 'vitals-delete-questions' });
        expect(errors).toBeEmpty();
        expect(stats).toMatchObject({
          Program: { created: 1, updated: 0, errored: 0 },
          Survey: { created: 1, updated: 0, errored: 0 },
          ProgramDataElement: { created: 16, updated: 0, errored: 0 },
          SurveyScreenComponent: { created: 16, updated: 0, errored: 0 },
        });
      }

      // find imported ssc
      const componentsBefore = await getComponents();
      expect(componentsBefore).toHaveLength(16);

      {
        const { errors, stats } = await doImport({ file: 'vitals-delete-questions-2' });
        expect(errors).toBeEmpty();
        expect(stats).toMatchObject({
          ProgramDataElement: { updated: 16 }, // deleter should NOT delete underlying PDEs
          SurveyScreenComponent: { updated: 15, deleted: 1 },
        });
      }

      const componentsAfter = await getComponents();
      expect(componentsAfter).toHaveLength(15);
    });
  });
});
