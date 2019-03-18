import { to } from 'await-to-js';
import moment from 'moment';
import { toast } from 'react-toastify';
import { visitStatuses, DB_OBJECTS_MAX_DEPTH } from '../../constants';
import {
  FETCH_VISIT_REQUEST,
  FETCH_VISIT_SUCCESS,
  FETCH_VISIT_FAILED,
  SAVE_VISIT_REQUEST,
  SAVE_VISIT_SUCCESS,
  SAVE_VISIT_FAILED,
  SAVE_VISIT_RESET,
} from '../types';
import { PatientModel, VisitModel } from '../../models';

export const initVisit = ({ patientId, id }) => async dispatch => {
  dispatch({ type: FETCH_VISIT_REQUEST });
  const action = id ? 'edit' : 'new';
  const patientModel = new PatientModel();
  const visitModel = new VisitModel();
  patientModel.set({ _id: patientId });
  let [error] = await to(patientModel.fetch({ relations: true, deep: false }));
  if (action === 'edit' && !error) {
    visitModel.set({ _id: id });
    [error] = await to(visitModel.fetch({
      data: {
        objects_max_depth: DB_OBJECTS_MAX_DEPTH.VISIT_MAIN,
      },
    }));
  }
  if (error) return dispatch({ type: FETCH_VISIT_FAILED, error });
  return dispatch({
    type: FETCH_VISIT_SUCCESS,
    patient: patientModel,
    visit: visitModel,
    action,
    startTime: new Date().toISOString(),
    loading: false,
  });
};

export const submitForm = ({
  action, visitModel, patientModel, history, setStatus,
}) => async dispatch => {
  dispatch({ type: SAVE_VISIT_REQUEST });
  if (visitModel.isValid()) {
    try {
      const endDate = visitModel.get('endDate');
      if (endDate instanceof moment && !endDate.isValid()) visitModel.set('endDate', null, { silent: true });
      if (setStatus) updateStatus({ visitModel, patientModel });
      await visitModel.save(null, { silent: true });
      if (action === 'new') patientModel.get('visits').add(visitModel);
      if (patientModel.changed) await patientModel.save(null, { silent: true });
      dispatch({
        type: SAVE_VISIT_SUCCESS,
        patient: patientModel,
        visit: visitModel,
      });
      toast('Visit saved successfully.', { type: toast.TYPE.SUCCESS });
      return history.push(`/patients/visit/${patientModel.id}/${visitModel.id}`);
    } catch (error) {
      console.error({ error });
      return dispatch({ type: SAVE_VISIT_FAILED, error });
    }
  } else {
    const error = visitModel.validationError;
    console.error({ error });
    return dispatch({ type: SAVE_VISIT_FAILED, error });
  }
};

export const resetSaved = () => dispatch => dispatch({ type: SAVE_VISIT_RESET });

const updateStatus = ({ visitModel, patientModel }) => {
  if (moment(visitModel.get('startDate')).isSameOrBefore(moment())
    && (visitModel.get('endDate') === null
        || moment(visitModel.get('endDate')).isSameOrAfter(moment()))) {
    if (visitModel.get('visitType') === 'admission') {
      visitModel.set('status', visitStatuses.ADMITTED);
      patientModel.set('admitted', true);
    }
    if (visitModel.get('visitType') !== 'admission') {
      visitModel.set('status', visitStatuses.CHECKED_IN);
    }
  }
};
