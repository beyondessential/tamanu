import {
  CREATE_APPOINTMENT_REQUEST,
  CREATE_APPOINTMENT_SUCCESS,
  CREATE_APPOINTMENT_FAILED,
} from './types';

export function createAppointmentRequest() {
  return {
    type: CREATE_APPOINTMENT_REQUEST,
  };
}

export function createAppointmentSuccess(appointment) {
  return {
    type: CREATE_APPOINTMENT_SUCCESS,
    payload: appointment,
  };
}

export function createAppointmentFailed() {
  return {
    type: CREATE_APPOINTMENT_FAILED,
  };
}

export const createAppointment = (appointment, history) => dispatch => {
  dispatch(createAppointmentRequest());
  appointment.save(appointment.attributes, {
    success: (model, response) => {
      dispatch(createAppointmentSuccess(response));
      history.push('/appointments');
    },
    error: (model, response) => {
      console.log('error', response);
      return dispatch(createAppointmentFailed(response));
    },
  });
};
