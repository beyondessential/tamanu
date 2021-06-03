import { importSurvey } from '~/admin/importProgram';
import { preprocessRecordSet } from '~/admin/preprocessRecordSet';
import { readSurveyXSLX } from '~/admin/surveyImporter';

const TEST_SURVEY_PATH = './data/test_programs.xlsx';

describe('Importing surveys', () => {

  let resultInfo = null;
  let recordGroups = null;

  beforeAll(async () => {
    const rawData = await importSurvey({ 
      file: TEST_SURVEY_PATH,
      programName: 'Test Program',
      programCode: 'test-program',
      surveyName: 'Test Survey',
      surveyCode: 'test-survey',
    });

    const { 
      recordGroups: rg, 
      ...rest 
    } = await preprocessRecordSet(rawData);

    resultInfo = rest;
    recordGroups = rg;
  });

  it('Should import a survey', () => {
    const { records } = resultInfo.stats;
    expect(records).toHaveProperty('program', 1);
    expect(records).toHaveProperty('survey', 1);
    expect(records).toHaveProperty('programDataElement', 19);
    expect(records).toHaveProperty('surveyScreenComponent', 19);
  });

  describe('Survey validation', () => {
    test.todo('Should ensure questions all have a valid type');
    test.todo('Should ensure visibilityCriteria fields have valid syntax');
    test.todo('Should ensure validationCriteria fields have valid syntax');
    test.todo('Should ensure config fields have valid syntax');
    test.todo('Should ensure calculation fields have valid syntax');
    test.todo('Should ensure options and optionLabels fields have valid syntax');
  });

});
