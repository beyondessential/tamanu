import { CentralSyncManager } from '../../app/sync/CentralSyncManager';

/*
  There was not enough time to actually write these tests but will
  leave general notes for the future here.

  - Probably a good idea to call .restoreConfig afterEach test (see line X).
  - If you needed to overwrite config just call CentralSyncManager.overrideConfig(customConfigObject).
  - Initializing the CentralSyncManager needs the app context or a mock like:
      const syncManager = new CentralSyncManager({
        store: {
          models: {
            SyncSession: {
              findAll: async () => [],
            },
          },
          sequelize: {},
        },
        onClose: () => {},
      });

      // Also if using this mock remember to call .close() on the instance. i.e.:
      syncManager.close();
*/

describe('CentralSyncManager', () => {
  describe('startSession', () => {
    afterEach(() => {
      CentralSyncManager.restoreConfig();
    });

    it.todo('creates a new session');
    it.todo('tick-tocks the global clock');
    it.todo('allows concurrent sync sessions');
  });

  describe('connectToSession', () => {
    it.todo('all');
  });

  describe('endSession', () => {
    it.todo('all');
  });

  describe('setupSnapshotForPull', () => {
    it.todo('all');
  });

  describe('addIncomingChanges', () => {
    it.todo('all');
  });
});
