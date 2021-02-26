import {
  readSurveyXSLX,
  writeProgramToDatabase,
  writeSurveyToDatabase,
} from 'lan/app/surveyImporter';
import { createTestContext } from './utilities';

const TEST_SURVEY_PATH = './data/test_programs.xlsx';

// Disabled these tests as functionality has moved to the admin importer tool,
// sending records to sync server instead of importing directly to DB.
// This test should be updated to reflect that.
//
xdescribe('Importing surveys', () => {
  let models = null;

  beforeAll(async () => {
    const ctx = await createTestContext();
    models = ctx.models;
  });

  it('Should import a survey', () => {
    const surveyData = readSurveyXSLX('Test Survey', TEST_SURVEY_PATH);

    expect(surveyData).toHaveProperty('name', 'Test Survey');

    const { screens } = surveyData;
    expect(screens).toHaveLength(3);

    const { dataElements } = screens[1];
    expect(dataElements).toHaveLength(10);
  });

  it('Should write a survey to the database', async () => {
    const surveyData = readSurveyXSLX('Test Survey', TEST_SURVEY_PATH);

    const program = await writeProgramToDatabase(models, {
      name: 'Test Program',
    });

    expect(program).toBeDefined();
    expect(program.dataValues).toHaveProperty('name', 'Test Program');
    expect(program.dataValues).toHaveProperty('id');

    const survey = await writeSurveyToDatabase(models, program, surveyData);
    expect(survey.dataValues).toHaveProperty('id');

    const { id } = survey.dataValues;

    const components = await models.SurveyScreenComponent.getComponentsForSurvey(survey.id);

    expect(components).toHaveLength(19);

    expect(components.every(c => c.surveyId === id)).toEqual(true);

    const dataElements = components.map(c => c.dataElement);
    // ensure every dataElement is defined and has text
    expect(dataElements.every(q => q)).toEqual(true);
    expect(dataElements.every(q => q.defaultText)).toEqual(true);
  });
});
