import { Op } from 'sequelize';

export const getAnswers = async (models, where) =>
  models.SurveyResponseAnswer.findAll({
    where: {
      ...where,
      body: {
        [Op.not]: '',
      },
    },
    include: [
      {
        model: models.SurveyResponse,
        as: 'surveyResponse',
        include: [
          {
            model: models.Encounter,
            as: 'encounter',
          },
        ],
      },
    ],
    order: [[{ model: models.SurveyResponse, as: 'surveyResponse' }, 'end_time', 'ASC']],
  });
