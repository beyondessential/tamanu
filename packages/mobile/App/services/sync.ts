import { Database } from '~/infra/db';

const TARGET_DUMMY_PATIENT_COUNT = 50;

interface SyncRecord {
  type: string;
}

export class DummySyncSource {

  isSyncing = false; 

  async isSyncAvailable(): Promise<bool> {
    // dummy logic, only importing patients at the moment
    const repo = models.Patient.getRepository();
    const count = await repo.count();
    return count < TARGET_DUMMY_PATIENT_COUNT;
  }

  async syncRecord(record: SyncRecord) {
    // write one single downloaded record to the database
    // - dispatch to different record type importer functions somehow
    // - must allow for partial sync (create vs update/patch)
  }

  async runScheduledSync() {
    // query the server for any new data
    // - how do we know whether data is new?
    //   - send most recent sync date
    //   - or an index?
    //   - do we need a non-synced local table to track config things like this?
    //   - or does it query... all tables? for a sync date?
    // - how do we know which data we want?
    //   - send IDs of patients we're interested in?
    //     - does this mean sending over hundreds of patient IDs in the request?
    //     - or making hundreds of requests (1/patient)
    //     - how does this work w/ LAN sync? 1000s of requests??
    //     - does the sync server track which patients which clients want?
    // - does initial sync work differently?
    //   - sync reference data
    //   - get all provisional patients
  }

  // this is for when the user hits "sync this patient"
  async runManualSync(patientId: string) {
    // this will need to sync data that is older than whatever the "most recent
    // sync" would indicate
    // - just get all historical records for this patient?
    // - some kind of "lastFullSync" field on Patient? 
  }

  //--------------------------------------------------------- 
  
  async importDummyPatients(amount: int) {
    const dummyPatients = new Array(amount)
      .fill(0).map(x => generatePatient());
    const patients = await Promise.all(
      dummyPatients.map(data => importPatient(models, data))
    );
  }

}

