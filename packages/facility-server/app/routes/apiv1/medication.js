import config from 'config';
import express from 'express';

import {
  simpleGet,
  simplePut,
  simplePost,
  paginatedGetList,
  permissionCheckingRouter,
} from '@tamanu/shared/utils/crudHelpers';

export const medication = express.Router();

medication.get('/:id', simpleGet('EncounterMedication'));
medication.put('/:id', simplePut('EncounterMedication'));
medication.post('/$', simplePost('EncounterMedication'));

const globalMedicationRequests = permissionCheckingRouter('list', 'EncounterMedication');
globalMedicationRequests.get('/$', (req, res, next) =>
  paginatedGetList('EncounterMedication', '', {
    additionalFilters: {
      '$encounter.location.facility.id$': config.serverFacilityId,
    },
    include: [
      {
        model: req.models.Encounter,
        as: 'encounter',
        include: [
          {
            model: req.models.Patient,
            as: 'patient',
          },
          {
            model: req.models.Department,
            as: 'department',
          },
          {
            model: req.models.Location,
            as: 'location',
            include: [
              {
                model: req.models.Facility,
                as: 'facility',
              },
              {
                model: req.models.LocationGroup,
                as: 'locationGroup',
              },
            ],
          },
        ],
      },
    ],
  })(req, res, next),
);
medication.use(globalMedicationRequests);
