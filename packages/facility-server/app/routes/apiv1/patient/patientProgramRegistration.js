import express from 'express';
import asyncHandler from 'express-async-handler';
import { isAfter } from 'date-fns';
import { subject } from '@casl/ability';
import { NotFoundError, ValidationError } from '@tamanu/shared/errors';
import { DELETION_STATUSES, REGISTRATION_STATUSES } from '@tamanu/constants';

export const patientProgramRegistration = express.Router();

patientProgramRegistration.get(
  '/:patientId/programRegistration',
  asyncHandler(async (req, res) => {
    const { params, models } = req;

    req.checkPermission('read', 'Patient');
    req.checkPermission('read', 'PatientProgramRegistration');
    req.checkPermission('list', 'PatientProgramRegistration');

    const registrationData = await models.PatientProgramRegistration.getMostRecentRegistrationsForPatient(
      params.patientId,
    );

    const filteredData = registrationData.filter(x => req.ability.can('read', x.programRegistry));
    res.send({ data: filteredData });
  }),
);

patientProgramRegistration.post(
  '/:patientId/programRegistration',
  asyncHandler(async (req, res) => {
    const { db, models, params, body } = req;
    const { patientId } = params;
    const { programRegistryId } = body;

    req.checkPermission('read', 'Patient');
    const patient = await models.Patient.findByPk(patientId);
    if (!patient) throw new NotFoundError();

    req.checkPermission('read', subject('ProgramRegistry', { id: programRegistryId }));
    const programRegistry = await models.ProgramRegistry.findByPk(programRegistryId);
    if (!programRegistry) throw new NotFoundError();

    const existingRegistration = await models.PatientProgramRegistration.findOne({
      where: {
        programRegistryId,
        patientId,
      },
    });

    if (existingRegistration) {
      req.checkPermission('write', 'PatientProgramRegistration', { programRegistryId });
    } else {
      req.checkPermission('create', 'PatientProgramRegistration', { programRegistryId });
    }

    const { conditionIds = [], ...registrationData } = body;

    if (conditionIds.length > 0) {
      req.checkPermission('create', 'PatientProgramRegistrationCondition', { programRegistryId });
    }

    // Run in a transaction so it either fails or succeeds together
    const [registration, conditions] = await db.transaction(async () => {
      return Promise.all([
        models.PatientProgramRegistration.create({
          patientId,
          programRegistryId,
          ...registrationData,
        }),
        models.PatientProgramRegistrationCondition.bulkCreate(
          conditionIds.map(conditionId => ({
            patientId,
            programRegistryId,
            clinicianId: registrationData.clinicianId,
            date: registrationData.date,
            programRegistryConditionId: conditionId,
          })),
        ),
      ]);
    });

    // Convert Sequelize model to use a custom object as response
    const responseObject = {
      ...registration.get({ plain: true }),
      conditions,
    };

    res.send(responseObject);
  }),
);

const getChangingFieldRecords = (allRecords, field) =>
  allRecords.filter(({ [field]: currentValue }, i) => {
    // We always want the first record
    if (i === 0) {
      return true;
    }
    const prevValue = allRecords[i - 1][field];
    return currentValue !== prevValue;
  });

const getRegistrationRecords = allRecords =>
  getChangingFieldRecords(allRecords, 'registrationStatus').filter(
    ({ registrationStatus }) => registrationStatus === REGISTRATION_STATUSES.ACTIVE,
  );
const getDeactivationRecords = allRecords =>
  getChangingFieldRecords(allRecords, 'registrationStatus').filter(
    ({ registrationStatus }) => registrationStatus === REGISTRATION_STATUSES.INACTIVE,
  );
const getStatusChangeRecords = allRecords =>
  getChangingFieldRecords(allRecords, 'clinicalStatusId');

patientProgramRegistration.get(
  '/:patientId/programRegistration/:programRegistryId',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const { patientId, programRegistryId } = params;
    const { PatientProgramRegistration } = models;

    req.checkPermission('read', subject('ProgramRegistry', { id: programRegistryId }));
    req.checkPermission('read', 'PatientProgramRegistration');

    const registration = await PatientProgramRegistration.findOne({
      where: {
        isMostRecent: true,
        patientId,
        programRegistryId,
      },
      include: PatientProgramRegistration.getFullReferenceAssociations(),
      raw: true,
      nest: true,
    });

    if (!registration) {
      throw new NotFoundError();
    }

    const history = await PatientProgramRegistration.findAll({
      where: {
        patientId,
        programRegistryId,
      },
      include: PatientProgramRegistration.getListReferenceAssociations(),
      order: [['date', 'ASC']],
      raw: true,
      nest: true,
    });

    const registrationRecords = getRegistrationRecords(history)
      .map(({ date, clinician }) => ({ date, clinician }))
      .reverse();

    const recentRegistrationRecord = registrationRecords.find(
      ({ date }) => !isAfter(new Date(date), new Date(registration.date)),
    );

    const deactivationRecords = getDeactivationRecords(history)
      .map(({ date, clinician }) => ({ date, clinician }))
      .reverse();

    const recentDeativationRecord = deactivationRecords.find(
      ({ date }) => !isAfter(new Date(date), new Date(registration.date)),
    );
    const deactivationData =
      registration.registrationStatus === REGISTRATION_STATUSES.INACTIVE
        ? {
            dateRemoved: recentDeativationRecord.date,
            removedBy: recentDeativationRecord.clinician,
          }
        : {};

    res.send({
      ...registration,
      // Using optional chaining for these until we create the new field to track
      // registration date in https://linear.app/bes/issue/SAV-570/add-new-column-to-patient-program-registration
      // when that work gets done, we can decide whether we want to enforce these or keep the optional chaining
      registrationDate: recentRegistrationRecord?.date,
      registrationClinician: recentRegistrationRecord?.clinician,
      ...deactivationData,
    });
  }),
);
patientProgramRegistration.get(
  '/:patientId/programRegistration/:programRegistryId/history$',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const { patientId, programRegistryId } = params;
    const { PatientProgramRegistration } = models;

    req.checkPermission('read', subject('ProgramRegistry', { id: programRegistryId }));
    req.checkPermission('list', 'PatientProgramRegistration');

    const fullHistory = await PatientProgramRegistration.findAll({
      where: {
        patientId,
        programRegistryId,
      },
      include: PatientProgramRegistration.getListReferenceAssociations(),
      order: [['date', 'ASC']],
      // Get the raw records so we can easily reverse later.
      raw: true,
      nest: true,
    });

    // Be sure to use the whole history to find the registration dates, not just the status
    // change records.
    const registrationDates = getRegistrationRecords(fullHistory)
      .map(({ date }) => date)
      .reverse();

    const statusChangeRecords = getStatusChangeRecords(fullHistory);
    const historyWithRegistrationDate = statusChangeRecords.map(data => ({
      ...data,
      // Find the latest registrationDate that is not after the date of interest
      registrationDate: registrationDates.find(
        registrationDate => !isAfter(new Date(registrationDate), new Date(data.date)),
      ),
    }));

    res.send({
      count: historyWithRegistrationDate.length,
      // Give the history latest-first
      data: historyWithRegistrationDate.reverse(),
    });
  }),
);

patientProgramRegistration.post(
  '/:patientId/programRegistration/:programRegistryId/condition',
  asyncHandler(async (req, res) => {
    const { models, params, body } = req;
    const { patientId, programRegistryId } = params;

    req.checkPermission('read', 'Patient');
    const patient = await models.Patient.findByPk(patientId);
    if (!patient) throw new NotFoundError();

    req.checkPermission('read', subject('ProgramRegistry', { id: programRegistryId }));
    const programRegistry = await models.ProgramRegistry.findByPk(programRegistryId);
    if (!programRegistry) throw new NotFoundError();

    req.checkPermission('read', 'PatientProgramRegistrationCondition');
    const conditionExists = await models.PatientProgramRegistrationCondition.count({
      where: {
        programRegistryId,
        patientId,
        programRegistryConditionId: body.programRegistryConditionId,
        deletionStatus: null,
      },
    });
    if (conditionExists) {
      throw new ValidationError("Can't create a duplicate condition for the same patient");
    }

    req.checkPermission('create', 'PatientProgramRegistrationCondition');
    const condition = await models.PatientProgramRegistrationCondition.create({
      patientId,
      programRegistryId,
      ...body,
    });

    res.send(condition);
  }),
);

patientProgramRegistration.get(
  '/:patientId/programRegistration/:programRegistryId/condition',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const { patientId, programRegistryId } = params;
    const { PatientProgramRegistrationCondition } = models;

    req.checkPermission('read', subject('ProgramRegistry', { id: programRegistryId }));
    req.checkPermission('list', 'PatientProgramRegistrationCondition');

    const history = await PatientProgramRegistrationCondition.findAll({
      where: {
        patientId,
        programRegistryId,
        deletionStatus: null,
      },
      include: PatientProgramRegistrationCondition.getFullReferenceAssociations(),
      order: [['date', 'DESC']],
    });

    res.send({
      count: history.length,
      data: history,
    });
  }),
);

patientProgramRegistration.delete(
  '/:patientId/programRegistration/:programRegistryId/condition/:conditionId',
  asyncHandler(async (req, res) => {
    const { models, params, body } = req;
    const { patientId, programRegistryId, conditionId } = params;

    req.checkPermission('read', 'Patient');
    const patient = await models.Patient.findByPk(patientId);
    if (!patient) throw new NotFoundError();
    req.checkPermission('read', subject('ProgramRegistry', { id: programRegistryId }));
    const programRegistry = await models.ProgramRegistry.findByPk(programRegistryId);
    if (!programRegistry) throw new NotFoundError();

    req.checkPermission('delete', 'PatientProgramRegistrationCondition');
    const existingCondition = await models.PatientProgramRegistrationCondition.findOne({
      where: {
        id: conditionId,
      },
    });
    if (!existingCondition) throw new NotFoundError();
    const condition = await existingCondition.update({
      deletionStatus: DELETION_STATUSES.DELETED,
      deletionClinicianId: req.user.id,
      deletionDate: body.deletionDate,
    });
    res.send(condition);
  }),
);
