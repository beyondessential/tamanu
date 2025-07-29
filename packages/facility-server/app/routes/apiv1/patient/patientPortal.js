import express from 'express';
import asyncHandler from 'express-async-handler';

import { replaceInTemplate } from '@tamanu/utils/replaceInTemplate';
import { NotFoundError } from '@tamanu/shared/errors';
import {
  COMMUNICATION_STATUSES,
  PATIENT_COMMUNICATION_CHANNELS,
  PATIENT_COMMUNICATION_TYPES,
} from '@tamanu/constants';

export const patientPortal = express.Router();

const sendRegistrationEmail = async ({ patientId, patientEmail, models, settings, facilityId }) => {
  const patientPortalRegistrationTemplate = await settings[facilityId].get(
    'templates.patientPortalRegistrationEmail',
  );

  const patient = await models.Patient.findByPk(patientId);
  if (!patient) {
    throw new NotFoundError('Patient not found');
  }

  const content = replaceInTemplate(patientPortalRegistrationTemplate.body, {
    firstName: patient.firstName,
    lastName: patient.lastName,
    // TODO - get registration link for patient portal
    registrationLink: `https://facility-1.main.cd.tamanu.app/`,
  });

  return await models.PatientCommunication.create({
    patientId,
    type: PATIENT_COMMUNICATION_TYPES.PATIENT_PORTAL_REGISTRATION,
    channel: PATIENT_COMMUNICATION_CHANNELS.EMAIL,
    status: COMMUNICATION_STATUSES.QUEUED,
    destination: patientEmail,
    subject: patientPortalRegistrationTemplate.subject,
    content,
  });
};

patientPortal.post(
  '/:id/portal/register',
  asyncHandler(async (req, res) => {
    const { models, settings, facilityId } = req;
    const { id: patientId } = req.params;

    const { email: patientEmail } = req.body;

    // TODO - actually register patient

    await sendRegistrationEmail({ patientId, patientEmail, models, settings, facilityId });

    res.send({ message: 'Registration email sent' });
  }),
);
