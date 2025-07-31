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

export const patientPortal = express.Router();

const getPatientOrThrow = async ({ models, patientId }) => {
  const patient = await models.Patient.findByPk(patientId);
  if (!patient) {
    throw new NotFoundError('Patient not found');
  }
  return patient;
};

const constructRegistrationLink = () => {
  // TODO - construct the registration link for the patient portal
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
  const patientUser = await models.PatientUser.findOne({
    where: { patientId: patient.id },
  });

  if (!patientUser) {
    throw new NotFoundError(
      'Patient has not been registered for portal access. Please register the patient first.',
    );
  }

  // TODO - fetch the **unexpired** token for the patient user, throw if none exists

  const patientPortalRegistrationTemplate = await settings[facilityId].get(
    'templates.patientPortalRegistrationEmail',
  );

  const content = replaceInTemplate(patientPortalRegistrationTemplate.body, {
    firstName: patient.firstName,
    lastName: patient.lastName,
    registrationLink: constructRegistrationLink(),
  });

  await models.PatientCommunication.create({
    patientId: patient.id,
    type: PATIENT_COMMUNICATION_TYPES.PATIENT_PORTAL_REGISTRATION,
    channel: PATIENT_COMMUNICATION_CHANNELS.EMAIL,
    status: COMMUNICATION_STATUSES.QUEUED,
    destination: patientEmail,
    subject: patientPortalRegistrationTemplate.subject,
    content,
  });
};

patientPortal.get(
  '/:id/portal/status',
  asyncHandler(async (req, res) => {
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
    const { models, user } = req;
    const { id: patientId } = req.params;
    const { formId, assignedAt } = req.body;

    const patient = await getPatientOrThrow({ models, patientId });

    const survey = await models.Survey.findByPk(formId);
    if (!survey) {
      throw new NotFoundError('Survey not found');
    }

    const patientSurveyAssignment = await models.PatientSurveyAssignment.create({
      patientId: patient.id,
      surveyId: survey.id,
      assignedById: user.id,
      assignedAt: assignedAt,
    });

    // TODO - send an email to patient if they have registered for the portal

    res.send({ patientSurveyAssignment });
  }),
);

patientPortal.get(
  '/:id/portal/forms',
  asyncHandler(async (req, res) => {
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
    const { models } = req;
    const { id: patientId, assignmentId } = req.params;

    const patient = await getPatientOrThrow({ models, patientId });
    await models.PatientSurveyAssignment.destroy({
      where: { id: assignmentId, patientId: patient.id },
    });

    res.send({ message: 'Patient survey assignments deleted' });
  }),
);
