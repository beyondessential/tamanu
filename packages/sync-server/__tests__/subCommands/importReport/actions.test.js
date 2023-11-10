import Table from 'cli-table3';
import { log } from '@tamanu/shared/services/logging';
import { spyOnModule } from '@tamanu/shared/test-helpers/spyOn';
import { initDatabase } from '../../../app/database';
import {
  createVersion,
  getVersionError,
  listVersions,
  DEFAULT_USER_EMAIL,
  ACTIVE_TEXT,
  OVERWRITING_TEXT,
  formatUpdatedAt,
} from '../../../app/subCommands/importReport/actions';

spyOnModule(jest, '../../../app/subCommands/importReport/actions');

const baseVersionData = {
  query: "test-query", 
  queryOptions: {
    parameters: [ 
      {
        parameterField: "TestField", 
        name: "test" 
      }
    ],
    defaultDateRange: "allTime"
  }
};

jest.mock('@tamanu/shared/services/logging', () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockPush = jest.fn();
const mockToString = jest.fn();

jest.mock('cli-table3', () =>
  jest.fn().mockImplementation(() => ({
    push: mockPush,
    toString: mockToString,
  })),
);

const mockDefinition = { id: 'test-definition-id', name: 'test-definition-name' };

const mockUpdatedAt = new Date();
const mockFormattedUpdatedAt = formatUpdatedAt(mockUpdatedAt);

const mockVersions = [
  { versionNumber: 2, status: 'draft', updatedAt: mockUpdatedAt },
  { versionNumber: 1, status: 'draft', updatedAt: mockUpdatedAt },
];

jest.mock('../../../app/database', () => ({
  initDatabase: jest.fn().mockResolvedValue({
    models: {
      User: {
        findOne: jest.fn().mockResolvedValue({
          id: 'test-user-id',
        }),
      },
      ReportDefinitionVersion: {
        upsert: jest.fn().mockResolvedValue([{ versionNumber: 3, status: 'draft' }]),
      },
      LocalSystemFact: {
        get: jest.fn().mockResolvedValue('dummyFact'),
      },
    },
    sequelize: {
      query: jest.fn().mockResolvedValue([]),
    },
  }),
}));

describe('importReport actions', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listVersions', () => {

    it('calls push on table for each version', async () => {
      const mockVersionsWithActive = [
        { versionNumber: 3, status: 'published', updatedAt: mockUpdatedAt },
        ...mockVersions,
      ];
      await listVersions(mockDefinition, mockVersionsWithActive);
      expect(Table).toBeCalled();
      expect(mockPush).nthCalledWith(1, [3, `published ${ACTIVE_TEXT}`, mockFormattedUpdatedAt]);
      expect(mockPush).nthCalledWith(2, [2, 'draft', mockFormattedUpdatedAt]);
      expect(mockPush).nthCalledWith(3, [1, 'draft', mockFormattedUpdatedAt]);
      expect(mockToString).toBeCalled();
    });
  });

  describe('createVersion', () => {

    let mockStore;

    beforeEach(async () => {
      mockStore = await initDatabase();
    });

    it('calls the correct functions and creates version', async () => {
      await createVersion(baseVersionData, mockDefinition, mockVersions, mockStore, true);
      expect(mockStore.models.User.findOne).toHaveBeenCalledWith({
        where: {
          email: DEFAULT_USER_EMAIL,
        },
      });
      expect(mockStore.models.ReportDefinitionVersion.upsert).toHaveBeenCalledWith({
        reportDefinitionId: 'test-definition-id',
        query: 'test-query',
        queryOptions: {
          parameters: [{ parameterField: 'TestField', name: 'test' }],
          defaultDateRange: 'allTime',
        },
        userId: 'test-user-id',
        versionNumber: 3,
      });
    });

    it('calls the correct functions and updates version when versionNumber supplied', async () => {
      const data = {
        ...baseVersionData,
        versionNumber: 1,
      };
      await createVersion(data, mockDefinition, [{ versionNumber: 1 }], mockStore);
      expect(log.warn).nthCalledWith(1, `Version 1 already exists, ${OVERWRITING_TEXT}`);
      expect(mockStore.models.ReportDefinitionVersion.upsert).toBeCalledWith({
        reportDefinitionId: 'test-definition-id',
        query: 'test-query',
        queryOptions: {
          parameters: [{ parameterField: 'TestField', name: 'test' }],
          defaultDateRange: 'allTime',
        },
        userId: 'test-user-id',
        versionNumber: 1,
      });
    });

    it('throws error when versionNumber is invalid', async () => {
      const data = {
        ...baseVersionData,
        versionNumber: 3,
      };
      expect(
        createVersion(data, mockDefinition, [{ versionNumber: 1 }], mockStore),
      ).rejects.toThrow(getVersionError({ versionNumber: 3 }));
    });
  });
});
