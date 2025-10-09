import express from 'express';
import asyncHandler from 'express-async-handler';
import { subject } from '@casl/ability';
import { NotFoundError } from '@tamanu/errors';
import { REGISTRATION_STATUSES } from '@tamanu/constants';
import { Op } from 'sequelize';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { validatePatientProgramRegistrationRequest } from './utils';

export const patientProgramRegistration = express.Router();

patientProgramRegistration.get(
  '/:patientId/programRegistration',
  asyncHandler(async (req, res) => {
    const { params, models } = req;

    req.checkPermission('read', 'Patient');
    req.checkPermission('read', 'PatientProgramRegistration');
    req.checkPermission('list', 'PatientProgramRegistration');

    const registrationData = await models.PatientProgramRegistration.getRegistrationsForPatient(
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
    const { programRegistryId, registeringFacilityId } = body;

    await validatePatientProgramRegistrationRequest(req, patientId, programRegistryId);

    req.checkPermission('create', 'PatientProgramRegistration');

    const { conditions = [], ...registrationData } = body;

    if (conditions.length > 0) {
      req.checkPermission('create', 'PatientProgramRegistrationCondition');
    }

    // Run in a transaction so it either fails or succeeds together
    const [registration, conditionsRecords] = await db.transaction(async transaction => {
      let registrationRecord;

      // Check if this PPR has been previously deleted
      const existingRecordedInErrorRegistration = await models.PatientProgramRegistration.findOne({
        where: {
          programRegistryId,
          patientId,
          registrationStatus: REGISTRATION_STATUSES.RECORDED_IN_ERROR,
        },
        transaction,
        paranoid: false,
      });

      // If the registration was previously recorded in error, update that record to preserve the unique id. Otherwise, create a new one.
      if (existingRecordedInErrorRegistration) {
        registrationRecord = await existingRecordedInErrorRegistration.update(
          {
            deletedAt: null,
            clinicalStatusId: null,
            deactivatedDate: null,
            deactivatedClinicianId: null,
            ...registrationData,
          },
          {
            transaction,
          },
        );
      } else {
        registrationRecord = await models.PatientProgramRegistration.create(
          {
            patientId,
            programRegistryId,
            ...registrationData,
          },
          { transaction },
        );
      }

      const newConditions = await models.PatientProgramRegistrationCondition.bulkCreate(
        conditions
          .filter(condition => condition.conditionId)
          .map(condition => ({
            patientProgramRegistrationId: registrationRecord.id,
            clinicianId: registrationData.clinicianId,
            date: registrationData.date,
            programRegistryConditionId: condition.conditionId,
            programRegistryConditionCategoryId: condition.conditionCategoryId,
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

      return [registrationRecord, newConditions];
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

    const existingRegistration = await PatientProgramRegistration.findOne({
      where: { id },
    });

    if (!existingRegistration) {
      throw new NotFoundError('PatientProgramRegistration not found');
    }

    const conditionsData = conditions.map(condition => ({
      id: condition.id,
      patientProgramRegistrationId: existingRegistration.id,
      clinicianId: registrationData.clinicianId,
      date: condition.date,
      programRegistryConditionId: condition.conditionId,
      programRegistryConditionCategoryId: condition.conditionCategoryId,
      reasonForChange: condition.reasonForChange,
    }));

    const updatedRegistrationData = {
      ...registrationData,
      deactivatedDate: null,
      deactivatedClinicianId: null,
    };

    // If the registration status is being changed to INACTIVE, set the deactivated fields
    if (registrationData.registrationStatus === REGISTRATION_STATUSES.INACTIVE) {
      updatedRegistrationData.deactivatedDate =
        registrationData.deactivatedDate || getCurrentDateTimeString();
      updatedRegistrationData.deactivatedClinicianId = registrationData.clinicianId;
    }

    const [registration] = await db.transaction(async () => {
      return Promise.all([
        existingRegistration.update(updatedRegistrationData),
        models.PatientProgramRegistrationCondition.bulkCreate(conditionsData, {
          updateOnDuplicate: ['date', 'programRegistryConditionCategoryId', 'reasonForChange'],
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

    req.checkPermission('delete', 'PatientProgramRegistration');

    const existingRegistration = await PatientProgramRegistration.findOne({
      where: { id },
    });

    if (!existingRegistration) {
      throw new NotFoundError('PatientProgramRegistration not found');
    }

    await db.transaction(async transaction => {
      // Update the status to recordedInError
      await existingRegistration.update(
        { registrationStatus: REGISTRATION_STATUSES.RECORDED_IN_ERROR },
        { transaction },
      );

      // Soft delete all related conditions
      await PatientProgramRegistrationCondition.destroy({
        where: { patientProgramRegistrationId: id },
        transaction,
      });
    });

    res.status(200).send({ message: 'Registration successfully deleted' });
  }),
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

    await req.audit.access({
      recordId: registration.id,
      frontEndContext: params,
      model: PatientProgramRegistration,
      facilityId,
    });

    res.send({
      ...registration,
      registrationDate: registration.date,
      registrationClinician: registration.clinician,
      dateRemoved: registration.deactivatedDate,
      removedBy: registration.deactivatedClinician,
    });
  }),
);

patientProgramRegistration.get(
  '/:patientId/programRegistration/:programRegistryId/history$',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const { patientId, programRegistryId } = params;
    const { ChangeLog, User, PatientProgramRegistration, ProgramRegistryClinicalStatus } = models;

    req.checkPermission('read', subject('ProgramRegistry', { id: programRegistryId }));
    req.checkPermission('list', 'PatientProgramRegistration');

    const registration = await PatientProgramRegistration.findOne({
      where: {
        patientId,
        programRegistryId,
      },
    });

    if (!registration) {
      res.send({
        count: 0,
        data: [],
      });
    }

    const changes = await ChangeLog.findAll({
      where: {
        tableName: 'patient_program_registrations',
        recordId: registration.id,
        migrationContext: null,
      },
      include: [
        {
          model: User,
          as: 'updatedByUser',
          attributes: ['id', 'displayName'],
        },
      ],
      order: [['loggedAt', 'DESC']],
    });

    // Get all unique clinical status IDs from the changes
    const clinicalStatusIds = [
      ...new Set(changes.map(change => change.recordData.clinical_status_id).filter(Boolean)),
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

    const history = changes
      .map(change => {
        const data = change.recordData;
        return {
          id: change.id,
          date: change.loggedAt,
          registrationStatus: data.registration_status,
          clinicalStatusId: data.clinical_status_id,
          clinicalStatus: data.clinical_status_id
            ? clinicalStatusMap[data.clinical_status_id]
            : null,
          clinician: change.updatedByUser,
          registrationDate: data.date,
        };
      })
      .filter(change => change.registrationStatus !== REGISTRATION_STATUSES.INACTIVE)
      // Add this filter to remove entries with unchanged clinical status
      .filter((change, index, array) => {
        if (index === array.length - 1) return true; // Always keep the original record
        const nextChange = array[index + 1];
        return change.clinicalStatusId !== nextChange.clinicalStatusId;
      });

    res.send({
      count: history.length,
      data: history,
    });
  }),
);
