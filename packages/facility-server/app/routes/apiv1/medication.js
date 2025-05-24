import express from 'express';
import asyncHandler from 'express-async-handler';
import {
  datetimeCustomValidation,
  getCurrentDateTimeString,
  toDateTimeString,
} from '@tamanu/utils/dateTime';
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
  NOTE_RECORD_TYPES,
  NOTE_TYPES,
  REFERENCE_TYPES,
} from '@tamanu/constants';
import { add, format, isAfter, isEqual } from 'date-fns';
import { Op } from 'sequelize';

export const medication = express.Router();

medication.get('/:id', simpleGet('Prescription', { auditAccess: true }));

medication.post(
  '/patientOngoingPrescription/:patientId',
  asyncHandler(async (req, res) => {
    const { models, db } = req;
    const patientId = req.params.patientId;
    const data = req.body;
    const { Prescription, Patient, PatientOngoingPrescription } = models;
    req.checkPermission('create', 'Prescription');

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      throw new InvalidOperationError(`Patient with id ${patientId} not found`);
    }

    const result = await db.transaction(async (transaction) => {
      const prescription = await Prescription.create(data, { transaction });
      await PatientOngoingPrescription.create(
        { patientId, prescriptionId: prescription.id },
        { transaction },
      );
      return prescription;
    });

    res.send(result.forResponse());
  }),
);
medication.post(
  '/encounterPrescription/:encounterId',
  asyncHandler(async (req, res) => {
    const { models, db } = req;
    const encounterId = req.params.encounterId;
    const data = req.body;
    const { Prescription, Encounter, EncounterPrescription, MedicationAdministrationRecord } =
      models;
    req.checkPermission('create', 'Prescription');

    const encounter = await Encounter.findByPk(encounterId);
    if (!encounter) {
      throw new InvalidOperationError(`Encounter with id ${encounterId} not found`);
    }
    if (new Date(data.startDate) < new Date(encounter.startDate)) {
      throw new InvalidOperationError(
        `Cannot create prescription with start date (${data.startDate}) before encounter start date (${encounter.startDate})`,
      );
    }

    const result = await db.transaction(async (transaction) => {
      const prescription = await Prescription.create(data, { transaction });
      await EncounterPrescription.create(
        { encounterId, prescriptionId: prescription.id },
        { transaction },
      );
      await MedicationAdministrationRecord.generateMedicationAdministrationRecords(prescription);
      return prescription;
    });

    res.send(result.forResponse());
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
    discontinuingDate: datetimeCustomValidation.optional(),
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
      discontinuedDate: data.discontinuingDate
        ? toDateTimeString(data.discontinuingDate)
        : getCurrentDateTimeString(),
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
    pauseStartDate: datetimeCustomValidation.optional(),
  })
  .strip();
// Pause a medication
medication.post(
  '/:id/pause',
  asyncHandler(async (req, res) => {
    const { models, params, user } = req;
    const { Prescription, EncounterPrescription, EncounterPausePrescription } = models;

    // Validate request body against the schema
    const {
      encounterId,
      pauseDuration,
      pauseTimeUnit,
      notes,
      pauseStartDate: pauseStartDateInput,
    } = await pauseMedicationSchema.parseAsync(req.body);

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
    const pauseStartDate = pauseStartDateInput
      ? toDateTimeString(pauseStartDateInput)
      : getCurrentDateTimeString();
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
      order: [['pauseEndDate', 'DESC']],
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

const givenMarUpdateSchema = z
  .object({
    dose: z.object({
      doseAmount: z.number(),
      givenTime: datetimeCustomValidation,
      givenByUserId: z.string().optional(),
      recordedByUserId: z.string().optional(),
    }),
    recordedByUserId: z.string().optional(),
    changingStatusReason: z.string().optional(),
  })
  .strip();
medication.put(
  '/medication-administration-record/:id/given',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'MedicationAdministrationRecord');
    const { models, params } = req;
    const { MedicationAdministrationRecord, MedicationAdministrationRecordDose, User } = models;

    const { dose, recordedByUserId, changingStatusReason } = await givenMarUpdateSchema.parseAsync(
      req.body,
    );

    const record = await MedicationAdministrationRecord.findByPk(params.id);
    if (!record) {
      throw new InvalidOperationError(`MAR with id ${params.id} not found`);
    }

    if (record.status === ADMINISTRATION_STATUS.GIVEN) {
      throw new InvalidOperationError(`MAR with id ${params.id} is already given`);
    }

    if (recordedByUserId) {
      const recordedByUser = await User.findByPk(recordedByUserId);
      if (!recordedByUser) {
        throw new InvalidOperationError(`User with id ${recordedByUserId} not found`);
      }
    }

    if (dose.recordedByUserId) {
      const doseRecordedByUser = await User.findByPk(dose.recordedByUserId);
      if (!doseRecordedByUser) {
        throw new InvalidOperationError(`User with id ${dose.recordedByUserId} not found`);
      }
    }

    //validate givenByUserId
    if (dose.givenByUserId) {
      const givenByUser = await User.findByPk(dose.givenByUserId);
      if (!givenByUser) {
        throw new InvalidOperationError(`User with id ${dose.givenByUserId} not found`);
      }
    }

    record.status = ADMINISTRATION_STATUS.GIVEN;
    record.recordedByUserId = recordedByUserId || req.user.id;
    record.changingStatusReason = changingStatusReason;
    if (!record.recordedAt) {
      record.recordedAt = getCurrentDateTimeString();
    } else {
      record.isEdited = true;
    }
    await record.save();

    await MedicationAdministrationRecordDose.create({
      marId: record.id,
      doseAmount: dose.doseAmount,
      givenTime: dose.givenTime,
      givenByUserId: dose.givenByUserId || req.user.id,
      recordedByUserId: dose.recordedByUserId || req.user.id,
      doseIndex: 0,
    });

    res.send(record.forResponse());
  }),
);

const givenMarCreateSchema = z
  .object({
    dose: z.object({
      doseAmount: z.number(),
      givenTime: datetimeCustomValidation,
    }),
    dueAt: datetimeCustomValidation,
    prescriptionId: z.string(),
    changingStatusReason: z.string().optional(),
  })
  .strip();
medication.post(
  '/medication-administration-record/given',
  asyncHandler(async (req, res) => {
    const { models } = req;
    const { MedicationAdministrationRecord, MedicationAdministrationRecordDose } = models;

    req.checkPermission('create', 'MedicationAdministrationRecord');
    const { dose, dueAt, prescriptionId, changingStatusReason } =
      await givenMarCreateSchema.parseAsync(req.body);

    //validate dose
    if (dose.doseAmount <= 0) {
      throw new InvalidOperationError(`Dose amount must be greater than 0`);
    }

    //create MAR
    const record = await MedicationAdministrationRecord.create({
      dueAt,
      prescriptionId,
      status: ADMINISTRATION_STATUS.GIVEN,
      recordedAt: getCurrentDateTimeString(),
      recordedByUserId: req.user.id,
      changingStatusReason,
    });

    //create dose
    await MedicationAdministrationRecordDose.create({
      marId: record.id,
      doseAmount: dose.doseAmount,
      givenTime: dose.givenTime,
      givenByUserId: req.user.id,
      recordedByUserId: req.user.id,
      doseIndex: 0,
    });

    res.send(record.forResponse());
  }),
);

const notGivenInfoInputUpdateSchema = z
  .object({
    reasonNotGivenId: z.string(),
    recordedByUserId: z.string(),
    changingNotGivenInfoReason: z.string().optional(),
  })
  .strip();
medication.put(
  '/medication-administration-record/:id/not-given-info',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'MedicationAdministrationRecord');
    const { models, params } = req;
    const { MedicationAdministrationRecord, User } = models;

    const { reasonNotGivenId, recordedByUserId, changingNotGivenInfoReason } =
      await notGivenInfoInputUpdateSchema.parseAsync(req.body);

    const record = await MedicationAdministrationRecord.findByPk(params.id);
    if (!record) {
      throw new InvalidOperationError(`MAR with id ${params.id} not found`);
    }

    const recordedByUser = await User.findByPk(recordedByUserId);
    if (!recordedByUser) {
      throw new InvalidOperationError(`User with id ${recordedByUserId} not found`);
    }

    const reasonNotGiven = await req.models.ReferenceData.findByPk(reasonNotGivenId, {
      where: { type: REFERENCE_TYPES.MEDICATION_NOT_GIVEN_REASON },
    });
    if (!reasonNotGiven) {
      throw new InvalidOperationError(`Not given reason with id ${reasonNotGivenId} not found`);
    }

    if (
      record.reasonNotGivenId === reasonNotGivenId &&
      record.recordedByUserId === recordedByUserId
    ) {
      throw new InvalidOperationError(`No changes were made to the MAR`);
    }

    record.reasonNotGivenId = reasonNotGivenId;
    record.recordedByUserId = recordedByUserId;
    record.changingNotGivenInfoReason = changingNotGivenInfoReason;
    record.isEdited = true;
    await record.save();

    res.send(record.forResponse());
  }),
);

const notGivenInputUpdateSchema = z
  .object({
    reasonNotGivenId: z.string(),
    recordedByUserId: z.string().optional(),
    changingStatusReason: z.string().optional(),
  })
  .strip();
medication.put(
  '/medication-administration-record/:id/not-given',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'MedicationAdministrationRecord');
    const { models, params } = req;
    const { MedicationAdministrationRecord, MedicationAdministrationRecordDose, User } = models;

    const { reasonNotGivenId, recordedByUserId, changingStatusReason } =
      await notGivenInputUpdateSchema.parseAsync(req.body);

    //validate not given reason
    const reasonNotGiven = await req.models.ReferenceData.findByPk(reasonNotGivenId, {
      where: { type: REFERENCE_TYPES.MEDICATION_NOT_GIVEN_REASON },
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
    if (recordedByUserId) {
      const recordedByUser = await User.findByPk(recordedByUserId);
      if (!recordedByUser) {
        throw new InvalidOperationError(`User with id ${recordedByUserId} not found`);
      }
    }

    record.reasonNotGivenId = reasonNotGivenId;
    record.status = ADMINISTRATION_STATUS.NOT_GIVEN;
    record.recordedByUserId = recordedByUserId || req.user.id;
    record.changingStatusReason = changingStatusReason;
    if (!record.recordedAt) {
      record.recordedAt = getCurrentDateTimeString();
    } else {
      record.isEdited = true;
    }
    await record.save();

    await MedicationAdministrationRecordDose.destroy({
      where: {
        marId: record.id,
      },
    });

    res.send(record.forResponse());
  }),
);

const notGivenInputCreateSchema = z
  .object({
    reasonNotGivenId: z.string(),
    dueAt: datetimeCustomValidation,
    prescriptionId: z.string(),
    changingStatusReason: z.string().optional(),
  })
  .strip();
medication.post(
  '/medication-administration-record/not-given',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'MedicationAdministrationRecord');
    const { models } = req;
    const { MedicationAdministrationRecord } = models;

    const { reasonNotGivenId, dueAt, prescriptionId, changingStatusReason } =
      await notGivenInputCreateSchema.parseAsync(req.body);

    //validate not given reason
    const reasonNotGiven = await req.models.ReferenceData.findByPk(reasonNotGivenId, {
      where: { type: REFERENCE_TYPES.MEDICATION_NOT_GIVEN_REASON },
    });
    if (!reasonNotGiven) {
      throw new InvalidOperationError(`Not given reason with id ${reasonNotGivenId} not found`);
    }

    //create MAR
    const record = await MedicationAdministrationRecord.create({
      reasonNotGivenId,
      dueAt,
      prescriptionId,
      status: ADMINISTRATION_STATUS.NOT_GIVEN,
      recordedAt: getCurrentDateTimeString(),
      recordedByUserId: req.user.id,
      changingStatusReason,
    });

    res.send(record.forResponse());
  }),
);

const updateMarInputSchema = z
  .object({
    isError: z.boolean().optional(),
    errorNotes: z.string().optional(),
    doses: z
      .array(
        z
          .object({
            doseAmount: z.number(),
            givenTime: datetimeCustomValidation,
            givenByUserId: z.string(),
            recordedByUserId: z.string(),
          })
          .strip(),
      )
      .optional(),
  })
  .strip();
medication.put(
  '/medication-administration-record/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'MedicationAdministrationRecord');
    const { models, params } = req;
    const marId = params.id;
    const {
      MedicationAdministrationRecord,
      MedicationAdministrationRecordDose,
      User,
      Prescription,
      Note,
    } = models;

    const { isError, errorNotes, doses } = await updateMarInputSchema.parseAsync(req.body);

    const existingMar = await MedicationAdministrationRecord.findByPk(marId, {
      include: [
        {
          model: Prescription,
          as: 'prescription',
          include: ['encounterPrescription', 'medication'],
        },
      ],
    });
    if (!existingMar) {
      throw new InvalidOperationError(`MAR with id ${marId} not found`);
    }

    if (existingMar.status !== ADMINISTRATION_STATUS.GIVEN && doses?.length) {
      throw new InvalidOperationError(`MAR with id ${marId} is not given and cannot have doses`);
    }

    if (isError) {
      existingMar.isError = isError;
      existingMar.errorNotes = errorNotes;
    }

    await existingMar.save();

    if (doses.length) {
      for (const dose of doses) {
        const givenByUser = await User.findByPk(dose.givenByUserId);
        if (!givenByUser) {
          throw new InvalidOperationError(`User with id ${dose.givenByUserId} not found`);
        }

        const recordedByUser = await User.findByPk(dose.recordedByUserId);
        if (!recordedByUser) {
          throw new InvalidOperationError(`User with id ${dose.recordedByUserId} not found`);
        }
      }

      const lastDoseIndex = await MedicationAdministrationRecordDose.max('doseIndex', {
        where: { marId },
      });

      const dosesToCreate = doses.map((d, index) => ({
        ...d,
        marId,
        doseIndex: lastDoseIndex + index + 1,
      }));

      await MedicationAdministrationRecordDose.bulkCreate(dosesToCreate);
    }

    const currentDate = getCurrentDateTimeString();
    await Note.create({
      content:
        `Medication error recorded for ${existingMar.prescription.medication.name} dose recorded at ${existingMar.recordedAt}. ${errorNotes || ''}`.trim(),
      authorId: req.user.id,
      recordId: existingMar.prescription.encounterPrescription.encounterId,
      date: currentDate,
      noteType: NOTE_TYPES.SYSTEM,
      recordType: NOTE_RECORD_TYPES.ENCOUNTER,
    });

    res.send(existingMar.forResponse());
  }),
);

medication.get(
  '/:id/medication-administration-record/doses',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'MedicationAdministrationRecordDose');
    const { models, params } = req;
    const { MedicationAdministrationRecordDose } = models;

    const doses = await MedicationAdministrationRecordDose.findAll({
      where: { marId: params.id },
      include: [
        {
          association: 'givenByUser',
          attributes: ['id', 'displayName'],
        },
        {
          association: 'recordedByUser',
          attributes: ['id', 'displayName'],
        },
      ],
      order: [['doseIndex', 'ASC']],
    });

    res.send({
      count: doses.length,
      data: doses.map((dose) => dose.forResponse()),
    });
  }),
);

const updateDoseSchema = z.object({
  doseAmount: z.number(),
  givenTime: datetimeCustomValidation,
  givenByUserId: z.string(),
  recordedByUserId: z.string(),
  reasonForChange: z.string().optional(),
});
medication.put(
  '/medication-administration-record/doses/:doseId',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'MedicationAdministrationRecordDose');
    const { models, params } = req;
    const { doseId } = params;
    const { MedicationAdministrationRecordDose, User, MedicationAdministrationRecord } = models;

    const { doseAmount, givenTime, givenByUserId, recordedByUserId, reasonForChange } =
      await updateDoseSchema.parseAsync(req.body);

    const doseObject = await MedicationAdministrationRecordDose.findByPk(doseId);
    if (!doseObject) {
      throw new InvalidOperationError(`Dose with id ${doseId} not found`);
    }

    const givenByUser = await User.findByPk(givenByUserId);
    if (!givenByUser) {
      throw new InvalidOperationError(`User with id ${givenByUserId} not found`);
    }

    const recordedByUser = await User.findByPk(recordedByUserId);
    if (!recordedByUser) {
      throw new InvalidOperationError(`User with id ${recordedByUserId} not found`);
    }

    if (
      Number(doseObject.doseAmount) === doseAmount &&
      isEqual(new Date(doseObject.givenTime), new Date(givenTime)) &&
      doseObject.givenByUserId === givenByUserId &&
      doseObject.recordedByUserId === recordedByUserId
    ) {
      throw new InvalidOperationError(`No changes were made to the dose`);
    }

    doseObject.doseAmount = doseAmount;
    doseObject.givenTime = givenTime;
    doseObject.givenByUserId = givenByUserId;
    doseObject.recordedByUserId = recordedByUserId;
    doseObject.reasonForChange = reasonForChange;
    await doseObject.save();

    await MedicationAdministrationRecord.update(
      {
        isEdited: true,
      },
      {
        where: {
          id: doseObject.marId,
        },
      },
    );

    res.send(doseObject.forResponse());
  }),
);

const deleteDoseInputSchema = z
  .object({
    reasonForRemoval: z.string().optional(),
  })
  .strip();
medication.delete(
  '/medication-administration-record/doses/:doseId',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'MedicationAdministrationRecord');
    const { models, params, query } = req;
    const doseId = params.doseId;
    const { MedicationAdministrationRecordDose } = models;

    const { reasonForRemoval } = await deleteDoseInputSchema.parseAsync(query);

    const existingDose = await MedicationAdministrationRecordDose.findByPk(doseId);
    if (!existingDose) {
      throw new InvalidOperationError(`Dose with id ${doseId} not found`);
    }

    if (existingDose.doseIndex === 0) {
      throw new InvalidOperationError(`Cannot delete primary dose`);
    }

    existingDose.reasonForRemoval = reasonForRemoval;
    existingDose.isRemoved = true;
    await existingDose.save();

    res.send(existingDose.forResponse());
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
