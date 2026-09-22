import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';
import { DOCUMENT_SIZE_LIMIT } from '@tamanu/constants';
import { NotFoundError } from '@tamanu/errors';
import { CentralServerConnection } from '../../../sync';
import { uploadAttachment } from '../../../utils/uploadAttachment';

export const patientProfilePicture = express.Router();

// Photos captured before a patient could hold one on their record live as the answer to a
// survey question conventionally coded like this, and are still shown until one is set.
const LEGACY_PHOTO_QUESTION_CODE = 'ProfilePhoto';

const DEFAULT_PHOTO_MIME_TYPE = 'image/jpeg';

// what we want is:
// - the answer body
// - of a programdataelement with code 'ProfilePhoto'
// - on a surveyresponse
// - attached to an encounter
// - with this patient
const getLegacySurveyPhotoAttachmentId = async (req, patientId) => {
  const result = await req.db.query(
    `
      SELECT body
        FROM
          survey_response_answers
          LEFT JOIN survey_responses
            ON (survey_response_answers.response_id = survey_responses.id)
          LEFT JOIN encounters
            ON (survey_responses.encounter_id = encounters.id)
          LEFT JOIN program_data_elements
            ON (survey_response_answers.data_element_id = program_data_elements.id)
        WHERE
          encounters.patient_id = :patientId
          AND program_data_elements.code = :photoCode
          AND encounters.deleted_at is null
        ORDER BY 
          survey_responses.created_at DESC
      LIMIT 1
    `,
    {
      replacements: {
        patientId,
        photoCode: LEGACY_PHOTO_QUESTION_CODE,
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
    const response = await centralServer.fetch(`attachment/${attachmentId}?base64=true`, {
      method: 'GET',
    });

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
    req.checkPermission('write', 'Patient');

    const { models, params } = req;
    await getPatientOrThrow(req, params.id);

    // the image is stored on the central server, so this needs it to be reachable
    const { attachmentId } = await uploadAttachment(req, DOCUMENT_SIZE_LIMIT);

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
    req.checkPermission('write', 'Patient');

    const { models, params } = req;
    await getPatientOrThrow(req, params.id);

    await models.PatientAdditionalData.updateForPatient(params.id, {
      profilePhotoAttachmentId: null,
      profilePhotoRemoved: true,
    });

    res.send({});
  }),
);
