import { to } from 'await-to-js';
import {
  pageSizes,
  dateFormat,
  dbViews
} from '../../constants';
import {
  FETCH_APPOINTMENTS_REQUEST,
  FETCH_APPOINTMENTS_SUCCESS,
  FETCH_APPOINTMENTS_FAILED,
} from '../types';
import { AppointmentCollection } from '../../collections';

export const fetchAppointments = ({ page, view = dbViews.appointmentRequested }) =>
  async dispatch => {
    try {
      dispatch({ type: FETCH_APPOINTMENTS_REQUEST });
      const appointmentCollection = new AppointmentCollection({
        pageSize: pageSizes.appointments
      });
      await appointmentCollection.getPage(page, view).promise();
      console.log({ appointmentCollection });
      let appointments = appointmentCollection.toJSON();
      appointments = appointments.map(object => ({ name: 'Jane Doe', ...object }));

      dispatch({
        type: FETCH_APPOINTMENTS_SUCCESS,
        appointments,
        totalPages: appointmentCollection.state.totalPages,
        loading: false,
      });
    } catch (err) {
      dispatch({ type: FETCH_APPOINTMENTS_FAILED, err })
    }
  };

