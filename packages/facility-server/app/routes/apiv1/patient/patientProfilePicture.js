import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';

import { readBlobAsBase64 } from '@tamanu/shared/utils/serveBlob';

import { resolveBlobForRead } from '../../../blobServing';
import { CentralServerConnection } from '../../../sync';

export const patientProfilePicture = express.Router();

patientProfilePicture.get(
  '/:id/profilePicture',
  asyncHandler(async (req, res) => {
    const { params, deviceId, blobCache } = req;

    // what we want is:
    // - the answer body
    // - of a programdataelement with code 'ProfilePhoto'
    // - on a surveyresponse
    // - attached to an encounter
    // - with this patient
    const photoCode = 'ProfilePhoto';
    const patientId = params.id;
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
          photoCode,
        },
        type: QueryTypes.SELECT,
      },
    );

    if (result.length === 0) {
      res.status(404).send({ error: 'No profile image found for patient.' });
      return;
    }

    // the body of a ProfilePhoto survey answer is an attachment id
    const attachmentId = result[0].body;
    const localAttachment = await req.models.Attachment.findByPk(attachmentId);

    // spec: ATCH
    // A hash-backed attachment reads from the local store, resolving the bytes
    // from central on a miss, so a picture the facility already holds displays
    // without connectivity.
    if (localAttachment?.hash) {
      const { hash } = localAttachment;
      const { availability, size } = await resolveBlobForRead(req, hash);
      if (availability) {
        res.status(202).send({ attachmentId, availability });
        return;
      }

      res.send({
        mimeType: 'image/jpeg',
        data: await readBlobAsBase64({ size, open: () => blobCache.open(hash) }),
      });
      return;
    }

    // spec: ATCH
    // Legacy attachments reside only on the central server, so one with no local
    // hash is read through it.
    const centralServer = new CentralServerConnection({ deviceId });
    const response = await centralServer.fetch(`attachment/${attachmentId}?base64=true`, {
      method: 'GET',
    });

    if (!response?.data) {
      res.status(202).send({ attachmentId, availability: response?.availability });
      return;
    }

    res.send({
      mimeType: 'image/jpeg',
      data: response.data,
    });
  }),
);
