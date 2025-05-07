import express from 'express';
import asyncHandler from 'express-async-handler';
import { isAfter } from 'date-fns';
import { subject } from '@casl/ability';
import { NotFoundError } from '@tamanu/shared/errors';
import { REGISTRATION_STATUSES, PROGRAM_REGISTRY_CONDITION_CATEGORIES } from '@tamanu/constants';
import { validatePatientProgramRegistrationRequest } from './utils';
import { Op, Sequelize } from 'sequelize';

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
  '/programRegistration/:id',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'PatientProgramRegistration');
    const { db, models, params, body } = req;
    const { id } = params;
    const { conditions = [], ...registrationData } = body;
    const { PatientProgramRegistration } = models;

    if (conditions.length > 0) {
      req.checkPermission('create', 'PatientProgramRegistrationCondition');
    }

    const existingRegistration = await PatientProgramRegistration.findByPk(id);

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

patientProgramRegistration.delete(
  '/programRegistration/:id',
  asyncHandler(async (req, res) => {
    const { db, models, params } = req;
    const { id } = params;
    const { PatientProgramRegistration, PatientProgramRegistrationCondition } = models;

    // Set permissions for the delete action to write instead of delete to match existing permissions
    req.checkPermission('write', 'PatientProgramRegistration');

    const existingRegistration = await PatientProgramRegistration.findByPk(id);

    if (!existingRegistration) {
      throw new NotFoundError('PatientProgramRegistration not found');
    }

    await db.transaction(async (transaction) => {
      // Update the status to recordedInError and soft delete the registration
      await existingRegistration.update(
        { registrationStatus: REGISTRATION_STATUSES.RECORDED_IN_ERROR },
        { transaction },
      );
      await existingRegistration.destroy({ transaction });

      // Soft delete all related conditions
      await PatientProgramRegistrationCondition.destroy({
        where: { patientProgramRegistrationId: id },
        transaction,
      });
    });

    res.status(200).send({ message: 'Registration successfully deleted' });
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

patientProgramRegistration.get(
  '/:patientId/programRegistration/:programRegistryId',
  asyncHandler(async (req, res) => {
    const {
      models,
      params,
      query: { facilityId },
    } = req;
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

    await req.audit.access({
      recordId: registration.id,
      params,
      model: PatientProgramRegistration,
      facilityId,
    });

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
    const { ChangeLog, User, ProgramRegistryClinicalStatus } = models;

    req.checkPermission('read', subject('ProgramRegistry', { id: programRegistryId }));
    req.checkPermission('list', 'PatientProgramRegistration');

    const changes = await ChangeLog.findAll({
      where: {
        tableName: 'patient_program_registrations',
        recordId: {
          [Op.in]: Sequelize.literal(
            `(SELECT id::text FROM patient_program_registrations WHERE patient_id = :patientId AND program_registry_id = :programRegistryId)`,
          ),
        },
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'displayName'],
        },
      ],
      order: [['loggedAt', 'DESC']],
      replacements: {
        patientId,
        programRegistryId,
      },
    });

    // Get all unique clinical status IDs from the changes
    const clinicalStatusIds = [
      ...new Set(changes.map((change) => change.recordData.clinical_status_id).filter(Boolean)),
    ];

    // Fetch all clinical statuses in one query
    const clinicalStatuses = await ProgramRegistryClinicalStatus.findAll({
      where: {
        id: {
          [Op.in]: clinicalStatusIds,
        },
      },
      attributes: ['id', 'name', 'color'],
    });

    // Create a map for quick lookup
    const clinicalStatusMap = clinicalStatuses.reduce((acc, status) => {
      acc[status.id] = status;
      return acc;
    }, {});

    const history = changes.map((change) => {
      const data = change.recordData;
      return {
        id: change.id,
        date: change.loggedAt,
        registrationStatus: data.registration_status,
        clinicalStatusId: data.clinical_status_id,
        clinicalStatus: data.clinical_status_id ? clinicalStatusMap[data.clinical_status_id] : null,
        clinician: change.user,
        registrationDate: data.date,
      };
    });

    res.send({
      count: history.length,
      data: history,
    });
  }),
);
