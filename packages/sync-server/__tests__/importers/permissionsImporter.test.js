import { importPermissions } from '../../app/admin/importPermissions';
import { preprocessRecordSet } from '../../app/admin/preprocessRecordSet';

const TEST_PERMISSIONS_PATH = './__tests__/importers/test_permissions.xlsx';

describe('Importing permissions', () => {
  let resultInfo = null;
  let importedPermissions = null;

  beforeAll(async () => {
    const rawData = await importPermissions({ file: TEST_PERMISSIONS_PATH });
    const { recordGroups: rg, ...rest } = await preprocessRecordSet(rawData);
    resultInfo = rest;
    [, importedPermissions] = rg.find(x => x[0] === 'permission');
  });

  const findErrors = (recordType, text) => {
    const hasError = record => record.errors.some(e => e.includes(text));
    const condition = record => record.recordType === recordType && hasError(record);
    return resultInfo.errors.filter(condition);
  };

  it('Should import some permissions', async () => {
    const { records } = resultInfo.stats;
    expect(records).toHaveProperty('role', 3);
    expect(records).toHaveProperty('permission', 35);
  });

  describe('Permissions validation', () => {
    it('Should forbid duplicates of the same permission', async () => {
      const [err] = findErrors('permission', 'is already being used');
      expect(err).toBeTruthy();
      expect(err.data).toHaveProperty('verb', 'list');
      expect(err.data).toHaveProperty('noun', 'User');
      expect(err.data).toHaveProperty('role', 'reception');
    });

    it('Should forbid permissions with an invalid role', async () => {
      const [err] = findErrors(
        'permission',
        `could not find a record of type role called "invalid"`,
      );
      expect(err).toBeTruthy();
    });
  });

  describe('Checking Ys', () => {
    let yErrors = null;
    beforeAll(() => {
      yErrors = findErrors('permission', `permissions matrix must only use the letter y`);
    });

    it('Should delete a permission with a Y cell set to N', async () => {
      const found = importedPermissions.find(x => x.data.noun === 'ToBeDeleted');
      expect(found.data).toHaveProperty('deletedAt');

      // all others should be null
      const otherFound = importedPermissions.filter(x => x.data.noun !== 'ToBeDeleted');
      otherFound.forEach(record => {
        expect(record.data).toHaveProperty('deletedAt', null);
      });
    });

    it('Should forbid permissions with a matrix cell other than "y"', async () => {
      const wrongLetter = yErrors.find(x => x.data.noun === 'FailDueToWrongLetter');
      expect(wrongLetter).toBeTruthy();
    });

    it('Should not allow multiple ys', async () => {
      const twoLetters = yErrors.find(x => x.data.noun === 'FailDueToTwoLetters');
      expect(twoLetters).toBeTruthy();
    });

    it('Should ignore permissions with a matrix cell with just a space', async () => {
      // shouldn't be a record OR an error, just ignored
      const found = importedPermissions.some(x => x.data.noun === 'FailDueToSpace');
      expect(found).toEqual(false);
    });

    it('Should not be case-sensitive about the Ys', async () => {
      const found = importedPermissions.some(x => x.data.noun === 'SucceedEvenThoughCapitalY');
      expect(found).toEqual(true);
    });

    it('Should ignore whitespace in the y cell', async () => {
      const found = importedPermissions.some(x => x.data.noun === 'SucceedEvenThoughSpace');
      expect(found).toEqual(true);
    });
  });
});
