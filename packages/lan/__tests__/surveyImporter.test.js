import {
  readSurveyXSLX,
  writeProgramToDatabase,
  writeSurveyToDatabase,
} from 'lan/app/surveyImporter';
import { createTestContext } from './utilities';

const { models } = createTestContext();

const TEST_SURVEY_PATH = './data/test_programs.xlsx';

describe('Importing surveys', () => {
  it('Should import a survey', () => {
    const surveyData = readSurveyXSLX('Test Survey', TEST_SURVEY_PATH);

    expect(surveyData).toHaveProperty('name', 'Test Survey');

    const { screens } = surveyData;
    expect(screens).toHaveLength(3);

    const { questions } = screens[1];
    expect(questions).toHaveLength(10);
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

    const questions = components.map(c => c.question);
    // ensure every question is defined and has text
    expect(questions.every(q => q)).toEqual(true);
    expect(questions.every(q => q.text)).toEqual(true);
  });
});
