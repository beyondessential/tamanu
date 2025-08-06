import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';

import { NotFoundError, ValidationError } from '@tamanu/shared/errors';
import { replaceInTemplate } from '@tamanu/utils/replaceInTemplate';
import { mapQueryFilters } from '../../../database/utils';
import {
  PATIENT_COMMUNICATION_TYPES,
  PATIENT_COMMUNICATION_CHANNELS,
  COMMUNICATION_STATUSES,
  PATIENT_SURVEY_ASSIGNMENTS_STATUSES,
} from '@tamanu/constants';
import { PatientSurveyAssignmentsSchema } from '@tamanu/shared/schemas/facility/responses/patientSurveyAssignments.schema';
import { SendPortalFormRequestSchema } from '@tamanu/shared/schemas/facility/requests/sendPortalForm.schema';

export const patientPortal = express.Router();

const getPatientOrThrow = async ({ models, patientId }) => {
  const patient = await models.Patient.findByPk(patientId);
  if (!patient) {
    throw new NotFoundError('Patient not found');
  }
  return patient;
};

const getPatientUserOrThrow = async ({ models, patientId }) => {
  const patientUser = await models.PatientUser.findOne({
    where: { patientId },
  });
  if (!patientUser) {
    throw new NotFoundError(
      'Patient has not been registered for portal access. Please register the patient first.',
    );
  }
  return patientUser;
};

const getSurveyOrThrow = async ({ models, surveyId }) => {
  const survey = await models.Survey.findByPk(surveyId);
  if (!survey) {
    throw new NotFoundError('Survey not found');
  }
  return survey;
};

const constructRegistrationLink = () => {
  // TODO - construct the registration link for the patient portal
  return `http://localhost:5173/`;
};

const constructLoginLink = () => {
  // TODO - construct the login link for the patient portal
  return `http://localhost:5173/`;
};

const registerPatient = async ({ patient, models }) => {
  // eslint-disable-next-line no-unused-vars
  const [patientUser] = await models.PatientUser.findOrCreate({
    where: { patientId: patient.id },
  });

  // TODO - Check if an **unexpired** token exists for patient user - if so, return it, else create a new one

  return constructRegistrationLink();
};

const sendRegistrationEmail = async ({ patient, patientEmail, models, settings, facilityId }) => {
  await getPatientUserOrThrow({ models, patientId: patient.id });
  const facility = await models.Facility.findByPk(facilityId);

  // TODO - fetch the **unexpired** token for the patient user, throw if none exists

  const patientPortalRegistrationTemplate = await settings[facilityId].get(
    'templates.patientPortalRegistrationEmail',
  );

  const subject = replaceInTemplate(patientPortalRegistrationTemplate.subject, {
    facilityName: facility.name,
  });

  const content = replaceInTemplate(patientPortalRegistrationTemplate.body, {
    firstName: patient.firstName,
    lastName: patient.lastName,
    facilityName: facility.name,
    registrationLink: constructRegistrationLink(),
  });

  await models.PatientCommunication.create({
    patientId: patient.id,
    type: PATIENT_COMMUNICATION_TYPES.PATIENT_PORTAL_REGISTRATION,
    channel: PATIENT_COMMUNICATION_CHANNELS.EMAIL,
    status: COMMUNICATION_STATUSES.QUEUED,
    destination: patientEmail,
    subject,
    content,
  });
};

/**
 * This sends an email to an already registered patient to complete a form.
 */
const sendRegisteredFormEmail = async ({ patient, patientEmail, models, settings, facilityId }) => {
  await getPatientUserOrThrow({ models, patientId: patient.id });
  const facility = await models.Facility.findByPk(facilityId);

  const patientPortalRegisteredFormTemplate = await settings[facilityId].get(
    'templates.patientPortalRegisteredFormEmail',
  );

  const subject = replaceInTemplate(patientPortalRegisteredFormTemplate.subject, {
    facilityName: facility.name,
  });

  const content = replaceInTemplate(patientPortalRegisteredFormTemplate.body, {
    firstName: patient.firstName,
    lastName: patient.lastName,
    facilityName: facility.name,
    registrationLink: constructLoginLink(),
  });

  await models.PatientCommunication.create({
    patientId: patient.id,
    type: PATIENT_COMMUNICATION_TYPES.PATIENT_PORTAL_REGISTERED_FORM,
    channel: PATIENT_COMMUNICATION_CHANNELS.EMAIL,
    status: COMMUNICATION_STATUSES.QUEUED,
    destination: patientEmail,
    subject,
    content,
  });
};

/**
 * This sends an email to an unregistered patient to complete a form.
 * It will contain a registration link rather than a login link.
 * Note that the PatientUser model should have been created before calling this method.
 */
const sendUnregisteredFormEmail = async ({
  patient,
  patientEmail,
  models,
  settings,
  facilityId,
}) => {
  // Although this email is for an unregistered patient, they should still have been registered (PatientUser created) before calling this method.
  await getPatientUserOrThrow({ models, patientId: patient.id });
  const facility = await models.Facility.findByPk(facilityId);

  const patientPortalUnregisteredFormTemplate = await settings[facilityId].get(
    'templates.patientPortalUnregisteredFormEmail',
  );

  const subject = replaceInTemplate(patientPortalUnregisteredFormTemplate.subject, {
    facilityName: facility.name,
  });

  const content = replaceInTemplate(patientPortalUnregisteredFormTemplate.body, {
    firstName: patient.firstName,
    lastName: patient.lastName,
    facilityName: facility.name,
    registrationLink: constructRegistrationLink(),
  });

  await models.PatientCommunication.create({
    patientId: patient.id,
    type: PATIENT_COMMUNICATION_TYPES.PATIENT_PORTAL_UNREGISTERED_FORM,
    channel: PATIENT_COMMUNICATION_CHANNELS.EMAIL,
    status: COMMUNICATION_STATUSES.QUEUED,
    destination: patientEmail,
    subject,
    content,
  });
};

patientPortal.get(
  '/:id/portal/status',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'PatientPortal');

    const { models } = req;
    const { id: patientId } = req.params;

    const patient = await getPatientOrThrow({ models, patientId });

    const patientUser = await models.PatientUser.findOne({
      where: { patientId: patient.id },
    });

    if (!patientUser) {
      return res.send({
        hasPortalAccount: false,
        status: null,
      });
    }

    res.send({
      hasPortalAccount: true,
      status: patientUser.status,
    });
  }),
);

// Soft registers the patient for portal access.
patientPortal.post(
  '/:id/portal/register',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'PatientPortal');

    const { models } = req;
    const { id: patientId } = req.params;

    const patient = await getPatientOrThrow({ models, patientId });

    const registrationLink = await registerPatient({ patient, models });

    res.send({ registrationLink });
  }),
);

patientPortal.post(
  '/:id/portal/send-registration-email',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'PatientPortal');

    const { models, settings, facilityId } = req;
    const { id: patientId } = req.params;
    const { email: patientEmail } = req.body;

    if (!patientEmail) {
      throw new ValidationError('Email is required');
    }

    const patient = await getPatientOrThrow({ models, patientId });

    await sendRegistrationEmail({ patient, patientEmail, models, settings, facilityId });

    res.send({ message: 'Registration email successfully sent' });
  }),
);

patientPortal.post(
  '/:id/portal/forms',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'PatientPortalForm');

    const { models, user, settings, facilityId } = req;
    const { id: patientId } = req.params;
    const { formId, assignedAt, email: patientEmail } = SendPortalFormRequestSchema.parse(req.body);

    const patient = await getPatientOrThrow({ models, patientId });
    const patientUser = await models.PatientUser.findOne({
      where: { patientId: patient.id },
    });
    const survey = await getSurveyOrThrow({ models, surveyId: formId });

    if (!patientEmail && (!patientUser || !patientUser.email)) {
      throw new ValidationError(
        'Patient has no registered email address - provide an email to send the form.',
      );
    }

    // If the patient has not yet registered for the portal, we need to register them and send the unregistered form email.
    // Otherwise, we just send the registered form email.
    if (!patientUser) {
      await registerPatient({ patient, models });
      await sendUnregisteredFormEmail({
        patient,
        patientEmail: patientEmail ?? patientUser.email,
        models,
        settings,
        facilityId,
      });
    } else {
      await sendRegisteredFormEmail({
        patient,
        patientEmail: patientEmail ?? patientUser.email,
        models,
        settings,
        facilityId,
      });
    }

    const patientSurveyAssignment = await models.PatientSurveyAssignment.create({
      patientId: patient.id,
      surveyId: survey.id,
      assignedById: user.id,
      assignedAt: assignedAt,
    });

    res.send({ patientSurveyAssignment });
  }),
);

patientPortal.get(
  '/:id/portal/forms',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'PatientPortalForm');

    const { models, query } = req;
    const { id: patientId } = req.params;

    // Handle both `params` object and query params
    const params = query.params || query;

    const {
      page = 0,
      rowsPerPage = 25,
      order = 'ASC',
      orderBy = 'assignedAt',
      status = PATIENT_SURVEY_ASSIGNMENTS_STATUSES.OUTSTANDING,
      all = false,
      ...filterParams
    } = params;

    const patient = await getPatientOrThrow({ models, patientId });

    const offset = all ? undefined : page * rowsPerPage;

    const filters = mapQueryFilters(filterParams, [{ key: 'surveyId', operator: Op.eq }]);

    const baseQueryOptions = {
      where: {
        [Op.and]: [{ patientId: patient.id }, { status }, filters],
      },
      include: [
        {
          model: models.Survey,
          as: 'survey',
          include: [{ model: models.Program, as: 'program' }],
        },
        {
          model: models.User,
          as: 'assignedBy',
        },
        {
          model: models.Patient,
          as: 'patient',
        },
      ],
    };

    const count = await models.PatientSurveyAssignment.count({
      where: baseQueryOptions.where,
    });

    // If no results, return early
    if (count === 0) {
      res.send({
        count: 0,
        data: [],
      });
      return;
    }

    const patientSurveyAssignments = await models.PatientSurveyAssignment.findAll({
      ...baseQueryOptions,
      order: orderBy ? [[...orderBy.split('.'), order.toUpperCase()]] : [['assignedAt', 'DESC']],
      limit: all ? undefined : rowsPerPage,
      offset,
    });

    res.send({
      count,
      data: patientSurveyAssignments.map(assignment =>
        PatientSurveyAssignmentsSchema.parse(assignment.forResponse()),
      ),
    });
  }),
);

patientPortal.delete(
  '/:id/portal/forms/:assignmentId',
  asyncHandler(async (req, res) => {
    req.checkPermission('delete', 'PatientPortalForm');

    const { models } = req;
    const { id: patientId, assignmentId } = req.params;

    const patient = await getPatientOrThrow({ models, patientId });
    await models.PatientSurveyAssignment.destroy({
      where: { id: assignmentId, patientId: patient.id },
    });

    res.send({ message: 'Patient survey assignments deleted' });
  }),
);
