import { describe, expect, it, vi } from 'vitest';
import { REPORT_STATUSES } from '@tamanu/constants';
import {
  findOrCreateDefinition,
  getLatestVersion,
} from '../../../app/subCommands/importReport/utils';

const mockDefinition = {
  name: 'test-definition-name',
};

describe('importReport utils', () => {

  describe('getOrCreateDefinition', () => {
    const mockStoreReturning = (definition, created) => ({
      models: {
        ReportDefinition: {
          findOrCreate: vi.fn().mockResolvedValue([definition, created]),
        },
      },
    });

    it('calls the findOrCreate function for ReportDefinition', async () => {
      const mockStore = mockStoreReturning(mockDefinition, true);
      const actual = await findOrCreateDefinition('test-name', undefined, mockStore);
      expect(mockStore.models.ReportDefinition.findOrCreate).toHaveBeenCalledWith({
        where: {
          name: 'test-name',
        },
        defaults: {},
      });
      expect(actual).toBe(mockDefinition);
    });

    it('creates a new definition on the schema the file declares', async () => {
      const rawDefinition = { ...mockDefinition, dbSchema: 'raw' };
      const mockStore = mockStoreReturning(rawDefinition, true);
      const actual = await findOrCreateDefinition('test-name', 'raw', mockStore);
      expect(mockStore.models.ReportDefinition.findOrCreate).toHaveBeenCalledWith({
        where: { name: 'test-name' },
        defaults: { dbSchema: 'raw' },
      });
      expect(actual).toBe(rawDefinition);
    });

    it('refuses a version for a schema the existing definition is not on', async () => {
      const mockStore = mockStoreReturning({ ...mockDefinition, dbSchema: 'reporting' }, false);
      await expect(findOrCreateDefinition('test-name', 'raw', mockStore)).rejects.toThrow(
        /cannot take a raw version/,
      );
    });

    it('accepts a version for the schema the existing definition is on', async () => {
      const existing = { ...mockDefinition, dbSchema: 'raw' };
      const mockStore = mockStoreReturning(existing, false);
      await expect(findOrCreateDefinition('test-name', 'raw', mockStore)).resolves.toBe(existing);
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
