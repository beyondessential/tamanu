import { importPermissions } from '../../app/admin/importPermissions';
import { preprocessRecordSet } from '../../app/admin/preprocessRecordSet';

const TEST_PERMISSIONS_PATH = './__tests__/importers/test_permissions.xlsx';

describe('Importing permissions', () => {
  let rawData;

  beforeAll(async () => {
    rawData = await importPermissions({
      file: TEST_PERMISSIONS_PATH,
    });
  });

  const expectError = (recordType, text) => {
    const hasError = record => record.errors.some(e => e.includes(text));
    const condition = record => record.recordType === recordType && hasError(record);
    expect(resultInfo.errors.some(condition)).toEqual(true);
  };

  it('Should import some permissions', async () => {
    const { recordGroups, ...resultInfo } = await preprocessRecordSet(rawData);
    console.log(recordGroups, resultInfo);
    const { records } = resultInfo.stats;
    expect(records).toHaveProperty('role', 6);
    expect(records).toHaveProperty('permission', 10);
  });

  describe('Permissions validation', () => {
    it('Should forbid duplicates of the same permission', async () => {
      
    });

    it('Should forbid permissions with an invalid role', async () => {
      
    });
  });
});
