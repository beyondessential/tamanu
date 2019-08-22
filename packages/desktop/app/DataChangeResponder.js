import { reloadPatient } from './store/patient';

const ALL_CHANGES = '*';

export class DataChangeResponder {
  constructor(api, store) {
    this.api = api;
    this.store = store;
    this.handleVisitChange = this.handleVisitChange.bind(this);

    const listeners = {
      visit: this.handleVisitChange,
    };
    Object.entries(listeners).forEach(([recordType, callback]) =>
      api.subscribeToChanges(recordType, ALL_CHANGES, callback),
    );
  }

  handleVisitChange({ patientId }) {
    const state = this.store.getState();
    if (state.patient.id === patientId) {
      this.store.dispatch(reloadPatient(patientId));
    }
  }
}
