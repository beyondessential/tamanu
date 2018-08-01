import { filter, chain, set } from 'lodash';
import { to } from 'await-to-js';
import { getFileInDocumentsPath, imageDataIsFileName } from '../../utils';
import {
  LOAD_SURVEYS_START,
  LOAD_SURVEYS_SUCCESS,
  LOAD_SURVEYS_FAILED,
} from '../types';
import { validateAnswer } from './validation';
import { PatientModel, ProgramModel } from '../../models';

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

    const surveys = programModel.get('surveys').sort().toJSON();
    const surveyResps = patientModel.get('surveyResponses');
    const surveysDone = surveyResps.toJSON().map(survey => survey.surveyId);
    const availableSurveys = filter(surveys, survey => survey.canRedo || !surveysDone.includes(survey._id));
    const completedSurveys = getCompletedSurveys({ surveys, surveysDone, surveyResps });
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

const getCompletedSurveys = ({ surveys, surveysDone, surveyResps }) => {
  return chain(surveys)
    .filter(survey => surveysDone.includes(survey._id))
    .map(survey => {
      set(survey, 'count', surveyResps.where({ surveyId: survey._id }).length);
      return survey;
    })
    .value();
};
