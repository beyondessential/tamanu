import faye from 'faye';

function channelToRecordType(channel) {
  return channel.split('/')[1]; // because '/visit/*' becomes ['', 'visit', '*']
}

const SUBSCRIBE_CHANNEL = '/meta/subscribe';
const UNSUBSCRIBE_CHANNEL = '/meta/unsubscribe';
const DISCONNECT_CHANNEL = '/meta/disconnect';

class DataChangePublisher {
  constructor(server, database) {
    this.database = database;
    const fayeInstance = new faye.NodeAdapter({ mount: '/faye', timeout: 45 });
    fayeInstance.attach(server);
    fayeInstance.addExtension({ incoming: this.handleClientConnection });
    this.fayeClient = fayeInstance.getClient();
    this.subscriptions = {};
  }

  handleClientConnection = (message, callback) => {
    const { channel, subscription, clientId } = message;
    switch (channel) {
      case SUBSCRIBE_CHANNEL:
        this.handleSubscribe(clientId, subscription);
        break;
      case UNSUBSCRIBE_CHANNEL:
        this.handleUnsubscribe(clientId, subscription);
        break;
      case DISCONNECT_CHANNEL:
        this.handleDisconnect(clientId);
        break;
      default:
      // do nothing
    }
    callback(message); // continue with regular faye behaviour
  };

  handleSubscribe = (clientId, channel) => {
    console.log('handling');
    const recordType = channelToRecordType(channel);
    if (this.subscriptions[recordType]) {
      this.subscriptions[recordType].subscribers.add(clientId);
    } else {
      // subscribe to changes
      const collection = this.database.objects(recordType);
      collection.addListener(this.publishChangesToClients);
      this.subscriptions[recordType] = { collection, subscribers: new Set() };
    }
  };

  handleUnsubscribe = (clientId, channel) => {
    const recordType = channelToRecordType(channel);
    this.subscriptions[recordType].subscribers.delete(clientId);
    this.removeListenerIfOrphaned(recordType);
  };

  handleDisconnect = clientId => {
    Object.entries(this.subscriptions).forEach(([recordType, { subscribers }]) => {
      if (subscribers.has(clientId)) {
        subscribers.delete(clientId);
        this.removeListenerIfOrphaned(recordType);
      }
    });
  };

  removeListenerIfOrphaned = recordType => {
    const { collection, subscribers } = this.subscriptions[recordType];
    if (subscribers.length === 0) {
      collection.removeListener(this.publishChangesToClients);
      delete this.subscriptions[recordType];
    }
  };

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
