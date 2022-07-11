import { cloneDeep } from 'lodash';
import { importProgram } from '../../app/admin/importProgram';
import { preprocessRecordSet } from '../../app/admin/preprocessRecordSet';

const TEST_PROGRAMS_PATH = './__tests__/importers/test_programs.xlsx';

describe('Importing programs', () => {
  let rawData;

  beforeAll(async () => {
    rawData = await importProgram({
      file: TEST_PROGRAMS_PATH,
    });
  });

  it('Should import a survey', async () => {
    const { recordGroups, ...resultInfo } = await preprocessRecordSet(rawData);
    const { records } = resultInfo.stats;
    expect(records).toHaveProperty('program', 1);
    expect(records).toHaveProperty('survey', 1);
    expect(records).toHaveProperty('programDataElement', 21);
    expect(records).toHaveProperty('surveyScreenComponent', 21);
  });

  describe('Survey validation', () => {
    it('Should ensure surveys have all required fields', async () => {
      // Instead of preparing several different files, just copy and modify the raw data
      const clonedRawData = cloneDeep(rawData);
      const requiredSurveyFields = ['id', 'surveyType', 'isSensitive'];

      // Test cloned data before modifying it to ensure it's okay
      const { recordGroups, ...resultInfo } = await preprocessRecordSet(clonedRawData);
      expect(resultInfo.errors.length).toBe(0);

      // Use for...of instead of forEach to properly await each loop
      for (const field of requiredSurveyFields) {
        // Get a fresh object with all keys/values
        clonedRawData[1].data = cloneDeep(rawData[1].data);

        // Remove field
        delete clonedRawData[1].data[field];

        // Process modified record, run validation and expect error
        const {
          recordGroups: modifiedRecordGroups,
          ...modifiedResultInfo
        } = await preprocessRecordSet(clonedRawData);
        expect(modifiedResultInfo.errors.length).toBe(1);
      }
    });
    test.todo('Should ensure questions all have a valid type');
    test.todo('Should ensure visibilityCriteria fields have valid syntax');
    test.todo('Should ensure validationCriteria fields have valid syntax');
    test.todo('Should ensure config fields have valid syntax');
    test.todo('Should ensure calculation fields have valid syntax');
    test.todo('Should ensure options and optionLabels fields have valid syntax');
  });
});
