import { REPORT_STATUSES } from 'shared/constants';
import {
  findOrCreateDefinition,
  getLatestVersion,
} from '../../../app/subCommands/importReport/utils';

const mockDefinition = {
  name: 'test-definition-name',
};

describe('importReport utils', () => {
  
  describe('getOrCreateDefinition', () => {
    it('calls the findOrCreate function for ReportDefinition', async () => {
      const mockStore = {
        models: {
          ReportDefinition: {
            findOrCreate: jest.fn().mockResolvedValue([mockDefinition, true]),
          },
        },
      };
      const actual = await findOrCreateDefinition('test-name', mockStore);
      expect(mockStore.models.ReportDefinition.findOrCreate).toHaveBeenCalledWith({
        where: {
          name: 'test-name',
        },
      });
      expect(actual).toBe(mockDefinition);
    });
  });

  describe('getLatestVersion', () => {

    it('returns the latest version if no status is provided', async () => {
      const expected = { versionNumber: 3, status: REPORT_STATUSES.DRAFT };
      const mockVersions = [
        { versionNumber: 1, status: REPORT_STATUSES.DRAFT },
        expected,
        { versionNumber: 2, status: REPORT_STATUSES.DRAFT },
      ];
      const actual = getLatestVersion(mockVersions);
      expect(actual).toEqual(expected);
    });

    it('returns the latest version with status provided', async () => {
      const expected = {
        versionNumber: 3,
        status: REPORT_STATUSES.PUBLISHED,
      };
      const mockVersions = [
        { versionNumber: 1, status: REPORT_STATUSES.DRAFT },
        { versionNumber: 2, status: REPORT_STATUSES.DRAFT },
        expected,
        { versionNumber: 4, status: REPORT_STATUSES.DRAFT },
      ];
      const actual = getLatestVersion(mockVersions, REPORT_STATUSES.PUBLISHED);
      expect(actual).toEqual(expected);
    });

    it('does not return version when none found with status provided', async () => {
      const mockVersions = [
        { versionNumber: 1, status: REPORT_STATUSES.DRAFT },
        { versionNumber: 2, status: REPORT_STATUSES.DRAFT },
      ];
      const actual = getLatestVersion(mockVersions, REPORT_STATUSES.PUBLISHED);
      expect(actual).toBeUndefined();
    });
  });
});
