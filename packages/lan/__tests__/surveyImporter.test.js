import { importProgram } from '~/admin/importProgram';
import { preprocessRecordSet } from '~/admin/preprocessRecordSet';

const TEST_PROGRAMS_PATH = './__tests__/importers/test_programs.xlsx';

describe('Importing programs', () => {

  let resultInfo = null;
  let recordGroups = null;

  beforeAll(async () => {
    const rawData = await importProgram({ 
      file: TEST_PROGRAMS_PATH,
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
    expect(records).toHaveProperty('programDataElement', 21);
    expect(records).toHaveProperty('surveyScreenComponent', 21);
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
