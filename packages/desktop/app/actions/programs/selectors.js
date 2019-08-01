export const getStartTime = state => state.programs.startTime || [];

export const getSurveyScreenIndex = state => state.programs.currentScreenIndex;

export const getCurrentScreen = state => getSurveyScreen(state, getSurveyScreenIndex(state));

export const getSurveyScreen = (state, screenIndex) => getScreens(state)[screenIndex];

export const getScreens = state => state.programs.screens || [];

export const getTotalNumberOfScreens = state => getScreens(state).length;

export const getErrorMessageForScreen = (state, screenIndex) => {
  // If the screen index is past the end of the screens array, get the submit screen error
  if (screenIndex === getTotalNumberOfScreens(state)) {
    if (
      getScreens(state).some(screen =>
        screen.components.some(component => !!component.validationErrorMessage),
      )
    ) {
      return 'This survey contains validation errors on some answers, please go back through and fix them before submitting';
    }
    return '';
  }
  return getSurveyScreen(state, screenIndex).errorMessage;
};

export const getVisibleSurveyScreenQuestions = (state, screenIndex) => {
  // Build questions to display, filtering out follow up questions if enabling answer not given
  const questions = [];
  getSurveyScreen(state, screenIndex).components.forEach((component, index) => {
    const { questionId, visbilityCriteria } = component;
    if (checkVisibilityCriteriaAreMet(state, visbilityCriteria)) {
      questions.push({
        id: questionId,
        ...getQuestion(state, questionId),
        componentIndex: index,
        validationCriteria: component.validationCriteria,
      });
    }
  });
  return questions;
};

export const getSelectedClinicName = ({ programs }) => programs.selectedClinic.name;

export const getSelectedCountryId = ({ programs }) => programs.selectedClinic.countryId;

// Whether a given survey can repeat, i.e. be done again and again within a single facility on a
// single date. If no surveyId passed in, will assume the current survey being completed
export const getCanSurveyRepeat = ({ programs }, surveyId = programs.surveyId) =>
  programs.surveys[surveyId] && programs.surveys[surveyId].canRepeat;

// The name of a survey. If no surveyId passed in, will assume the current survey being completed
export const getSurveyName = ({ programs }, surveyId = programs.surveyId) =>
  programs.surveys[surveyId].name;

export const getQuestionState = (state, screenIndex, componentIndex) => {
  const component = getSurveyScreen(state, screenIndex).components[componentIndex];
  return {
    ...component,
    answer: getAnswerForQuestion(state, component.questionId),
  };
};

const getQuestion = (state, questionId) => state.programs.questions[questionId];

export const getAnswers = state => state.programs.answers;

export const getAnswerForQuestion = (state, questionId) => getAnswers(state)[questionId];

/**
 * Checks whether all prior questions had the relevant answers enabling this question to be visible,
 * based on visibity criteria object in the format:
 * {
 *   _conjunction: 'and'/'or', // Optional, if not provided default to 'or'
 *   questionId1: ['answer1', 'answer2'],
 *   questionId2: ['answer1'],
 * }
 * Where for each question, we check whether that question has been answered with one of the options
 * in the array. The criteria will be met if at least one prior question has been answered with a
 * relevant option, or in the case of _conjunction: 'and', all prior questions have been answered
 * with a relevant option.
 * @param {object} state The redux state tree
 * @param {object} visibilityCriteria An object representing answers required to prior questions
 */
const checkVisibilityCriteriaAreMet = (state, visibilityCriteria) => {
  if (!visibilityCriteria || Object.keys(visibilityCriteria).length === 0) {
    return true;
  }
  const checkIfQuestionMeetsCriteria = ([questionId, answersEnablingFollowUp]) =>
    answersEnablingFollowUp.includes(getAnswerForQuestion(state, questionId));

  const { _conjunction: conjunction, ...restOfCriteria } = visibilityCriteria;
  if (conjunction === 'and') {
    return Object.entries(restOfCriteria).every(checkIfQuestionMeetsCriteria);
  }
  return Object.entries(restOfCriteria).some(checkIfQuestionMeetsCriteria);
};
