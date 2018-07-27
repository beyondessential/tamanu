import { has } from 'lodash';
import {
  INIT_SURVEY,
  ANSWER_CHANGE,
  VALIDATION_ERROR_CHANGE,
  ASSESSMENT_CLINIC_SELECT,
  EXTRA_PROPS_CHANGE,
  ASSESSMENT_RESET,
  SURVEY_SCREEN_ERROR_MESSAGE_CHANGE,
  SURVEY_SCREEN_SELECT,
  SURVEY_SUBMIT,
  SURVEY_SUBMIT_SUCCESS,
  UPDATE_SURVEYS,
  WIPE_CURRENT_SURVEY,
  LOGIN_REQUEST,
} from '../actions/types';

import { SurveyModel } from '../models';

const surveyModel = new SurveyModel();

const initialState = {
  survey: Object.assign({}, surveyModel.attributes),
  currentScreenIndex: -1,
  screens: null,
  selectedClinic: null,
  isSubmitting: false,
  isSurveyInProgress: false,
  questions: {},
  answers: {},
  loading: true,
};

// Have to be careful with objects in default state, must deep copy when using them. State should
// not be mutated. This utility function makes it easy to update a specific component, and deep
// clone along the way, to avoid mutating objects
const updateComponentState = (state, screenIndex, componentIndex, updateComponent) => {
  const screens = [...state.screens];
  const components = [...screens[screenIndex].components];
  const component = updateComponent({ ...components[componentIndex] });
  components[componentIndex] = component;
  screens[screenIndex].components = components;
  return { screens };
};

const stateChanges = {
  [INIT_SURVEY]: ({ assessorId, loading, patient, survey, program, startTime }, state) => ({
    ...state,
    answers: initialState.answers,
    assessorId,
    patient,
    program,
    survey,
    startTime,
    loading: false,
    isSubmitting: false,
    isSurveyInProgress: true,
    currentScreenIndex: 0, // Start at the first screen
  }),
  [ANSWER_CHANGE]: ({ questionId, questionType, newAnswer }, state) => {
    const answers = { ...state.answers };
    answers[questionId] = { questionId, questionType, newAnswer };
    return { ...state, answers };
  },
  [SURVEY_SUBMIT]: (_, state) => ({ ...state, isSubmitting: true }),
  [SURVEY_SUBMIT_SUCCESS]: (_, state) => ({
    ...state,
    isSubmitting: false,
    isSurveyInProgress: false,
  }),
  [SURVEY_SCREEN_SELECT]: ({ screenIndex }, state) => ({
    ...state,
    currentScreenIndex: screenIndex,
  }),
  [EXTRA_PROPS_CHANGE]: ({ componentIndex, newProps }, state) =>
    updateComponentState(state, state.currentScreenIndex, componentIndex, (component) => {
      component.extraProps = { ...component.extraProps, ...newProps };
      return component;
    }),

  [VALIDATION_ERROR_CHANGE]: ({ screenIndex, componentIndex, validationErrorMessage }, state) =>
    updateComponentState(state, screenIndex, componentIndex, (component) => {
      if (component.hasOwnProperty('validationErrorMessage') || validationErrorMessage) {
        component.validationErrorMessage = validationErrorMessage;
      }
      return component;
    }),
  [ASSESSMENT_CLINIC_SELECT]: ({ selectedClinic }, state) => ({ ...state, selectedClinic }),
  [ASSESSMENT_RESET]: () => initialState,
  [SURVEY_SCREEN_ERROR_MESSAGE_CHANGE]: ({ message, screenIndex }, state) => {
    const screens = [...state.screens];
    screens[screenIndex].errorMessage = message;
    return { ...state, screens };
  },
  [UPDATE_SURVEYS]: ({ surveys }, state) => ({ ...state, surveys }),
  [WIPE_CURRENT_SURVEY]: (_, state) => ({
    ...state,
    answers: initialState.answers,
    questions: initialState.questions,
    screens: initialState.screens,
    currentScreenIndex: initialState.currentScreenIndex,
    isSurveyInProgress: false,
  }),
  [LOGIN_REQUEST]: (_, state) => ({ ...state, selectedClinic: initialState.selectedClinic }),
};

export default (state = initialState, action) => {
  if (has(stateChanges, action.type)) return stateChanges[action.type](action, state);
  return state;
};
