import faye from 'faye';

const TRACKED_RECORD_TYPES = ['visit'];

class DataChangePublisher {
  constructor(server, database) {
    this.database = database;
    const fayeInstance = new faye.NodeAdapter({ mount: '/faye', timeout: 45 });
    fayeInstance.attach(server);
    this.fayeClient = fayeInstance.getClient();
    TRACKED_RECORD_TYPES.forEach(recordType => {
      const allObjects = database.objects(recordType);
      allObjects.addListener(this.publishChangesToClients);
    });
  }

  publishChangesToClients = (
    collection,
    { insertions, newModifications: modifications, deletions },
  ) => {
    insertions.forEach(index => {
      this.publishChangeToClients('create', collection[index]);
    });
    modifications.forEach(index => {
      this.publishChangeToClients('update', collection[index]);
    });
    deletions.forEach(index => {
      this.publishChangeToClients('delete', collection[index]);
    });
  };

  publishChangeToClients(changeType, record) {
    const recordType = record.objectSchema().name;
    const payload = {};
    switch (recordType) {
      case 'visit': {
        // TODO may want to also publish _what_ fields in the record have changed, so that the
        // client can be optimised to take specific actions depending on if the field is relevant
        // (e.g. discharge status)
        const patient = record.patient[0];
        payload.patientId = patient._id;
        payload.visitId = record._id;
        break;
      }
      default:
        return; // clients don't care about this record type (yet)
    }
    this.fayeClient.publish(`/${recordType}/${changeType}`, payload);
  }
}

export function startDataChangePublisher(server, database) {
  const publisher = new DataChangePublisher(server, database);
  return publisher;
}
