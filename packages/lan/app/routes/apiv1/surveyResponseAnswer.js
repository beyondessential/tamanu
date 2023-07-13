import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { NotFoundError, InvalidOperationError, InvalidParameterError } from 'shared/errors';
import { SURVEY_TYPES, PROGRAM_DATA_ELEMENT_TYPES } from 'shared/constants';

export const surveyResponseAnswer = express.Router();

surveyResponseAnswer.put(
  '/vital/:id',
  asyncHandler(async (req, res) => {
    const { db, models, user, params, getLocalisation } = req;
    const { SurveyResponseAnswer, SurveyResponse, Survey, VitalLog, ProgramDataElement } = models;
    const { id } = params;

    const localisation = await getLocalisation();
    if (!localisation?.features?.enableVitalEdit) {
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
    if (answerObject.body === req.body.newValue) {
      throw new InvalidParameterError('New value is the same as previous value.');
    }

    await db.transaction(async () => {
      const { newValue = '', reasonForChange, date } = req.body;
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
    const { db, models, user, getLocalisation } = req;
    const { SurveyResponseAnswer, SurveyResponse, Survey, VitalLog, ProgramDataElement } = models;
    req.checkPermission('create', 'Vitals');

    // Even though this wouldn't technically be editing a vital
    // we will not allow the creation of a single vital answer if its not enabled
    const localisation = await getLocalisation();
    if (!localisation?.features?.enableVitalEdit) {
      throw new InvalidOperationError('Editing vitals is disabled.');
    }

    // Ensure data element exists and it's not a calculated question
    const dataElement = await ProgramDataElement.findOne({ where: { id: req.body.dataElementId } });
    if (!dataElement || dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.CALCULATED) {
      throw new InvalidOperationError('Invalid data element.');
    }

    const responseObject = await SurveyResponse.findAll({
      where: {
        encounterId: req.body.encounterId,
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
          where: { body: req.body.recordedDate },
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
      const { newValue = '', reasonForChange, date, dataElementId } = req.body;
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
