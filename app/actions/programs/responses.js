import { to } from 'await-to-js';
import {
  LOAD_RESPONSES_REQUEST,
  LOAD_RESPONSES_SUCCESS,
  LOAD_RESPONSES_FAILED,
} from '../types';
import { ProgramModel, PatientModel, SurveyModel } from '../../models';

export const initResponses = ({ patientId, programId, surveyId, moduleId }) =>
  async dispatch => {
    dispatch({ type: LOAD_RESPONSES_REQUEST });
    const patient = new PatientModel();
    const program = new ProgramModel();
    patient.set({ _id: patientId });
    program.set({ _id: programId });
    const [error] = await to(Promise.all([
      patient.fetch({ relations: true, deep: false }),
      program.fetch({ relations: true, deep: false })
    ]));

    // Fetch all the responses
    const tasks = [];
    const filters = { surveyId };
    if (moduleId) filters.moduleId = moduleId;
    const responses = patient.get('surveyResponses').where(filters);
    responses.forEach(response => tasks.push(response.fetch({ relations: true })));
    await Promise.all(tasks);

    if (error) return dispatch({ type: LOAD_RESPONSES_FAILED, error });
    const survey = new SurveyModel(); // await program.getSurvey(surveyId).promise();
    survey.set('_id', surveyId);
    await survey.fetch({ relations: true });
    dispatch({
      type: LOAD_RESPONSES_SUCCESS,
      patient,
      program,
      survey,
      responses,
      loading: false,
    });
  };
