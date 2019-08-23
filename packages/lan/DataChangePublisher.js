import faye from 'faye';

function channelToRecordType(channel) {
  return channel.split('/')[1]; // because '/visit/*' becomes ['', 'visit', '*']
}

class DataChangePublisher {
  constructor(server, database) {
    this.database = database;
    const fayeInstance = new faye.NodeAdapter({ mount: '/faye', timeout: 45 });
    fayeInstance.attach(server);
    this.fayeClient = fayeInstance.getClient();
    this.client.on('subscribe', this.handleSubscribe);
    this.client.on('unsubscribe', this.handleUnsubscribe);
    this.subscriptions = {};
  }

  handleSubscribe = (clientId, channel) => {
    const recordType = channelToRecordType(channel);
    if (this.subscriptions[recordType]) {
      this.subscriptions[recordType].subscribers++;
    } else {
      // subscribe to changes
      const collection = this.database.objects(recordType);
      collection.addListener(this.publishChangesToClients);
      this.subscriptions[recordType] = { collection, subscribers: 0 };
    }
  };

  handleUnsubscribe = (client, channel) => {
    const recordType = channelToRecordType(channel);
    const subscription = this.subscriptions[recordType];
    subscription.subscribers--;
    if (!subscription.subscribers) {
      const { collection } = subscription;
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
