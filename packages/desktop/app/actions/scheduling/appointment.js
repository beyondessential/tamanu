import { to } from 'await-to-js';
import { toast } from 'react-toastify';
import { has, isEmpty } from 'lodash';
import {
  FETCH_APPOINTMENT_REQUEST,
  FETCH_APPOINTMENT_SUCCESS,
  FETCH_APPOINTMENT_FAILED,
  SAVE_APPOINTMENT_REQUEST,
  SAVE_APPOINTMENT_SUCCESS,
  SAVE_APPOINTMENT_FAILED,
  DELETE_APPOINTMENT_FAILED,
  DELETE_APPOINTMENT_REQUEST,
  DELETE_APPOINTMENT_SUCCESS,
} from '../types';
import {
  PatientModel,
  AppointmentModel,
} from '../../models';

export const fetchAppointment = ({ id, patientId }) => async dispatch => {
  dispatch({ type: FETCH_APPOINTMENT_REQUEST });
  let error = null;
  let patient = null;
  const action = id ? 'update' : 'new';
  const appointmentModel = new AppointmentModel();
  if (action === 'update' && id && !error) {
    appointmentModel.set({ _id: id });
    [error] = await to(appointmentModel.fetch({ relations: true, deep: false }));
    // Set patient
    const { parents } = appointmentModel;
    if (has(parents, 'patients') && !isEmpty(parents.patients)) {
      appointmentModel.set('patient', parents.patients[0].id);
    }
  }
  if (patientId) {
    patient = new PatientModel({ _id: patientId });
    await patient.fetch();
    appointmentModel.set('patient', patientId);
  }
  if (error) return dispatch({ type: FETCH_APPOINTMENT_FAILED, error });
  dispatch({
    type: FETCH_APPOINTMENT_SUCCESS,
    appointment: appointmentModel,
    patient,
    loading: false,
  });
};

export const saveAppointment = ({
  action, model, patient, history, surgery = false,
}) => async dispatch => {
  dispatch({ type: SAVE_APPOINTMENT_REQUEST });
  if (model.isValid()) {
    try {
      await model.save();
      // Attach to patient
      if (action === 'new') {
        const patientModel = new PatientModel({ _id: patient });
        await patientModel.fetch();
        patientModel.get('appointments').add(model);
        await patientModel.save(null, { silent: true });
      }
      dispatch({ type: SAVE_APPOINTMENT_SUCCESS });
      toast('Appointment saved successfully.', { type: 'success' });
      if (action === 'new') {
        history.push(`/appointments/${surgery ? 'surgery' : 'appointment'}/${model.id}`);
      }
    } catch (error) {
      console.log({ error });
      dispatch({ type: SAVE_APPOINTMENT_FAILED, error });
    }
  } else {
    const error = model.validationError;
    console.log({ error });
    dispatch({ type: SAVE_APPOINTMENT_FAILED, error });
  }
};

export const deleteAppointment = ({ _id }) => async dispatch => {
  dispatch({ type: DELETE_APPOINTMENT_REQUEST });

  try {
    const appointment = new AppointmentModel({ _id });
    await appointment.destroy();
    dispatch({ type: DELETE_APPOINTMENT_SUCCESS });
    toast('Appointment deleted successfully.', { type: 'success' });
  } catch (error) {
    console.log({ error });
    dispatch({ type: DELETE_APPOINTMENT_FAILED, error });
  }
};
