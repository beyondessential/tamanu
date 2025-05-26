import { exportProgram } from '../../../dist/admin/programExporter';
import { createTestContext } from '../../utilities';
import { fake } from '@tamanu/fake-data/fake';
import { Program, Survey, ProgramDataElement, SurveyScreenComponent } from '@tamanu/database';

const surveySheetHeaders = [
  'code',
  'type',
  'name',
  'text',
  'detail',
  'newScreen',
  'options',
  'optionLabels',
  'optionColors',
  'visibilityCriteria',
  'validationCriteria',
  'visualisationConfig',
  'optionSet',
  'questionLabel',
  'detailLabel',
  'calculation',
  'config',
  'visibilityStatus',
];

const mockExcelFileSystem = {};

const buildExpectedMetadataSheet = (program, surveys) => [
  ['programName', program.name],
  ['programCode', program.id.replace('program-', '')],
  ['country', ''],
  ['homeServer', ''],
  [],
  [
    'code',
    'name',
    'surveyType',
    'targetLocationId',
    'targetDepartmentId',
    'status',
    'isSensitive',
    'visibilityStatus',
    'notifiable',
    'notifyEmailAddresses',
  ],
  ...surveys.map((survey) => [
    survey.code,
    survey.name,
    survey.surveyType,
    '',
    '',
    'publish',
    false,
    'current',
    expect.any(Boolean),
    '',
  ]),
];

const buildExpectedSurveySheet = (surveyScreenComponentAndProgramDataElements) => [
  surveySheetHeaders,
  ...surveyScreenComponentAndProgramDataElements.map(
    ({ surveyScreenComponent, programDataElement }) => [
      programDataElement.code,
      programDataElement.type,
      programDataElement.name,
      programDataElement.defaultText,
      surveyScreenComponent.detail,
      '',
      programDataElement.defaultOptions,
      '',
      '',
      null,
      surveyScreenComponent.validationCriteria,
      programDataElement.visualisationConfig,
      '',
      '',
      '',
      null,
      null,
      'current',
    ],
  ),
];

jest.mock('xlsx', () => ({
  utils: {
    book_new: () => ({}),
    aoa_to_sheet: (data) => data,
    book_append_sheet: (book, sheet, name) => {
      book[name] = sheet;
    },
  },
  writeFile: (book, fileName) => {
    mockExcelFileSystem[fileName] = book;
  },
}));

describe('Program export', () => {
  let ctx;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
  });

  afterAll(async () => {
    await ctx.close();
  });

  afterEach(async () => {
    await SurveyScreenComponent.truncate({ cascade: true, force: true });
    await ProgramDataElement.truncate({ cascade: true, force: true });
    await Survey.truncate({ cascade: true, force: true });
    await Program.truncate({ cascade: true, force: true });
  });

  it('should export a program', async () => {
    const programId = 'test-program';
    const surveyCode = 'test-survey';
    const questionCode = 'test-question';
    const program = await models.Program.create({ ...fake(Program), id: programId });
    const survey = await models.Survey.create({
      ...fake(Survey),
      code: surveyCode,
      programId: programId,
    });
    const programDataElement = await ProgramDataElement.create({
      ...fake(ProgramDataElement),
      code: questionCode,
      id: `pde-${questionCode}`,
    });

    const surveyScreenComponent = await SurveyScreenComponent.create({
      ...fake(SurveyScreenComponent),
      surveyId: survey.id,
      code: `${survey.id}-${programDataElement.code}`,
      dataElementId: programDataElement.id,
    });

    const exportFileName = await exportProgram(ctx.store, programId);
    const exportFile = mockExcelFileSystem[exportFileName];

    expect(exportFile).toHaveProperty('Metadata', buildExpectedMetadataSheet(program, [survey]));
    expect(exportFile).toHaveProperty(
      surveyCode,
      buildExpectedSurveySheet([{ surveyScreenComponent, programDataElement }]),
    );
  });

  it('can export a sheet for each survey in a program', async () => {
    const programId = 'test-program';
    const survey1Code = 'test-survey-1';
    const survey2Code = 'test-survey-2';
    const survey1QuestionCode = 'test-survey-1-question';
    const survey2QuestionCode = 'test-survey-2-question';
    const program = await models.Program.create({ ...fake(Program), id: programId });
    const survey1 = await models.Survey.create({
      ...fake(Survey),
      code: survey1Code,
      programId: programId,
    });
    const survey2 = await models.Survey.create({
      ...fake(Survey),
      code: survey2Code,
      programId: programId,
    });
    const survey1ProgramDataElement = await ProgramDataElement.create({
      ...fake(ProgramDataElement),
      code: survey1QuestionCode,
      id: `pde-${survey1QuestionCode}`,
    });

    const survey1SurveyScreenComponent = await SurveyScreenComponent.create({
      ...fake(SurveyScreenComponent),
      surveyId: survey1.id,
      code: `${survey1.id}-${survey1ProgramDataElement.code}`,
      dataElementId: survey1ProgramDataElement.id,
    });

    const survey2ProgramDataElement = await ProgramDataElement.create({
      ...fake(ProgramDataElement),
      code: survey2QuestionCode,
      id: `pde-${survey2QuestionCode}`,
    });

    const survey2SurveyScreenComponent = await SurveyScreenComponent.create({
      ...fake(SurveyScreenComponent),
      surveyId: survey2.id,
      code: `${survey2.id}-${survey2ProgramDataElement.code}`,
      dataElementId: survey2ProgramDataElement.id,
    });

    const exportFileName = await exportProgram(ctx.store, programId);
    const exportFile = mockExcelFileSystem[exportFileName];

    expect(exportFile).toHaveProperty(
      'Metadata',
      buildExpectedMetadataSheet(program, [survey1, survey2]),
    );
    expect(exportFile).toHaveProperty(
      survey1Code,
      buildExpectedSurveySheet([
        {
          surveyScreenComponent: survey1SurveyScreenComponent,
          programDataElement: survey1ProgramDataElement,
        },
      ]),
    );
    expect(exportFile).toHaveProperty(
      survey2Code,
      buildExpectedSurveySheet([
        {
          surveyScreenComponent: survey2SurveyScreenComponent,
          programDataElement: survey2ProgramDataElement,
        },
      ]),
    );
  });

  it('can export a sheet an obsolete survey', async () => {
    const programId = 'test-program';
    const surveyCode = 'test-survey';
    const obsoleteSurveyCode = 'test-obsolete-survey';
    const surveyQuestionCode = 'test-survey-question';
    const program = await models.Program.create({ ...fake(Program), id: programId });
    const survey = await models.Survey.create({
      ...fake(Survey),
      code: surveyCode,
      programId: programId,
    });
    const obsoleteSurvey = await models.Survey.create({
      ...fake(Survey),
      code: obsoleteSurveyCode,
      programId: programId,
      surveyType: 'obsolete',
    });
    const programDataElement = await ProgramDataElement.create({
      ...fake(ProgramDataElement),
      code: surveyQuestionCode,
      id: `pde-${surveyQuestionCode}`,
    });

    const surveyScreenComponent = await SurveyScreenComponent.create({
      ...fake(SurveyScreenComponent),
      surveyId: survey.id,
      code: `${survey.id}-${programDataElement.code}`,
      dataElementId: programDataElement.id,
    });

    const exportFileName = await exportProgram(ctx.store, programId);
    const exportFile = mockExcelFileSystem[exportFileName];

    expect(exportFile).toHaveProperty(
      'Metadata',
      buildExpectedMetadataSheet(program, [survey, obsoleteSurvey]),
    );
    expect(exportFile).toHaveProperty(
      surveyCode,
      buildExpectedSurveySheet([
        {
          surveyScreenComponent,
          programDataElement,
        },
      ]),
    );
    expect(exportFile).toHaveProperty(obsoleteSurveyCode, buildExpectedSurveySheet([]));
  });
});
