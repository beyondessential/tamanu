import { to } from 'await-to-js';
import {
  LOAD_RESPONSE_REQUEST,
  LOAD_RESPONSE_SUCCESS,
  LOAD_RESPONSE_FAILED,
} from '../types';
import { ProgramModel, PatientModel, SurveyResponseModel } from '../../models';

export const initResponse = ({
  patientId, programId, surveyId, responseId,
}) => async dispatch => {
  dispatch({ type: LOAD_RESPONSE_REQUEST });
  const patient = new PatientModel();
  const program = new ProgramModel();
  const response = new SurveyResponseModel();
  patient.set({ _id: patientId });
  program.set({ _id: programId });
  response.set({ _id: responseId });
  const [error] = await to(Promise.all([
    patient.fetch(),
    program.fetch(),
    response.fetch(),
  ]));

  if (error) return dispatch({ type: LOAD_RESPONSE_FAILED, error });
  const survey = program.getSurvey(surveyId);
  await survey.fetch({ data: { objects_max_depth: 15 } });
  dispatch({
    type: LOAD_RESPONSE_SUCCESS,
    patient,
    program,
    survey,
    response,
    loading: false,
  });
};
