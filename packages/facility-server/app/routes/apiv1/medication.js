import express from 'express';
import asyncHandler from 'express-async-handler';
import { getCurrentDateTimeString, toDateTimeString } from '@tamanu/utils/dateTime';
import { z } from 'zod';

import {
  paginatedGetList,
  permissionCheckingRouter,
  simpleGet,
} from '@tamanu/shared/utils/crudHelpers';
import { InvalidOperationError, ResourceConflictError } from '@tamanu/shared/errors';
import {
  ADMINISTRATION_FREQUENCIES,
  ADMINISTRATION_STATUS,
  MEDICATION_PAUSE_DURATION_UNITS_LABELS,
  REFERENCE_TYPES,
} from '@tamanu/constants';
import { add, format, isAfter } from 'date-fns';
import { Op } from 'sequelize';

export const medication = express.Router();

medication.get('/:id', simpleGet('Prescription'));

medication.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { models } = req;
    const { encounterId, ...data } = req.body;
    const { Prescription, EncounterPrescription } = models;
    req.checkPermission('create', 'Prescription');

    const existingPrescription = await Prescription.findByPk(req.body.id, {
      paranoid: false,
    });
    if (existingPrescription) {
      throw new InvalidOperationError(
        `Cannot create prescription with id (${req.body.id}), it already exists`,
      );
    }

    if (data.frequency === ADMINISTRATION_FREQUENCIES.IMMEDIATELY || data.isOngoing) {
      data.durationValue = null;
      data.durationUnit = null;
    }

    if (data.durationValue && data.durationUnit) {
      data.endDate = add(new Date(data.startDate), {
        [data.durationUnit]: data.durationValue,
      });
    }

    const prescription = await Prescription.create(data);
    await EncounterPrescription.create({ encounterId, prescriptionId: prescription.id });

    res.send(prescription.forResponse());
  }),
);

const updatePharmacyNotesInputSchema = z
  .object({
    pharmacyNotes: z
      .string()
      .optional()
      .nullable()
      .transform((v) => (!v ? null : v)),
    displayPharmacyNotesInMar: z.boolean().optional(),
  })
  .strip();
medication.put(
  '/:id/pharmacy-notes',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const { Prescription } = models;

    const { pharmacyNotes, displayPharmacyNotesInMar } =
      await updatePharmacyNotesInputSchema.parseAsync(req.body);

    req.checkPermission('create', 'MedicationPharmacyNote');

    const prescription = await Prescription.findByPk(params.id);
    if (!prescription) {
      throw new InvalidOperationError(`Prescription with id ${params.id} not found`);
    }

    if (prescription.pharmacyNotes && prescription.pharmacyNotes !== pharmacyNotes) {
      req.checkPermission('write', 'MedicationPharmacyNote');
    }

    prescription.pharmacyNotes = pharmacyNotes;
    prescription.displayPharmacyNotesInMar = displayPharmacyNotesInMar;
    await prescription.save();
    res.send(prescription.forResponse());
  }),
);

const discontinueInputSchema = z
  .object({
    discontinuingClinicianId: z.string(),
    discontinuingReason: z.string().optional(),
  })
  .strip();
medication.post(
  '/:id/discontinue',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const { Prescription } = models;

    const data = await discontinueInputSchema.parseAsync(req.body);

    req.checkPermission('write', 'Prescription');

    const prescription = await Prescription.findByPk(params.id);
    if (!prescription) {
      throw new InvalidOperationError(`Prescription with id ${params.id} not found`);
    }
    if (prescription.discontinued) {
      throw new ResourceConflictError('Prescription already discontinued');
    }

    Object.assign(prescription, {
      ...data,
      discontinuedDate: getCurrentDateTimeString(),
      discontinued: true,
    });
    await prescription.save();

    const updatedObject = await Prescription.findByPk(params.id, {
      include: Prescription.getListReferenceAssociations(),
    });
    res.send(updatedObject.forResponse());
  }),
);

const pauseMedicationSchema = z
  .object({
    encounterId: z.string().uuid({ message: 'Valid encounter ID is required' }),
    pauseDuration: z.coerce
      .number()
      .positive({ message: 'Pause duration must be a positive number' }),
    pauseTimeUnit: z.enum(Object.keys(MEDICATION_PAUSE_DURATION_UNITS_LABELS), {
      errorMap: () => ({ message: 'Pause time unit must be either "Hours" or "Days"' }),
    }),
    notes: z.string().optional(),
  })
  .strip();
// Pause a medication
medication.post(
  '/:id/pause',
  asyncHandler(async (req, res) => {
    const { models, params, user } = req;
    const { Prescription, EncounterPrescription, EncounterPausePrescription } = models;

    // Validate request body against the schema
    const { encounterId, pauseDuration, pauseTimeUnit, notes } =
      await pauseMedicationSchema.parseAsync(req.body);

    req.checkPermission('write', 'Prescription');

    // Find the prescription
    const prescription = await Prescription.findByPk(params.id);
    if (!prescription) {
      throw new InvalidOperationError(`Prescription with id ${params.id} not found`);
    }

    if (prescription.frequency === ADMINISTRATION_FREQUENCIES.IMMEDIATELY) {
      throw new InvalidOperationError(
        `Medication with frequency ${ADMINISTRATION_FREQUENCIES.IMMEDIATELY} cannot be paused`,
      );
    }

    // Find the encounter prescription link
    const encounterPrescription = await EncounterPrescription.findOne({
      where: {
        prescriptionId: params.id,
        encounterId,
      },
    });

    if (!encounterPrescription) {
      throw new InvalidOperationError(`Prescription is not associated with the provided encounter`);
    }

    // Check if the medication is already paused using the static method
    const { isPaused } = await EncounterPausePrescription.isPrescriptionPaused(params.id);
    if (isPaused) {
      throw new InvalidOperationError(`Medication is already paused`);
    }

    // Calculate the pause end date to validate against prescription end date
    const pauseStartDate = getCurrentDateTimeString();
    const pauseEndDate = add(new Date(pauseStartDate), {
      [pauseTimeUnit]: pauseDuration,
    });

    // Validate that pause duration doesn't extend beyond medication end date
    if (prescription.endDate && isAfter(pauseEndDate, new Date(prescription.endDate))) {
      throw new InvalidOperationError(
        'Pause duration extends beyond the medication end date. Please reduce the pause duration or choose a different medication.',
      );
    }

    // Create pause record (pauseEndDate will be calculated by model hooks)
    const pauseRecord = await EncounterPausePrescription.create({
      encounterPrescriptionId: encounterPrescription.id,
      pauseDuration,
      pauseTimeUnit,
      pauseStartDate,
      pauseEndDate: toDateTimeString(pauseEndDate),
      notes,
      pausingClinicianId: user.id,
      createdBy: user.id,
    });

    // Return the pause record along with the prescription
    res.send({
      prescription: prescription.forResponse(),
      pauseRecord: pauseRecord.forResponse(),
    });
  }),
);

const resumeMedicationSchema = z
  .object({
    encounterId: z.string().uuid({ message: 'Valid encounter ID is required' }),
  })
  .strip();
// Resume a paused medication
medication.post(
  '/:id/resume',
  asyncHandler(async (req, res) => {
    const { models, params, user } = req;
    const { Prescription, EncounterPrescription, EncounterPausePrescription } = models;

    // Validate request body against the schema
    const { encounterId } = await resumeMedicationSchema.parseAsync(req.body);

    req.checkPermission('write', 'Prescription');

    // Find the prescription
    const prescription = await Prescription.findByPk(params.id);
    if (!prescription) {
      throw new InvalidOperationError(`Prescription with id ${params.id} not found`);
    }

    // Find the encounter prescription link
    const encounterPrescription = await EncounterPrescription.findOne({
      where: {
        prescriptionId: params.id,
        encounterId,
      },
    });

    if (!encounterPrescription) {
      throw new InvalidOperationError(`Prescription is not associated with the provided encounter`);
    }

    // Check if the medication is currently paused
    const { isPaused, pauseData } = await EncounterPausePrescription.isPrescriptionPaused(
      params.id,
    );
    if (!isPaused || !pauseData) {
      throw new InvalidOperationError(`Medication is not currently paused`);
    }

    // Update pause record to end now (history is created automatically by model hooks)
    const currentDate = getCurrentDateTimeString();
    pauseData.pauseEndDate = currentDate;
    pauseData.updatedBy = user.id;

    await pauseData.save();

    // Return the updated prescription
    res.send({
      prescription: prescription.forResponse(),
      pauseRecord: pauseData.forResponse(),
    });
  }),
);

const getPauseQuerySchema = z
  .object({
    encounterId: z.string().uuid({ message: 'Valid encounter ID is required' }),
  })
  .strip();
// Get active pause information for a medication
medication.get(
  '/:id/pause',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const { Prescription, EncounterPrescription, EncounterPausePrescription } = models;

    // Validate query params against the schema
    const { encounterId } = await getPauseQuerySchema.parseAsync(req.query);

    req.checkPermission('read', 'Prescription');

    // Find the prescription
    const prescription = await Prescription.findByPk(params.id);
    if (!prescription) {
      throw new InvalidOperationError(`Prescription with id ${params.id} not found`);
    }

    // Find the encounter prescription link - needed for returning the correct pause
    const encounterPrescription = await EncounterPrescription.findOne({
      where: {
        prescriptionId: params.id,
        encounterId,
      },
    });

    if (!encounterPrescription) {
      throw new InvalidOperationError(`Prescription is not associated with the provided encounter`);
    }

    // Check if the medication is paused using our static method
    const { isPaused, pauseData } = await EncounterPausePrescription.isPrescriptionPaused(
      params.id,
    );

    if (!isPaused || !pauseData) {
      // Not paused - return null
      return res.send({ pauseRecord: null });
    }

    // Load associations for the pause record
    await pauseData.reload({
      include: [
        {
          association: 'pausingClinician',
          attributes: ['id', 'displayName'],
        },
      ],
    });

    // Return active pause record
    res.send({ pauseRecord: pauseData.forResponse() });
  }),
);

const getPausesQuerySchema = z
  .object({
    encounterId: z.string().uuid({ message: 'Valid encounter ID is required' }),
    marDate: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(new Date(val).getTime()), {
        message: 'marDate must be a valid date string',
      }),
  })
  .strip();
medication.get(
  '/:id/pauses',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const { Prescription, EncounterPrescription, EncounterPausePrescription } = models;

    // Validate query params against the schema
    const { encounterId, marDate } = await getPausesQuerySchema.parseAsync(req.query);

    req.checkPermission('read', 'Prescription');

    // Find the prescription
    const prescription = await Prescription.findByPk(params.id);
    if (!prescription) {
      throw new InvalidOperationError(`Prescription with id ${params.id} not found`);
    }

    // Find the encounter prescription link
    const encounterPrescription = await EncounterPrescription.findOne({
      where: {
        prescriptionId: params.id,
        encounterId,
      },
    });

    if (!encounterPrescription) {
      throw new InvalidOperationError(`Prescription is not associated with the provided encounter`);
    }

    // Build where clause
    const whereClause = {
      encounterPrescriptionId: encounterPrescription.id,
    };

    // If marDate is provided, filter for pauses that are active on that date
    if (marDate) {
      const startOfMarDate = format(new Date(marDate), 'yyyy-MM-dd 00:00:00');
      const endOfMarDate = format(new Date(marDate), 'yyyy-MM-dd 23:59:59');
      whereClause[Op.and] = [
        { pauseStartDate: { [Op.lte]: endOfMarDate } },
        { pauseEndDate: { [Op.gte]: startOfMarDate } },
      ];
    }

    // Get all pause records for this encounter prescription with filters
    const pauseRecords = await EncounterPausePrescription.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
    });

    // Return pause records
    res.send({
      count: pauseRecords.length,
      data: pauseRecords.map((record) => record.forResponse()),
    });
  }),
);

const pauseHistoryQuerySchema = z
  .object({
    encounterId: z.string().uuid({ message: 'Valid encounter ID is required' }),
  })
  .strip();
// Get pause history for a medication
medication.get(
  '/:id/pause-history',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const { Prescription, EncounterPrescription, EncounterPausePrescriptionHistory } = models;

    // Validate query params against the schema
    const { encounterId } = await pauseHistoryQuerySchema.parseAsync(req.query);

    req.checkPermission('read', 'Prescription');

    // Find the prescription
    const prescription = await Prescription.findByPk(params.id);
    if (!prescription) {
      throw new InvalidOperationError(`Prescription with id ${params.id} not found`);
    }

    // Find the encounter prescription link
    const encounterPrescription = await EncounterPrescription.findOne({
      where: {
        prescriptionId: params.id,
        encounterId,
      },
    });

    if (!encounterPrescription) {
      throw new InvalidOperationError(`Prescription is not associated with the provided encounter`);
    }

    // Get pause history for this encounter prescription
    const pauseHistory = await EncounterPausePrescriptionHistory.findAll({
      where: {
        encounterPrescriptionId: encounterPrescription.id,
      },
      order: [['actionDate', 'DESC']],
    });

    // Return history records
    res.send({
      count: pauseHistory.length,
      data: pauseHistory.map((record) => record.forResponse()),
    });
  }),
);

const givenMarUpdateSchema = z.object({
  dose: z.object({
    doseAmount: z.number(),
    givenTime: z.string().datetime(),
    givenByUserId: z.string(),
  }),
  recordedByUserId: z.string(),
  reasonForChange: z.string().optional(),
});
medication.put(
  '/medication-administration-record/:id/given',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'MedicationAdministrationRecord');
    const { models, params } = req;
    const { MedicationAdministrationRecord, MedicationAdministrationRecordDose, User } = models;

    const { dose, recordedByUserId, reasonForChange } = await givenMarUpdateSchema.parseAsync(
      req.body,
    );

    const record = await MedicationAdministrationRecord.findByPk(params.id);
    if (!record) {
      throw new InvalidOperationError(`MAR with id ${params.id} not found`);
    }

    if (record.status === ADMINISTRATION_STATUS.GIVEN) {
      throw new InvalidOperationError(`MAR with id ${params.id} is already given`);
    }

    //validate recordedByUserId
    const recordedByUser = await User.findByPk(recordedByUserId);
    if (!recordedByUser) {
      throw new InvalidOperationError(`User with id ${recordedByUserId} not found`);
    }

    //validate givenByUserId
    const givenByUser = await User.findByPk(dose.givenByUserId);
    if (!givenByUser) {
      throw new InvalidOperationError(`User with id ${dose.givenByUserId} not found`);
    }

    //Update MAR and add dose to the MAR
    record.status = ADMINISTRATION_STATUS.GIVEN;
    record.recordedByUserId = recordedByUserId;
    record.reasonForChange = reasonForChange;
    if (!record.recordedAt) {
      record.recordedAt = getCurrentDateTimeString();
    }
    await record.save();
    await MedicationAdministrationRecordDose.create({
      marId: record.id,
      doseAmount: dose.doseAmount,
      givenTime: dose.givenTime,
      givenByUserId: dose.givenByUserId,
    });

    res.send(record.forResponse());
  }),
);

const givenMarCreateSchema = z.object({
  dose: z.object({
    doseAmount: z.number(),
    givenTime: z.string().datetime(),
    givenByUserId: z.string(),
  }),
  dueAt: z.string().datetime(),
  prescriptionId: z.string(),
  recordedByUserId: z.string(),
  reasonForChange: z.string().optional(),
});
medication.post(
  '/medication-administration-record/given',
  asyncHandler(async (req, res) => {
    const { models } = req;
    const {
      MedicationAdministrationRecord,
      MedicationAdministrationRecordDose,
      Prescription,
      User,
    } = models;

    req.checkPermission('create', 'MedicationAdministrationRecord');
    const { dose, dueAt, prescriptionId, recordedByUserId, reasonForChange } =
      await givenMarCreateSchema.parseAsync(req.body);

    //validate prescription
    const prescription = await Prescription.findByPk(prescriptionId);
    if (!prescription) {
      throw new InvalidOperationError(`Prescription with id ${prescriptionId} not found`);
    }

    //validate dose
    if (dose.doseAmount <= 0) {
      throw new InvalidOperationError(`Dose amount must be greater than 0`);
    }

    //validate recordedByUserId
    const recordedByUser = await User.findByPk(recordedByUserId);
    if (!recordedByUser) {
      throw new InvalidOperationError(`User with id ${recordedByUserId} not found`);
    }

    //validate givenByUserId
    const givenByUser = await User.findByPk(dose.givenByUserId);
    if (!givenByUser) {
      throw new InvalidOperationError(`User with id ${dose.givenByUserId} not found`);
    }

    //create MAR
    const record = await MedicationAdministrationRecord.create({
      dueAt,
      prescriptionId,
      status: ADMINISTRATION_STATUS.GIVEN,
      recordedAt: getCurrentDateTimeString(),
      recordedByUserId,
      reasonForChange,
    });

    //create dose
    await MedicationAdministrationRecordDose.create({
      marId: record.id,
      doseAmount: dose.doseAmount,
      givenTime: dose.givenTime,
      givenByUserId: dose.givenByUserId,
    });

    res.send(record.forResponse());
  }),
);

const notGivenInputUpdateSchema = z.object({
  reasonNotGivenId: z.string(),
  recordedByUserId: z.string(),
  reasonForChange: z.string().optional(),
});
medication.put(
  '/medication-administration-record/:id/not-given',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'MedicationAdministrationRecord');
    const { models, params } = req;
    const { MedicationAdministrationRecord, User } = models;

    const { reasonNotGivenId, recordedByUserId, reasonForChange } = await notGivenInputUpdateSchema.parseAsync(
      req.body,
    );

    //validate not given reason
    const reasonNotGiven = await req.models.ReferenceData.findByPk(reasonNotGivenId, {
      where: { type: REFERENCE_TYPES.REASON_NOT_GIVEN },
    });
    if (!reasonNotGiven) {
      throw new InvalidOperationError(`Not given reason with id ${reasonNotGivenId} not found`);
    }

    const record = await MedicationAdministrationRecord.findByPk(params.id);
    if (!record) {
      throw new InvalidOperationError(`MAR with id ${params.id} not found`);
    }

    if (record.status === ADMINISTRATION_STATUS.NOT_GIVEN) {
      throw new InvalidOperationError(`MAR with id ${params.id} is already not given`);
    }

    //validate recordedByUserId
    const recordedByUser = await User.findByPk(recordedByUserId);
    if (!recordedByUser) {
      throw new InvalidOperationError(`User with id ${recordedByUserId} not found`);
    }

    //Update MAR
    record.reasonNotGivenId = reasonNotGivenId;
    record.status = ADMINISTRATION_STATUS.NOT_GIVEN;
    record.recordedByUserId = recordedByUserId;
    record.reasonForChange = reasonForChange;
    if (!record.recordedAt) {
      record.recordedAt = getCurrentDateTimeString();
    }
    await record.save();

    res.send(record.forResponse());
  }),
);

const notGivenInputCreateSchema = z.object({
  reasonNotGivenId: z.string(),
  dueAt: z.string().datetime(),
  prescriptionId: z.string(),
  recordedByUserId: z.string(),
  reasonForChange: z.string().optional(),
});
medication.post(
  '/medication-administration-record/not-given',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'MedicationAdministrationRecord');
    const { models } = req;
    const { MedicationAdministrationRecord, Prescription, User } = models;

    const { reasonNotGivenId, dueAt, prescriptionId, recordedByUserId, reasonForChange } =
      await notGivenInputCreateSchema.parseAsync(req.body);

    //validate prescription
    const prescription = await Prescription.findByPk(prescriptionId);
    if (!prescription) {
      throw new InvalidOperationError(`Prescription with id ${prescriptionId} not found`);
    }

    //validate not given reason
    const reasonNotGiven = await req.models.ReferenceData.findByPk(reasonNotGivenId, {
      where: { type: REFERENCE_TYPES.REASON_NOT_GIVEN },
    });
    if (!reasonNotGiven) {
      throw new InvalidOperationError(`Not given reason with id ${reasonNotGivenId} not found`);
    }

    //validate recordedByUserId
    const recordedByUser = await User.findByPk(recordedByUserId);
    if (!recordedByUser) {
      throw new InvalidOperationError(`User with id ${recordedByUserId} not found`);
    }

    //create MAR
    const record = await MedicationAdministrationRecord.create({
      reasonNotGivenId,
      dueAt,
      prescriptionId,
      status: ADMINISTRATION_STATUS.NOT_GIVEN,
      recordedAt: getCurrentDateTimeString(),
      recordedByUserId,
      reasonForChange,
    });

    res.send(record.forResponse());
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
