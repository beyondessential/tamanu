import express from 'express';
import asyncHandler from 'express-async-handler';

import {
  paginatedGetList,
  permissionCheckingRouter,
  simpleGet,
  simplePost,
  simplePut,
} from '@tamanu/shared/utils/crudHelpers';
import { InvalidOperationError } from '@tamanu/shared/errors';

export const medication = express.Router();

medication.get('/:id', simpleGet('Prescription'));
medication.put('/:id', simplePut('Prescription'));
medication.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { models } = req;
    const { encounterId, ...rest } = req.body;
    const { Prescription, EncounterPrescription, MedicationAdministrationRecord } = models;
    req.checkPermission('create', 'Prescription');

    const existingPrescription = await Prescription.findByPk(req.body.id, {
      paranoid: false,
    });
    if (existingPrescription) {
      throw new InvalidOperationError(
        `Cannot create object with id (${req.body.id}), it already exists`,
      );
    }

    const prescription = await Prescription.create(rest);
    await EncounterPrescription.create({ encounterId, prescriptionId: prescription.id });
    await MedicationAdministrationRecord.generateMedicationAdministrationRecords(prescription);
    res.send(prescription);
  }),
);

medication.put(
  '/:id/pharmacy-notes',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const { Prescription } = models;
    const { pharmacyNotes, displayPharmacyNotesInMar } = req.body;
    req.checkPermission('create', 'MedicationPharmacyNote');

    const object = await Prescription.findByPk(params.id);
    if (object.pharmacyNotes && object.pharmacyNotes !== pharmacyNotes) {
      req.checkPermission('write', 'MedicationPharmacyNote');
    }

    object.pharmacyNotes = pharmacyNotes;
    object.displayPharmacyNotesInMar = displayPharmacyNotesInMar;
    await object.save();
    res.send(object);
  }),
);

medication.put('/mar/:id', simplePut('MedicationAdministrationRecord'));
medication.post('/mar', simplePost('MedicationAdministrationRecord'));

const globalMedicationRequests = permissionCheckingRouter('list', 'Prescription');
globalMedicationRequests.get('/$', (req, res, next) =>
  paginatedGetList('Prescription', '', {
    additionalFilters: {
      '$encounter.location.facility.id$': req.query.facilityId,
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
