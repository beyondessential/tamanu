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

const registerPatient = async ({ patientId, email, models }) => {
  const [portalUser, created] = await models.PortalUser.findOrCreate({
    where: { patientId },
    defaults: { email },
  });

  if (!created && email && portalUser.email !== email) {
    portalUser.email = email;
    await portalUser.save();
  }

  return [portalUser, created];
};

const sendPortalEmail = async ({ patient, email, models, settings, facilityId, emailType }) => {
  const facility = await models.Facility.findByPk(facilityId);
  const emailTemplates = {
    [PATIENT_COMMUNICATION_TYPES.PATIENT_PORTAL_REGISTRATION]:
      'templates.patientPortalRegistrationEmail',
    [PATIENT_COMMUNICATION_TYPES.PATIENT_PORTAL_REGISTERED_FORM]:
      'templates.patientPortalRegisteredFormEmail',
    [PATIENT_COMMUNICATION_TYPES.PATIENT_PORTAL_UNREGISTERED_FORM]:
      'templates.patientPortalUnregisteredFormEmail',
  };

  const templateKey = emailTemplates[emailType];
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
    req.checkPermission('read', 'PatientPortal');

    const { models } = req;
    const { id: patientId } = req.params;

    const patient = await getPatientOrThrow({ models, patientId });

    const portalUser = await models.PortalUser.findOne({
      where: { patientId: patient.id },
    });

    res.send({
      hasPortalAccount: !!portalUser,
      status: portalUser?.status || null,
    });
  }),
);

patientPortal.post(
  '/:id/portal/register',
  asyncHandler(async (req, res) => {
    req.checkPermission('create', 'PatientPortal');
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
    const survey = await getSurveyOrThrow({ models, surveyId: formId });
    let portalUser = await getPortalUserOrThrow({ models, patientId: patient.id });

    if (!email && (!portalUser || !portalUser.email)) {
      throw new ValidationError(
        'Patient has no registered email address - provide an email to send the form.',
      );
    }

    // Handle user registration and email sending
    if (!portalUser) {
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
      await sendPortalEmail({
        patient,
        email,
        models,
        settings,
        facilityId,
        emailType: PATIENT_COMMUNICATION_TYPES.PATIENT_PORTAL_REGISTERED_FORM,
      });
    }

    const portalSurveyAssignment = await models.PortalSurveyAssignment.create({
      patientId: patient.id,
      surveyId: survey.id,
      assignedById: user.id,
      assignedAt: assignedAt,
    });

    res.send(portalSurveyAssignment);
  }),
);

patientPortal.get(
  '/:id/portal/forms',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'PatientPortalForm');

    const { models, query } = req;
    const { id: patientId } = req.params;

    const params = query.params || query;
    const patient = await getPatientOrThrow({ models, patientId });

    // Inline buildFormsQuery logic
    const {
      page = 0,
      rowsPerPage = 25,
      order = 'ASC',
      orderBy = 'assignedAt',
      status = PORTAL_SURVEY_ASSIGNMENTS_STATUSES.OUTSTANDING,
      all = false,
      ...filterParams
    } = params;

    const offset = all ? undefined : page * rowsPerPage;
    const filters = mapQueryFilters(filterParams, [{ key: 'surveyId', operator: Op.eq }]);

    const baseQueryOptions = {
      where: {
        [Op.and]: [{ patientId: patient.id }, { status }, filters],
      },
      include: [
        {
          model: 'Survey',
          as: 'survey',
          include: [{ model: 'Program', as: 'program' }],
        },
        {
          model: 'User',
          as: 'assignedBy',
        },
        {
          model: 'Patient',
          as: 'patient',
        },
      ],
    };

    const pagination = {
      order: orderBy ? [[...orderBy.split('.'), order.toUpperCase()]] : [['assignedAt', 'DESC']],
      limit: all ? undefined : rowsPerPage,
      offset,
    };

    const count = await models.PortalSurveyAssignment.count({
      where: baseQueryOptions.where,
    });

    if (count === 0) {
      return res.send({ count: 0, data: [] });
    }

    // Fix include models reference
    const queryWithModels = {
      ...baseQueryOptions,
      include: baseQueryOptions.include.map(inc => ({
        ...inc,
        model: models[inc.model],
        include: inc.include?.map(subInc => ({
          ...subInc,
          model: models[subInc.model],
        })),
      })),
    };

    const portalSurveyAssignments = await models.PortalSurveyAssignment.findAll({
      ...queryWithModels,
      ...pagination,
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
