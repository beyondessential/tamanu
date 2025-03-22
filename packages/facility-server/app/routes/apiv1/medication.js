import express from 'express';
import asyncHandler from 'express-async-handler';

import {
  paginatedGetList,
  permissionCheckingRouter,
  simpleGet,
  simplePut,
} from '@tamanu/shared/utils/crudHelpers';
import { InvalidOperationError, NotFoundError, ResourceConflictError } from '@tamanu/shared/errors';
import { z } from 'zod';

export const medication = express.Router();

medication.get('/:id', simpleGet('Prescription'));
medication.put('/:id', simplePut('Prescription'));
medication.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { models } = req;
    const { encounterId, ...rest } = req.body;
    const { Prescription, EncounterPrescription } = models;
    req.checkPermission('create', 'Prescription');

    const existingObject = await Prescription.findByPk(req.body.id, {
      paranoid: false,
    });
    if (existingObject) {
      throw new InvalidOperationError(
        `Cannot create object with id (${req.body.id}), it already exists`,
      );
    }

    const object = await Prescription.create(rest);
    await EncounterPrescription.create({ encounterId, prescriptionId: object.id });
    res.send(object);
  }),
);

const updatePharmacyNotesInputSchema = z.object({
  pharmacyNotes: z.string().optional(),
  displayPharmacyNotesInMar: z.boolean().optional(),
});
medication.put(
  '/:id/pharmacy-notes',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const { Prescription } = models;

    const { pharmacyNotes, displayPharmacyNotesInMar } =
      await updatePharmacyNotesInputSchema.parseAsync(req.body);

    req.checkPermission('create', 'MedicationPharmacyNote');

    const object = await Prescription.findByPk(params.id);
    if (!object) {
      throw new NotFoundError('Prescription not found');
    }

    if (object.pharmacyNotes && object.pharmacyNotes !== pharmacyNotes) {
      req.checkPermission('write', 'MedicationPharmacyNote');
    }
    object.pharmacyNotes = pharmacyNotes;
    object.displayPharmacyNotesInMar = displayPharmacyNotesInMar;
    await object.save();
    res.send(object);
  }),
);

const discontinueInputSchema = z.object({
  discontinuingClinicianId: z.string(),
  discontinuedDate: z.string(),
  discontinuingReason: z.string().optional(),
});
medication.put(
  '/:id/discontinue',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const { Prescription } = models;

    const data = await discontinueInputSchema.parseAsync(req.body);

    req.checkPermission('write', 'Prescription');

    const object = await Prescription.findByPk(params.id);
    if (!object) {
      throw new NotFoundError('Prescription not found');
    }
    if (object.discontinued) {
      throw new ResourceConflictError('Prescription already discontinued');
    }

    Object.assign(object, { ...data, discontinued: true });
    await object.save();

    const updatedObject = await Prescription.findByPk(params.id, {
      include: Prescription.getListReferenceAssociations(),
    });
    res.send(updatedObject);
  }),
);

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
