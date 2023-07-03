import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { NotFoundError } from 'shared/errors';
import { SURVEY_TYPES, PROGRAM_DATA_ELEMENT_TYPES } from 'shared/constants';
import { runCalculations } from 'shared/utils/calculations';
import { getStringValue } from 'shared/utils/fields';

export const surveyResponseAnswer = express.Router();

surveyResponseAnswer.put(
  '/vital/:id',
  asyncHandler(async (req, res) => {
    const { db, models, user, params } = req;
    const {
      SurveyResponseAnswer,
      SurveyResponse,
      Survey,
      VitalLog,
      ProgramDataElement,
      SurveyScreenComponent,
    } = models;
    const { id } = params;
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

    const screenComponents = await SurveyScreenComponent.getComponentsForSurvey(
      answerObject.surveyResponse.survey.id,
    );
    const calculatedScreenComponents = screenComponents.filter(c => c.calculation);

    await db.transaction(async () => {
      const { newValue = '', reasonForChange } = req.body;
      await VitalLog.create({
        reasonForChange,
        previousValue: answerObject.body,
        newValue,
        recordedById: user.id,
        answerId: id,
      });
      await answerObject.update({ body: newValue });

      // Check if any calculated question is affected by this change
      let answers;
      let calculatedValues;
      for (const component of calculatedScreenComponents) {
        if (component.calculation.includes(answerObject.ProgramDataElement.code) === false) {
          continue;
        }

        // Grab answers only once
        if (!calculatedValues) {
          const response = await SurveyResponse.findByPk(answerObject.surveyResponse.id, {
            include: [
              {
                required: true,
                model: SurveyResponseAnswer,
                as: 'answers',
              },
            ],
          });
          answers = response.answers;
          const values = {};
          answers.forEach(answer => {
            values[answer.dataElementId] = answer.body;
          });
          calculatedValues = runCalculations(screenComponents, values);
        }

        // Modify survey response answer for calculated value and create log
        const calculatedAnswer = answers.find(
          answer => answer.dataElementId === component.dataElement.id,
        );
        if (!calculatedAnswer) continue;

        const stringValue = getStringValue(
          component.dataElement.type,
          calculatedValues[component.dataElement.id],
        );
        const newCalculatedValue = stringValue ?? '';
        await VitalLog.create({
          reasonForChange,
          previousValue: calculatedAnswer.body,
          newValue: newCalculatedValue,
          recordedById: user.id,
          answerId: calculatedAnswer.id,
        });
        await calculatedAnswer.update({ body: newCalculatedValue });
      }
    });

    res.send(answerObject);
  }),
);
