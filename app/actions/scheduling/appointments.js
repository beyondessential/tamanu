import React from 'react';
import { has, isEmpty, set, concat, capitalize, head } from 'lodash';
import moment from 'moment';
import {
  pageSizes,
  dbViews
} from '../../constants';
import {
  FETCH_APPOINTMENTS_REQUEST,
  FETCH_APPOINTMENTS_SUCCESS,
  FETCH_APPOINTMENTS_FAILED,
} from '../types';
import { AppointmentCollection } from '../../collections';

export const fetchAppointments = ({
  page,
  view = dbViews.appointmentsSearch,
  keys = [],
  sorted = [],
  pageSize = pageSizes.appointments
}) => {
  return async dispatch => {
    try {
      dispatch({ type: FETCH_APPOINTMENTS_REQUEST });
      const appointmentCollection = new AppointmentCollection({ pageSize });
      // Merge keys
      const viewKeys = concat(keys, dbViews.appointmentsSearchKeys.slice(keys.length));
      // Set pagination options
      if (sorted.length > 0) {
        const sort = head(sorted);
        appointmentCollection.setSorting(sort.id, sort.desc ? 1 : -1);
      }
      // Fetch results
      await appointmentCollection.getPage(page, view, viewKeys);
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
};

export const fetchCalender = ({ view = dbViews.appointmentsSearch, keys = [] }) =>
    async dispatch => {
      try {
        dispatch({ type: FETCH_APPOINTMENTS_REQUEST });
        const appointmentCollection = new AppointmentCollection({
          pageSize: pageSizes.appointments
        });
        // Merge keys
        const viewKeys = concat(keys, dbViews.appointmentsSearchKeys.slice(keys.length));
        // Fetch results
        await appointmentCollection.fetchByView({ view, keys: viewKeys });
        const appointments = appointmentCollection.toJSON().map(({ _id, startDate, endDate, allDay, patients, location }) => ({
            _id,
            allDay,
            start: moment(startDate).toDate(),
            end: moment(endDate).toDate(),
            title: _getTitle({ patients, location }),
          })
        );

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

  const _getTitle = ({ patients, location }) => {
    let patient = '';
    if (!isEmpty(patients) && has(patients[0], 'firstName') && has(patients[0], 'lastName')) {
      patient = `${capitalize(patients[0].firstName)} ${capitalize(patients[0].lastName)}`;
    }

    return (
      <span className="is-size-7">
        {patient} {location && <br />} {location}
      </span>
    )
  };
