import { createDummyPatient } from '@tamanu/database/demoData/patients';
import { API } from '../../app/api/singletons';
import { initStore } from '../../app/store';
import { mockLocalisationData } from './config';

export const { store, history } = initStore(API, {
  patient: createDummyPatient(null, { id: 'test-patient' }),
  auth: {
    user: {
      id: 'test-user-id',
    },
    localisation: mockLocalisationData.data,
    ability: {
      can: () => true,
    },
  },
});
