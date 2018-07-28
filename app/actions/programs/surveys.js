import { filter } from 'lodash';
import { to } from 'await-to-js';
import { getFileInDocumentsPath, imageDataIsFileName } from '../../utils';
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
  LOAD_SURVEYS_START,
  LOAD_SURVEYS_SUCCESS,
  LOAD_SURVEYS_FAILED,
} from '../types';
import { validateAnswer } from './validation';
import { AnswerModel, PatientModel, ProgramModel, SurveyResponseModel } from '../../models';

export const initSurveys = ({ patientId, programId }) =>
  async dispatch => {
    dispatch({ type: LOAD_SURVEYS_START });
    const patientModel = new PatientModel();
    const programModel = new ProgramModel();
    patientModel.set({ _id: patientId });
    programModel.set({ _id: programId });
    const [error] = await to(Promise.all([
      patientModel.fetch({ relations: true }),
      programModel.fetch({ relations: true, deep: false })
    ]));
    if (error) return dispatch({ type: LOAD_SURVEYS_FAILED, error });

    const surveys = programModel.get('surveys').toJSON();
    const surveyResps = patientModel.get('surveyResponses').toJSON();
    const surveysDone = surveyResps.map(survey => survey.surveyId);
    const availableSurveys = filter(surveys, survey => survey.canRedo || !surveysDone.includes(survey._id));
    const completedSurveys = filter(surveys, survey => surveysDone.includes(survey._id));
    dispatch({
      type: LOAD_SURVEYS_SUCCESS,
      assessorId: 'test-user',
      patient: patientModel,
      program: programModel,
      availableSurveys,
      completedSurveys,
      startTime: new Date().toISOString(),
      loading: false,
    });
  };
