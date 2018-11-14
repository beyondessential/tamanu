import { to } from 'await-to-js';
import { has, isEmpty, set } from 'lodash';
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
      await appointmentCollection.getPage(page, view);
      const appointments = appointmentCollection.models.map(object => {
        const { parents } = object;
        let name = '';
        if (has(parents, 'patients') && !isEmpty(parents.patients))
          name = set(object.attributes, 'patientsName', `${parents.patients[0].get('firstName')} ${parents.patients[0].get('lastName')}`);
        return { name, ...object.toJSON() };
      });

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

