import { filter, chain, set, template } from 'lodash';
import moment from 'moment';
import { to } from 'await-to-js';
import { dateFormat, timeFormat } from '../../constants';
import { getFileInDocumentsPath, imageDataIsFileName } from '../../utils';
import {
  LOAD_SURVEYS_REQUEST,
  LOAD_SURVEYS_SUCCESS,
  LOAD_SURVEYS_FAILED,
  LOAD_COMPLETED_SURVEYS_SUCCESS,
} from '../types';
import { validateAnswer } from './validation';
import { PatientModel, ProgramModel } from '../../models';

export const initSurveys = ({ patientId, programId, moduleId }) =>
  async dispatch => {
    dispatch({ type: LOAD_SURVEYS_REQUEST });
    const patientModel = new PatientModel();
    const programModel = new ProgramModel();
    patientModel.set({ _id: patientId });
    programModel.set({ _id: programId });
    const [error] = await to(Promise.all([
      patientModel.fetch({ relations: true }),
      programModel.fetch({ relations: true, deep: false })
    ]));
    if (error) return dispatch({ type: LOAD_SURVEYS_FAILED, error });

    let modules = [];
    if (programModel.get('programType') !== 'direct') {
      const moduleOptions = programModel.get('moduleOptions');
      if (patientModel.has(moduleOptions.collection)) {
        modules = patientModel.get(moduleOptions.collection).toJSON();
        modules = modules.map(module => ({
          label: template(moduleOptions.label)({ moment, dateFormat, timeFormat, ...module }),
          value: module[moduleOptions.value]
        }));
      }
    }

    let filters = {};
    const surveys = programModel.get('surveys').sort().toJSON();
    const surveyResponses = patientModel.get('surveyResponses');
    const surveysDone = surveyResponses.toJSON().map(survey => survey.surveyId);
    const availableSurveys = filter(surveys, survey => survey.canRedo || !surveysDone.includes(survey._id));
    if (moduleId) filters = { moduleType: programModel.get('programType'), moduleId };
    const completedSurveys = _getCompletedSurveys({ surveys, surveysDone, surveyResponses, ...filters });
    dispatch({
      type: LOAD_SURVEYS_SUCCESS,
      assessorId: 'test-user',
      patient: patientModel,
      program: programModel,
      modules,
      availableSurveys,
      completedSurveys,
      surveys,
      surveysDone,
      surveyResponses,
      startTime: new Date().toISOString(),
      loading: false,
    });
  };

export const getCompletedSurveys = ({ moduleType, moduleId }) =>
  async (dispatch, getState) => {
    const { programs } = getState();
    const { surveys, surveysDone, surveyResponses } = programs;
    const completedSurveys = _getCompletedSurveys({ surveys, surveysDone, surveyResponses, moduleType, moduleId });
    dispatch({
      type: LOAD_COMPLETED_SURVEYS_SUCCESS,
      completedSurveys
    });
  };

const _getCompletedSurveys = ({ surveys, surveysDone, surveyResponses, moduleType, moduleId }) => {
  let filters = {};
  if (moduleType && moduleId) filters = { moduleType, moduleId };
  return chain(surveys)
    .filter(survey => surveysDone.includes(survey._id))
    .map(survey => {
      set(survey, 'count', surveyResponses.where({ surveyId: survey._id, ...filters }).length);
      return survey;
    })
    .filter(survey => survey.count > 0)
    .value();
};
