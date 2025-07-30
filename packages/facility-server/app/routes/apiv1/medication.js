import express from 'express';
import asyncHandler from 'express-async-handler';
import {
  dateCustomValidation,
  datetimeCustomValidation,
  getCurrentDateTimeString,
  toDateTimeString,
} from '@tamanu/utils/dateTime';
import { z } from 'zod';

import { paginatedGetList, permissionCheckingRouter } from '@tamanu/shared/utils/crudHelpers';
import { NotFoundError, InvalidOperationError, ResourceConflictError } from '@tamanu/shared/errors';
import {
  ADMINISTRATION_FREQUENCIES,
  ADMINISTRATION_STATUS,
  DRUG_ROUTES,
  DRUG_UNITS,
  MEDICATION_DURATION_UNITS,
  MEDICATION_PAUSE_DURATION_UNITS_LABELS,
  NOTE_RECORD_TYPES,
  NOTE_TYPES,
  REFERENCE_TYPES,
  SYSTEM_USER_UUID,
} from '@tamanu/constants';
import { add, format, isAfter, isEqual } from 'date-fns';
import { Op, QueryTypes } from 'sequelize';

export const medication = express.Router();

medication.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params, query } = req;
    const { Prescription } = models;

    req.checkPermission('read', 'Medication');
    const object = await Prescription.findByPk(params.id, {
      include: Prescription.getFullReferenceAssociations(),
    });
    if (!object) throw new NotFoundError();

    if (object) {
      await req.audit.access({
        recordId: object.id,
        params,
        model: Prescription,
        facilityId: query.facilityId,
      });
    }

    res.send(object);
  }),
);

const medicationInputSchema = z
  .object({
    encounterId: z.string().optional().nullable(),
    patientId: z.string().optional().nullable(),
    date: dateCustomValidation,
    notes: z.string().optional().nullable(),
    indication: z.string().optional().nullable(),
    route: z.enum(Object.values(DRUG_ROUTES)),
    medicationId: z.string(),
    prescriberId: z.string(),
    quantity: z.coerce.number().int().optional().nullable(),
    isOngoing: z.boolean().optional().nullable(),
    isPrn: z.boolean().optional().nullable(),
    isVariableDose: z.boolean().optional().nullable(),
    doseAmount: z.coerce.number().positive().optional().nullable(),
    units: z.enum(Object.values(DRUG_UNITS)),
    frequency: z.enum(Object.values(ADMINISTRATION_FREQUENCIES)),
    startDate: datetimeCustomValidation,
    durationValue: z.coerce.number().positive().optional().nullable(),
    durationUnit: z.enum(Object.values(MEDICATION_DURATION_UNITS)).optional().nullable(),
    isPhoneOrder: z.boolean().optional(),
    idealTimes: z.array(z.string()).optional().nullable(),
  })
  .strip()
  .superRefine((val, ctx) => {
    if (!val.isVariableDose && !val.doseAmount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Dose amount is required or isVariableDose must be true',
      });
    }
    if (val.durationValue && !val.durationUnit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Duration unit is required when duration value is provided',
      });
    }
    if (val.durationUnit && !val.durationValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Duration value is required when duration unit is provided',
      });
    }
    if (
      val.frequency !== ADMINISTRATION_FREQUENCIES.IMMEDIATELY &&
      val.frequency !== ADMINISTRATION_FREQUENCIES.AS_DIRECTED &&
      !val.idealTimes?.length
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ideal times are required when frequency is not IMMEDIATELY or AS_DIRECTED',
      });
    }
    if (
      (val.frequency === ADMINISTRATION_FREQUENCIES.IMMEDIATELY || val.isOngoing) &&
      val.durationValue
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Duration value and unit are not allowed when frequency is IMMEDIATELY or isOngoing',
      });
    }
  });

medication.post(
  '/patientOngoingPrescription/:patientId',
  asyncHandler(async (req, res) => {
    const { models, db } = req;
    const patientId = req.params.patientId;
    const { Prescription, Patient, PatientOngoingPrescription } = models;
    req.checkPermission('create', 'Medication');

    const data = await medicationInputSchema.parseAsync(req.body);

    await checkSensitiveMedicationPermission([data.medicationId], req, 'create');

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      throw new InvalidOperationError(`Patient with id ${patientId} not found`);
    }

    const result = await db.transaction(async transaction => {
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

const checkSensitiveMedicationPermission = async (medicationIds, req, action) => {
  if (!medicationIds?.length) return true;

  const isSensitive = await req.models.ReferenceData.hasSensitiveMedication(medicationIds);
  if (isSensitive) {
    req.checkPermission(action, 'SensitiveMedication');
  }
};

const createEncounterPrescription = async ({ encounter, data, models }) => {
  const { Prescription, EncounterPrescription, MedicationAdministrationRecord } = models;

  const prescription = await Prescription.create({ ...data, id: undefined });
  await EncounterPrescription.create({
    encounterId: encounter.id,
    prescriptionId: prescription.id,
  });
  await MedicationAdministrationRecord.generateMedicationAdministrationRecords(prescription);
  return prescription;
};

medication.post(
  '/encounterPrescription/:encounterId',
  asyncHandler(async (req, res) => {
    const { models, db } = req;
    const encounterId = req.params.encounterId;
    const { Encounter } = models;
    req.checkPermission('create', 'Medication');
    const data = await medicationInputSchema.parseAsync(req.body);

    await checkSensitiveMedicationPermission([data.medicationId], req, 'create');

    const encounter = await Encounter.findByPk(encounterId);
    if (!encounter) {
      throw new InvalidOperationError(`Encounter with id ${encounterId} not found`);
    }
    if (encounter.endDate) {
      throw new InvalidOperationError(`Encounter with id ${encounterId} is discharged`);
    }
    if (new Date(data.startDate) < new Date(encounter.startDate)) {
      throw new InvalidOperationError(
        `Cannot create prescription with start date (${data.startDate}) before encounter start date (${encounter.startDate})`,
      );
    }

    const result = await db.transaction(async () => {
      const prescription = await createEncounterPrescription({ encounter, data, models });
      return prescription;
    });

    res.send(result.forResponse());
  }),
);

medication.post(
  '/medication-set',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'Medication');
    const { models } = req;
    const { medicationSet, encounterId } = req.body;
    const { Encounter } = models;

    const encounter = await Encounter.findByPk(encounterId);
    if (!encounter) {
      throw new InvalidOperationError(`Encounter with id ${encounterId} not found`);
    }
    if (encounter.endDate) {
      throw new InvalidOperationError(`Encounter with id ${encounterId} is discharged`);
    }
    for (const medication of medicationSet) {
      if (new Date(medication.startDate) < new Date(encounter.startDate)) {
        throw new InvalidOperationError(
          `Cannot create prescription with start date (${medication.startDate}) before encounter start date (${encounter.startDate})`,
        );
      }
    }

    await checkSensitiveMedicationPermission(
      medicationSet.map(m => m.medicationId),
      req,
      'create',
    );

    const result = await req.db.transaction(async () => {
      const prescriptions = [];
      for (const medication of medicationSet) {
        const data = await medicationInputSchema.parseAsync(medication);
        const prescription = await createEncounterPrescription({
          encounter,
          data,
          models,
        });
        prescriptions.push(prescription);
      }
      return prescriptions;
    });

    res.send(result.map(prescription => prescription.forResponse()));
  }),
);

const importOngoingMedicationsSchema = z
  .object({
    encounterId: z.string().uuid({ message: 'Valid encounter ID is required' }),
    prescriptionIds: z.array(z.string().uuid({ message: 'Valid prescription ID is required' })),
    prescriberId: z.string(),
  })
  .strip();
medication.post(
  '/import-ongoing',
  asyncHandler(async (req, res) => {
    const { models, db } = req;
    const { Encounter, Prescription, PatientOngoingPrescription } = models;

    const { prescriptionIds, prescriberId, encounterId } =
      await importOngoingMedicationsSchema.parseAsync(req.body);

    req.checkPermission('create', 'Medication');

    const encounter = await Encounter.findByPk(encounterId);
    if (!encounter) {
      throw new InvalidOperationError(`Encounter with id ${encounterId} not found`);
    }
    if (encounter.endDate) {
      throw new InvalidOperationError(`Encounter with id ${encounterId} is discharged`);
    }

    const ongoingPrescriptions = await Prescription.findAll({
      where: {
        id: { [Op.in]: prescriptionIds },
        discontinued: { [Op.not]: true },
      },
      include: [
        {
          model: PatientOngoingPrescription,
          as: 'patientOngoingPrescription',
          where: {
            patientId: encounter.patientId,
          },
        },
      ],
    });

    if (ongoingPrescriptions.length !== prescriptionIds.length) {
      const foundIds = new Set(ongoingPrescriptions.map(p => p.id));
      const missingIds = prescriptionIds.filter(id => !foundIds.has(id));
      throw new InvalidOperationError(
        `Prescription(s) with id(s) ${missingIds.join(
          ', ',
        )} not found, have been discontinued, or do not belong to this patient.`,
      );
    }

    const importPrescriptions = ongoingPrescriptions;
    await checkSensitiveMedicationPermission(
      importPrescriptions.map(prescription => prescription.medicationId),
      req,
      'create',
    );

    const result = await db.transaction(async () => {
      const newPrescriptions = [];

      for (const prescription of importPrescriptions) {
        const newPrescription = await createEncounterPrescription({
          encounter,
          data: {
            ...prescription.toJSON(),
            createdAt: undefined,
            updatedAt: undefined,
            prescriberId,
            date: getCurrentDateTimeString(),
            startDate: getCurrentDateTimeString(),
          },
          models,
        });

        newPrescriptions.push(newPrescription);
      }

      return newPrescriptions;
    });

    res.send({
      count: result.length,
      data: result.map(prescription => prescription.forResponse()),
    });
  }),
);

const updatePharmacyNotesInputSchema = z
  .object({
    pharmacyNotes: z
      .string()
      .optional()
      .nullable()
      .transform(v => (!v ? null : v)),
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

    req.checkPermission('write', 'Medication');
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
    const { models, params, db } = req;
    const { Encounter, Prescription } = models;

    const data = await discontinueInputSchema.parseAsync(req.body);

    req.checkPermission('write', 'Medication');

    const prescription = await Prescription.findByPk(params.id, {
      include: [
        {
          model: models.EncounterPrescription,
          as: 'encounterPrescription',
          attributes: ['encounterId'],
          required: false,
        },
      ],
    });
    if (!prescription) {
      throw new InvalidOperationError(`Prescription with id ${params.id} not found`);
    }

    await checkSensitiveMedicationPermission([prescription.medicationId], req, 'write');

    if (prescription.discontinued) {
      throw new ResourceConflictError('Prescription already discontinued');
    }

    await db.transaction(async () => {
      Object.assign(prescription, {
        ...data,
        discontinuedDate: data.discontinuingDate
          ? toDateTimeString(data.discontinuingDate)
          : getCurrentDateTimeString(),
        discontinued: true,
      });
      await prescription.save();
      // if the prescription is associated with an encounter, we need to remove the same prescription from the patient's ongoing medications
      const encounterId = prescription.encounterPrescription?.encounterId;
      if (!encounterId) return;
      const encounter = await Encounter.findByPk(encounterId);
      // if the encounter is not found or the encounter is ended, we don't need to remove the prescription from the patient's ongoing medications
      if (!encounter || encounter.endDate) return;

      const existingPatientOngoingPrescription =
        await models.PatientOngoingPrescription.findPatientOngoingPrescriptionWithSameDetails(
          encounter.patientId,
          prescription,
        );

      if (existingPatientOngoingPrescription) {
        const existingOngoingPrescription = existingPatientOngoingPrescription.prescription;
        Object.assign(existingOngoingPrescription, {
          discontinuingClinicianId: SYSTEM_USER_UUID,
          discontinuedDate: getCurrentDateTimeString(),
          discontinued: true,
          discontinuingReason: 'Discontinued by user discontinue encounter prescription',
        });
        await existingOngoingPrescription.save();
      }
    });

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

    req.checkPermission('write', 'Medication');

    // Find the prescription
    const prescription = await Prescription.findByPk(params.id);
    if (!prescription) {
      throw new InvalidOperationError(`Prescription with id ${params.id} not found`);
    }

    await checkSensitiveMedicationPermission([prescription.medicationId], req, 'write');

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

    req.checkPermission('write', 'Medication');

    // Find the prescription
    const prescription = await Prescription.findByPk(params.id);
    if (!prescription) {
      throw new InvalidOperationError(`Prescription with id ${params.id} not found`);
    }

    await checkSensitiveMedicationPermission([prescription.medicationId], req, 'write');

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

    req.checkPermission('read', 'Medication');

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
      .refine(val => !val || !isNaN(new Date(val).getTime()), {
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

    req.checkPermission('read', 'Medication');

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
      data: pauseRecords.map(record => record.forResponse()),
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

    req.checkPermission('read', 'Medication');

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
      data: pauseHistory.map(record => record.forResponse()),
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
    changingStatusReason: z.string().optional().nullable().default(null),
  })
  .strip();
medication.put(
  '/medication-administration-record/:id/given',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'MedicationAdministration');
    const { models, params, db } = req;
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

    const result = await db.transaction(async () => {
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

      return record;
    });

    res.send(result.forResponse());
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
    changingStatusReason: z.string().optional().nullable().default(null),
  })
  .strip();
medication.post(
  '/medication-administration-record/given',
  asyncHandler(async (req, res) => {
    const { models, db } = req;
    const { MedicationAdministrationRecord, MedicationAdministrationRecordDose } = models;

    req.checkPermission('create', 'MedicationAdministration');
    const { dose, dueAt, prescriptionId, changingStatusReason } =
      await givenMarCreateSchema.parseAsync(req.body);

    //validate dose
    if (dose.doseAmount <= 0) {
      throw new InvalidOperationError(`Dose amount must be greater than 0`);
    }

    const result = await db.transaction(async () => {
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
      return record;
    });

    res.send(result.forResponse());
  }),
);

const notGivenMarInfoUpdateSchema = z
  .object({
    reasonNotGivenId: z.string(),
    recordedByUserId: z.string(),
    changingNotGivenInfoReason: z.string().optional().nullable().default(null),
  })
  .strip();
medication.put(
  '/medication-administration-record/:id/not-given-info',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'MedicationAdministration');
    const { models, params } = req;
    const { MedicationAdministrationRecord, User } = models;

    const { reasonNotGivenId, recordedByUserId, changingNotGivenInfoReason } =
      await notGivenMarInfoUpdateSchema.parseAsync(req.body);

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

const notGivenMarUpdateSchema = z
  .object({
    reasonNotGivenId: z.string(),
    recordedByUserId: z.string().optional(),
    changingStatusReason: z.string().optional().nullable().default(null),
  })
  .strip();
medication.put(
  '/medication-administration-record/:id/not-given',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'MedicationAdministration');
    const { models, params, db } = req;
    const { MedicationAdministrationRecord, MedicationAdministrationRecordDose, User } = models;

    const { reasonNotGivenId, recordedByUserId, changingStatusReason } =
      await notGivenMarUpdateSchema.parseAsync(req.body);

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

    const result = await db.transaction(async () => {
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

      return record;
    });

    res.send(result.forResponse());
  }),
);

const notGivenMarCreateSchema = z
  .object({
    reasonNotGivenId: z.string(),
    dueAt: datetimeCustomValidation,
    prescriptionId: z.string(),
    changingStatusReason: z.string().optional().nullable().default(null),
  })
  .strip();
medication.post(
  '/medication-administration-record/not-given',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'MedicationAdministration');
    const { models } = req;
    const { MedicationAdministrationRecord } = models;

    const { reasonNotGivenId, dueAt, prescriptionId, changingStatusReason } =
      await notGivenMarCreateSchema.parseAsync(req.body);

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

const updateMarSchema = z
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
    req.checkPermission('write', 'MedicationAdministration');
    const { models, params, db } = req;
    const marId = params.id;
    const {
      MedicationAdministrationRecord,
      MedicationAdministrationRecordDose,
      User,
      Prescription,
      Note,
    } = models;

    const { isError, errorNotes, doses } = await updateMarSchema.parseAsync(req.body);

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

    const result = await db.transaction(async () => {
      if (isError) {
        existingMar.isError = isError;
        existingMar.errorNotes = errorNotes;

        await Note.create({
          content:
            `Medication error recorded for ${existingMar.prescription.medication.name} dose recorded at ${existingMar.recordedAt}. ${errorNotes || ''}`.trim(),
          authorId: req.user.id,
          recordId: existingMar.prescription.encounterPrescription.encounterId,
          date: getCurrentDateTimeString(),
          noteType: NOTE_TYPES.SYSTEM,
          recordType: NOTE_RECORD_TYPES.ENCOUNTER,
        });
        await existingMar.save();
      }

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

      return existingMar;
    });

    res.send(result.forResponse());
  }),
);

medication.get(
  '/medication-administration-record/:id/doses',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'MedicationAdministration');
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
      data: doses.map(dose => dose.forResponse()),
    });
  }),
);

const updateDoseSchema = z.object({
  doseAmount: z.number(),
  givenTime: datetimeCustomValidation,
  givenByUserId: z.string(),
  recordedByUserId: z.string(),
  reasonForChange: z.string().optional().nullable().default(null),
});
medication.put(
  '/medication-administration-record/doses/:doseId',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'MedicationAdministration');
    const { models, params, db } = req;
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

    const marId = doseObject.marId;
    const result = await db.transaction(async () => {
      await MedicationAdministrationRecord.update(
        {
          isEdited: true,
        },
        {
          where: {
            id: marId,
          },
        },
      );

      doseObject.doseAmount = doseAmount;
      doseObject.givenTime = givenTime;
      doseObject.givenByUserId = givenByUserId;
      doseObject.recordedByUserId = recordedByUserId;
      doseObject.reasonForChange = reasonForChange;
      await doseObject.save();

      return doseObject;
    });

    res.send(result.forResponse());
  }),
);

const deleteDoseInputSchema = z
  .object({
    reasonForRemoval: z.string().optional().nullable().default(null),
  })
  .strip();
medication.delete(
  '/medication-administration-record/doses/:doseId',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'MedicationAdministration');
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

medication.get(
  '/medication-administration-record/:id/changelog',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'MedicationAdministration');
    const { models, params, db } = req;
    const { MedicationAdministrationRecord } = models;
    const marId = params.id;

    // Verify the MAR exists
    const mar = await MedicationAdministrationRecord.findByPk(marId);
    if (!mar) {
      throw new InvalidOperationError(`MAR with id ${marId} not found`);
    }

    // Use raw SQL query to get changelog data
    const query = `
      select
        case
          when c.table_name = 'medication_administration_records' then 'mar'
          when c.table_name = 'medication_administration_record_doses' then 'dose'
        end as type,
        c.record_data->>'id' id,
        c.record_data->>'status' mar_status,
        c.record_data->>'changing_status_reason' mar_changing_status_reason,
        c.record_data->>'changing_not_given_info_reason' mar_changing_not_given_info_reason,
        reason_not_given.name mar_not_given_reason_name,
        reason_not_given.id mar_not_given_reason_id,

        c.record_data->>'dose_index' dose_index,
        c.record_data->>'dose_amount' dose_amount,
        c.record_data->>'given_time' dose_given_time,
        c.record_data->>'is_removed' dose_is_removed,
        c.record_data->>'reason_for_removal' dose_reason_for_removal,
        c.record_data->>'reason_for_change' dose_reason_for_change,
        given_by_user.display_name dose_given_user_name,
        given_by_user.id dose_given_user_id,

        recorded_by_user.display_name recorded_by_user_name,
        recorded_by_user.id recorded_by_user_id,

        c.created_at,
        c.record_created_at record_created_at,
        c.record_updated_at record_updated_at,
        c.record_deleted_at record_deleted_at,
        updated_by_user.display_name as changed_by_user
      from logs.changes c
      left join public.users updated_by_user on updated_by_user.id = c.updated_by_user_id
      left join public.reference_data reason_not_given on reason_not_given.type = :medicationNotGivenReason and reason_not_given.id = c.record_data->>'reason_not_given_id'
      left join public.users recorded_by_user on recorded_by_user.id = c.record_data->>'recorded_by_user_id'
      left join public.users given_by_user on given_by_user.id = c.record_data->>'given_by_user_id'
      where c.table_schema = 'public'
      and c.table_name IN ('medication_administration_records', 'medication_administration_record_doses')
      and (c.record_data->>'id' = :marId or c.record_data->>'mar_id' = :marId)
      order by c.created_at desc,
        case
          when c.table_name = 'medication_administration_records' then 1
          when c.table_name = 'medication_administration_record_doses' then 2
        end desc,
        c.record_data->>'dose_index' desc
    `;

    const results = await db.query(query, {
      replacements: {
        marId,
        medicationNotGivenReason: REFERENCE_TYPES.MEDICATION_NOT_GIVEN_REASON,
      },
      type: QueryTypes.SELECT,
    });

    // Transform results for the response
    const transformedResults = results.map(result => ({
      type: result.type,
      id: result.id,
      marStatus: result.mar_status,
      marChangingStatusReason: result.mar_changing_status_reason,
      marChangingNotGivenInfoReason: result.mar_changing_not_given_info_reason,
      marNotGivenReason: {
        id: result.mar_not_given_reason_id,
        name: result.mar_not_given_reason_name,
      },

      doseIndex: result.type === 'dose' ? Number(result.dose_index) : null,
      doseAmount: result.dose_amount,
      doseGivenTime: result.dose_given_time,
      doseIsRemoved: result.dose_is_removed,
      doseReasonForRemoval: result.dose_reason_for_removal,
      doseReasonForChange: result.dose_reason_for_change,
      doseGivenByUser: {
        id: result.dose_given_user_id,
        name: result.dose_given_user_name,
      },

      recordedByUser: {
        id: result.recorded_by_user_id,
        name: result.recorded_by_user_name,
      },

      changedByUser: result.changed_by_user,
      createdAt: result.created_at,
      recordCreatedAt: result.record_created_at,
      recordUpdatedAt: result.record_updated_at,
      recordDeletedAt: result.record_deleted_at,
      changeType:
        new Date(result.record_created_at).getTime() ===
        new Date(result.record_updated_at).getTime()
          ? 'CREATED'
          : 'UPDATED',
    }));

    res.send(transformedResults);
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
