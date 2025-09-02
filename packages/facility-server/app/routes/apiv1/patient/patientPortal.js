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
  PORTAL_SURVEY_ASSIGNMENTS_STATUSES,
} from '@tamanu/constants';
import { PortalSurveyAssignmentsSchema } from '@tamanu/shared/schemas/facility/responses/portalSurveyAssignments.schema';
import { SendPortalFormRequestSchema } from '@tamanu/shared/schemas/facility/requests/sendPortalForm.schema';

export const patientPortal = express.Router();

const getPatientOrThrow = async ({ models, patientId }) => {
  const patient = await models.Patient.findByPk(patientId);
  if (!patient) {
    throw new NotFoundError('Patient not found');
  }
  return patient;
};

const getPortalUserOrThrow = async ({ models, patientId }) => {
  const portalUser = await models.PortalUser.findOne({
    where: { patientId },
  });
  if (!portalUser) {
    throw new NotFoundError(
      'Patient has not been registered for portal access. Please register the patient first.',
    );
  }
  return portalUser;
};

const getSurveyOrThrow = async ({ models, surveyId }) => {
  const survey = await models.Survey.findByPk(surveyId);
  if (!survey) {
    throw new NotFoundError('Survey not found');
  }
  return survey;
};

const registerPatient = async ({ patientId, patientEmail, models }) => {
  const [portalUser, created] = await models.PortalUser.findOrCreate({
    where: { patientId },
    defaults: { email: patientEmail },
  });

  if (!created && patientEmail && portalUser.email !== patientEmail) {
    // A PortalUser already exists. If a new email is provided, update it.
    // Note that email has a unique constraint, so this may fail if the email is taken by another user.
    portalUser.email = patientEmail;
    await portalUser.save();
  }

  return [portalUser, created];
};

const sendRegistrationEmail = async ({ patient, patientEmail, models, settings, facilityId }) => {
  const facility = await models.Facility.findByPk(facilityId);
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
  });

  await models.PatientCommunication.create({
    patientId: patient.id,
    type: PATIENT_COMMUNICATION_TYPES.PATIENT_PORTAL_REGISTRATION,
    channel: PATIENT_COMMUNICATION_CHANNELS.PORTAL_EMAIL,
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
  await getPortalUserOrThrow({ models, patientId: patient.id });
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
  });

  await models.PatientCommunication.create({
    patientId: patient.id,
    type: PATIENT_COMMUNICATION_TYPES.PATIENT_PORTAL_REGISTERED_FORM,
    channel: PATIENT_COMMUNICATION_CHANNELS.PORTAL_EMAIL,
    status: COMMUNICATION_STATUSES.QUEUED,
    destination: patientEmail,
    subject,
    content,
  });
};

/**
 * This sends an email to an unregistered patient to complete a form.
 * It will contain a registration link rather than a login link.
 * Note that the PortalUser model should have been created before calling this method.
 */
const sendUnregisteredFormEmail = async ({
  patient,
  patientEmail,
  models,
  settings,
  facilityId,
}) => {
  // Although this email is for an unregistered patient, they should still have been registered (PortalUser created) before calling this method.
  await getPortalUserOrThrow({ models, patientId: patient.id });
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
  });

  await models.PatientCommunication.create({
    patientId: patient.id,
    type: PATIENT_COMMUNICATION_TYPES.PATIENT_PORTAL_UNREGISTERED_FORM,
    channel: PATIENT_COMMUNICATION_CHANNELS.PORTAL_EMAIL,
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

    const portalUser = await models.PortalUser.findOne({
      where: { patientId: patient.id },
    });

    if (!portalUser) {
      return res.send({
        hasPortalAccount: false,
        status: null,
      });
    }

    res.send({
      hasPortalAccount: true,
      status: portalUser.status,
    });
  }),
);

// Soft registers the patient for portal access.
patientPortal.post(
  '/:id/portal/register',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'PatientPortal');
    const { models, settings, body } = req;
    const { id: patientId } = req.params;
    const { email: patientEmail, facilityId } = body;

    if (!patientEmail) {
      throw new ValidationError('Email is required');
    }

    const patient = await getPatientOrThrow({ models, patientId });

    const [newPatient] = await registerPatient({ patientEmail, patientId, models });

    await sendRegistrationEmail({ patient, patientEmail, models, settings, facilityId });

    res.send(newPatient);
  }),
);

patientPortal.post(
  '/:id/portal/forms',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'PatientPortalForm');

    const { models, user, settings } = req;
    const { id: patientId } = req.params;
    const {
      formId,
      assignedAt,
      email: patientEmail,
      facilityId,
    } = SendPortalFormRequestSchema.parse(req.body);

    const patient = await getPatientOrThrow({ models, patientId });
    const portalUser = await models.PortalUser.findOne({
      where: { patientId: patient.id },
    });
    const survey = await getSurveyOrThrow({ models, surveyId: formId });

    if (!patientEmail && (!portalUser || !portalUser.email)) {
      throw new ValidationError(
        'Patient has no registered email address - provide an email to send the form.',
      );
    }

    // If the patient has not yet registered for the portal, we need to register them and send the unregistered form email.
    // Otherwise, we just send the registered form email.
    if (!portalUser) {
      await registerPatient({ patientId, models, patientEmail });
      await sendUnregisteredFormEmail({
        patient,
        patientEmail: patientEmail ?? portalUser.email,
        models,
        settings,
        facilityId,
      });
    } else {
      await sendRegisteredFormEmail({
        patient,
        patientEmail: patientEmail ?? portalUser.email,
        models,
        settings,
        facilityId,
      });
    }

    const portalSurveyAssignment = await models.PortalSurveyAssignment.create({
      patientId: patient.id,
      surveyId: survey.id,
      assignedById: user.id,
      assignedAt: assignedAt,
    });

    res.send({ portalSurveyAssignment });
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
      status = PORTAL_SURVEY_ASSIGNMENTS_STATUSES.OUTSTANDING,
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

    const count = await models.PortalSurveyAssignment.count({
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

    const portalSurveyAssignments = await models.PortalSurveyAssignment.findAll({
      ...baseQueryOptions,
      order: orderBy ? [[...orderBy.split('.'), order.toUpperCase()]] : [['assignedAt', 'DESC']],
      limit: all ? undefined : rowsPerPage,
      offset,
    });

    res.send({
      count,
      data: portalSurveyAssignments.map(assignment =>
        PortalSurveyAssignmentsSchema.parse(assignment.forResponse()),
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
    await models.PortalSurveyAssignment.destroy({
      where: { id: assignmentId, patientId: patient.id },
    });

    res.send({ message: 'Portal survey assignments deleted' });
  }),
);
