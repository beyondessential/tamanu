import express from 'express';
import asyncHandler from 'express-async-handler';
import { isAfter } from 'date-fns';
import { subject } from '@casl/ability';
import { NotFoundError } from '@tamanu/shared/errors';
import { REGISTRATION_STATUSES } from '@tamanu/constants';
import { validatePatientProgramRegistrationRequest } from './utils';

export const patientProgramRegistration = express.Router();

patientProgramRegistration.get(
  '/:patientId/programRegistration',
  asyncHandler(async (req, res) => {
    const { params, models } = req;

    req.checkPermission('read', 'Patient');
    req.checkPermission('read', 'PatientProgramRegistration');
    req.checkPermission('list', 'PatientProgramRegistration');

    const registrationData =
      await models.PatientProgramRegistration.getMostRecentRegistrationsForPatient(
        params.patientId,
      );

    const filteredData = registrationData.filter((x) => req.ability.can('read', x.programRegistry));
    res.send({ data: filteredData });
  }),
);

patientProgramRegistration.post(
  '/:patientId/programRegistration',
  asyncHandler(async (req, res) => {
    const { db, models, params, body } = req;
    const { patientId } = params;
    const { programRegistryId, registeringFacilityId } = body;

    await validatePatientProgramRegistrationRequest(req, patientId, programRegistryId);

    const existingRegistration = await models.PatientProgramRegistration.findOne({
      where: {
        programRegistryId,
        patientId,
      },
    });

    if (existingRegistration) {
      req.checkPermission('write', 'PatientProgramRegistration');
    } else {
      req.checkPermission('create', 'PatientProgramRegistration');
    }

    const { conditions = [], ...registrationData } = body;

    if (conditions.length > 0) {
      req.checkPermission('create', 'PatientProgramRegistrationCondition');
    }

    // Run in a transaction so it either fails or succeeds together
    const [registration, conditionsRecords] = await db.transaction(async (transaction) => {
      const newRegistration = await models.PatientProgramRegistration.create(
        {
          patientId,
          programRegistryId,
          ...registrationData,
        },
        { transaction },
      );

      const newConditions = await models.PatientProgramRegistrationCondition.bulkCreate(
        conditions
          .filter((condition) => condition.conditionId)
          .map((condition) => ({
            patientProgramRegistrationId: newRegistration.id,
            clinicianId: registrationData.clinicianId,
            date: registrationData.date,
            programRegistryConditionId: condition.conditionId,
            conditionCategory: condition.category,
          })),
        { transaction },
      );

      await models.PatientFacility.upsert(
        {
          patientId,
          facilityId: registeringFacilityId,
        },
        { transaction },
      );

      return [newRegistration, newConditions];
    });

    // Convert Sequelize model to use a custom object as response
    const responseObject = {
      ...registration.get({ plain: true }),
      conditions: conditionsRecords,
    };

    res.send(responseObject);
  }),
);

patientProgramRegistration.put(
  '/programRegistration/:programRegistrationId',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'PatientProgramRegistration');
    const { db, models, params, body } = req;
    const { programRegistrationId } = params;
    const { conditions = [], ...registrationData } = body;
    const { PatientProgramRegistration } = models;

    if (conditions.length > 0) {
      req.checkPermission('create', 'PatientProgramRegistrationCondition');
    }

    const existingRegistration = await PatientProgramRegistration.findByPk(programRegistrationId);

    if (!existingRegistration) {
      throw new NotFoundError('PatientProgramRegistration not found');
    }

    const conditionsData = conditions.map((condition) => ({
      id: condition.id,
      patientProgramRegistrationId: existingRegistration.id,
      clinicianId: registrationData.clinicianId,
      date: condition.date,
      programRegistryConditionId: condition.conditionId,
      conditionCategory: condition.conditionCategory,
      reasonForChange: condition.reasonForChange,
    }));

    const [registration] = await db.transaction(async () => {
      return Promise.all([
        existingRegistration.update(registrationData),
        models.PatientProgramRegistrationCondition.bulkCreate(conditionsData, {
          updateOnDuplicate: ['date', 'conditionCategory', 'reasonForChange'],
        }),
      ]);
    });

    const responseObject = {
      ...registration.get({ plain: true }),
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

const getRegistrationRecords = (allRecords) =>
  getChangingFieldRecords(allRecords, 'registrationStatus').filter(
    ({ registrationStatus }) => registrationStatus === REGISTRATION_STATUSES.ACTIVE,
  );
const getDeactivationRecords = (allRecords) =>
  getChangingFieldRecords(allRecords, 'registrationStatus').filter(
    ({ registrationStatus }) => registrationStatus === REGISTRATION_STATUSES.INACTIVE,
  );
const getStatusChangeRecords = (allRecords) =>
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

    const recentDeactivationRecord = deactivationRecords.find(
      ({ date }) => !isAfter(new Date(date), new Date(registration.date)),
    );
    const deactivationData =
      registration.registrationStatus === REGISTRATION_STATUSES.INACTIVE
        ? {
            dateRemoved: recentDeactivationRecord.date,
            removedBy: recentDeactivationRecord.clinician,
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
    const historyWithRegistrationDate = statusChangeRecords.map((data) => ({
      ...data,
      // Find the latest registrationDate that is not after the date of interest
      registrationDate: registrationDates.find(
        (registrationDate) => !isAfter(new Date(registrationDate), new Date(data.date)),
      ),
    }));

    res.send({
      count: historyWithRegistrationDate.length,
      // Give the history latest-first
      data: historyWithRegistrationDate.reverse(),
    });
  }),
);
