import { reloadPatient } from './store/patient';
import { reloadVisit } from './store/visit';

const ALL_CHANGES = '*';

class DataChangeResponder {
  constructor(api, store) {
    this.api = api;
    this.store = store;

    const listeners = {
      visit: this.handleVisitChange,
    };
    Object.entries(listeners).forEach(([recordType, callback]) =>
      api.subscribeToChanges(recordType, ALL_CHANGES, callback),
    );
  }

  handleVisitChange = ({ patientId, visitId }) => {
    // TODO should only reload patient/visit if relevant changes have been made, e.g. fully new
    // or discharge status has changed, otherwise we'll be reloading things too often!
    const state = this.store.getState();
    if (state.patient.id === patientId) {
      this.store.dispatch(reloadPatient(patientId));
    }
    if (state.visit.id === visitId) {
      this.store.dispatch(reloadVisit(visitId));
    }
  };
}

export function startDataChangeResponder(api, store) {
  const responder = new DataChangeResponder(api, store);
  return responder;
}
