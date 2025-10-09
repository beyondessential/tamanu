import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';

import { NotFoundError, ValidationError } from '@tamanu/errors';
import { replaceInTemplate } from '@tamanu/utils/replaceInTemplate';
import { mapQueryFilters } from '../../../database/utils';
import {
  PATIENT_COMMUNICATION_TYPES,
  PATIENT_COMMUNICATION_CHANNELS,
  COMMUNICATION_STATUSES,
  PORTAL_SURVEY_ASSIGNMENTS_STATUSES,
  PORTAL_USER_STATUSES,
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

const registerPatient = async ({ patientId, email, models }) => {
  let portalUser = await models.PortalUser.findOne({
    where: { patientId },
  });

  const existingEmailUser = await models.PortalUser.findOne({
    where: { email },
  });

  if (!portalUser) {
    if (existingEmailUser) {
      throw new ValidationError(`Email ${email} is already registered to another patient`);
    }

    portalUser = await models.PortalUser.create({
      patientId,
      email,
    });
  } else {
    // Portal user exists, update email if provided and different
    if (portalUser.email !== email) {
      if (existingEmailUser && existingEmailUser.patientId !== patientId) {
        throw new ValidationError(`Email ${email} is already registered to another patient`);
      }

      portalUser.email = email;
      await portalUser.save();
    }
  }

  return [portalUser];
};

const EMAIL_TEMPLATES = {
  [PATIENT_COMMUNICATION_TYPES.PATIENT_PORTAL_REGISTRATION]:
    'templates.patientPortalRegistrationEmail',
  [PATIENT_COMMUNICATION_TYPES.PATIENT_PORTAL_REGISTERED_FORM]:
    'templates.patientPortalRegisteredFormEmail',
  [PATIENT_COMMUNICATION_TYPES.PATIENT_PORTAL_UNREGISTERED_FORM]:
    'templates.patientPortalUnregisteredFormEmail',
};

const sendPortalEmail = async ({ patient, email, models, settings, facilityId, emailType }) => {
  const facility = await models.Facility.findByPk(facilityId);

  const templateKey = EMAIL_TEMPLATES[emailType];
  if (!templateKey) {
    throw new Error(`Unknown email type: ${emailType}`);
  }

  const template = await settings[facilityId].get(templateKey);
  const templateData = {
    firstName: patient.firstName,
    lastName: patient.lastName,
    facilityName: facility.name,
  };

  const subject = replaceInTemplate(template.subject, templateData);

  // The registration link is added in the Portal Communication Processor
  const content = replaceInTemplate(template.body, templateData);

  await models.PatientCommunication.create({
    patientId: patient.id,
    type: emailType,
    channel: PATIENT_COMMUNICATION_CHANNELS.PORTAL_EMAIL,
    status: COMMUNICATION_STATUSES.QUEUED,
    destination: email,
    subject,
    content,
  });
};

patientPortal.get(
  '/:id/portal/status',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'PatientPortalRegistration');

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

patientPortal.post(
  '/:id/portal/register',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'PatientPortalRegistration');
    const { models, settings, body } = req;
    const { id: patientId } = req.params;
    const { email, facilityId } = body;

    if (!email) {
      throw new ValidationError('Email is required');
    }

    const patient = await getPatientOrThrow({ models, patientId });
    const [portalUser] = await registerPatient({ email, patientId, models });

    await sendPortalEmail({
      patient,
      email,
      models,
      settings,
      facilityId,
      emailType: PATIENT_COMMUNICATION_TYPES.PATIENT_PORTAL_REGISTRATION,
    });

    res.send(portalUser);
  }),
);

patientPortal.post(
  '/:id/portal/forms',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'PatientPortalForm');

    const { models, user, settings } = req;
    const { id: patientId } = req.params;
    const { formId, assignedAt, email, facilityId } = SendPortalFormRequestSchema.parse(req.body);

    const patient = await getPatientOrThrow({ models, patientId });
    const survey = await models.Survey.findByPk(formId);
    if (!survey) {
      throw new NotFoundError('Survey not found');
    }

    const portalUser = await models.PortalUser.findOne({
      where: { patientId },
    });

    // Handle user registration and email sending
    if (!portalUser) {
      if (!email) {
        throw new ValidationError('You must provide an email to send the form.');
      }
      req.checkPermission('create', 'PatientPortalRegistration');
      await registerPatient({ patientId: patient.id, models, email });
      await sendPortalEmail({
        patient,
        email,
        models,
        settings,
        facilityId,
        emailType: PATIENT_COMMUNICATION_TYPES.PATIENT_PORTAL_UNREGISTERED_FORM,
      });
    } else {
      const emailType =
        portalUser.status === PORTAL_USER_STATUSES.REGISTERED
          ? PATIENT_COMMUNICATION_TYPES.PATIENT_PORTAL_REGISTERED_FORM
          : PATIENT_COMMUNICATION_TYPES.PATIENT_PORTAL_UNREGISTERED_FORM;
      await sendPortalEmail({
        patient,
        email: portalUser.email,
        models,
        settings,
        facilityId,
        emailType,
      });
    }

    const existingAssignment = await models.PortalSurveyAssignment.findOne({
      where: {
        patientId,
        surveyId: survey.id,
        status: PORTAL_SURVEY_ASSIGNMENTS_STATUSES.OUTSTANDING,
      },
    });

    // Don't create an assignment if there is already a pending one
    if (existingAssignment) {
      return res.send(existingAssignment);
    }

    const portalSurveyAssignment = await models.PortalSurveyAssignment.create({
      patientId: patient.id,
      surveyId: survey.id,
      facilityId,
      assignedById: user.id,
      assignedAt: assignedAt,
    });

    res.send(portalSurveyAssignment);
  }),
);

const sortKeys = {
  assignedAt: 'assignedAt',
  assignedBy: 'assignedBy.displayName',
  form: 'survey.name',
  program: 'survey.program.name',
};

patientPortal.get(
  '/:id/portal/forms',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'PatientPortalForm');

    const { models, query } = req;
    const { id: patientId } = req.params;

    // Handle both `params` object and query params
    const params = query.params || query;

    const {
      page = 0,
      rowsPerPage = 25,
      order = 'DESC',
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

    const sortKey = sortKeys[orderBy];

    const portalSurveyAssignments = await models.PortalSurveyAssignment.findAll({
      ...baseQueryOptions,
      order: [[...sortKey.split('.'), order.toUpperCase()]],
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
