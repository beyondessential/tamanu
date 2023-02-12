import { createDummyPatient } from "../../../shared-src/src/demoData/patients";
import { API } from "../../app/api/singletons";
import { initStore } from "../../app/store";

export const { store, history } = initStore(API, {
  patient: createDummyPatient(null, {id: 'test-patient'}),
  auth: {
    ability: {
      can: () => true,
    }
  }
});
