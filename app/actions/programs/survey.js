import { getFileInDocumentsPath, imageDataIsFileName } from '../../utils';
import {
  getAnswers,
  getStartTime,
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
} from '../types';
import { validateAnswer } from './validation';
import { AnswerModel, PatientModel, ProgramModel, SurveyModel, SurveyResponseModel } from '../../models';

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

export const submitSurvey = ({ patientModel, programId, surveyId, moduleId, history, shouldRepeat = false }) =>
  async (dispatch, getState) => {
    const { id: patientId } = patientModel;
    const startTime = getStartTime(getState());
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

      // Attach to the module
      const programModel = new ProgramModel();
      programModel.set('_id', programId);
      await programModel.fetch();
      if (programModel.get('programType') !== 'direct') {
        const moduleOptions = programModel.get('moduleOptions');
        const moduleModel = patientModel.get(moduleOptions.collection).findWhere({ _id: moduleId });
        await moduleModel.fetch({ relations: true, deep: false });
        moduleModel.get('surveyResponses').add(responseModel.id);
        await moduleModel.save();
      }

      // Save patient
      patientModel.get('surveyResponses').add(responseModel.id);
      await patientModel.save();

      dispatch({ type: SURVEY_SUBMIT_SUCCESS });
      if (shouldRepeat) {
        dispatch(selectSurvey(surveyId, true));
      } else {
        dispatch(gotoProgram(patientId, programId, history));
      }
    }
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
  return dispatch => history.push(`/programs/${programId}/${patientId}/surveys`);
};

