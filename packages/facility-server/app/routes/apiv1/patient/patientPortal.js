import express from 'express';
import asyncHandler from 'express-async-handler';

import { NotFoundError, ValidationError } from '@tamanu/shared/errors';
import { replaceInTemplate } from '@tamanu/utils/replaceInTemplate';
import {
  PATIENT_COMMUNICATION_TYPES,
  PATIENT_COMMUNICATION_CHANNELS,
  COMMUNICATION_STATUSES,
} from '@tamanu/constants';

export const patientPortal = express.Router();

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
    req.checkPermission('read', 'PatientPortal');

    const { models } = req;
    const { id: patientId } = req.params;

    const patient = await models.Patient.findByPk(patientId);
    if (!patient) {
      throw new NotFoundError('Patient not found');
    }

    const patientUser = await models.PatientUser.findOne({
      where: { patientId },
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

    const patient = await models.Patient.findByPk(patientId);
    if (!patient) {
      throw new NotFoundError('Patient not found');
    }

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

    const patient = await models.Patient.findByPk(patientId);
    if (!patient) {
      throw new NotFoundError('Patient not found');
    }

    await sendRegistrationEmail({ patient, patientEmail, models, settings, facilityId });

    res.send({ message: 'Registration email successfully sent' });
  }),
);
