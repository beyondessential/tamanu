import asyncHandler from 'express-async-handler';
import config from 'config';
import { Op } from 'sequelize';
import { subject } from '@casl/ability';
import { getPrimaryTimeZone } from '@tamanu/shared/utils/timeZoneCheck';
import { toStoredDateTime } from '@tamanu/utils/dateTime';

export const fetchGraphData = (options = {}) =>
  asyncHandler(async (req, res) => {
    const {
      permissionAction = 'read',
      permissionNoun = 'Charting',
      dateDataElementId,
    } = options;

    const { params } = req;
    const { id: encounterId, patientId, dataElementId } = params;

    if (!encounterId && !patientId) {
      throw new Error('Either encounterId or patientId must be provided');
    }

    const { data, surveyId } = await getGraphData(req, {
      encounterId,
      patientId,
      dateDataElementId,
      dataElementId
    });

    if (permissionNoun === 'Charting' && surveyId) {
      req.checkPermission(permissionAction, subject('Charting', { id: surveyId }));
    } else {
      req.checkPermission(permissionAction, permissionNoun);
    }

    res.send({
      count: data.length,
      data,
    });
  });

async function getGraphData(req, options = {}) {
  const { models, query, settings, facilityId } = req;
  const { encounterId, patientId, dateDataElementId, dataElementId } = options;
  const { startDate, endDate } = query;

  const primaryTimeZone = getPrimaryTimeZone(config);
  const facilityTimeZone = await settings[facilityId]?.get('facilityTimeZone');
  const storedStartDate = toStoredDateTime(startDate, primaryTimeZone, facilityTimeZone) ?? startDate;
  const storedEndDate = toStoredDateTime(endDate, primaryTimeZone, facilityTimeZone) ?? endDate;
  const { SurveyResponse, SurveyResponseAnswer, Encounter } = models;

  const dateAnswersQuery = {
    include: [
      {
        model: SurveyResponse,
        required: true,
        as: 'surveyResponse',
        ...(encounterId
          ? {
              where: { encounterId },
            }
          : {
              include: [
                {
                  model: Encounter,
                  required: true,
                  as: 'encounter',
                  where: {
                    patientId,
                    deletedAt: null,
                  },
                },
              ],
            }),
      },
    ],
    where: {
      dataElementId: dateDataElementId,
      body: {
        [Op.gte]: storedStartDate,
        [Op.lte]: storedEndDate,
      },
    },
  };

  const dateAnswers = await SurveyResponseAnswer.findAll(dateAnswersQuery);

  const responseIds = dateAnswers.map(dateAnswer => dateAnswer.responseId);

  const answers = await SurveyResponseAnswer.findAll({
    where: {
      responseId: responseIds,
      dataElementId,
      body: { [Op.and]: [{ [Op.ne]: '' }, { [Op.not]: null }] },
    },
  });

  const data = answers
    .map(answer => {
      const { responseId } = answer;
      const recordedDateAnswer = dateAnswers.find(
        dateAnswer => dateAnswer.responseId === responseId,
      );
      const recordedDate = recordedDateAnswer.body;
      return { ...answer.dataValues, recordedDate };
    })
    .sort((a, b) => {
      return a.recordedDate > b.recordedDate ? 1 : -1;
    });

  // Survey ID will be the same for all answers because the
  // data element ID is unique to the survey
  return { data, surveyId: dateAnswers[0]?.surveyResponse.surveyId };
}
