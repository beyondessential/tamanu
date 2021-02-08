import { reloadPatient } from './store/patient';

const ALL_CHANGES = '*';

class DataChangeResponder {
  constructor(api, store) {
    this.api = api;
    this.store = store;

    const listeners = {
      encounter: this.handleEncounterChange,
    };
    Object.entries(listeners).forEach(([recordType, callback]) =>
      api.subscribeToChanges(recordType, ALL_CHANGES, callback),
    );
  }

  handleEncounterChange = ({ patientId }) => {
    // TODO should only reload patient/encounter if relevant changes have been made, e.g. fully new
    // or discharge status has changed, otherwise we'll be reloading things too often!
    const state = this.store.getState();
    if (state.patient.id === patientId) {
      this.store.dispatch(reloadPatient(patientId));
    }
  };
}

export function startDataChangeResponder(api, store) {
  const responder = new DataChangeResponder(api, store);
  return responder;
}
