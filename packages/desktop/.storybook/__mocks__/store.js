import { createDummyPatient } from "shared/demoData/patients";
import { API } from "../../app/api/singletons";
import { initStore } from "../../app/store";
import { mockLocalisationData } from "./config";

export const { store, history } = initStore(API, {
  patient: createDummyPatient(null, {id: 'test-patient'}),
  auth: {
    localisation: mockLocalisationData.data,
    ability: {
      can: () => true,
    }
  }
});
