import { to } from 'await-to-js';
import moment from 'moment';
import { visitStatuses } from '../../constants';
import {
  FETCH_VISIT_REQUEST,
  FETCH_VISIT_SUCCESS,
  FETCH_VISIT_FAILED,
  SAVE_VISIT_REQUEST,
  SAVE_VISIT_SUCCESS,
  SAVE_VISIT_FAILED,
} from '../types';
import { PatientModel, VisitModel } from '../../models';

export const initVisit = ({ patientId, id }) =>
  async dispatch => {
    dispatch({ type: FETCH_VISIT_REQUEST });
    const action = id ? 'edit' : 'new';
    const patientModel = new PatientModel();
    const visitModel = new VisitModel();
    patientModel.set({ _id: patientId });
    let [error] = await to(patientModel.fetch({ relations: true, deep: false }));
    if (action === 'edit' && !error) {
      visitModel.set({ _id: id });
      [error] = await to(visitModel.fetch({ relations: true, deep: false }));
    }
    if (error) return dispatch({ type: FETCH_VISIT_FAILED, error });
    dispatch({
      type: FETCH_VISIT_SUCCESS,
      patient: patientModel,
      visit: visitModel,
      action,
      startTime: new Date().toISOString(),
      loading: false,
    });
  };

export const submitForm = ({ action, visitModel, patientModel, history, setStatus }) =>
  async dispatch => {
    dispatch({ type: SAVE_VISIT_REQUEST });
    if (visitModel.isValid()) {
      try {
        const endDate = visitModel.get('endDate');
        if (endDate instanceof moment && !endDate.isValid()) visitModel.set('endDate', null, { silent: true });
        if (setStatus) _setStatus(visitModel);
        const Model = await visitModel.save(null, { silent: true });
        if (action === 'new') {
          patientModel.get('visits').add({ _id: Model.id });
          await patientModel.save(null, { silent: true });
        }
        dispatch({
          type: SAVE_VISIT_SUCCESS,
          patient: patientModel,
          visit: Model,
        });
        if (action === 'new') history.push(`/patients/visit/${patientModel.id}/${Model.id}`);
      } catch (error) {
        console.log({ error });
        dispatch({ type: SAVE_VISIT_FAILED, error });
      }
    } else {
      const error = visitModel.validationError;
      console.log({ error });
      dispatch({ type: SAVE_VISIT_FAILED, error });
    }
  };

const _setStatus = (Model) => {
  if (moment(Model.get('startDate')).isSameOrBefore(moment()) &&
    (
      Model.get('endDate') === null ||
      moment(Model.get('endDate')).isSameOrAfter(moment())
    )
  ) {
    if (Model.get('visitType') === 'admission') Model.set('status', visitStatuses.ADMITTED);
    if (Model.get('visitType') !== 'admission') Model.set('status', visitStatuses.CHECKED_IN);
  }
};
