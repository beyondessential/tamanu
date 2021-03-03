import express from 'express';

import {
  simpleGet,
  simplePut,
  simplePost,
  paginatedGetList,
  permissionCheckingRouter,
} from './crudHelpers';

export const medication = express.Router();

medication.get('/:id', simpleGet('EncounterMedication'));
medication.put('/:id', simplePut('EncounterMedication'));
medication.post('/$', simplePost('EncounterMedication'));

const globalMedicationRequests = permissionCheckingRouter('list', 'EncounterMedication');
globalMedicationRequests.get(
  '/$',
  paginatedGetList('EncounterMedication', '', {
    include: [
      {
        association: 'encounter',
        include: ['patient', 'department', 'location'],
      },
    ],
  }),
);
medication.use(globalMedicationRequests);
