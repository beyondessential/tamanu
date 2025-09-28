import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { subject } from '@casl/ability';
import { InvalidOperationError, InvalidParameterError, NotFoundError } from '@tamanu/errors';
import {
  CHARTING_DATA_ELEMENT_IDS,
  PROGRAM_DATA_ELEMENT_TYPES,
  SETTING_KEYS,
  SURVEY_TYPES,
  VITALS_DATA_ELEMENT_IDS,
} from '@tamanu/constants';
import { transformAnswers } from '@tamanu/shared/reports/utilities/transformAnswers';

export const surveyResponseAnswer = express.Router();

surveyResponseAnswer.get(
  '/latest-answer/:dataElementCode',
  asyncHandler(async (req, res) => {
    const { models, query, params } = req;
    const { patientId, facilityId } = query;
    const { dataElementCode } = params;

    req.checkPermission('read', 'SurveyResponse');

    const answer = await models.SurveyResponseAnswer.findOne({
      include: [
        {
          model: models.SurveyResponse,
          as: 'surveyResponse',
          required: true,
          include: [
            {
              model: models.Encounter,
              as: 'encounter',
              where: { patientId },
            },
          ],
        },
        {
          model: models.ProgramDataElement,
          where: { code: dataElementCode },
          include: [
            {
              model: models.SurveyScreenComponent,
              as: 'surveyScreenComponent',
              include: models.SurveyScreenComponent.getListReferenceAssociations(true),
            },
          ],
        },
      ],
      order: [['surveyResponse', 'startTime', 'DESC']],
    });

    if (!answer) {
      throw new NotFoundError('No answer found');
    }

    const transformedAnswers = await transformAnswers(
      models,
      [answer],
      [answer.ProgramDataElement.surveyScreenComponent],
      { notTransformDate: true },
    );
    answer.dataValues.displayAnswer = transformedAnswers[0]?.body;

    await req.audit.access({
      recordId: answer.id,
      frontEndContext: params,
      model: models.SurveyResponseAnswer,
      facilityId,
    });

    res.send(answer);
  }),
);

async function putSurveyResponseAnswer(req, isVital = false) {
  const {
    db,
    models,
    user,
    params,
    body,
  } = req;
  const { SurveyResponseAnswer, SurveyResponse, Survey, VitalLog, ProgramDataElement } = models;
  const { id } = params;
  const surveyWhereClause = isVital
    ? { surveyType: SURVEY_TYPES.VITALS }
    : { id: body.surveyId };
  const answerObject = await SurveyResponseAnswer.findByPk(id, {
    include: [
      {
        required: true,
        model: SurveyResponse,
        as: 'surveyResponse',
        include: [
          {
            required: true,
            model: Survey,
            as: 'survey',
            where: surveyWhereClause,
          },
        ],
      },
      {
        required: true,
        model: ProgramDataElement,
        where: { type: { [Op.not]: PROGRAM_DATA_ELEMENT_TYPES.CALCULATED } },
      },
    ],
  });
  if (!answerObject) throw new NotFoundError();
  if (answerObject.body === body.newValue) {
    throw new InvalidParameterError('New value is the same as previous value.');
  }

  await db.transaction(async () => {
    const { newValue = '', reasonForChange, date } = body;
    if (isVital) {
      const previousValue = answerObject.body;
      await answerObject.update({ body: newValue });
      await VitalLog.create({
        date,
        reasonForChange,
        previousValue,
        newValue,
        recordedById: user.id,
        answerId: id,
      });
    } else {
      await answerObject.updateWithReasonForChange(newValue, reasonForChange);
    }
    await answerObject.upsertCalculatedQuestions({ date, reasonForChange, user, isVital });
  });

  return answerObject;
}

async function postSurveyResponseAnswer(req, isVital = false) {
  const {
    db,
    models,
    user,
    body,
  } = req;
  const { SurveyResponseAnswer, SurveyResponse, Survey, VitalLog, ProgramDataElement } = models;

  // Ensure data element exists and it's not a calculated question
  const dataElement = await ProgramDataElement.findOne({ where: { id: body.dataElementId } });
  if (!dataElement || dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.CALCULATED) {
    throw new InvalidOperationError('Invalid data element.');
  }

  const surveyWhereClause = isVital
    ? { surveyType: SURVEY_TYPES.VITALS }
    : { id: body.surveyId };
  const dateDataElementId = isVital
    ? VITALS_DATA_ELEMENT_IDS.dateRecorded
    : CHARTING_DATA_ELEMENT_IDS.dateRecorded;
  const responseObject = await SurveyResponse.findAll({
    where: {
      encounterId: body.encounterId,
    },
    include: [
      {
        required: true,
        model: Survey,
        as: 'survey',
        where: surveyWhereClause,
      },
      {
        required: true,
        model: SurveyResponseAnswer,
        as: 'answers',
        where: {
          body: body.recordedDate,
          dataElementId: dateDataElementId,
        },
      },
    ],
  });
  // Can't do magic here, it's impossible to tell where
  // it should be created without guessing.
  if (responseObject.length !== 1) {
    throw new InvalidOperationError('Unable to complete action, please contact support.');
  }

  let newAnswer;
  await db.transaction(async () => {
    const { newValue = '', reasonForChange, date, dataElementId } = body;
    newAnswer = await models.SurveyResponseAnswer.create({
      dataElementId,
      body: newValue,
      responseId: responseObject[0].id,
    });
    if (isVital) {
      await VitalLog.create({
        date,
        reasonForChange,
        newValue,
        recordedById: user.id,
        answerId: newAnswer.id,
      });
    }
    await newAnswer.upsertCalculatedQuestions({ date, reasonForChange, user, isVital });
  });

  return newAnswer;
}

surveyResponseAnswer.put(
  '/vital/:id',
  asyncHandler(async (req, res) => {
    const {
      settings,
      body: { facilityId },
    } = req;
    req.checkPermission('write', 'Vitals');

    const enableVitalEdit = await settings[facilityId].get(SETTING_KEYS.FEATURES_ENABLE_VITAL_EDIT);
    if (!enableVitalEdit) {
      throw new InvalidOperationError('Editing vitals is disabled.');
    }

    const answerObject = await putSurveyResponseAnswer(req, true);
    res.send(answerObject);
  }),
);

surveyResponseAnswer.post(
  '/vital',
  asyncHandler(async (req, res) => {
    const {
      settings,
      body: { facilityId },
    } = req;
    req.checkPermission('create', 'Vitals');

    // Even though this wouldn't technically be editing a vital
    // we will not allow the creation of a single vital answer if its not enabled
    const enableVitalEdit = await settings[facilityId].get(SETTING_KEYS.FEATURES_ENABLE_VITAL_EDIT);
    if (!enableVitalEdit) {
      throw new InvalidOperationError('Editing vitals is disabled.');
    }

    const newAnswer = await postSurveyResponseAnswer(req, true);

    res.send(newAnswer);
  }),
);

surveyResponseAnswer.put(
  '/chart/:id',
  asyncHandler(async (req, res) => {
    const {
      settings,
      body: { facilityId, surveyId },
    } = req;
    req.checkPermission('write', subject('Charting', { id: surveyId }));

    const enableChartEdit = await settings[facilityId].get(SETTING_KEYS.FEATURES_ENABLE_CHARTING_EDIT);
    if (!enableChartEdit) {
      throw new InvalidOperationError('Editing charts is disabled.');
    }

    const answerObject = await putSurveyResponseAnswer(req);
    res.send(answerObject);
  }),
);

surveyResponseAnswer.post(
  '/chart',
  asyncHandler(async (req, res) => {
    const {
      settings,
      body: { facilityId, surveyId },
    } = req;
    req.checkPermission('create', subject('Charting', { id: surveyId }));

    // Even though this wouldn't technically be editing a chart
    // we will not allow the creation of a single chart answer if its not enabled
    const enableChartEdit = await settings[facilityId].get(SETTING_KEYS.FEATURES_ENABLE_CHARTING_EDIT);
    if (!enableChartEdit) {
      throw new InvalidOperationError('Editing charts is disabled.');
    }

    const newAnswer = await postSurveyResponseAnswer(req);

    res.send(newAnswer);
  }),
);

surveyResponseAnswer.put(
  '/photo/:id',
  asyncHandler(async (req, res) => {
    const { db, models, params } = req;
    const { SurveyResponseAnswer, Attachment } = models;
    const { id } = params;

    // Find answer
    const answerObject = await SurveyResponseAnswer.findByPk(id, {
      include: [
        {
          // Ensure answer is photo type
          required: true,
          model: models.ProgramDataElement,
          where: { type: PROGRAM_DATA_ELEMENT_TYPES.PHOTO },
        },
        {
          required: true,
          model: models.SurveyResponse,
          as: 'surveyResponse',
        },
      ],
    });

    if (!answerObject) {
      throw new InvalidParameterError('Invalid answer ID.');
    }

    req.checkPermission(
      'delete',
      subject('Charting', { id: answerObject.surveyResponse.surveyId }),
    );

    await db.transaction(async () => {
      // Blank out the attachment. We need to upsert because the record
      // might not exist on facility server.
      await Attachment.upsert({
        id: answerObject.body,
        data: Buffer.from([]),
        type: 'image/jpeg',
        size: 0,
      });

      // Update answer to empty string (needed for logs and table display)
      await answerObject.update({ body: '' });
    });

    res.send(answerObject);
  }),
);
