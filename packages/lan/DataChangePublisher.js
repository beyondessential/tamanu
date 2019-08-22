import faye from 'faye';

const TRACKED_RECORD_TYPES = ['visit'];

export class DataChangePublisher {
  constructor(server, database) {
    this.database = database;
    const fayeInstance = new faye.NodeAdapter({ mount: '/faye', timeout: 45 });
    fayeInstance.attach(server);
    this.fayeClient = fayeInstance.getClient();
    this.publishChangesToClients = this.publishChangesToClients.bind(this);
    TRACKED_RECORD_TYPES.forEach(recordType => {
      const allObjects = database.objects(recordType);
      allObjects.addListener(this.publishChangesToClients);
    });
  }

  publishChangesToClients(collection, { insertions, newModifications: modifications, deletions }) {
    insertions.forEach(index => {
      this.publishChangeToClients('create', collection[index]);
    });
    modifications.forEach(index => {
      this.publishChangeToClients('update', collection[index]);
    });
    deletions.forEach(index => {
      this.publishChangeToClients('delete', collection[index]);
    });
  }

  publishChangeToClients(changeType, record) {
    const recordType = record.objectSchema().name;
    const payload = {};
    switch (recordType) {
      case 'visit': {
        const patient = record.patient[0];
        payload.patientId = patient._id;
        break;
      }
      default:
        return; // clients don't care about this record type (yet)
    }
    console.log(payload);
    this.fayeClient.publish(`/${recordType}/${changeType}`, payload);
  }
}
