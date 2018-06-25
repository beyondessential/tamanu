const { buildCheckFunction, validationResult } = require('express-validator/check');
const { buildSanitizeFunction } = require('express-validator/filter');
const { matchedData } = require('express-validator/filter');
const {
  camelCase,
  chain,
  difference,
  filter,
  find,
  flatMap,
  forEach,
  includes,
  isEmpty,
  join,
  map,
} = require('lodash');

const { MedicalHistoryQuestionnaire, User } = require('../../models');

const internals = {
  SCOPES: ['device-connect', 'questionnaire'],
  checkBody: buildCheckFunction(['body']),
  sanitizeBody: buildSanitizeFunction(['body']),
};

internals.validateQuery = (req, res, next) => {
  const { scope } = req.query;
  if (!scope) return next({ status: 422, field: 'scope', message: 'scope is required' });
  if (!includes(internals.SCOPES, scope)) {
    return next({
      status: 422,
      field: 'scope',
      message: `scope is required to be one of ${join(internals.SCOPES)}`,
    });
  }
  return next();
};

internals.validateBody = [
  internals.checkBody('answers').exists().withMessage('answers is required'),
  internals.checkBody('answers').isArray().withMessage('answers is required to be an array'),
  internals.checkBody('answers.*.questionId').exists().withMessage('questionId is required for all answers'),
  internals.checkBody('answers.*.optionId').exists().withMessage('optionId is required for all answers'),
  internals.sanitizeBody('answers.*.questionId').trim(),
  internals.sanitizeBody('answers.*.optionId').trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        answers: {
          errors: chain(errors.array()).map('msg').uniq().value(),
        }
      });
    }
    return next();
  },
];

internals.updateMedicalHistory = async (req, res, next) => {
  const { id: userId } = req.user;

  const questionnaire = await MedicalHistoryQuestionnaire.findOne({ isActive: true });
  if (!questionnaire) return next({ status: 500, error: 'No active medical history questionnaire' });

  const { scope } = req.query;
  const { answers } = matchedData(req);

  const questions = internals.compileQuestions(questionnaire, scope, answers);

  const messages = internals.integrityMessages(questionnaire, questions, answers);
  if (!isEmpty(messages)) {
    return next({ status: 422, message: messages });
  }

  const ops = { $set: {} };
  ops.$set[`medicalHistory.${camelCase(scope)}`] = {
    answers,
    questionnaireId: questionnaire.id,
  };
  await User.findByIdAndUpdate(userId, ops);

  return res.status(204).end();
};

internals.compileQuestions = (questionnaire, scope, answers) => {
  const scopedQuestions = scope
    ? filter(questionnaire.questions, { scope })
    : questionnaire.questions;

  return flatMap(
    scopedQuestions,
    (question) => {
      if (isEmpty(question.followUps)) return question;

      const answer = find(answers, { questionId: question.id });
      if (!answer) return question;

      const followUp = find(question.followUps, { triggerOptionId: answer.optionId });
      if (!followUp) return question;

      return [question, followUp];
    }
  );
};

internals.integrityMessages = (questionnaire, questions, answers) => {
  function validate(answer) {
    if (filter(answers, { questionId: answer.questionId }).length > 1) {
      return `too many answers for questionId "${answer.questionId}"`;
    }

    const question = find(questions, { id: answer.questionId });
    if (isEmpty(question)) return `questionId "${answer.questionId}" not found`;

    const optionsSet = find(questionnaire.optionsSets, { id: question.optionsSetId });
    const option = find(optionsSet.options, { id: answer.optionId });
    if (isEmpty(option)) return `optionId "${answer.optionId}" not found`;

    return null;
  }

  const messages = chain(answers).map(validate).compact().value();

  const missingAnswers = difference(
    map(questions, 'id'), map(answers, 'questionId')
  );

  forEach(missingAnswers, (questionId) => {
    messages.push(`answer for questionId "${questionId}" is required`);
  });

  return messages;
};

module.exports = [
  internals.validateQuery,
  internals.validateBody,
  internals.updateMedicalHistory
];
