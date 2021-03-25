import { log } from '~/logging';

export const addPatientMarkForSyncHook = context => {
  context.models.Patient.addHook('afterSave', 'syncWhenMarkedForSync', async patient => {
    try {
      if (patient.changed('markedForSync') && patient.markedForSync && patient.id) {
        log.debug(
          `[syncWhenMarkedForSync] patient ${patient.id} was newly marked for sync, syncing immediately...`,
        );
        await context.syncManager.runSync(patient.id);
      }
    } catch (e) {
      log.warn(`[syncWhenMarkedForSync] patient ${patient.id} failed to sync: ${e.stack}`);
    }
  });
};
