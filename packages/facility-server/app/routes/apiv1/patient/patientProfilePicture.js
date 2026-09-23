import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';
import {
  DOCUMENT_SIZE_LIMIT,
  LEGACY_PROFILE_PHOTO_QUESTION_CODE,
  PHOTO_MIME_TYPES,
} from '@tamanu/constants';
import { NotFoundError } from '@tamanu/errors';
import { CentralServerConnection } from '../../../sync';
import { uploadAttachment } from '../../../utils/uploadAttachment';

export const patientProfilePicture = express.Router();

const DEFAULT_PHOTO_MIME_TYPE = 'image/jpeg';

// The photo is the most recent answer to a ProfilePhoto question on any of this patient's
// encounters. The question is resolved first: program_data_elements is small, and a deployment
// that never configured one can skip the answers table altogether rather than joining through it
// on every patient view.
const getLegacySurveyPhotoAttachmentId = async (req, patientId) => {
  const dataElements = await req.models.ProgramDataElement.findAll({
    where: { code: LEGACY_PROFILE_PHOTO_QUESTION_CODE },
    attributes: ['id'],
  });

  if (dataElements.length === 0) return null;

  const result = await req.db.query(
    `
      SELECT body
        FROM
          survey_response_answers
          JOIN survey_responses
            ON (survey_response_answers.response_id = survey_responses.id)
          JOIN encounters
            ON (survey_responses.encounter_id = encounters.id)
        WHERE
          encounters.patient_id = :patientId
          AND survey_response_answers.data_element_id IN (:dataElementIds)
          AND encounters.deleted_at is null
        ORDER BY
          survey_responses.created_at DESC
      LIMIT 1
    `,
    {
      replacements: {
        patientId,
        dataElementIds: dataElements.map(dataElement => dataElement.id),
      },
      type: QueryTypes.SELECT,
    },
  );

  // the body of a ProfilePhoto survey answer is an attachment id
  return result.length > 0 ? result[0].body : null;
};

const resolvePhotoAttachmentId = async (req, patientId) => {
  const additionalData = await req.models.PatientAdditionalData.getForPatient(patientId);

  if (additionalData?.profilePhotoAttachmentId) {
    return additionalData.profilePhotoAttachmentId;
  }

  // Removing a photo leaves the patient with none, so an older survey photo must not be shown
  // in its place. Only a patient who has never had one on their record falls back.
  if (additionalData?.profilePhotoRemoved) {
    return null;
  }

  return getLegacySurveyPhotoAttachmentId(req, patientId);
};

const getPatientOrThrow = async (req, patientId) => {
  const patient = await req.models.Patient.findByPk(patientId);
  if (!patient) {
    throw new NotFoundError();
  }
  return patient;
};

patientProfilePicture.get(
  '/:id/profilePicture',
  asyncHandler(async (req, res) => {
    const { params, deviceId } = req;

    const attachmentId = await resolvePhotoAttachmentId(req, params.id);

    if (!attachmentId) {
      res.status(404).send({ error: 'No profile image found for patient.' });
      return;
    }

    // the image itself is only held on the central server, so it can only be shown while
    // that server is reachable
    const centralServer = new CentralServerConnection({ deviceId });
    const response = await centralServer.fetch(
      `attachment/${encodeURIComponent(attachmentId)}?base64=true`,
      {
        method: 'GET',
        // this runs on every patient view and the avatar falls back to initials, so it must not
        // sit through the default sync backoff when central is unreachable
        backoff: { maxAttempts: 1 },
      },
    );

    // send the data along
    res.send({
      mimeType: response.type ?? DEFAULT_PHOTO_MIME_TYPE,
      data: response.data,
    });
  }),
);

patientProfilePicture.post(
  '/:id/profilePicture',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const patient = await getPatientOrThrow(req, params.id);
    req.checkPermission('write', patient);

    // the image is stored on the central server, so this needs it to be reachable
    const { attachmentId } = await uploadAttachment(
      req,
      DOCUMENT_SIZE_LIMIT,
      PHOTO_MIME_TYPES,
    );

    await models.PatientAdditionalData.updateForPatient(params.id, {
      profilePhotoAttachmentId: attachmentId,
      profilePhotoRemoved: false,
    });

    res.send({ attachmentId });
  }),
);

patientProfilePicture.delete(
  '/:id/profilePicture',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    const patient = await getPatientOrThrow(req, params.id);
    req.checkPermission('write', patient);

    await models.PatientAdditionalData.updateForPatient(params.id, {
      profilePhotoAttachmentId: null,
      profilePhotoRemoved: true,
    });

    res.send({});
  }),
);
