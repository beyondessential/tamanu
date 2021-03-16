import { readSurveyXSLX } from 'lan/app/surveyImporter';
import { createTestContext } from './utilities';

const TEST_SURVEY_PATH = './data/test_programs.xlsx';

describe('Importing surveys', () => {

  it('Should import a survey', () => {
    const surveyData = readSurveyXSLX('Test Survey', TEST_SURVEY_PATH);

    expect(surveyData).toHaveProperty('name', 'Test Survey');

    const { screens } = surveyData;
    expect(screens).toHaveLength(3);

    const { dataElements } = screens[1];
    expect(dataElements).toHaveLength(10);
  });

});
