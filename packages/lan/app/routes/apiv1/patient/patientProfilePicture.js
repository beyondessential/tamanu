import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes, Op } from 'sequelize';
import { ENCOUNTER_TYPES } from 'shared/constants';
import { WebRemote } from '~/sync';

export const patientProfilePicture = express.Router();

const imageB64Data = `iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4 //8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==`;

patientProfilePicture.get(
  '/:id/profilePicture',
  asyncHandler(async (req, res) => {
    const { models, params } = req;

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
    let attachmentId = result[0].body;

    // load the attachment from the remote
    const remote = new WebRemote();
    const response = await remote.fetch(`attachment/${attachmentId}?base64=true`, {
      method: 'GET',
    });

    // send the data along
    res.send({
      mimeType: 'image/jpeg',
      data: response.data,
    });
  }),
);