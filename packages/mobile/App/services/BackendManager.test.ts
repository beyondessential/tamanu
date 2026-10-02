import { BackendManager } from './BackendManager';

jest.mock('../infra/db', () => ({
  Database: {
    models: {},
    requestPragmaOptimize: jest.fn().mockResolvedValue(undefined),
    requestSpaceReclaim: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('./sync', () => ({
  CentralServerConnection: jest.fn(),
  MobileSyncManager: jest.fn(() => ({ isSyncing: false })),
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

    expect(Database.requestPragmaOptimize).toHaveBeenCalledTimes(1);
    expect(manager.prevAppState).toBe('background');
  });

  it('refreshes planner stats when the app becomes inactive', () => {
    manager.onAppStateChange('inactive');

    expect(Database.requestPragmaOptimize).toHaveBeenCalledTimes(1);
  });

  it('reclaims space after the planner stats refresh has finished', async () => {
    let finishRefresh: () => void;
    Database.requestPragmaOptimize.mockReturnValueOnce(
      new Promise<void>(resolve => {
        finishRefresh = resolve;
      }),
    );

    manager.onAppStateChange('background');
    await Promise.resolve();
    expect(Database.requestSpaceReclaim).not.toHaveBeenCalled();

    finishRefresh();
    await Promise.resolve();
    expect(Database.requestSpaceReclaim).toHaveBeenCalledTimes(1);
  });

  it('does not reclaim space if a sync started during the planner stats refresh', async () => {
    let finishRefresh: () => void;
    Database.requestPragmaOptimize.mockReturnValueOnce(
      new Promise<void>(resolve => {
        finishRefresh = resolve;
      }),
    );

    manager.onAppStateChange('background');
    manager.syncManager.isSyncing = true;
    finishRefresh();
    await Promise.resolve();

    expect(Database.requestSpaceReclaim).not.toHaveBeenCalled();
  });

  it('does not reclaim space if the app came back to the foreground during the refresh', async () => {
    let finishRefresh: () => void;
    Database.requestPragmaOptimize.mockReturnValueOnce(
      new Promise<void>(resolve => {
        finishRefresh = resolve;
      }),
    );

    manager.onAppStateChange('background');
    manager.onAppStateChange('active');
    finishRefresh();
    await Promise.resolve();

    expect(Database.requestSpaceReclaim).not.toHaveBeenCalled();
  });

  it('skips the refresh while a sync is running', () => {
    manager.syncManager.isSyncing = true;

    manager.onAppStateChange('background');

    expect(Database.requestPragmaOptimize).not.toHaveBeenCalled();
    expect(Database.requestSpaceReclaim).not.toHaveBeenCalled();
  });

  it('does not refresh when returning to the foreground', () => {
    manager.prevAppState = 'background';

    manager.onAppStateChange('active');

    expect(Database.requestPragmaOptimize).not.toHaveBeenCalled();
    expect(manager.prevAppState).toBe('active');
  });

  it('does not refresh on background-to-background transitions', () => {
    manager.prevAppState = 'inactive';

    manager.onAppStateChange('background');

    expect(Database.requestPragmaOptimize).not.toHaveBeenCalled();
  });
});
