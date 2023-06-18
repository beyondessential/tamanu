import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { NotFoundError } from 'shared/errors';
import { SURVEY_TYPES, PROGRAM_DATA_ELEMENT_TYPES } from 'shared/constants';
import { runCalculations } from 'shared/utils/calculations';
import { getStringValue } from 'shared/utils/fields';

export const surveyResponse = express.Router();

// also update /packages/mobile/App/ui/helpers/constants.js when this changes
const MODEL_COLUMN_TO_ANSWER_DISPLAY_VALUE = {
  User: 'displayName',
  Department: 'name',
  Facility: 'name',
  Location: 'name',
  LocationGroup: 'name',
  ReferenceData: 'name',
};

const DEFAULT_DISPLAY_COLUMN = 'id';

surveyResponse.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    req.checkPermission('read', 'SurveyResponse');

    const surveyResponseRecord = await models.SurveyResponse.findByPk(params.id);
    const components = await models.SurveyScreenComponent.getComponentsForSurvey(
      surveyResponseRecord.surveyId,
    );
    const answers = await models.SurveyResponseAnswer.findAll({
      where: { responseId: params.id },
    });

    const autocompleteComponents = components
      .filter(c => c.dataElement.dataValues.type === 'Autocomplete')
      .map(({ dataElementId, config: componentConfig }) => [
        dataElementId,
        JSON.parse(componentConfig),
      ]);
    const autocompleteComponentMap = new Map(autocompleteComponents);

    // Transform Autocomplete answers from: { body: ReferenceData.id } to: { body: ReferenceData.name, originalBody: ReferenceData.id }
    const transformedAnswers = await Promise.all(
      answers.map(async answer => {
        const componentConfig = autocompleteComponentMap.get(answer.dataValues.dataElementId);
        if (!componentConfig) {
          return answer;
        }

        const model = models[componentConfig.source];
        if (!model) {
          throw new Error(
            'Survey is misconfigured: Question config did not specify a valid source',
          );
        }

        const result = await model.findByPk(answer.dataValues.body);
        if (!result) {
          if (componentConfig.source === 'ReferenceData') {
            throw new Error(
              `Selected answer ${componentConfig.source}[${answer.dataValues.body}] not found (check that the surveyquestion's source isn't ReferenceData for a Location, Facility, or Department)`,
            );
          }
          throw new Error(
            `Selected answer ${componentConfig.source}[${answer.dataValues.body}] not found`,
          );
        }

        const columnToDisplay =
          MODEL_COLUMN_TO_ANSWER_DISPLAY_VALUE[componentConfig.source] || DEFAULT_DISPLAY_COLUMN;
        const answerDisplayValue = result[columnToDisplay];

        const transformedAnswer = {
          ...answer.dataValues,
          originalBody: answer.dataValues.body,
          body: answerDisplayValue,
        };
        return transformedAnswer;
      }),
    );

    res.send({
      ...surveyResponseRecord.forResponse(),
      components,
      answers: transformedAnswers,
    });
  }),
);

surveyResponse.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { models, body, db } = req;

    // Responses for the vitals survey will check against 'Vitals' create permissions
    // All others witll check against 'SurveyResponse' create permissions
    req.checkPermission('create', await models.Survey.getResponsePermissionCheck(body.surveyId));

    const getDefaultId = async type => models.SurveyResponseAnswer.getDefaultId(type);
    const updatedBody = {
      locationId: body.locationId || (await getDefaultId('location')),
      departmentId: body.departmentId || (await getDefaultId('department')),
      userId: req.user.id,
      ...body,
    };

    const responseRecord = await db.transaction(async () => {
      return models.SurveyResponse.createWithAnswers(updatedBody);
    });
    res.send(responseRecord);
  }),
);

surveyResponse.put(
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
      const { previousValue = '', newValue = '', reasonForChange } = req.body;
      await VitalLog.create({
        reasonForChange,
        previousValue,
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
          const values = answers.map(answer => ({ [answer.dataElementId]: answer.body }));
          calculatedValues = runCalculations(screenComponents, values);
        }

        // Modify survey response answer for calculated value and create log
        const calculatedAnswer = answers.find(
          answer => answer.dataElementId === component.dataElement.id,
        );
        if (!calculatedAnswer) continue;

        const newCalculatedValue = getStringValue(calculatedValues[component.dataElement.id]) ?? '';
        await VitalLog.create({
          reasonForChange,
          previousValue: calculatedAnswer.body,
          newValue: newCalculatedValue,
          recordedById: user.id,
          answerId: calculatedAnswer.id,
        });
        await calculatedAnswer.update({ body: newCalculatedValue });
      }

      // TODO: Figure out if we should update the whole survey response for sync purposes
    });

    res.send(answerObject);
  }),
);
