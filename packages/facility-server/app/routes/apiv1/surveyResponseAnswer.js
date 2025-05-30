import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { InvalidOperationError, InvalidParameterError, NotFoundError } from '@tamanu/shared/errors';
import {
  PROGRAM_DATA_ELEMENT_TYPES,
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
    answer.dataValues.sourceType = transformedAnswers[0]?.sourceType;

    await req.audit.access({
      recordId: answer.id,
      params,
      model: models.SurveyResponseAnswer,
      facilityId,
    });

    res.send(answer);
  }),
);

surveyResponseAnswer.put(
  '/vital/:id',
  asyncHandler(async (req, res) => {
    const {
      db,
      models,
      user,
      params,
      settings,
      body: { facilityId, ...body },
    } = req;
    const { SurveyResponseAnswer, SurveyResponse, Survey, VitalLog, ProgramDataElement } = models;
    const { id } = params;

    const enableVitalEdit = await settings[facilityId].get('features.enableVitalEdit');
    if (!enableVitalEdit) {
      throw new InvalidOperationError('Editing vitals is disabled.');
    }

    req.checkPermission('write', 'Vitals');
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
              where: { surveyType: SURVEY_TYPES.VITALS },
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
      await VitalLog.create({
        date,
        reasonForChange,
        previousValue: answerObject.body,
        newValue,
        recordedById: user.id,
        answerId: id,
      });
      await answerObject.update({ body: newValue });
      await answerObject.upsertCalculatedQuestions({ date, reasonForChange, user });
    });

    res.send(answerObject);
  }),
);

surveyResponseAnswer.post(
  '/vital',
  asyncHandler(async (req, res) => {
    const {
      db,
      models,
      user,
      settings,
      body: { facilityId, ...body },
    } = req;
    const { SurveyResponseAnswer, SurveyResponse, Survey, VitalLog, ProgramDataElement } = models;
    req.checkPermission('create', 'Vitals');

    // Even though this wouldn't technically be editing a vital
    // we will not allow the creation of a single vital answer if its not enabled
    const enableVitalEdit = await settings[facilityId].get('features.enableVitalEdit');
    if (!enableVitalEdit) {
      throw new InvalidOperationError('Editing vitals is disabled.');
    }

    // Ensure data element exists and it's not a calculated question
    const dataElement = await ProgramDataElement.findOne({ where: { id: body.dataElementId } });
    if (!dataElement || dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.CALCULATED) {
      throw new InvalidOperationError('Invalid data element.');
    }

    const responseObject = await SurveyResponse.findAll({
      where: {
        encounterId: body.encounterId,
      },
      include: [
        {
          required: true,
          model: Survey,
          as: 'survey',
          where: { surveyType: SURVEY_TYPES.VITALS },
        },
        {
          required: true,
          model: SurveyResponseAnswer,
          as: 'answers',
          where: {
            body: body.recordedDate,
            dataElementId: VITALS_DATA_ELEMENT_IDS.dateRecorded,
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
      await VitalLog.create({
        date,
        reasonForChange,
        newValue,
        recordedById: user.id,
        answerId: newAnswer.id,
      });
      await newAnswer.upsertCalculatedQuestions({ date, reasonForChange, user });
    });

    res.send(newAnswer);
  }),
);
