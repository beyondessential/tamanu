import { BackendManager } from './BackendManager';

jest.mock('../infra/db', () => ({
  Database: {
    models: {},
    requestQueryPlannerStatsRefresh: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('./sync', () => ({
  CentralServerConnection: jest.fn(),
  MobileSyncManager: jest.fn(() => ({ isSyncing: false, emitter: { on: jest.fn() } })),
}));

jest.mock('./auth', () => ({ AuthService: jest.fn() }));
jest.mock('./localisation', () => ({ LocalisationService: jest.fn() }));
jest.mock('./settings', () => ({ SettingsService: jest.fn() }));
jest.mock('./permissions', () => ({ PermissionsService: jest.fn() }));
jest.mock('../models/modelsMap', () => ({ MODELS_MAP: {} }));

const { Database } = jest.requireMock('../infra/db');

describe('BackendManager.onAppStateChange()', () => {
  let manager: BackendManager;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = new BackendManager();
    manager.prevAppState = 'active';
  });

  it('refreshes planner stats when the app is backgrounded', () => {
    manager.onAppStateChange('background');

    expect(Database.requestQueryPlannerStatsRefresh).toHaveBeenCalledTimes(1);
    expect(manager.prevAppState).toBe('background');
  });

  it('refreshes planner stats when the app becomes inactive', () => {
    manager.onAppStateChange('inactive');

    expect(Database.requestQueryPlannerStatsRefresh).toHaveBeenCalledTimes(1);
  });

  it('skips the refresh while a sync is running', () => {
    manager.syncManager.isSyncing = true;

    manager.onAppStateChange('background');

    expect(Database.requestQueryPlannerStatsRefresh).not.toHaveBeenCalled();
  });

  it('does not refresh when returning to the foreground', () => {
    manager.prevAppState = 'background';

    manager.onAppStateChange('active');

    expect(Database.requestQueryPlannerStatsRefresh).not.toHaveBeenCalled();
    expect(manager.prevAppState).toBe('active');
  });

  it('does not refresh on background-to-background transitions', () => {
    manager.prevAppState = 'inactive';

    manager.onAppStateChange('background');

    expect(Database.requestQueryPlannerStatsRefresh).not.toHaveBeenCalled();
  });
});
