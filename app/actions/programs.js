import { getFileInDocumentsPath, imageDataIsFileName } from '../utils';
import {
  getAnswers,
  getCurrentScreen,
  getSelectedClinicName,
  getSurveyScreenIndex,
  getTotalNumberOfScreens,
  getSurveyScreen,
  getVisibleSurveyScreenQuestions,
  getAnswerForQuestion,
} from './selectors';
import {
  ANSWER_CHANGE,
  ASSESSMENT_CLINIC_SELECT,
  EXTRA_PROPS_CHANGE,
  SURVEY_SCREEN_SELECT,
  INIT_SURVEY,
  UPDATE_SURVEYS,
  SURVEY_SUBMIT,
  SURVEY_SUBMIT_SUCCESS,
  WIPE_CURRENT_SURVEY,
  ASSESSMENT_RESET,
  VALIDATION_ERROR_CHANGE,
  SURVEY_SCREEN_ERROR_MESSAGE_CHANGE,
} from './types';
import { validateAnswer } from './validation';
import { AnswerModel, PatientModel, ProgramModel, SurveyModel, SurveyResponseModel } from '../models';

export const initSurvey = ({ patientId, programId, surveyId }) =>
  async dispatch => {
    const patientModel = new PatientModel();
    const programModel = new ProgramModel();
    const surveyModel = new SurveyModel();
    patientModel.set({ _id: patientId });
    programModel.set({ _id: programId });
    surveyModel.set({ _id: surveyId });
    await Promise.all([
      surveyModel.fetch({ relations: true }),
      patientModel.fetch(),
      programModel.fetch()
    ]);

    dispatch({
      type: INIT_SURVEY,
      assessorId: 'test-user',
      patient: patientModel,
      program: programModel,
      survey: surveyModel,
      startTime: new Date().toISOString(),
      loading: false,
    });
  };

export const changeAnswer = (questionId, questionType, newAnswer) => ({
  type: ANSWER_CHANGE,
  questionId,
  questionType,
  newAnswer,
});

export const changeExtraProps = (componentIndex, newProps) => ({
  type: EXTRA_PROPS_CHANGE,
  componentIndex,
  newProps,
});

export const submitSurvey = (patientId, surveyId, programId, history, startTime, shouldRepeat = false) => {
  return async (dispatch, getState) => {
    // console.log('__model__', model);
    // console.log('__props__', props);
    // const screens = getScreens(getState());
    // screens.forEach((screen, screenIndex) => {
    //   dispatch(validateScreen(screenIndex));
    // });
    // const validatedScreens = getScreens(getState()); // Re-fetch state now validation is added
    // if (validatedScreens.some((screen) => doesScreenHaveValidationErrors(screen))) {
    //   return; // Early return, do not submit if there are validation errors
    // }

    dispatch({ type: SURVEY_SUBMIT });
    const location = {}; // await getCurrentUserLocation(getState(), 1000);
    const existingSurveyResponses = [];
    // Skip duplicate survey responses.
    // const existingSurveyResponses = await database.findSurveyResponses({
    //   surveyId,
    //   clinicId,
    //   startTime,
    // });

    // Only save the survey if it isn't a duplicate.
    if (existingSurveyResponses.length === 0) {
      const response = {
        surveyId,
        assessorName: 'userName', // TODO: update this
        patientId,
        startTime,
        userId: '000', // TODO: update this
        metadata: JSON.stringify({ location }),
      };

      // Set endTime only after no duplicate responses are found.
      response.endTime = new Date().toISOString();

      // Save the response
      const responseModel = new SurveyResponseModel();
      responseModel.set(response);
      await responseModel.save();

      // Attach answers
      const tasks = [];
      const answerEntries = Object.entries(getAnswers(getState()));
      answerEntries.forEach(entry => {
        const answer = processAnswerForDatabase(entry[1]);
        const answerModel = new AnswerModel();
        answerModel.set(answer);
        tasks.push(answerModel.save());
      });

      // Update answers
      const answers = await Promise.all(tasks);
      answers.forEach(answer => responseModel.get('answers').add(answer.id));
      await responseModel.save();

      dispatch({ type: SURVEY_SUBMIT_SUCCESS });
      if (shouldRepeat) {
        dispatch(selectSurvey(surveyId, true));
      } else {
        dispatch(gotoProgram(patientId, programId, history));
      }
    }
  };
};

const processAnswerForDatabase = ({ questionId, questionType, newAnswer: answer }) => {
  let processedAnswer = answer;

  // if (type === 'Photo' && imageDataIsFileName(answer)) {
  //   const fileName = getFileInDocumentsPath(answer);
  //   processedAnswer = await RNFS.readFile(fileName, 'base64');
  // }

  // Some question types work off raw data, but display and store a processed version. E.g. DaysSince
  // questions store the raw date during the survey, but need to save the days since that raw date.
  if (answer && answer.processed) {
    processedAnswer = answer.processed;
  }

  processedAnswer = typeof processedAnswer === 'string' ? processedAnswer : JSON.stringify(processedAnswer);

  return {
    questionId,
    questionType,
    body: processedAnswer,
  };
};

const gotoProgram = (patientId, programId, history) => {
  return dispatch => dispatch(history.push(`/programs/${programId}/${patientId}/surveys`));
};

export const changeClinic = (clinic) => (dispatch, getState, { analytics }) => {
  const { assessment } = getState();
  const oldClinicId = assessment.clinic ? assessment.clinic.id : null;

  if (oldClinicId !== clinic.id) dispatch(wipeCurrentSurvey());
  dispatch({
    type: ASSESSMENT_CLINIC_SELECT,
    selectedClinic: clinic,
  });

  analytics.trackEvent('Change clinic', {
    oldClinicId,
    clinicId: clinic.id,
  });

  const { assessment: assessmentState, authentication: authState } = getState();
  const { isSurveyInProgress, assessorId } = assessmentState;
  const { currentUserId } = authState;
  const isUnfinishedSurveyForCurrentUser = isSurveyInProgress &&
    assessorId === currentUserId;
  if (isUnfinishedSurveyForCurrentUser) {
    Alert.alert(
      'Survey in progress',
      'You didn\'t submit your last survey, would you like to continue it?',
      [
        {
          text: 'Discard',
          onPress: () => dispatch(wipeCurrentSurvey()),
        },
        {
          text: 'Continue Survey',
          onPress: () => dispatch(continueUnfinishedSurvey()),
          style: 'cancel',
        },
      ],
      { cancelable: true },
    );
  }
};

export const continueUnfinishedSurvey = () => (dispatch, getState) => {
  dispatch(openSurvey(getSelectedClinicName(getState())));
  dispatch(watchUserLocation());
};

export const wipeCurrentSurvey = () =>
  (dispatch) => {
    dispatch({ type: WIPE_CURRENT_SURVEY });
    dispatch(stopWatchingUserLocation());
  };

export const selectSurvey = ({ surveyModel }) =>
  (dispatch, getState) => {
    const { _id: surveyId } = surveyModel.toJSON();
    const screens = surveyModel.get('screens');
    const questions = screens.map(screen => screen.get('components'));
    dispatch({
      type: INIT_SURVEY,
      assessorId: 'test-user',
      surveyId,
      screens: screens.toJSON(),
      questions,
      startTime: new Date().toISOString(),
      isSubmitting: true
    });

    // if (!isRepeating) {
    //   dispatch(openSurvey(getSelectedClinicName(getState())));
    //   dispatch(watchUserLocation());
    // }
  };

// export const selectSurveyGroup = openSurveyGroup;

export const moveToSurveyScreen = (toIndex) => (dispatch, getState) => {
  dispatch(validateScreen());
  const state = getState(); // Fetch state after validation so it includes new validation errors
  const currentScreen = getCurrentScreen(state);
  if (doesScreenHaveValidationErrors(currentScreen)) {
    // At least one validation error on screen, scroll it to the top and show a notification
    dispatch({
      type: SURVEY_SCREEN_ERROR_MESSAGE_CHANGE,
      message: 'Please fix all validation errors before moving on',
      screenIndex: getSurveyScreenIndex(state),
    });
  } else {
    if (currentScreen) {
      // No validation errors or coming in from another point in the app, set the error message back
      // to blank
      dispatch({
        type: SURVEY_SCREEN_ERROR_MESSAGE_CHANGE,
        message: '',
        screenIndex: getSurveyScreenIndex(state),
      });
    }
    // Navigate to the requested screen
    dispatch({
      type: SURVEY_SCREEN_SELECT,
      screenIndex: toIndex,
    });
  }
};

export const moveSurveyScreens = (numberOfScreens) => (dispatch, getState) => {
  const state = getState();
  const currentScreenIndex = getSurveyScreenIndex(state);
  const fromIndex = currentScreenIndex === undefined ? -1 : currentScreenIndex;

  let toIndex = fromIndex + numberOfScreens;
  toIndex = Math.min(toIndex, getTotalNumberOfScreens(state));

  dispatch(moveToSurveyScreen(toIndex));
};

export const validateComponent = (screenIndex, componentIndex, validationCriteria, answer) =>
  (dispatch, getState) => {
    dispatch({
      type: VALIDATION_ERROR_CHANGE,
      screenIndex,
      componentIndex,
      validationErrorMessage: validateAnswer(validationCriteria, answer),
    });
    // If there was previously a validation error message on this screen, turn off any screen and
    // level error messages that no longer apply
    const screen = getSurveyScreen(getState(), screenIndex);
    if (!!screen.errorMessage &&
      !doesScreenHaveValidationErrors(screen)) {
      dispatch({
        type: SURVEY_SCREEN_ERROR_MESSAGE_CHANGE,
        screenIndex,
        message: '',
      });
    }
  };

const validateScreen = (screenIndex) => (dispatch, getState) => {
  const state = getState();
  // If no screen index is specified, validate the current screen
  const screenIndexToValidate = screenIndex === undefined ? getSurveyScreenIndex(state) : screenIndex;
  if (screenIndexToValidate === getTotalNumberOfScreens(state)) {
    // This is the submit screen, don't validate.
    return;
  }
  const questions = getVisibleSurveyScreenQuestions(state, screenIndexToValidate);
  questions.forEach(({ id: questionId, validationCriteria, componentIndex }) => {
    dispatch(validateComponent(
      screenIndexToValidate,
      componentIndex,
      validationCriteria,
      getAnswerForQuestion(state, questionId),
    ));
  });
};

const doesScreenHaveValidationErrors = (screen) =>
  screen && screen.components.some(({ validationErrorMessage }) => !!validationErrorMessage);

export const resetAssessmentState = () => ({
  type: ASSESSMENT_RESET,
});

const goBack = () => { console.log('goBack'); };
const openSurvey = () => { console.log('openSurvey'); };
const openSurveyGroup = () => { console.log('openSurveyGroup'); };
const getCurrentUserLocation = () => { console.log('getCurrentUserLocation'); };
const watchUserLocation = () => { console.log('watchUserLocation'); };
const stopWatchingUserLocation = () => { console.log('stopWatchingUserLocation'); };
const arrayWithIdsToObject = (arr) => { console.log('arrayWithIdsToObject'); return arr; };
