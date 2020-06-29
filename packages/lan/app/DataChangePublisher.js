import faye from 'faye';

function channelToRecordType(channel) {
  return channel.split('/')[1]; // because '/encounter/*' becomes ['', 'encounter', '*']
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

    this.database.sequelize.addHook('afterSave', this.onRecordUpdate);
  }

  onRecordUpdate = instance => {
    this.publishChangeToClients('update', instance);
  };

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
    const recordType = channelToRecordType(channel);
    if (this.subscriptions[recordType]) {
      this.subscriptions[recordType].subscribers.add(clientId);
    } else {
      // subscribe to changes
      this.subscriptions[recordType] = { subscribers: new Set() };
    }
  };

  handleUnsubscribe = (clientId, channel) => {
    const recordType = channelToRecordType(channel);
    this.subscriptions[recordType].subscribers.delete(clientId);
  };

  handleDisconnect = clientId => {
    Object.entries(this.subscriptions).forEach(([, { subscribers }]) => {
      if (subscribers.has(clientId)) {
        subscribers.delete(clientId);
      }
    });
  };

  publishChangeToClients(changeType, record) {
    const recordType = record.constructor.name.toLowerCase();
    const payload = {};
    switch (recordType) {
      case 'encounter': {
        // TODO may want to also publish _what_ fields in the record have changed, so that the
        // client can be optimised to take specific actions depending on if the field is relevant
        // (e.g. discharge status)
        payload.patientId = record.patientId;
        payload.encounterId = record.id;
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
