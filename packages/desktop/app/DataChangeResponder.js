const ALL_CHANGES = '*';

class DataChangeResponder {
  constructor(api, store) {
    this.api = api;
    this.store = store;

    const listeners = {};
    Object.entries(listeners).forEach(([recordType, callback]) =>
      api.subscribeToChanges(recordType, ALL_CHANGES, callback),
    );
  }
}

export function startDataChangeResponder(api, store) {
  const responder = new DataChangeResponder(api, store);
  return responder;
}
